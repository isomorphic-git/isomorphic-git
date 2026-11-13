// @ts-check
import '../typedefs.js'

import { STAGE } from '../commands/STAGE.js'
import { TREE } from '../commands/TREE.js'
import { WORKDIR } from '../commands/WORKDIR.js'
import { _checkout } from '../commands/checkout.js'
import { _commit } from '../commands/commit.js'
import { _currentBranch } from '../commands/currentBranch.js'
import { _findMergeBase } from '../commands/findMergeBase.js'
import { _readCommit } from '../commands/readCommit.js'
import { _walk } from '../commands/walk.js'
import { AlreadyExistsError } from '../errors/AlreadyExistsError.js'
import { EmptyCommitError } from '../errors/EmptyCommitError.js'
import { MergeConflictError } from '../errors/MergeConflictError.js'
import { NotFoundError } from '../errors/NotFoundError.js'
import { RebaseLocalChangesError } from '../errors/RebaseLocalChangesError.js'
import { RebaseNotSupportedError } from '../errors/RebaseNotSupportedError.js'
import { GitConfigManager } from '../managers/GitConfigManager.js'
import { GitIgnoreManager } from '../managers/GitIgnoreManager.js'
import { GitIndexManager } from '../managers/GitIndexManager.js'
import { GitRefManager } from '../managers/GitRefManager.js'
import { GitShallowManager } from '../managers/GitShallowManager.js'
import { findLocalChanges } from '../utils/findLocalChanges.js'
import { findSameChanges } from '../utils/findSameChanges.js'
import {
  clearMergeState,
  formatMergeMessage,
  stripConflictsComment,
} from '../utils/mergeState.js'
import { mergeTree } from '../utils/mergeTree.js'
import { resolveCommit } from '../utils/resolveCommit.js'

const EMPTY_TREE_OID = '4b825dc642cb6eb9a060e54bf8d69288fbee4904'

// What git writes to `rebase-merge/head-name` when no branch is rebased.
const DETACHED = 'detached HEAD'

/**
 * @typedef {Object} RebaseResult
 * @property {string} oid - The commit the rebased branch now points to
 * @property {boolean} [alreadyUpToDate] - True if the branch was already up to date, so no commit was replayed
 */

/**
 * @typedef {Object} RebaseState - What `.git/rebase-merge` remembers between stops
 * @property {string} headName - The branch being rebased, e.g. `refs/heads/topic`, or `detached HEAD`
 * @property {string} onto - The commit the branch is replayed onto
 * @property {string} origHead - Where the branch was before the rebase
 * @property {Array<{oid: string, subject: string}>} todo - The commits still to replay
 * @property {Array<{oid: string, subject: string}>} done - The commits already handled
 * @property {string} [stoppedSha] - The commit whose replay stopped
 * @property {boolean} [started] - Set while the rebase is being started (not continued)
 * @property {boolean} [dropRedundant] - Whether commits that become empty are dropped (`git rebase` without `-i` or `--empty=stop`) rather than stopped at
 */

/**
 * @param {object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {object} args.cache
 * @param {string} [args.dir]
 * @param {string} args.gitdir
 * @param {string} args.upstream
 * @param {string} [args.onto]
 * @param {string} [args.branch]
 * @param {Object} args.committer
 * @param {boolean} args.abortOnConflict
 * @param {MergeDriverCallback} [args.mergeDriver]
 *
 * @returns {Promise<RebaseResult>}
 */
export async function _rebase({
  fs,
  cache,
  dir,
  gitdir,
  upstream,
  onto = upstream,
  branch,
  committer,
  abortOnConflict = true,
  mergeDriver,
}) {
  for (const name of ['rebase-merge', 'rebase-apply']) {
    if (await fs.exists(`${gitdir}/${name}`)) {
      throw new AlreadyExistsError('rebase', `${gitdir}/${name}`, false)
    }
  }
  const { headName, origHead } = await findBranch({
    fs,
    cache,
    gitdir,
    branch,
  })
  const upstreamOid = await resolveCommitish({
    fs,
    cache,
    gitdir,
    ref: upstream,
  })
  const ontoOid = await resolveCommitish({ fs, cache, gitdir, ref: onto })

  // Like git, refuse to start over local changes, even with nothing to do.
  if (dir) await assertCleanWorkTree({ fs, cache, dir, gitdir })

  if (
    await isUpToDate({
      fs,
      cache,
      gitdir,
      onto: ontoOid,
      upstream: upstreamOid,
      head: origHead,
    })
  ) {
    // Like git, the branch is still checked out.
    await finish({ fs, cache, dir, gitdir, headName, oid: origHead })
    return { oid: origHead, alreadyUpToDate: true }
  }

  const picks = await listPicks({
    fs,
    cache,
    dir,
    gitdir,
    tip: origHead,
    upstream: upstreamOid,
  })
  const state = {
    headName,
    onto: ontoOid,
    origHead,
    todo: picks.map(pick => ({ oid: pick.oid, subject: subjectOf(pick) })),
    done: [],
    // Like git, ORIG_HEAD is only written by the call that starts it.
    started: true,
    dropRedundant: true,
  }
  return replay({
    fs,
    cache,
    dir,
    gitdir,
    state,
    head: ontoOid,
    committer,
    stopOnConflict: !abortOnConflict,
    mergeDriver,
  })
}

/**
 * @param {object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {object} args.cache
 * @param {string} args.dir
 * @param {string} args.gitdir
 * @param {Object} args.committer
 * @param {boolean} args.skip
 * @param {MergeDriverCallback} [args.mergeDriver]
 *
 * @returns {Promise<RebaseResult>}
 */
export async function _continueRebase({
  fs,
  cache,
  dir,
  gitdir,
  committer,
  skip = false,
  mergeDriver,
}) {
  const state = await readState({ fs, gitdir })
  const head = await GitRefManager.resolve({ fs, gitdir, ref: 'HEAD' })
  const read = name =>
    fs.read(`${gitdir}/rebase-merge/${name}`, { encoding: 'utf8' })

  if (skip) {
    // Drop whatever the stopped commit left in the index and working tree.
    await _checkout({ fs, cache, dir, gitdir, ref: head, force: true })
  } else {
    // Unresolved conflicts stop here with an UnmergedPathsError and, like
    // git, so do unstaged changes.
    const { commit: headCommit } = await _readCommit({
      fs,
      cache,
      gitdir,
      oid: head,
    })
    const { staged, unstaged } = await findChanges({
      fs,
      cache,
      dir,
      gitdir,
      headTree: headCommit.tree,
    })
    if (unstaged.length > 0) throw new RebaseLocalChangesError(unstaged)
    const amend = /** @type {string|null} */ (await read('amend'))
    if (amend) {
      // `git rebase -i` stopped to edit a commit: like git, staged changes
      // amend it, as long as it is still HEAD.
      if (staged.length > 0) {
        if (amend.trim() !== head) throw new RebaseLocalChangesError(staged)
        await _commit({ fs, cache, gitdir, amend: true, committer })
      }
    } else if (state.stoppedSha) {
      // Commit the resolution, unless the user already did (or nothing is
      // left of the commit).
      const { commit } = await _readCommit({
        fs,
        cache,
        gitdir,
        oid: state.stoppedSha,
      })
      const message = (await read('message')) || commit.message
      try {
        await _commit({
          fs,
          cache,
          gitdir,
          message: stripConflictsComment(/** @type {string} */ (message)),
          author: commit.author,
          committer,
          disallowEmpty: true,
        })
      } catch (err) {
        if (err.code !== EmptyCommitError.code) throw err
      }
    }
  }
  for (const file of ['stopped-sha', 'message', 'author-script', 'amend']) {
    await fs.rm(`${gitdir}/rebase-merge/${file}`)
  }
  await fs.rm(`${gitdir}/REBASE_HEAD`)
  await clearMergeState({ fs, gitdir })

  return replay({
    fs,
    cache,
    dir,
    gitdir,
    state,
    head: await GitRefManager.resolve({ fs, gitdir, ref: 'HEAD' }),
    committer,
    stopOnConflict: true,
    mergeDriver,
  })
}

/**
 * @param {object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {object} args.cache
 * @param {string} args.dir
 * @param {string} args.gitdir
 */
export async function _abortRebase({ fs, cache, dir, gitdir }) {
  const { headName, origHead } = await readState({ fs, gitdir, todo: false })
  const headTree = await treeOf({ fs, cache, gitdir, ref: 'HEAD' })
  const origTree = await treeOf({ fs, cache, gitdir, ref: origHead })
  // Like `git rebase --abort`, refuse, with nothing changed, over an
  // untracked file where the branch has something; git replaces ignored
  // files, but refusing for them too never loses one.
  const inTheWay = await findUntracked({
    fs,
    cache,
    dir,
    gitdir,
    tree: origTree,
  })
  if (inTheWay.length > 0) throw new RebaseLocalChangesError(inTheWay)
  // Directories that become files, or files that become directories, which
  // checkout does not replace. What is in them is tracked, as just checked.
  for (const filepath of await findTypeChanges({
    fs,
    cache,
    gitdir,
    from: headTree,
    to: origTree,
  })) {
    await removePath({ fs, cache, dir, gitdir, filepath })
  }
  // Like git, put the branch back where it was and check it out.
  if (headName.startsWith('refs/')) {
    await GitRefManager.writeRef({ fs, gitdir, ref: headName, value: origHead })
  }
  await _checkout({
    fs,
    cache,
    dir,
    gitdir,
    ref: headName.startsWith('refs/') ? headName : origHead,
    force: true,
  })
  await clearRebaseState({ fs, gitdir })
}

/**
 * Replay `state.todo` on top of `head`, then move the branch there. A commit
 * that conflicts either throws right away or, with `stopOnConflict`, is left
 * in the working tree the way git leaves it, with the rebase state recorded
 * for `continueRebase`, `abortRebase` or `git rebase --continue`.
 */
async function replay({
  fs,
  cache,
  dir,
  gitdir,
  state,
  head,
  committer,
  stopOnConflict,
  mergeDriver,
}) {
  const shallows = await GitShallowManager.read({ fs, gitdir })
  while (state.todo.length) {
    const pick = state.todo.shift()
    state.done.push(pick)
    const { commit } = await _readCommit({ fs, cache, gitdir, oid: pick.oid })
    const parents = shallows.has(pick.oid) ? [] : commit.parent
    // Like git, a commit that already sits on the commit it would be
    // replayed onto is kept as it is.
    if (parents.length === 1 && parents[0] === head) {
      head = pick.oid
      continue
    }
    const baseTree = parents.length
      ? (await _readCommit({ fs, cache, gitdir, oid: parents[0] })).commit.tree
      : EMPTY_TREE_OID
    const headTree = (await _readCommit({ fs, cache, gitdir, oid: head }))
      .commit.tree

    let tree = headTree
    if (commit.tree !== baseTree) {
      // Work out the merge first without touching the working tree, so a
      // conflict can still be reported with nothing changed.
      const merge = args =>
        GitIndexManager.acquire({ fs, gitdir, cache }, index =>
          mergeTree({
            fs,
            cache,
            gitdir,
            index,
            ourOid: headTree,
            baseOid: baseTree,
            theirOid: commit.tree,
            ourName: 'HEAD',
            baseName: `parent of ${pick.oid.slice(0, 7)}`,
            theirName: `${pick.oid.slice(0, 7)} (${pick.subject})`,
            abortOnConflict: true,
            mergeDriver,
            ...args,
          })
        )
      const result = await merge({})
      if (result instanceof MergeConflictError) {
        if (!stopOnConflict || !dir) throw result
        // Like git, refuse when writing the commit's files would lose an
        // untracked file in their way; nothing is changed yet.
        const makeRoom = await findRoom({
          fs,
          cache,
          dir,
          gitdir,
          headTree: await treeOf({ fs, cache, gitdir, ref: 'HEAD' }),
          baseTree,
          theirTree: commit.tree,
        })
        await checkoutOver({ fs, cache, dir, gitdir, oid: head })
        await makeRoom()
        const conflict = await merge({ dir, abortOnConflict: false })
        await writeStop({ fs, gitdir, state, pick, commit, conflict })
        throw conflict
      }
      tree = result
      if (tree === headTree) {
        // A commit that has nothing left to add is dropped, like git does,
        // unless git started the rebase to stop there (`-i`,
        // `--empty=stop`): then it stops, and continuing drops it.
        if (state.dropRedundant) continue
        await checkoutOver({ fs, cache, dir, gitdir, oid: head })
        await writeStop({ fs, gitdir, state, pick, commit })
        await fs.write(`${gitdir}/CHERRY_PICK_HEAD`, `${pick.oid}\n`)
        throw new EmptyCommitError()
      }
    }
    head = await _commit({
      fs,
      cache,
      gitdir,
      message: commit.message,
      tree,
      parent: [head],
      author: commit.author,
      committer,
      noUpdateBranch: true,
    })
  }

  await finish({ fs, cache, dir, gitdir, headName: state.headName, oid: head })
  if (state.started)
    await fs.write(`${gitdir}/ORIG_HEAD`, `${state.origHead}\n`)
  await clearRebaseState({ fs, gitdir })
  return { oid: head }
}

// Move the branch (if any) to `oid`. With a working tree, also check it out
// and point HEAD at the branch, or detach HEAD at `oid` like git when no
// branch is rebased; without one, HEAD is left alone.
async function finish({ fs, cache, dir, gitdir, headName, oid }) {
  if (dir) await checkoutOver({ fs, cache, dir, gitdir, oid })
  if (headName === DETACHED) return
  await GitRefManager.writeRef({ fs, gitdir, ref: headName, value: oid })
  if (dir) {
    await GitRefManager.writeSymbolicRef({
      fs,
      gitdir,
      ref: 'HEAD',
      value: headName,
    })
  }
}

// Check out a commit the way git's rebase does: refuse when an untracked file
// is in the way, but replace untracked files that .gitignore ignores, and
// untracked directories that hold nothing else, when the ignore rules are
// simple enough to be sure git agrees (`isIgnored` with `strict`).
async function checkoutOver({ fs, cache, dir, gitdir, oid }) {
  const from = await treeOf({ fs, cache, gitdir, ref: 'HEAD' })
  const to = await treeOf({ fs, cache, gitdir, ref: oid })
  const makeRoom = await findRoom({
    fs,
    cache,
    dir,
    gitdir,
    headTree: from,
    baseTree: from,
    theirTree: to,
    typeChanges: true,
  })
  await makeRoom()
  await _checkout({ fs, cache, dir, gitdir, ref: oid })
}

async function treeOf({ fs, cache, gitdir, ref }) {
  const oid = await GitRefManager.resolve({ fs, gitdir, ref })
  return (await _readCommit({ fs, cache, gitdir, oid })).commit.tree
}

/**
 * Check that the changes from `baseTree` to `theirTree` can be written over
 * the working tree (checked out at `headTree`) without losing anything, and
 * return what clears the way: removing the ignored files and directories in
 * it, and (with `typeChanges`) the tracked directories that become files or
 * files that become directories, which checkout does not replace.
 * Throws `RebaseLocalChangesError`, with nothing changed, for anything else in
 * the way, and for anything in or above a repository nested in the working
 * tree (a submodule's checkout, say), which is never removed.
 *
 * @returns {Promise<() => Promise<void>>}
 */
async function findRoom({
  fs,
  cache,
  dir,
  gitdir,
  headTree,
  baseTree,
  theirTree,
  typeChanges = false,
}) {
  const ignored = []
  const filepaths = await findLocalChanges({
    fs,
    cache,
    dir,
    gitdir,
    headTree,
    baseTree,
    theirTree,
    ignored,
  })
  const ignoredDirs = []
  const inTheWay = []
  for (const filepath of filepaths) {
    if (await isIgnoredDir({ fs, dir, gitdir, filepath })) {
      ignoredDirs.push(filepath)
    } else {
      inTheWay.push(filepath)
    }
  }
  const replaced = typeChanges
    ? await findTypeChanges({
        fs,
        cache,
        gitdir,
        from: headTree,
        to: theirTree,
      })
    : []
  for (const filepath of [...ignored, ...ignoredDirs, ...replaced]) {
    if (await holdsRepository({ fs, dir, filepath })) inTheWay.push(filepath)
  }
  if (inTheWay.length > 0) {
    throw new RebaseLocalChangesError([...new Set(inTheWay)].sort())
  }
  return async () => {
    for (const filepath of ignored) await fs.rm(`${dir}/${filepath}`)
    for (const filepath of ignoredDirs) {
      await fs.rmdir(`${dir}/${filepath}`, { recursive: true })
    }
    for (const filepath of replaced) {
      await removePath({ fs, cache, dir, gitdir, filepath })
    }
  }
}

// Remove a path from the working tree and the index.
async function removePath({ fs, cache, dir, gitdir, filepath }) {
  const stat = await fs.lstat(`${dir}/${filepath}`)
  if (stat && stat.isDirectory()) {
    await fs.rmdir(`${dir}/${filepath}`, { recursive: true })
  } else if (stat) {
    await fs.rm(`${dir}/${filepath}`)
  }
  await GitIndexManager.acquire({ fs, gitdir, cache }, async index =>
    index.delete({ filepath })
  )
}

/**
 * The untracked files (ignored ones too) that checking out `tree` would
 * overwrite, and the directories that would have to go with untracked files
 * in them: what `git rebase --abort` refuses to overwrite.
 */
async function findUntracked({ fs, cache, dir, gitdir, tree }) {
  const tracked = await GitIndexManager.acquire(
    { fs, gitdir, cache },
    async index => [...index.entriesMap.keys()]
  )
  const isTracked = path => tracked.includes(path)
  const holdsUntracked = async path => {
    for (const name of (await fs.readdir(`${dir}/${path}`)) || []) {
      const child = `${path}/${name}`
      const stat = await fs.lstat(`${dir}/${child}`)
      if (
        stat.isDirectory() ? await holdsUntracked(child) : !isTracked(child)
      ) {
        return true
      }
    }
    return false
  }
  return _walk({
    fs,
    cache,
    dir,
    gitdir,
    trees: [TREE({ ref: tree }), WORKDIR({ refresh: false })],
    map: async (filepath, [target, workdir]) => {
      if (filepath === '.') return
      if (!target || !workdir) return null
      const types = [await target.type(), await workdir.type()]
      if (types[0] === 'tree' && types[1] === 'tree') return
      if (types[1] === 'tree') {
        // A submodule's directory is kept as it is.
        if (types[0] === 'commit') return null
        return (await holdsUntracked(filepath)) ? filepath : null
      }
      return isTracked(filepath) ? null : filepath
    },
  })
}

// Whether removing `filepath` would remove part of a repository nested in
// the working tree: a `.git` in a directory above it, at it, or below it.
async function holdsRepository({ fs, dir, filepath }) {
  const parts = filepath.split('/')
  for (let i = 1; i <= parts.length; i++) {
    const path = parts.slice(0, i).join('/')
    if (await fs.exists(`${dir}/${path}/.git`)) return true
  }
  const below = async path => {
    const stat = await fs.lstat(`${dir}/${path}`)
    if (!stat || !stat.isDirectory()) return false
    for (const name of (await fs.readdir(`${dir}/${path}`)) || []) {
      if (name === '.git' || (await below(`${path}/${name}`))) return true
    }
    return false
  }
  return below(filepath)
}

// The paths that are a directory in one tree and a file in the other
// (submodules left out).
async function findTypeChanges({ fs, cache, gitdir, from, to }) {
  return _walk({
    fs,
    cache,
    gitdir,
    trees: [TREE({ ref: from }), TREE({ ref: to })],
    map: async (filepath, [before, after]) => {
      if (filepath === '.') return
      if (!before || !after) return null
      if ((await before.oid()) === (await after.oid())) return null
      const types = [await before.type(), await after.type()]
      if (types.includes('commit')) {
        // A submodule replaced by a directory or a file, or the reverse,
        // which checkout cannot do. git keeps the submodule's directory and
        // whatever is in it; refuse rather than risk it.
        if (types[0] !== types[1]) {
          throw new RebaseNotSupportedError(
            `a submodule that becomes a directory or a file, or the reverse (${filepath})`
          )
        }
        return null
      }
      if ((types[0] === 'tree') !== (types[1] === 'tree')) return filepath
      if (types[0] !== 'tree') return null
    },
  })
}

// A directory in which every file is ignored (by rules simple enough to be
// sure git agrees), which git replaces. Only
// untracked directories are reported in the way (the index matches HEAD
// whenever a commit is checked out here).
async function isIgnoredDir({ fs, dir, gitdir, filepath }) {
  const stat = await fs.lstat(`${dir}/${filepath}`)
  if (!stat || !stat.isDirectory()) return false
  const allIgnored = async path => {
    for (const name of (await fs.readdir(`${dir}/${path}`)) || []) {
      const child = `${path}/${name}`
      const childStat = await fs.lstat(`${dir}/${child}`)
      if (childStat.isDirectory()) {
        if (!(await allIgnored(child))) return false
      } else if (
        !(await GitIgnoreManager.isIgnored({
          fs,
          dir,
          gitdir,
          filepath: child,
          strict: true,
        }))
      ) {
        return false
      }
    }
    return true
  }
  return allIgnored(filepath)
}

// Record the stopped rebase the way git does, so git can take over.
async function writeStop({ fs, gitdir, state, pick, commit, conflict }) {
  const message = conflict
    ? formatMergeMessage(commit.message, conflict.data.filepaths)
    : commit.message
  const line = ({ oid, subject }) => `pick ${oid} ${subject}\n`
  const files = {
    'head-name': `${state.headName}\n`,
    onto: `${state.onto}\n`,
    'orig-head': `${state.origHead}\n`,
    'git-rebase-todo': state.todo.map(line).join(''),
    done: state.done.map(line).join(''),
    end: `${state.todo.length + state.done.length}\n`,
    msgnum: `${state.done.length}\n`,
    'stopped-sha': `${pick.oid}\n`,
    message,
    'author-script': authorScript(commit.author),
    interactive: '',
  }
  // Like `git rebase`, drop commits that become empty after a stop too.
  if (state.dropRedundant) files.drop_redundant_commits = ''
  for (const [name, content] of Object.entries(files)) {
    await fs.write(`${gitdir}/rebase-merge/${name}`, content)
  }
  await fs.write(`${gitdir}/REBASE_HEAD`, `${pick.oid}\n`)
  await fs.write(`${gitdir}/MERGE_MSG`, message)
  if (state.started)
    await fs.write(`${gitdir}/ORIG_HEAD`, `${state.origHead}\n`)
}

// The files in `.git/rebase-merge` that continueRebase follows, or that do
// not change how commits are replayed (messages, hooks, exec lines, rerere,
// which the library does not use).
const UNDERSTOOD_STATE_FILES = [
  'head-name',
  'onto',
  'orig-head',
  'git-rebase-todo',
  'git-rebase-todo.backup',
  'done',
  'end',
  'msgnum',
  'stopped-sha',
  'message',
  'author-script',
  'amend',
  'interactive',
  'drop_redundant_commits',
  'patch',
  'quiet',
  'verbose',
  'reschedule-failed-exec',
  'no-reschedule-failed-exec',
  'allow_rerere_autoupdate',
  'rewritten-list',
]

/**
 * Read the rebase in progress. Its to-do list is only read when `todo` is
 * set, and then may hold nothing but picks.
 *
 * @returns {Promise<RebaseState>}
 */
async function readState({ fs, gitdir, todo = true }) {
  const read = async name =>
    /** @type {string|null} */ (
      await fs.read(`${gitdir}/rebase-merge/${name}`, { encoding: 'utf8' })
    )
  const headName = await read('head-name')
  if (!headName) throw new NotFoundError('a rebase in progress')
  // git re-applies an autostash when the rebase ends; refuse rather than
  // lose it.
  if (await fs.exists(`${gitdir}/rebase-merge/autostash`)) {
    throw new RebaseNotSupportedError('an autostash')
  }
  // Every other file git keeps there records an option of `git rebase`
  // (--signoff, --committer-date-is-author-date, --ignore-date, --empty=keep,
  // --update-refs, -S, -X, --root, ...) that would change how the rest is
  // replayed, so continuing is refused. None of them changes an abort.
  if (todo) {
    for (const name of (await fs.readdir(`${gitdir}/rebase-merge`)) || []) {
      if (!UNDERSTOOD_STATE_FILES.includes(name)) {
        throw new RebaseNotSupportedError(
          `the option git recorded in rebase-merge/${name}`
        )
      }
    }
  }
  // The list of what is done is just read for its count.
  const picks = (text, strict) =>
    (text || '')
      .split('\n')
      .filter(line => line && !line.startsWith('#'))
      .map(line => {
        const [command, oid, ...subject] = line.split(' ')
        if (strict && command !== 'pick' && command !== 'p') {
          throw new RebaseNotSupportedError(`the to-do command '${command}'`)
        }
        return { oid, subject: subject.join(' ') }
      })
  const stoppedSha = await read('stopped-sha')
  return {
    headName: headName.trim(),
    onto: /** @type {string} */ (await read('onto')).trim(),
    origHead: /** @type {string} */ (await read('orig-head')).trim(),
    todo: todo ? picks(await read('git-rebase-todo'), true) : [],
    done: todo ? picks(await read('done'), false) : [],
    stoppedSha: stoppedSha ? stoppedSha.trim() : undefined,
    dropRedundant: await fs.exists(
      `${gitdir}/rebase-merge/drop_redundant_commits`
    ),
  }
}

async function clearRebaseState({ fs, gitdir }) {
  await fs.rmdir(`${gitdir}/rebase-merge`, { recursive: true })
  await fs.rm(`${gitdir}/REBASE_HEAD`)
  await clearMergeState({ fs, gitdir })
}

// Like `git rebase`, refuse to start over staged or unstaged changes to
// tracked files (untracked files do not count).
async function assertCleanWorkTree({ fs, cache, dir, gitdir }) {
  const { commit } = await _readCommit({
    fs,
    cache,
    gitdir,
    oid: await GitRefManager.resolve({ fs, gitdir, ref: 'HEAD' }),
  })
  const { staged, unstaged } = await findChanges({
    fs,
    cache,
    dir,
    gitdir,
    headTree: commit.tree,
  })
  const filepaths = [...new Set([...staged, ...unstaged])].sort()
  if (filepaths.length > 0) throw new RebaseLocalChangesError(filepaths)
}

/**
 * The tracked files whose index entry differs from `headTree` (staged) and
 * whose working tree file differs from the index (unstaged), as `git
 * rebase` sees them before it starts: deletions and mode changes count,
 * submodules do not, and neither does the executable bit when
 * `core.fileMode` is false. Throws `UnmergedPathsError` on unmerged paths.
 */
async function findChanges({ fs, cache, dir, gitdir, headTree }) {
  await GitIndexManager.acquire(
    { fs, gitdir, cache, allowUnmerged: false },
    async () => {}
  )
  const config = await GitConfigManager.get({ fs, gitdir })
  const fileMode = (await config.get('core.filemode')) !== false
  const file = async entry => {
    if (!entry) return
    const type = await entry.type()
    if (type === 'tree') return
    return { type, mode: await entry.mode(), oid: () => entry.oid() }
  }
  const regular = mode => mode === 0o100644 || mode === 0o100755
  const sameMode = (a, b) => a === b || (!fileMode && regular(a) && regular(b))
  const differ = async (a, b) =>
    !a || !b || !sameMode(a.mode, b.mode) || (await a.oid()) !== (await b.oid())
  const staged = []
  const unstaged = []
  await _walk({
    fs,
    cache,
    dir,
    gitdir,
    // Only looking: the index is not refreshed (that would also take the
    // executable bit from disk when core.fileMode is false).
    trees: [TREE({ ref: headTree }), STAGE(), WORKDIR({ refresh: false })],
    map: async (filepath, [head, stage, workdir]) => {
      if (filepath === '.') return
      // Untracked files and directories are not looked into.
      if (!head && !stage) return null
      const headFile = await file(head)
      const stageFile = await file(stage)
      if (
        (headFile && headFile.type === 'commit') ||
        (stageFile && stageFile.type === 'commit')
      ) {
        return
      }
      if ((headFile || stageFile) && (await differ(headFile, stageFile))) {
        staged.push(filepath)
      }
      if (stageFile) {
        const workdirFile = await file(workdir)
        if (await differ(stageFile, workdirFile)) unstaged.push(filepath)
      }
    },
  })
  return { staged, unstaged }
}

// Like git, nothing to do when the branch has only linear history on top of
// `onto`, and `onto` is also where it forked from `upstream`.
async function isUpToDate({ fs, cache, gitdir, onto, upstream, head }) {
  for (const oid of new Set([onto, upstream])) {
    const bases = await _findMergeBase({ fs, cache, gitdir, oids: [oid, head] })
    if (bases.length !== 1 || bases[0] !== onto) return false
  }
  const shallows = await GitShallowManager.read({ fs, gitdir })
  for (let oid = head; oid !== onto; ) {
    const { commit } = await _readCommit({ fs, cache, gitdir, oid })
    const parents = shallows.has(oid) ? [] : commit.parent
    if (parents.length !== 1) return parents.length === 0
    oid = parents[0]
  }
  return true
}

/**
 * The branch to rebase and where it is. Like git, a branch is rebased and
 * moved; any other name of a commit (an oid, a tag, a remote-tracking branch)
 * is rebased on a detached HEAD and no ref is changed.
 *
 * @returns {Promise<{headName: string, origHead: string}>}
 */
async function findBranch({ fs, cache, gitdir, branch }) {
  if (branch === undefined) {
    const current = await _currentBranch({ fs, gitdir, fullname: true })
    branch = current || 'HEAD'
  }
  for (const ref of [`refs/heads/${branch}`, branch]) {
    if (!ref.startsWith('refs/heads/')) continue
    let oid
    try {
      oid = await GitRefManager.resolve({ fs, gitdir, ref })
    } catch (err) {
      if (err instanceof NotFoundError) continue
      throw err
    }
    return {
      headName: ref,
      origHead: (await resolveCommit({ fs, cache, gitdir, oid })).oid,
    }
  }
  return {
    headName: DETACHED,
    origHead: await resolveCommitish({ fs, cache, gitdir, ref: branch }),
  }
}

// How far back in time both sides keep being walked once no commit that is
// on only one side is left to look at, to cope with commits whose dates are
// out of order (git uses a small count of commits for the same purpose).
const DATE_SLOP = 24 * 60 * 60

// Which tips a commit is reachable from.
const ON_BRANCH = 1
const ON_UPSTREAM = 2
const ON_BOTH = ON_BRANCH | ON_UPSTREAM

/**
 * The commits to replay, in the order `git rebase` replays them (`git
 * rev-list --reverse --topo-order --no-merges upstream..tip`): the commits
 * reachable from `tip` but not from `upstream`, leaving out merge commits,
 * listed from `tip` down with a commit only once all its children are, the
 * parent that became ready last first. Like git, a commit whose change
 * upstream already made is left out too (see `findSameChanges`).
 */
async function listPicks({ fs, cache, dir, gitdir, tip, upstream }) {
  const commits = await walkBothSides({ fs, cache, gitdir, tip, upstream })
  const onBranch = commits.filter(entry => entry.flags === ON_BRANCH)
  if (!onBranch.length) return []

  const byOid = new Map(onBranch.map(entry => [entry.oid, entry]))
  const children = new Map(onBranch.map(entry => [entry.oid, 0]))
  for (const entry of onBranch) {
    for (const parent of entry.parents) {
      if (children.has(parent)) children.set(parent, children.get(parent) + 1)
    }
  }
  const ordered = []
  const stack = [byOid.get(tip)]
  while (stack.length) {
    const entry = stack.pop()
    ordered.push(entry)
    for (const parent of entry.parents) {
      if (!children.has(parent)) continue
      children.set(parent, children.get(parent) - 1)
      if (children.get(parent) === 0) stack.push(byOid.get(parent))
    }
  }
  const picks = ordered.reverse().filter(entry => entry.parents.length <= 1)

  const walked = new Map(commits.map(entry => [entry.oid, entry]))
  const patchCommit = async ({ oid, commit, parents }) => ({
    oid,
    tree: commit.tree,
    parentTree: !parents.length
      ? EMPTY_TREE_OID
      : walked.has(parents[0])
        ? walked.get(parents[0]).commit.tree
        : (await _readCommit({ fs, cache, gitdir, oid: parents[0] })).commit
            .tree,
  })
  const ours = []
  for (const entry of picks) ours.push(await patchCommit(entry))
  const theirs = []
  for (const entry of commits) {
    if (entry.flags === ON_UPSTREAM && entry.parents.length <= 1) {
      theirs.push(await patchCommit(entry))
    }
  }
  // git reads attributes from the working tree, which HEAD's tree stands
  // for when there is none here; the branch's own tree is added to be safe.
  const trees = [
    (await _readCommit({ fs, cache, gitdir, oid: tip })).commit.tree,
  ]
  try {
    trees.push(await treeOf({ fs, cache, gitdir, ref: 'HEAD' }))
  } catch (err) {
    // An unborn HEAD (in a bare repository) has no tree.
    if (!(err instanceof NotFoundError)) throw err
  }
  const applied = await findSameChanges({
    fs,
    cache,
    dir,
    gitdir,
    ours,
    theirs,
    trees,
  })
  return picks.filter(entry => !applied.has(entry.oid))
}

/**
 * Walk back from `tip` and `upstream`, newest first, marking each commit
 * with the tips it is reachable from, until only commits reachable from both
 * are left (and older than the others by `DATE_SLOP`).
 */
async function walkBothSides({ fs, cache, gitdir, tip, upstream }) {
  const shallows = await GitShallowManager.read({ fs, gitdir })
  const seen = new Map()
  const queue = []
  const date = entry => entry.commit.committer.timestamp
  // Marking a commit marks every ancestor already seen.
  const mark = (start, flags) => {
    const stack = [start]
    while (stack.length) {
      const entry = stack.pop()
      if ((entry.flags | flags) === entry.flags) continue
      entry.flags |= flags
      for (const parent of entry.parents) {
        if (seen.has(parent)) stack.push(seen.get(parent))
      }
    }
  }
  const add = async (oid, flags) => {
    if (seen.has(oid)) return mark(seen.get(oid), flags)
    const { commit } = await _readCommit({ fs, cache, gitdir, oid })
    const parents = shallows.has(oid) ? [] : commit.parent
    const added = { oid, commit, parents, flags }
    seen.set(oid, added)
    const at = queue.findIndex(other => date(added) > date(other))
    queue.splice(at === -1 ? queue.length : at, 0, added)
  }
  await add(tip, ON_BRANCH)
  await add(upstream, ON_UPSTREAM)
  let oldest = Infinity
  while (queue.length) {
    const entry = queue[0]
    if (
      date(entry) < oldest - DATE_SLOP &&
      queue.every(other => other.flags === ON_BOTH)
    ) {
      break
    }
    queue.shift()
    for (const parent of entry.parents) await add(parent, entry.flags)
    if (entry.flags !== ON_BOTH) oldest = Math.min(oldest, date(entry))
  }
  return [...seen.values()]
}

async function resolveCommitish({ fs, cache, gitdir, ref }) {
  const oid = await GitRefManager.resolve({ fs, gitdir, ref })
  return (await resolveCommit({ fs, cache, gitdir, oid })).oid
}

function subjectOf({ commit }) {
  return commit.message.split('\n')[0]
}

function authorScript({ name, email, timestamp, timezoneOffset }) {
  const quote = value => `'${String(value).replace(/'/g, `'\\''`)}'`
  const sign = timezoneOffset > 0 ? '-' : '+'
  const minutes = Math.abs(timezoneOffset)
  const zone = `${sign}${String(Math.floor(minutes / 60)).padStart(
    2,
    '0'
  )}${String(minutes % 60).padStart(2, '0')}`
  return (
    `GIT_AUTHOR_NAME=${quote(name)}\n` +
    `GIT_AUTHOR_EMAIL=${quote(email)}\n` +
    `GIT_AUTHOR_DATE=${quote(`@${timestamp} ${zone}`)}\n`
  )
}
