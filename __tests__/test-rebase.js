/* eslint-env node, browser, jasmine */
import {
  Errors,
  abortRebase,
  add,
  annotatedTag,
  branch,
  checkout,
  commit as gitCommit,
  continueRebase,
  init,
  log,
  merge,
  readCommit,
  rebase,
  remove,
  resolveRef,
  setConfig,
  status,
  statusMatrix,
  writeBlob,
  writeRef,
  writeTree,
} from 'isomorphic-git'
import { GitIndexManager } from 'isomorphic-git/internal-apis'

import { makeFixture } from './__helpers__/FixtureFS.js'

describe('rebase', () => {
  const author = {
    name: 'Original Author',
    email: 'original@example.com',
    timestamp: 1600000000,
    timezoneOffset: 0,
  }
  const committer = {
    name: 'Committer',
    email: 'committer@example.com',
    timestamp: 1700000000,
    timezoneOffset: 0,
  }

  // base:   f.txt, keep.txt
  // topic:  "topic 1" edits f.txt, "topic 2" adds g.txt
  // master: edits f.txt too unless told otherwise (so "topic 1" conflicts),
  //         and adds m.txt
  async function setup(name, { conflict = true } = {}) {
    const { fs, dir, gitdir } = await makeFixture(name)
    await init({ fs, dir, gitdir })
    await fs.write(`${dir}/f.txt`, 'a\nb\nc\n')
    await fs.write(`${dir}/keep.txt`, 'keep\n')
    await add({ fs, dir, gitdir, filepath: '.' })
    const baseOid = await gitCommit({
      fs,
      dir,
      gitdir,
      message: 'base',
      author,
    })

    await branch({ fs, dir, gitdir, ref: 'topic', checkout: true })
    await fs.write(`${dir}/f.txt`, 'a\nTOPIC\nc\n')
    await add({ fs, dir, gitdir, filepath: 'f.txt' })
    const topic1 = await gitCommit({
      fs,
      dir,
      gitdir,
      message: 'topic 1',
      author,
    })
    await fs.write(`${dir}/g.txt`, 'g\n')
    await add({ fs, dir, gitdir, filepath: 'g.txt' })
    const topic2 = await gitCommit({
      fs,
      dir,
      gitdir,
      message: 'topic 2\n\nbody line\n',
      author,
    })

    await checkout({ fs, dir, gitdir, ref: 'master' })
    if (conflict) await fs.write(`${dir}/f.txt`, 'a\nMASTER\nc\n')
    await fs.write(`${dir}/m.txt`, 'm\n')
    await add({ fs, dir, gitdir, filepath: '.' })
    const masterOid = await gitCommit({
      fs,
      dir,
      gitdir,
      message: 'master 1',
      author,
    })
    await checkout({ fs, dir, gitdir, ref: 'topic' })
    return { fs, dir, gitdir, baseOid, topic1, topic2, masterOid }
  }

  async function history(fs, gitdir, ref) {
    const commits = await log({ fs, gitdir, ref })
    return commits.map(({ commit }) => commit.message.split('\n')[0])
  }

  async function expectClean(fs, dir, gitdir) {
    const matrix = await statusMatrix({ fs, dir, gitdir })
    expect(matrix.every(row => row.slice(1).join() === '1,1,1')).toBe(true)
  }

  it('replays the branch on top of upstream and checks it out', async () => {
    const { fs, dir, gitdir, topic2, masterOid } = await setup(
      'tmp-rebase-clean',
      { conflict: false }
    )

    const { oid } = await rebase({
      fs,
      dir,
      gitdir,
      upstream: 'master',
      committer,
    })

    expect(await resolveRef({ fs, gitdir, ref: 'topic' })).toBe(oid)
    expect(await resolveRef({ fs, gitdir, ref: 'HEAD' })).toBe(oid)
    expect(await fs.read(`${gitdir}/HEAD`, 'utf8')).toBe(
      'ref: refs/heads/topic\n'
    )
    expect(await history(fs, gitdir, 'topic')).toEqual([
      'topic 2',
      'topic 1',
      'master 1',
      'base',
    ])
    const { commit } = await readCommit({ fs, gitdir, oid })
    expect(commit.author).toEqual(author)
    expect(commit.committer).toEqual(committer)
    expect(commit.message).toBe('topic 2\n\nbody line\n')
    const { commit: first } = await readCommit({
      fs,
      gitdir,
      oid: commit.parent[0],
    })
    expect(first.parent).toEqual([masterOid])
    // The working tree now has everything, and remembers where topic was.
    expect(await fs.read(`${dir}/m.txt`, 'utf8')).toBe('m\n')
    expect(await fs.read(`${dir}/f.txt`, 'utf8')).toBe('a\nTOPIC\nc\n')
    await expectClean(fs, dir, gitdir)
    expect(await fs.read(`${gitdir}/ORIG_HEAD`, 'utf8')).toBe(`${topic2}\n`)
  })

  it('does nothing when the branch is already up to date', async () => {
    const { fs, dir, gitdir, baseOid, topic2 } = await setup(
      'tmp-rebase-uptodate'
    )
    for (const upstream of [baseOid, 'topic']) {
      expect(await rebase({ fs, dir, gitdir, upstream, committer })).toEqual({
        oid: topic2,
        alreadyUpToDate: true,
      })
    }
    expect(await resolveRef({ fs, gitdir, ref: 'topic' })).toBe(topic2)
  })

  it('fast-forwards a branch that is behind upstream', async () => {
    const { fs, dir, gitdir, baseOid, topic2 } = await setup('tmp-rebase-ff')
    await branch({ fs, dir, gitdir, ref: 'behind', object: baseOid })

    const { oid } = await rebase({
      fs,
      dir,
      gitdir,
      upstream: 'topic',
      branch: 'behind',
      committer,
    })
    expect(oid).toBe(topic2)
    expect(await resolveRef({ fs, gitdir, ref: 'behind' })).toBe(topic2)
    expect(await fs.read(`${gitdir}/HEAD`, 'utf8')).toBe(
      'ref: refs/heads/behind\n'
    )
    expect(await fs.read(`${dir}/g.txt`, 'utf8')).toBe('g\n')
  })

  it('leaves out merge commits and drops commits that add nothing', async () => {
    const { fs, dir, gitdir, masterOid } = await setup('tmp-rebase-drop', {
      conflict: false,
    })
    // topic merges master, then adds m.txt exactly as master has it.
    await merge({ fs, dir, gitdir, theirs: 'master', author, committer })
    await checkout({ fs, dir, gitdir, ref: 'topic', force: true })
    await fs.write(`${dir}/f.txt`, 'a\nTOPIC\nc\nmore\n')
    await add({ fs, dir, gitdir, filepath: 'f.txt' })
    await gitCommit({ fs, dir, gitdir, message: 'topic 3', author })
    await checkout({ fs, dir, gitdir, ref: 'master' })
    await fs.write(`${dir}/m.txt`, 'm2\n')
    await add({ fs, dir, gitdir, filepath: 'm.txt' })
    await gitCommit({ fs, dir, gitdir, message: 'master 2', author })
    await checkout({ fs, dir, gitdir, ref: 'topic' })
    await fs.write(`${dir}/m.txt`, 'm2\n')
    await add({ fs, dir, gitdir, filepath: 'm.txt' })
    await gitCommit({ fs, dir, gitdir, message: 'same as master 2', author })

    await rebase({ fs, dir, gitdir, upstream: 'master', committer })

    expect(await history(fs, gitdir, 'topic')).toEqual([
      'topic 3',
      'topic 2',
      'topic 1',
      'master 2',
      'master 1',
      'base',
    ])
    expect(await fs.read(`${dir}/m.txt`, 'utf8')).toBe('m2\n')
    await expectClean(fs, dir, gitdir)
    expect(masterOid).toBeDefined()
  })

  it('throws and changes nothing on a conflict by default', async () => {
    const { fs, dir, gitdir, topic2 } = await setup('tmp-rebase-conflict')
    let error = null
    try {
      await rebase({ fs, dir, gitdir, upstream: 'master', committer })
    } catch (e) {
      error = e
    }
    expect(error).not.toBeNull()
    expect(error.code).toBe(Errors.MergeConflictError.code)
    expect(error.data.filepaths).toEqual(['f.txt'])
    expect(await resolveRef({ fs, gitdir, ref: 'topic' })).toBe(topic2)
    expect(await fs.read(`${gitdir}/HEAD`, 'utf8')).toBe(
      'ref: refs/heads/topic\n'
    )
    expect(await fs.read(`${dir}/f.txt`, 'utf8')).toBe('a\nTOPIC\nc\n')
    expect(await fs.exists(`${gitdir}/rebase-merge`)).toBe(false)
    await expectClean(fs, dir, gitdir)
  })

  it('refuses to start over local changes', async () => {
    const { fs, dir, gitdir, topic2 } = await setup('tmp-rebase-dirty', {
      conflict: false,
    })
    await fs.write(`${dir}/keep.txt`, 'edited\n')
    let error = null
    try {
      await rebase({ fs, dir, gitdir, upstream: 'master', committer })
    } catch (e) {
      error = e
    }
    expect(error).not.toBeNull()
    expect(error.code).toBe(Errors.RebaseLocalChangesError.code)
    expect(error.data.filepaths).toEqual(['keep.txt'])
    expect(await resolveRef({ fs, gitdir, ref: 'topic' })).toBe(topic2)
    expect(await fs.read(`${dir}/keep.txt`, 'utf8')).toBe('edited\n')
  })

  describe('untracked files where upstream has a file', () => {
    // master tracks .local/folder.lock; topic has it as an untracked file.
    async function lockSetup(name, { ignore, conflict }) {
      const { fs, dir, gitdir } = await makeFixture(name)
      await init({ fs, dir, gitdir })
      await fs.write(`${dir}/.gitignore`, ignore ? '.local\n' : '')
      await fs.write(`${dir}/f.txt`, 'one\ntwo\nthree\n')
      await add({ fs, dir, gitdir, filepath: '.gitignore' })
      await add({ fs, dir, gitdir, filepath: 'f.txt' })
      await gitCommit({ fs, dir, gitdir, message: 'base', author, committer })
      await branch({ fs, dir, gitdir, ref: 'topic', checkout: true })
      await fs.write(
        `${dir}/f.txt`,
        conflict ? 'one\ntopic\nthree\n' : 'one\ntwo\nthree\ntopic\n'
      )
      await add({ fs, dir, gitdir, filepath: 'f.txt' })
      const topicOid = await gitCommit({
        fs,
        dir,
        gitdir,
        message: 'topic 1',
        author,
        committer,
      })
      await checkout({ fs, dir, gitdir, ref: 'master' })
      await fs.write(`${dir}/.local/folder.lock`, 'theirs\n')
      await add({
        fs,
        dir,
        gitdir,
        filepath: '.local/folder.lock',
        force: true,
      })
      if (conflict) {
        await fs.write(`${dir}/f.txt`, 'one\nmaster\nthree\n')
        await add({ fs, dir, gitdir, filepath: 'f.txt' })
      }
      await gitCommit({ fs, dir, gitdir, message: 'master', author, committer })
      await checkout({ fs, dir, gitdir, ref: 'topic' })
      await fs.write(`${dir}/.local/folder.lock`, 'mine\n')
      return { fs, dir, gitdir, topicOid }
    }

    it('overwrites an untracked file that .gitignore ignores, like git', async () => {
      for (const conflict of [false, true]) {
        const { fs, dir, gitdir } = await lockSetup(
          `tmp-rebase-ignored-${conflict}`,
          { ignore: true, conflict }
        )
        let error = null
        try {
          await rebase({
            fs,
            dir,
            gitdir,
            upstream: 'master',
            committer,
            abortOnConflict: false,
          })
        } catch (e) {
          error = e
        }
        if (conflict) {
          expect(error && error.code).toBe(Errors.MergeConflictError.code)
        } else {
          expect(error).toBeNull()
        }
        expect(await fs.read(`${dir}/.local/folder.lock`, 'utf8')).toBe(
          'theirs\n'
        )
        expect(
          await status({ fs, dir, gitdir, filepath: '.local/folder.lock' })
        ).toBe('unmodified')
      }
    })

    it('refuses an untracked file that is not ignored, like git', async () => {
      const { fs, dir, gitdir, topicOid } = await lockSetup(
        'tmp-rebase-untracked',
        { ignore: false, conflict: false }
      )
      let error = null
      try {
        await rebase({ fs, dir, gitdir, upstream: 'master', committer })
      } catch (e) {
        error = e
      }
      expect(error).not.toBeNull()
      expect(error.code).toBe(Errors.RebaseLocalChangesError.code)
      expect(error.data.filepaths).toEqual(['.local/folder.lock'])
      expect(await resolveRef({ fs, gitdir, ref: 'topic' })).toBe(topicOid)
      expect(await resolveRef({ fs, gitdir, ref: 'HEAD' })).toBe(topicOid)
      expect(await fs.read(`${dir}/.local/folder.lock`, 'utf8')).toBe('mine\n')
      expect(await fs.exists(`${gitdir}/rebase-merge`)).toBe(false)
    })
  })

  describe('stopped on a conflict', () => {
    async function stop(name) {
      const repo = await setup(name)
      const { fs, dir, gitdir } = repo
      let error = null
      try {
        await rebase({
          fs,
          dir,
          gitdir,
          upstream: 'master',
          committer,
          abortOnConflict: false,
        })
      } catch (e) {
        error = e
      }
      expect(error).not.toBeNull()
      expect(error.code).toBe(Errors.MergeConflictError.code)
      return repo
    }

    it("leaves git's state behind and continues after the resolution", async () => {
      const repo = await stop('tmp-rebase-stop')
      const { fs, dir, gitdir, topic1, topic2, masterOid } = repo

      // HEAD is detached at the last commit that applied (none yet).
      expect(await fs.read(`${gitdir}/HEAD`, 'utf8')).toBe(`${masterOid}\n`)
      expect(await resolveRef({ fs, gitdir, ref: 'topic' })).toBe(topic2)
      expect(await fs.read(`${dir}/f.txt`, 'utf8')).toBe(
        `a\n<<<<<<< HEAD\nMASTER\n=======\nTOPIC\n>>>>>>> ${topic1.slice(
          0,
          7
        )} (topic 1)\nc\n`
      )
      expect(await fs.read(`${dir}/m.txt`, 'utf8')).toBe('m\n')
      const unmerged = await GitIndexManager.acquire(
        { fs, gitdir, cache: {} },
        async index => index.unmergedPaths
      )
      expect(unmerged).toEqual(['f.txt'])

      // The files git keeps for a stopped rebase.
      const read = async name => fs.read(`${gitdir}/${name}`, 'utf8')
      const message = 'topic 1\n\n# Conflicts:\n#\tf.txt\n'
      expect(await read('rebase-merge/head-name')).toBe('refs/heads/topic\n')
      expect(await read('rebase-merge/onto')).toBe(`${masterOid}\n`)
      expect(await read('rebase-merge/orig-head')).toBe(`${topic2}\n`)
      expect(await read('rebase-merge/git-rebase-todo')).toBe(
        `pick ${topic2} topic 2\n`
      )
      expect(await read('rebase-merge/done')).toBe(`pick ${topic1} topic 1\n`)
      expect(await read('rebase-merge/msgnum')).toBe('1\n')
      expect(await read('rebase-merge/end')).toBe('2\n')
      expect(await read('rebase-merge/stopped-sha')).toBe(`${topic1}\n`)
      expect(await read('rebase-merge/message')).toBe(message)
      expect(await read('rebase-merge/author-script')).toBe(
        "GIT_AUTHOR_NAME='Original Author'\nGIT_AUTHOR_EMAIL='original@example.com'\nGIT_AUTHOR_DATE='@1600000000 +0000'\n"
      )
      // Like git: drop the commits that become empty after a stop too.
      expect(await read('rebase-merge/drop_redundant_commits')).toBe('')
      expect(await read('rebase-merge/interactive')).toBe('')
      expect(await read('REBASE_HEAD')).toBe(`${topic1}\n`)
      expect(await read('MERGE_MSG')).toBe(message)
      expect(await read('ORIG_HEAD')).toBe(`${topic2}\n`)

      // Continuing before resolving is refused.
      let error = null
      try {
        await continueRebase({ fs, dir, gitdir, committer })
      } catch (e) {
        error = e
      }
      expect(error.code).toBe(Errors.UnmergedPathsError.code)

      await fs.write(`${dir}/f.txt`, 'a\nRESOLVED\nc\n')
      await add({ fs, dir, gitdir, filepath: 'f.txt' })
      const { oid } = await continueRebase({ fs, dir, gitdir, committer })

      expect(await resolveRef({ fs, gitdir, ref: 'topic' })).toBe(oid)
      expect(await fs.read(`${gitdir}/HEAD`, 'utf8')).toBe(
        'ref: refs/heads/topic\n'
      )
      expect(await history(fs, gitdir, 'topic')).toEqual([
        'topic 2',
        'topic 1',
        'master 1',
        'base',
      ])
      const { commit } = await readCommit({ fs, gitdir, oid })
      const { commit: resolved } = await readCommit({
        fs,
        gitdir,
        oid: commit.parent[0],
      })
      expect(resolved.author).toEqual(author)
      expect(resolved.committer).toEqual(committer)
      expect(resolved.message).toBe('topic 1\n')
      expect(await fs.read(`${dir}/f.txt`, 'utf8')).toBe('a\nRESOLVED\nc\n')
      expect(await fs.read(`${dir}/g.txt`, 'utf8')).toBe('g\n')
      await expectClean(fs, dir, gitdir)
      expect(await fs.exists(`${gitdir}/rebase-merge`)).toBe(false)
      expect(await read('REBASE_HEAD')).toBe(null)
      expect(await read('MERGE_MSG')).toBe(null)
    })

    it('accepts a commit made by hand before continuing', async () => {
      const repo = await stop('tmp-rebase-stop-commit')
      const { fs, dir, gitdir } = repo
      await fs.write(`${dir}/f.txt`, 'a\nRESOLVED\nc\n')
      await add({ fs, dir, gitdir, filepath: 'f.txt' })
      // Like `git commit`: the message is kept, and the author is whoever
      // commits (only a cherry-pick keeps the picked commit's author).
      await setConfig({ fs, dir, gitdir, path: 'user.name', value: 'Me' })
      await setConfig({ fs, dir, gitdir, path: 'user.email', value: 'me@x' })
      const byHand = await gitCommit({ fs, dir, gitdir, committer })
      const { commit } = await readCommit({ fs, gitdir, oid: byHand })
      expect(commit.author.name).toBe('Me')
      expect(commit.author.email).toBe('me@x')
      expect(commit.message).toBe('topic 1\n')

      const { oid } = await continueRebase({ fs, dir, gitdir, committer })
      const { commit: last } = await readCommit({ fs, gitdir, oid })
      expect(last.parent).toEqual([byHand])
      expect(await history(fs, gitdir, 'topic')).toEqual([
        'topic 2',
        'topic 1',
        'master 1',
        'base',
      ])
      await expectClean(fs, dir, gitdir)
    })

    it('can skip the stopped commit', async () => {
      const repo = await stop('tmp-rebase-skip')
      const { fs, dir, gitdir } = repo
      const { oid } = await continueRebase({
        fs,
        dir,
        gitdir,
        committer,
        skip: true,
      })
      expect(await resolveRef({ fs, gitdir, ref: 'topic' })).toBe(oid)
      expect(await history(fs, gitdir, 'topic')).toEqual([
        'topic 2',
        'master 1',
        'base',
      ])
      expect(await fs.read(`${dir}/f.txt`, 'utf8')).toBe('a\nMASTER\nc\n')
      expect(await fs.read(`${dir}/g.txt`, 'utf8')).toBe('g\n')
      await expectClean(fs, dir, gitdir)
    })

    it('can be aborted', async () => {
      const repo = await stop('tmp-rebase-abort')
      const { fs, dir, gitdir, topic2 } = repo
      await abortRebase({ fs, dir, gitdir })

      expect(await resolveRef({ fs, gitdir, ref: 'topic' })).toBe(topic2)
      expect(await fs.read(`${gitdir}/HEAD`, 'utf8')).toBe(
        'ref: refs/heads/topic\n'
      )
      expect(await fs.read(`${dir}/f.txt`, 'utf8')).toBe('a\nTOPIC\nc\n')
      expect(await fs.exists(`${dir}/m.txt`)).toBe(false)
      expect(await status({ fs, dir, gitdir, filepath: 'f.txt' })).toBe(
        'unmodified'
      )
      expect(await fs.exists(`${gitdir}/rebase-merge`)).toBe(false)
      expect(await fs.read(`${gitdir}/REBASE_HEAD`, 'utf8')).toBe(null)

      let error = null
      try {
        await abortRebase({ fs, dir, gitdir })
      } catch (e) {
        error = e
      }
      expect(error.code).toBe(Errors.NotFoundError.code)
    })

    it('stops again at the next conflict', async () => {
      const repo = await stop('tmp-rebase-twice')
      const { fs, dir, gitdir, topic2 } = repo
      // Make "topic 2" conflict too: master also has a g.txt.
      await fs.write(`${dir}/f.txt`, 'a\nRESOLVED\nc\n')
      await fs.write(`${dir}/g.txt`, 'from master\n')
      await add({ fs, dir, gitdir, filepath: ['f.txt', 'g.txt'] })

      let error = null
      try {
        await continueRebase({ fs, dir, gitdir, committer })
      } catch (e) {
        error = e
      }
      expect(error.code).toBe(Errors.MergeConflictError.code)
      expect(error.data.filepaths).toEqual(['g.txt'])
      expect(await fs.read(`${gitdir}/rebase-merge/stopped-sha`, 'utf8')).toBe(
        `${topic2}\n`
      )
      expect(
        await fs.read(`${gitdir}/rebase-merge/git-rebase-todo`, 'utf8')
      ).toBe('')
      expect(await fs.read(`${gitdir}/rebase-merge/msgnum`, 'utf8')).toBe('2\n')
      expect(await history(fs, gitdir, 'HEAD')).toEqual([
        'topic 1',
        'master 1',
        'base',
      ])
    })
  })

  describe('like git', () => {
    const catchError = async promise => {
      try {
        await promise
      } catch (e) {
        return e
      }
      return null
    }

    async function repo(name) {
      const { fs, dir, gitdir } = await makeFixture(name)
      // The git directory itself, to read the files git keeps there.
      const gd = gitdir
      await init({ fs, dir, gitdir })
      // Commit `files` (null deletes one) on HEAD.
      const c = async (message, files = {}, commitAuthor = author) => {
        for (const [filepath, content] of Object.entries(files)) {
          if (content === null) {
            await remove({ fs, dir, gitdir, filepath })
            await fs.rm(`${dir}/${filepath}`)
          } else {
            await fs.write(`${dir}/${filepath}`, content)
            await add({ fs, dir, gitdir, filepath })
          }
        }
        return gitCommit({
          fs,
          dir,
          gitdir,
          message,
          author: commitAuthor,
          committer,
        })
      }
      // A commit with the files of its parents, plus `<message>.txt` (or
      // `files`, where null deletes one), made at `time`, on no branch.
      const files = new Map()
      const mk = async (message, time, parent = [], changes) => {
        const entries = new Map()
        for (const oid of parent) {
          for (const [path, blob] of files.get(oid)) entries.set(path, blob)
        }
        for (const [path, content] of Object.entries(
          changes || { [`${message}.txt`]: message }
        )) {
          if (content === null) {
            entries.delete(path)
          } else {
            const blob = new TextEncoder().encode(`${content}\n`)
            entries.set(path, await writeBlob({ fs, dir, gitdir, blob }))
          }
        }
        const tree = await writeTree({
          fs,
          dir,
          gitdir,
          tree: [...entries].map(([path, oid]) => ({
            mode: '100644',
            path,
            oid,
            type: 'blob',
          })),
        })
        const oid = await gitCommit({
          fs,
          dir,
          gitdir,
          message,
          tree,
          parent,
          author: { ...author, timestamp: 1600000000 + time },
          committer: { ...committer, timestamp: 1600000000 + time },
          noUpdateBranch: true,
        })
        files.set(oid, entries)
        return oid
      }
      // Point branches at commits and check one out.
      const refs = async (branches, head) => {
        for (const [name, value] of Object.entries(branches)) {
          await writeRef({
            fs,
            dir,
            gitdir,
            ref: `refs/heads/${name}`,
            value,
            force: true,
          })
        }
        await checkout({ fs, dir, gitdir, ref: head, force: true })
      }
      return { fs, dir, gitdir, gd, c, mk, refs }
    }

    // base: f.txt; topic: "topic 1" and "topic 2"; master: "master 1".
    // With `conflict`, "topic 1" and "master 1" both change f.txt.
    async function diverged(name, { conflict = false } = {}) {
      const r = await repo(name)
      const { fs, dir, gitdir, c } = r
      const base = await c('base', { 'f.txt': 'a\nb\nc\n' })
      await branch({ fs, dir, gitdir, ref: 'topic', checkout: true })
      const t1 = await c(
        'topic 1',
        conflict ? { 'f.txt': 'a\nTOPIC\nc\n' } : { 't1.txt': '1\n' }
      )
      const t2 = await c('topic 2', { 't2.txt': '2\n' })
      await checkout({ fs, dir, gitdir, ref: 'master' })
      const master = await c(
        'master 1',
        conflict
          ? { 'f.txt': 'a\nMASTER\nc\n', 'm.txt': 'm\n' }
          : { 'm.txt': 'm\n' }
      )
      await checkout({ fs, dir, gitdir, ref: 'topic' })
      return { ...r, base, t1, t2, master }
    }

    async function writeState(fs, gd, files) {
      for (const [name, content] of Object.entries(files)) {
        await fs.write(`${gd}/rebase-merge/${name}`, content)
      }
    }

    it('rebases a commit, a tag or a remote-tracking branch on a detached HEAD, leaving refs alone', async () => {
      const { fs, dir, gitdir, gd, c } = await repo('tmp-rebase-detached')
      await c('base', { 'f.txt': 'a\n' })
      await branch({ fs, dir, gitdir, ref: 'topic', checkout: true })
      const t1 = await c('topic 1', { 't.txt': 't\n' })
      await writeRef({ fs, dir, gitdir, ref: 'refs/tags/v1', value: t1 })
      const tag = await annotatedTag({
        fs,
        dir,
        gitdir,
        ref: 'v1a',
        object: t1,
        tagger: author,
      })
      expect(tag).toBeUndefined()
      const v1a = await resolveRef({ fs, dir, gitdir, ref: 'refs/tags/v1a' })
      await writeRef({
        fs,
        dir,
        gitdir,
        ref: 'refs/remotes/origin/feat',
        value: t1,
      })
      await checkout({ fs, dir, gitdir, ref: 'master' })
      const master = await c('master 1', { 'm.txt': 'm\n' })

      let rebased
      for (const name of [t1, 'v1', 'v1a', 'origin/feat', undefined]) {
        // Without a branch, the detached HEAD itself is rebased.
        await checkout({ fs, dir, gitdir, ref: name ? 'master' : t1 })
        const { oid } = await rebase({
          fs,
          dir,
          gitdir,
          upstream: 'master',
          branch: name,
          committer,
        })
        rebased = rebased || oid
        expect(oid).toBe(rebased)
        const { commit } = await readCommit({ fs, dir, gitdir, oid })
        expect(commit.parent).toEqual([master])
        expect(await fs.read(`${gd}/HEAD`, 'utf8')).toBe(`${oid}\n`)
        expect(await fs.read(`${dir}/t.txt`, 'utf8')).toBe('t\n')
        for (const ref of ['topic', 'v1', 'origin/feat']) {
          expect(await resolveRef({ fs, dir, gitdir, ref })).toBe(t1)
        }
        expect(await resolveRef({ fs, dir, gitdir, ref: 'v1a' })).toBe(v1a)
        expect(await resolveRef({ fs, dir, gitdir, ref: 'master' })).toBe(
          master
        )
      }
    })

    it('stops a detached rebase like git, then aborts or continues it', async () => {
      const { fs, dir, gitdir, gd, t1, t2, master } = await diverged(
        'tmp-rebase-detached-stop',
        { conflict: true }
      )
      await checkout({ fs, dir, gitdir, ref: t2 })
      const stop = async () => {
        const error = await catchError(
          rebase({
            fs,
            dir,
            gitdir,
            upstream: 'master',
            committer,
            abortOnConflict: false,
          })
        )
        expect(error.code).toBe(Errors.MergeConflictError.code)
        expect(await fs.read(`${gd}/rebase-merge/head-name`, 'utf8')).toBe(
          'detached HEAD\n'
        )
        expect(await fs.read(`${gd}/rebase-merge/orig-head`, 'utf8')).toBe(
          `${t2}\n`
        )
      }
      await stop()
      await abortRebase({ fs, dir, gitdir })
      expect(await fs.read(`${gd}/HEAD`, 'utf8')).toBe(`${t2}\n`)
      expect(await fs.read(`${dir}/f.txt`, 'utf8')).toBe('a\nTOPIC\nc\n')

      await stop()
      await fs.write(`${dir}/f.txt`, 'a\nRESOLVED\nc\n')
      await add({ fs, dir, gitdir, filepath: 'f.txt' })
      const { oid } = await continueRebase({ fs, dir, gitdir, committer })
      expect(await fs.read(`${gd}/HEAD`, 'utf8')).toBe(`${oid}\n`)
      expect(await history(fs, gitdir, oid)).toEqual([
        'topic 2',
        'topic 1',
        'master 1',
        'base',
      ])
      expect(await resolveRef({ fs, dir, gitdir, ref: 'topic' })).toBe(t2)
      expect(await resolveRef({ fs, dir, gitdir, ref: 'master' })).toBe(master)
      expect(t1).toBeDefined()
    })

    it('refuses to start while a rebase is in progress', async () => {
      const { fs, dir, gitdir, gd } = await diverged('tmp-rebase-in-progress', {
        conflict: true,
      })
      const stopped = await catchError(
        rebase({
          fs,
          dir,
          gitdir,
          upstream: 'master',
          committer,
          abortOnConflict: false,
        })
      )
      expect(stopped.code).toBe(Errors.MergeConflictError.code)
      const again = await catchError(
        rebase({ fs, dir, gitdir, upstream: 'master', committer })
      )
      expect(again.code).toBe(Errors.AlreadyExistsError.code)
      await abortRebase({ fs, dir, gitdir })
      expect(await fs.read(`${gd}/MERGE_MSG`, 'utf8')).toBe(null)

      // Nor while `git am` or `git rebase --apply` is.
      await fs.write(`${gd}/rebase-apply/next`, '1\n')
      const apply = await catchError(
        rebase({ fs, dir, gitdir, upstream: 'master', committer })
      )
      expect(apply.code).toBe(Errors.AlreadyExistsError.code)
    })

    it('leaves a rebase with an autostash to git', async () => {
      const { fs, dir, gitdir, gd } = await diverged('tmp-rebase-autostash', {
        conflict: true,
      })
      await catchError(
        rebase({
          fs,
          dir,
          gitdir,
          upstream: 'master',
          committer,
          abortOnConflict: false,
        })
      )
      // `git rebase --autostash` keeps the stashed local changes here and
      // applies them once the rebase ends.
      const stash = 'f00dfeedf00dfeedf00dfeedf00dfeedf00dfeed\n'
      await fs.write(`${gd}/rebase-merge/autostash`, stash)
      await fs.write(`${dir}/f.txt`, 'a\nRESOLVED\nc\n')
      await add({ fs, dir, gitdir, filepath: 'f.txt' })
      for (const run of [
        () => continueRebase({ fs, dir, gitdir, committer }),
        () => continueRebase({ fs, dir, gitdir, committer, skip: true }),
        () => abortRebase({ fs, dir, gitdir }),
      ]) {
        const error = await catchError(run())
        expect(error.code).toBe(Errors.RebaseNotSupportedError.code)
        expect(error.data.feature).toBe('an autostash')
        expect(await fs.read(`${gd}/rebase-merge/autostash`, 'utf8')).toBe(
          stash
        )
        expect(await fs.read(`${dir}/f.txt`, 'utf8')).toBe('a\nRESOLVED\nc\n')
      }
    })

    it('drops commits whose change upstream already has, and keeps commits that start empty', async () => {
      const { fs, dir, gitdir, c } = await repo('tmp-rebase-cherry')
      await c('base', {
        'f.txt': 'a\nb\nc\n',
        'sub/g.txt': '1\n2\n3\n',
        'h.txt': 'p\nq\nr\ns\n',
      })
      await branch({ fs, dir, gitdir, ref: 'topic', checkout: true })
      await c('topic 1', { 'f.txt': 'a\nX\nc\n' })
      await c('topic 2', { 'sub/g.txt': '1\nY\n3\n' })
      await c('empty')
      await c('topic 3', { 't.txt': 't\n' })
      await c('topic 4', { 'h.txt': 'p\nQ\nr\ns\n' })
      await c('becomes empty', { 'e.txt': 'e\n' })
      await checkout({ fs, dir, gitdir, ref: 'master' })
      // master picked the first two changes (git ignores whitespace when
      // comparing them), then reverted one and edited the other.
      await c('same as topic 1', { 'f.txt': 'a\nX \nc\n' })
      await c('revert it', { 'f.txt': 'a\nb\nc\n' })
      await c('same as topic 2', { 'sub/g.txt': '1\nY\n3\n' })
      await c('then Z', { 'sub/g.txt': '1\nZ\n3\n' })
      // The change of topic 4, but next to other lines: not the same.
      await c('S', { 'h.txt': 'p\nq\nr\nS\n' })
      await c('like topic 4', { 'h.txt': 'p\nQ\nr\nS\n' })
      await c('revert that', { 'h.txt': 'p\nq\nr\nS\n' })
      // A bigger change that includes the last topic commit's.
      await c('e and more', { 'e.txt': 'e\n', 'v.txt': 'v\n' })
      await checkout({ fs, dir, gitdir, ref: 'topic' })

      await rebase({ fs, dir, gitdir, upstream: 'master', committer })
      expect(await history(fs, gitdir, 'topic')).toEqual([
        'topic 4',
        'topic 3',
        'empty',
        'e and more',
        'revert that',
        'like topic 4',
        'S',
        'then Z',
        'same as topic 2',
        'revert it',
        'same as topic 1',
        'base',
      ])
      expect(await fs.read(`${dir}/f.txt`, 'utf8')).toBe('a\nb\nc\n')
      expect(await fs.read(`${dir}/sub/g.txt`, 'utf8')).toBe('1\nZ\n3\n')
      expect(await fs.read(`${dir}/h.txt`, 'utf8')).toBe('p\nQ\nr\nS\n')
    })

    it('skips the same edit made upstream to another version of the file, like git', async () => {
      const { fs, dir, gitdir, c } = await repo('tmp-rebase-same-edit')
      await c('base', { 'f.txt': 'a\nb\nc\nd\ne\nf\ng\nh\n' })
      await branch({ fs, dir, gitdir, ref: 'topic', checkout: true })
      await c('topic', { 'f.txt': 'a\nB\nc\nd\ne\nf\ng\nh\n' })
      await checkout({ fs, dir, gitdir, ref: 'master' })
      // The same edit (same patch id) to a version of f.txt that differs
      // further away, then reverted: git skips topic, so B stays out.
      await c('other edit', { 'f.txt': 'a\nb\nc\nd\ne\nf\ng\nH\n' })
      await c('same edit', { 'f.txt': 'a\nB\nc\nd\ne\nf\ng\nH\n' })
      await c('revert it', { 'f.txt': 'a\nb\nc\nd\ne\nf\ng\nH\n' })
      await checkout({ fs, dir, gitdir, ref: 'topic' })

      await rebase({ fs, dir, gitdir, upstream: 'master', committer })
      expect((await history(fs, gitdir, 'topic'))[0]).toBe('revert it')
      expect(await fs.read(`${dir}/f.txt`, 'utf8')).toBe(
        'a\nb\nc\nd\ne\nf\ng\nH\n'
      )

      // The very same versions match even where a diff could be lined up in
      // more than one way: here g.txt loses one of two equal lines.
      await c('two lines', { 'g.txt': 'x\nx\n' })
      await branch({ fs, dir, gitdir, ref: 'topic2', checkout: true })
      await c('topic 2', { 'g.txt': 'x\n' })
      await checkout({ fs, dir, gitdir, ref: 'topic' })
      await c('same versions', { 'g.txt': 'x\n' })
      await c('restore', { 'g.txt': 'x\nx\n' })
      await rebase({
        fs,
        dir,
        gitdir,
        upstream: 'topic',
        branch: 'topic2',
        committer,
      })
      expect((await history(fs, gitdir, 'topic2'))[0]).toBe('restore')
      expect(await fs.read(`${dir}/g.txt`, 'utf8')).toBe('x\nx\n')
    })

    it('replays an edit that only looks the same, like git', async () => {
      // Upstream's edit sits next to another change (different context), or
      // git's diff lines it up differently (the two `\tz` lines below).
      const p1 =
        'k\nk\nk\nk\nb\n  a\n\tz\nk\nk\nk\nx\n}\n}\n\tz\nz \n{\nk\nk\nk\n  a\ny\n  b\n}\n\tz\n\nk\nk\nk\nk\n'
      const a1 =
        'k\nk\nk\nk\nb\n{\n\tz\n\tz\n  a\nk\nk\nk\nx\n}\n}\n\tz\nz \n{\nk\nk\nk\n{\n  b\ny\n  b\n}\n\tz\n\nk\nk\nk\nk\n'
      const p2 =
        '\nk\nk\nk\nb\n  a\n\tz\nk\nk\nk\nx\nx\nreturn\n\tz\nb\n}\nk\nk\nk\n  a\ny\n  b\n}\n\tz\n\nk\nk\nk\na\nx\na\n  a\n'
      const a2 =
        '\nk\nk\nk\nb\n{\n\tz\n\tz\n  a\nk\nk\nk\nx\nx\nreturn\n\tz\nb\n}\nk\nk\nk\n{\n  b\ny\n  b\n}\n\tz\n\nk\nk\nk\na\nx\na\n  a\n'
      // x1-x3, then <p>1-<p>4, a blank line, <p>5-<p>8, then y1-y3.
      const lines = p =>
        `x1\nx2\nx3\n${p}1\n${p}2\n${p}3\n${p}4\n\n${p}5\n${p}6\n${p}7\n${p}8\ny1\ny2\ny3\n`
      const cases = [
        {
          name: 'context',
          base: 'a\nb\nc\nd\ne\nf\ng\nh\n',
          topic: 'a\nB\nc\nd\ne\nf\ng\nh\n',
          before: 'a\nb\nc\nD\ne\nf\ng\nh\n',
          after: 'a\nB\nc\nD\ne\nf\ng\nh\n',
          result: 'a\nB\nc\nD\ne\nf\ng\nh\n',
        },
        {
          name: 'alignment',
          base: p1,
          topic: a1,
          before: p2,
          after: a2,
          result: a2,
        },
        {
          // git's diff counts the blank line among the changes as changed
          // when the file has more blank lines (here upstream's), so its two
          // patch ids differ, though the shortest diffs match.
          name: 'repeated-line',
          base: `${lines('o')}`,
          topic: `${lines('n')}`,
          before: `${lines('o')}z\n${'\n'.repeat(8)}`,
          after: `${lines('n')}z\n${'\n'.repeat(8)}`,
          result: `${lines('n')}z\n${'\n'.repeat(8)}`,
        },
      ]
      for (const { name, base, topic, before, after, result } of cases) {
        const { fs, dir, gitdir, c } = await repo(`tmp-rebase-look-${name}`)
        await c('base', { 'f.txt': base })
        await branch({ fs, dir, gitdir, ref: 'topic', checkout: true })
        await c('topic', { 'f.txt': topic })
        await checkout({ fs, dir, gitdir, ref: 'master' })
        await c('prepare', { 'f.txt': before })
        await c('similar edit', { 'f.txt': after })
        await c('revert it', { 'f.txt': before })
        await checkout({ fs, dir, gitdir, ref: 'topic' })

        await rebase({ fs, dir, gitdir, upstream: 'master', committer })
        expect((await history(fs, gitdir, 'topic'))[0]).toBe('topic')
        expect(await fs.read(`${dir}/f.txt`, 'utf8')).toBe(result)
      }

      // Binary files only match by their versions, as in git: here topic is
      // replayed and conflicts.
      const bin = (first, last) => `\0${first}\n1\n2\n3\n4\n5\n6\n7\n${last}\n`
      const { fs, dir, gitdir, c } = await repo('tmp-rebase-look-binary')
      await c('base', { 'b.bin': bin('x', 'y') })
      await branch({ fs, dir, gitdir, ref: 'topic', checkout: true })
      await c('topic', { 'b.bin': bin('x', 'Y') })
      await checkout({ fs, dir, gitdir, ref: 'master' })
      await c('prepare', { 'b.bin': bin('X', 'y') })
      await c('similar edit', { 'b.bin': bin('X', 'Y') })
      await c('revert it', { 'b.bin': bin('X', 'y') })
      await checkout({ fs, dir, gitdir, ref: 'topic' })
      const error = await catchError(
        rebase({ fs, dir, gitdir, upstream: 'master', committer })
      )
      expect(error && error.code).toBe(Errors.MergeConflictError.code)
      expect(error.data.filepaths).toEqual(['b.bin'])
    })

    it('does not take reaching the same version of a file from another one for the same change', async () => {
      const { fs, dir, gitdir, c } = await repo('tmp-rebase-same-result')
      await c('base', { 'f.txt': 'a\nb\nc\nd\ne\nf\ng\nh\n' })
      await branch({ fs, dir, gitdir, ref: 'topic', checkout: true })
      await c('topic', { 'f.txt': 'a\nB\nc\nd\ne\nf\ng\nh\n' })
      await checkout({ fs, dir, gitdir, ref: 'master' })
      await c('other edit', { 'f.txt': 'a\nb\nc\nd\ne\nf\ng\nH\n' })
      // Ends with topic's version of f.txt, from another one: git applies
      // topic too.
      await c('to topic version', { 'f.txt': 'a\nB\nc\nd\ne\nf\ng\nh\n' })
      await c('back', { 'f.txt': 'a\nb\nc\nd\ne\nf\ng\nH\n' })
      await checkout({ fs, dir, gitdir, ref: 'topic' })

      await rebase({ fs, dir, gitdir, upstream: 'master', committer })
      expect((await history(fs, gitdir, 'topic'))[0]).toBe('topic')
      expect(await fs.read(`${dir}/f.txt`, 'utf8')).toBe(
        'a\nB\nc\nd\ne\nf\ng\nH\n'
      )
    })

    it('with only a gitdir, moves the branch and leaves HEAD alone', async () => {
      const { fs, dir, gitdir, gd, t2, master } =
        await diverged('tmp-rebase-gitdir')
      await checkout({ fs, dir, gitdir, ref: 'master' })
      const { oid } = await rebase({
        fs,
        gitdir,
        upstream: 'master',
        branch: 'topic',
        committer,
      })
      expect(await history(fs, gitdir, 'topic')).toEqual([
        'topic 2',
        'topic 1',
        'master 1',
        'base',
      ])
      expect(await resolveRef({ fs, dir, gitdir, ref: 'topic' })).toBe(oid)
      expect(await fs.read(`${gd}/HEAD`, 'utf8')).toBe(
        'ref: refs/heads/master\n'
      )
      expect(await resolveRef({ fs, dir, gitdir, ref: 'master' })).toBe(master)
      expect(await fs.exists(`${dir}/t1.txt`)).toBe(false)
      expect(await fs.read(`${gd}/ORIG_HEAD`, 'utf8')).toBe(`${t2}\n`)

      // As in a bare repository whose HEAD names a branch not yet made.
      const { commit } = await readCommit({ fs, dir, gitdir, oid: master })
      await gitCommit({
        fs,
        gitdir,
        ref: 'refs/heads/master',
        message: 'master 2',
        tree: commit.tree,
        parent: [master],
        author,
        committer,
      })
      await fs.write(`${gd}/HEAD`, 'ref: refs/heads/unborn\n')
      await rebase({
        fs,
        gitdir,
        upstream: 'master',
        branch: 'topic',
        committer,
      })
      expect(await history(fs, gitdir, 'topic')).toEqual([
        'topic 2',
        'topic 1',
        'master 2',
        'master 1',
        'base',
      ])
    })

    it('does not stop on a conflict without a working tree', async () => {
      const { fs, dir, gitdir, gd, t2 } = await diverged(
        'tmp-rebase-gitdir-conflict',
        { conflict: true }
      )
      const error = await catchError(
        rebase({
          fs,
          gitdir,
          upstream: 'master',
          committer,
          abortOnConflict: false,
        })
      )
      expect(error.code).toBe(Errors.MergeConflictError.code)
      expect(await fs.exists(`${gd}/rebase-merge`)).toBe(false)
      expect(await fs.read(`${gd}/HEAD`, 'utf8')).toBe(
        'ref: refs/heads/topic\n'
      )
      expect(await resolveRef({ fs, dir, gitdir, ref: 'topic' })).toBe(t2)
    })

    it('replays a range with a merge, keeping the commits already in place', async () => {
      const { fs, dir, gitdir, mk, refs } = await repo('tmp-rebase-linearize')
      const base = await mk('base', 10)
      const s1 = await mk('s1', 20, [base])
      const t1 = await mk('t1', 30, [base])
      const merged = await mk('merge side', 40, [t1, s1])
      const t2 = await mk('t2', 50, [merged])
      await refs({ master: base, topic: t2 }, 'topic')

      const result = await rebase({
        fs,
        dir,
        gitdir,
        upstream: 'master',
        committer,
      })
      expect(result.alreadyUpToDate).toBeUndefined()
      expect(await history(fs, gitdir, 'topic')).toEqual([
        't2',
        's1',
        't1',
        'base',
      ])
      // Like git, a commit that already sits where it would be replayed is
      // kept as it is.
      const { commit } = await readCommit({ fs, dir, gitdir, oid: result.oid })
      const { commit: side } = await readCommit({
        fs,
        dir,
        gitdir,
        oid: commit.parent[0],
      })
      expect(side.parent).toEqual([t1])
    })

    it("replays commits in git's graph order", async () => {
      const { fs, dir, gitdir, mk, refs } = await repo('tmp-rebase-order')
      const base = await mk('base', 10)
      const c1 = await mk('c1', 20, [base])
      const c2 = await mk('c2', 30, [base])
      const c3 = await mk('c3', 40, [c1])
      const merged = await mk('merge', 50, [c3, c2])
      const m1 = await mk('m1', 60, [base])
      await refs({ master: m1, topic: merged }, 'topic')

      await rebase({ fs, dir, gitdir, upstream: 'master', committer })
      // git rev-list --reverse --topo-order --no-merges master..topic
      expect(await history(fs, gitdir, 'topic')).toEqual([
        'c2',
        'c3',
        'c1',
        'm1',
        'base',
      ])
    })

    it('finds the commits to replay despite out-of-order dates', async () => {
      const { fs, dir, gitdir, mk, refs } = await repo('tmp-rebase-dates')
      // "z" is dated before its parent "b", and "y" (on both sides) deletes
      // b.txt again.
      const a = await mk('a', 0)
      const b = await mk('b', 1000, [a])
      const z = await mk('z', 100, [b])
      const y = await mk('y', 4000, [z], { 'b.txt': null })
      const u = await mk('u', 5000, [y, a])
      const t = await mk('t', 3000, [y, b])
      const t2 = await mk('t2', 3500, [t])
      await refs({ master: u, topic: t2 }, 'topic')

      const { oid } = await rebase({
        fs,
        dir,
        gitdir,
        upstream: 'master',
        committer,
      })
      // Only t2 is replayed: b is upstream too, so b.txt stays deleted.
      const { commit } = await readCommit({ fs, dir, gitdir, oid })
      expect(commit.parent).toEqual([u])
      expect(await fs.exists(`${dir}/b.txt`)).toBe(false)
      expect(await fs.read(`${dir}/t2.txt`, 'utf8')).toBe('t2\n')
    })

    it('stops at shallow commits', async () => {
      const { fs, dir, gitdir, gd, c } = await repo('tmp-rebase-shallow')
      const old = await c('old', { 'f.txt': 'a\n' })
      const base = await c('base', { 'g.txt': 'g\n' })
      await branch({ fs, dir, gitdir, ref: 'topic', checkout: true })
      const t1 = await c('topic 1', { 't.txt': 't\n' })
      await checkout({ fs, dir, gitdir, ref: 'master' })
      const m1 = await c('master 1', { 'm.txt': 'm\n' })
      await checkout({ fs, dir, gitdir, ref: 'topic' })
      // A clone of depth 1: the parent of both tips is not there.
      await fs.write(`${gd}/shallow`, `${t1}\n${m1}\n`)
      for (const oid of [old, base]) {
        await fs.rm(`${gd}/objects/${oid.slice(0, 2)}/${oid.slice(2)}`)
      }

      const { oid } = await rebase({
        fs,
        dir,
        gitdir,
        upstream: 'master',
        committer,
      })
      // Like git, topic 1 is replayed as a root commit.
      const { commit } = await readCommit({ fs, dir, gitdir, oid })
      expect(commit.parent).toEqual([m1])
      expect(commit.message).toBe('topic 1\n')
      for (const file of ['f.txt', 'g.txt', 'm.txt', 't.txt']) {
        expect(await fs.exists(`${dir}/${file}`)).toBe(true)
      }
    })

    it('is up to date when the branch already sits on `onto`', async () => {
      const { fs, dir, gitdir, base, t2 } = await diverged('tmp-rebase-onto-ff')
      expect(
        await rebase({
          fs,
          dir,
          gitdir,
          upstream: 'master',
          onto: base,
          committer,
        })
      ).toEqual({ oid: t2, alreadyUpToDate: true })
      expect(await resolveRef({ fs, dir, gitdir, ref: 'topic' })).toBe(t2)
    })

    it('checks out the branch when it is up to date', async () => {
      const { fs, dir, gitdir, gd, base, t2 } = await diverged(
        'tmp-rebase-ff-switch'
      )
      await checkout({ fs, dir, gitdir, ref: 'master' })
      expect(
        await rebase({
          fs,
          dir,
          gitdir,
          upstream: base,
          branch: 'topic',
          committer,
        })
      ).toEqual({ oid: t2, alreadyUpToDate: true })
      expect(await fs.read(`${gd}/HEAD`, 'utf8')).toBe(
        'ref: refs/heads/topic\n'
      )
      expect(await fs.read(`${dir}/t2.txt`, 'utf8')).toBe('2\n')
    })

    it('replays onto `onto` only the commits not in upstream', async () => {
      const { fs, dir, gitdir, c, base, t1 } = await diverged('tmp-rebase-onto')
      await branch({ fs, dir, gitdir, ref: 'other', object: base })
      await checkout({ fs, dir, gitdir, ref: 'other' })
      const other = await c('other 1', { 'o.txt': 'o\n' })
      await checkout({ fs, dir, gitdir, ref: 'topic' })

      const { oid } = await rebase({
        fs,
        dir,
        gitdir,
        upstream: t1,
        onto: 'other',
        committer,
      })
      expect(await history(fs, gitdir, 'topic')).toEqual([
        'topic 2',
        'other 1',
        'base',
      ])
      const { commit } = await readCommit({ fs, dir, gitdir, oid })
      expect(commit.parent).toEqual([other])
      expect(await fs.exists(`${dir}/t1.txt`)).toBe(false)
      expect(await fs.exists(`${dir}/m.txt`)).toBe(false)
    })

    it('replays a root commit of an unrelated branch', async () => {
      const { fs, dir, gitdir, gd, c } = await repo('tmp-rebase-root')
      const master = await c('base', { 'f.txt': 'a\n' })
      await writeRef({
        fs,
        dir,
        gitdir,
        ref: 'HEAD',
        value: 'refs/heads/topic',
        symbolic: true,
        force: true,
      })
      await fs.rm(`${gd}/index`)
      await fs.rm(`${dir}/f.txt`)
      await c('root of topic', { 't.txt': 't\n' })

      const { oid } = await rebase({
        fs,
        dir,
        gitdir,
        upstream: 'master',
        committer,
      })
      const { commit } = await readCommit({ fs, dir, gitdir, oid })
      expect(commit.parent).toEqual([master])
      expect(await fs.read(`${dir}/f.txt`, 'utf8')).toBe('a\n')
      expect(await fs.read(`${dir}/t.txt`, 'utf8')).toBe('t\n')
    })

    it('rebases a branch that is not checked out, then checks it out', async () => {
      const { fs, dir, gitdir, gd } = await diverged('tmp-rebase-other-branch')
      await checkout({ fs, dir, gitdir, ref: 'master' })
      const { oid } = await rebase({
        fs,
        dir,
        gitdir,
        upstream: 'master',
        branch: 'topic',
        committer,
      })
      expect(await fs.read(`${gd}/HEAD`, 'utf8')).toBe(
        'ref: refs/heads/topic\n'
      )
      expect(await resolveRef({ fs, dir, gitdir, ref: 'topic' })).toBe(oid)
      expect(await history(fs, gitdir, 'topic')).toEqual([
        'topic 2',
        'topic 1',
        'master 1',
        'base',
      ])
      expect(await fs.read(`${dir}/t1.txt`, 'utf8')).toBe('1\n')
      await expectClean(fs, dir, gitdir)
    })

    it('refuses unstaged deletions and mode changes, like git', async () => {
      const { fs, dir, gitdir, gd, c } = await repo('tmp-rebase-unstaged')
      await fs.write(`${dir}/run.sh`, 'run\n')
      await add({ fs, dir, gitdir, filepath: 'run.sh' })
      // run.sh is committed as executable, but is not in the working tree.
      await GitIndexManager.acquire({ fs, gitdir: gd, cache: {} }, index => {
        const { oid } = index.entriesMap.get('run.sh')
        index.insert({ filepath: 'run.sh', oid, mode: 0o100755 })
      })
      await c('base', { 'f.txt': 'a\n', 'sub/s.txt': 's\n' })
      await branch({ fs, dir, gitdir, ref: 'topic', checkout: true })
      await c('topic 1', { 't.txt': 't\n' })
      await checkout({ fs, dir, gitdir, ref: 'master' })
      await c('master 1', { 'm.txt': 'm\n' })
      await checkout({ fs, dir, gitdir, ref: 'topic' })
      // Even when there is nothing to do.
      const refused = async filepaths => {
        for (const upstream of ['master', 'topic']) {
          const error = await catchError(
            rebase({ fs, dir, gitdir, upstream, committer })
          )
          expect(error && error.code).toBe(Errors.RebaseLocalChangesError.code)
          expect(error.data.filepaths).toEqual(filepaths)
        }
      }

      // init writes core.fileMode false; like git, the executable bit only
      // counts when it is true.
      await setConfig({ fs, dir, gitdir, path: 'core.filemode', value: true })
      await refused(['run.sh'])
      await setConfig({ fs, dir, gitdir, path: 'core.filemode', value: false })
      await fs.rm(`${dir}/f.txt`)
      await fs.rmdir(`${dir}/sub`, { recursive: true })
      await refused(['f.txt', 'sub/s.txt'])
      await checkout({
        fs,
        dir,
        gitdir,
        ref: 'topic',
        filepaths: ['f.txt', 'sub'],
        force: true,
      })
      const { oid } = await rebase({
        fs,
        dir,
        gitdir,
        upstream: 'master',
        committer,
      })
      expect(await history(fs, gitdir, oid)).toEqual([
        'topic 1',
        'master 1',
        'base',
      ])
    })

    it('refuses to continue over unstaged changes, and commits the message git keeps', async () => {
      const { fs, dir, gitdir, gd } = await diverged(
        'tmp-rebase-continue-dirty',
        {
          conflict: true,
        }
      )
      await catchError(
        rebase({
          fs,
          dir,
          gitdir,
          upstream: 'master',
          committer,
          abortOnConflict: false,
        })
      )
      await fs.write(`${dir}/f.txt`, 'a\nRESOLVED\nc\n')
      await add({ fs, dir, gitdir, filepath: 'f.txt' })
      for (const change of [
        () => fs.write(`${dir}/m.txt`, 'edited\n'),
        () => fs.rm(`${dir}/m.txt`),
      ]) {
        await change()
        const error = await catchError(
          continueRebase({ fs, dir, gitdir, committer })
        )
        expect(error && error.code).toBe(Errors.RebaseLocalChangesError.code)
        expect(error.data.filepaths).toEqual(['m.txt'])
        expect(await fs.exists(`${gd}/rebase-merge/stopped-sha`)).toBe(true)
      }
      await fs.write(`${dir}/m.txt`, 'm\n')
      // Like git, the message in rebase-merge/message is the one committed.
      await fs.write(`${gd}/rebase-merge/message`, 'topic 1, resolved\n')
      const { oid } = await continueRebase({ fs, dir, gitdir, committer })
      expect(await history(fs, gitdir, oid)).toEqual([
        'topic 2',
        'topic 1, resolved',
        'master 1',
        'base',
      ])
    })

    it('amends the commit that `git rebase -i` stopped to edit', async () => {
      const { fs, dir, gitdir, gd, c, t1, t2, master } =
        await diverged('tmp-rebase-edit')
      // As git leaves `edit` on "topic 1": replayed, HEAD detached on it.
      await checkout({ fs, dir, gitdir, ref: master })
      const edited = await c('topic 1', { 't1.txt': '1\n' })
      await writeState(fs, gd, {
        'head-name': 'refs/heads/topic\n',
        onto: `${master}\n`,
        'orig-head': `${t2}\n`,
        'git-rebase-todo': `pick ${t2} topic 2\n`,
        done: `edit ${t1} topic 1\n`,
        'stopped-sha': `${t1}\n`,
        amend: `${edited}\n`,
        message: 'topic 1\n',
        interactive: '',
      })
      await fs.write(`${dir}/t1.txt`, 'amended\n')
      await add({ fs, dir, gitdir, filepath: 't1.txt' })
      // Like git, refused when HEAD is no longer the commit to amend.
      await fs.write(`${gd}/rebase-merge/amend`, `${master}\n`)
      const error = await catchError(
        continueRebase({ fs, dir, gitdir, committer })
      )
      expect(error && error.code).toBe(Errors.RebaseLocalChangesError.code)
      expect(error.data.filepaths).toEqual(['t1.txt'])
      await fs.write(`${gd}/rebase-merge/amend`, `${edited}\n`)

      const { oid } = await continueRebase({ fs, dir, gitdir, committer })
      expect(await history(fs, gitdir, 'topic')).toEqual([
        'topic 2',
        'topic 1',
        'master 1',
        'base',
      ])
      const { commit } = await readCommit({ fs, dir, gitdir, oid })
      const { commit: amended } = await readCommit({
        fs,
        dir,
        gitdir,
        oid: commit.parent[0],
      })
      expect(amended.parent).toEqual([master])
      expect(amended.author).toEqual(author)
      expect(amended.committer).toEqual(committer)
      expect(await fs.read(`${dir}/t1.txt`, 'utf8')).toBe('amended\n')
    })

    it('continues a rebase that git recorded, and only aborts one with commands it cannot run', async () => {
      const { fs, dir, gitdir, gd, t1, t2, master } = await diverged(
        'tmp-rebase-git-state'
      )
      // As git leaves a `break` before the first pick.
      const state = todo => ({
        'head-name': 'refs/heads/topic\n',
        onto: `${master}\n`,
        'orig-head': `${t2}\n`,
        'git-rebase-todo': todo,
        done: '',
        interactive: '',
      })
      await checkout({ fs, dir, gitdir, ref: master })
      await writeState(
        fs,
        gd,
        state(`p ${t1} topic 1\n# a comment\n\npick ${t2} topic 2\n`)
      )
      const { oid } = await continueRebase({ fs, dir, gitdir, committer })
      expect(await history(fs, gitdir, 'topic')).toEqual([
        'topic 2',
        'topic 1',
        'master 1',
        'base',
      ])

      await checkout({ fs, dir, gitdir, ref: master })
      await writeState(fs, gd, state(`exec make\npick ${t1} topic 1\n`))
      const error = await catchError(
        continueRebase({ fs, dir, gitdir, committer })
      )
      expect(error.code).toBe(Errors.RebaseNotSupportedError.code)
      expect(error.data.feature).toBe("the to-do command 'exec'")
      expect(error.message).toContain("'exec'")
      // Like git, abort puts the branch back where the rebase found it.
      await abortRebase({ fs, dir, gitdir })
      expect(await fs.read(`${gd}/HEAD`, 'utf8')).toBe(
        'ref: refs/heads/topic\n'
      )
      expect(await resolveRef({ fs, dir, gitdir, ref: 'topic' })).toBe(t2)
      expect(oid).not.toBe(t2)
      expect(await fs.exists(`${dir}/m.txt`)).toBe(false)
      expect(await fs.exists(`${gd}/rebase-merge`)).toBe(false)
    })

    it("quotes the author in author-script the way git's shell does", async () => {
      const { fs, dir, gitdir, gd, c } = await repo('tmp-rebase-quote')
      const obrien = { ...author, name: "O'Brien", timezoneOffset: -330 }
      await c('base', { 'f.txt': 'a\n' })
      await branch({ fs, dir, gitdir, ref: 'topic', checkout: true })
      await c('topic 1', { 'f.txt': 'T\n' }, obrien)
      await checkout({ fs, dir, gitdir, ref: 'master' })
      await c('master 1', { 'f.txt': 'M\n' })
      await checkout({ fs, dir, gitdir, ref: 'topic' })
      await catchError(
        rebase({
          fs,
          dir,
          gitdir,
          upstream: 'master',
          committer,
          abortOnConflict: false,
        })
      )
      expect(await fs.read(`${gd}/rebase-merge/author-script`, 'utf8')).toBe(
        "GIT_AUTHOR_NAME='O'\\''Brien'\nGIT_AUTHOR_EMAIL='original@example.com'\nGIT_AUTHOR_DATE='@1600000000 +0530'\n"
      )
    })

    it('gives up on the patch id of a huge diff and replays the commit', async () => {
      const { fs, dir, gitdir, c } = await repo('tmp-rebase-huge-diff')
      const text = (word, last) =>
        Array.from({ length: 300 }, (_, i) => `${word} ${i}\n`).join('') +
        Array.from({ length: 9 }, (_, i) => `z${i}\n`).join('') +
        `${last}\n`
      await c('base', { 'f.txt': text('line', 'z9') })
      await branch({ fs, dir, gitdir, ref: 'topic', checkout: true })
      await c('topic', { 'f.txt': text('topic', 'z9') })
      await checkout({ fs, dir, gitdir, ref: 'master' })
      await c('other edit', { 'f.txt': text('line', 'Z9') })
      await c('same rewrite', { 'f.txt': text('topic', 'Z9') })
      await c('revert it', { 'f.txt': text('line', 'Z9') })
      await checkout({ fs, dir, gitdir, ref: 'topic' })

      // git skips topic (same patch id). Past 500 edits (here 600) the diff
      // is not worked out: from about 512 git's own diff stops being the
      // shortest, so its patch ids could differ where these match, and the
      // cap bounds time and memory. So topic is replayed.
      await rebase({ fs, dir, gitdir, upstream: 'master', committer })
      expect((await history(fs, gitdir, 'topic'))[0]).toBe('topic')
      expect(await fs.read(`${dir}/f.txt`, 'utf8')).toBe(text('topic', 'Z9'))
    })

    it('does not compare files that attributes may mark as binary', async () => {
      const lines = (third, last) =>
        `one\ntwo\n${third}\nfour\nfive\nsix\nseven\neight\n${last}\n`
      for (const where of [
        '.gitattributes',
        'no working tree',
        'later commit, no working tree',
        'working tree',
        'working tree, subdirectory',
        'info/attributes',
        'core.attributesFile',
      ]) {
        const { fs, dir, gitdir, gd, c } = await repo(
          `tmp-rebase-attributes-${where.replace(/\W/g, '')}`
        )
        if (where === '.gitattributes' || where === 'no working tree') {
          await c('attributes', { '.gitattributes': '*.dat binary\n' })
        } else if (where === 'working tree') {
          await fs.write(`${dir}/.gitattributes`, '*.dat binary\n')
        } else if (where === 'working tree, subdirectory') {
          await fs.write(`${dir}/sub/.gitattributes`, '*.dat binary\n')
        } else if (where === 'info/attributes') {
          await fs.write(`${gd}/info/attributes`, '*.dat binary\n')
        } else if (where === 'core.attributesFile') {
          await fs.write(`${gd}/attributes`, '*.dat binary\n')
          await setConfig({
            fs,
            dir,
            gitdir,
            path: 'core.attributesFile',
            value: `${gd}/attributes`,
          })
        }
        const file = where.includes('subdirectory') ? 'sub/x.dat' : 'x.dat'
        const noDir = where.includes('no working tree')
        await c('base', { [file]: lines('three', 'nine') })
        await branch({ fs, dir, gitdir, ref: 'topic', checkout: true })
        await c('topic', { [file]: lines('THREE', 'nine') })
        // Only the branch's tip has the attributes (git reads them from the
        // working tree, which has them).
        if (where === 'later commit, no working tree') {
          await c('attributes', { '.gitattributes': '*.dat binary\n' })
        }
        await checkout({ fs, dir, gitdir, ref: 'master' })
        await c('other edit', { [file]: lines('three', 'NINE') })
        await c('same edit', { [file]: lines('THREE', 'NINE') })
        await c('revert it', { [file]: lines('three', 'NINE') })
        await checkout({ fs, dir, gitdir, ref: 'topic' })

        // git compares x.dat as binary, so the patch ids differ and topic is
        // replayed.
        await rebase({
          fs,
          dir: noDir ? undefined : dir,
          gitdir,
          upstream: 'master',
          branch: 'topic',
          committer,
        })
        if (noDir) {
          await checkout({ fs, dir, gitdir, ref: 'topic', force: true })
        }
        expect(await history(fs, gitdir, 'topic')).toContain('topic')
        expect(await fs.read(`${dir}/${file}`, 'utf8')).toBe(
          lines('THREE', 'NINE')
        )
      }
    })

    it('leaves out upstream merge commits when looking for the same change', async () => {
      const { fs, dir, gitdir, mk, refs } = await repo(
        'tmp-rebase-upstream-merge'
      )
      const base = await mk('base', 10, [], { 'f.txt': 'a' })
      const t = await mk('t', 20, [base], { 'f.txt': 'B' })
      const m0 = await mk('m0', 30, [base], { 'g.txt': 'g' })
      const s = await mk('s', 40, [base], { 's.txt': 's' })
      // A merge that makes topic's change and drops its side's.
      const merged = await mk('merge', 50, [m0, s], {
        'f.txt': 'B',
        's.txt': null,
      })
      const reverted = await mk('revert', 60, [merged], { 'f.txt': 'a' })
      await refs({ master: reverted, topic: t }, 'topic')

      await rebase({ fs, dir, gitdir, upstream: 'master', committer })
      expect((await history(fs, gitdir, 'topic'))[0]).toBe('t')
      expect(await fs.read(`${dir}/f.txt`, 'utf8')).toBe('B\n')
    })

    it('marks every commit reached from both sides, however their dates go', async () => {
      const { fs, dir, gitdir, mk, refs } = await repo('tmp-rebase-dates-2')
      // The branch side reaches a (through d) before upstream's u1, dated
      // earlier, shows that b, and so a, are upstream too.
      const a = await mk('a', 10)
      const b = await mk('b', 100, [a])
      const d = await mk('d', 200, [a])
      const t = await mk('t', 1000, [b, d])
      const u1 = await mk('u1', 50, [b], { 'a.txt': null })
      const u = await mk('u', 2000, [u1])
      await refs({ master: u, topic: t }, 'topic')

      const { oid } = await rebase({
        fs,
        dir,
        gitdir,
        upstream: 'master',
        committer,
      })
      const { commit } = await readCommit({ fs, dir, gitdir, oid })
      expect(commit.message).toBe('d\n')
      expect(commit.parent).toEqual([u])
      expect(await fs.exists(`${dir}/a.txt`)).toBe(false)
    })

    it('drops the commits between `onto` and `upstream`', async () => {
      const { fs, dir, gitdir, base, t1 } = await diverged(
        'tmp-rebase-drop-onto'
      )
      const { oid } = await rebase({
        fs,
        dir,
        gitdir,
        upstream: t1,
        onto: base,
        committer,
      })
      expect(await history(fs, gitdir, oid)).toEqual(['topic 2', 'base'])
      expect(await fs.exists(`${dir}/t1.txt`)).toBe(false)
    })

    it('turns a directory into a file and back when upstream does, like git', async () => {
      for (const toFile of [true, false]) {
        const { fs, dir, gitdir, gd, c } = await repo(
          `tmp-rebase-dir-${toFile}`
        )
        const removeD = async () => {
          const stat = await fs.lstat(`${dir}/d`)
          if (stat.isDirectory()) {
            await fs.rmdir(`${dir}/d`, { recursive: true })
          } else {
            await fs.rm(`${dir}/d`)
          }
        }
        await c('base', toFile ? { 'd/a': 'a\n' } : { d: 'file\n' })
        await branch({ fs, dir, gitdir, ref: 'topic', checkout: true })
        await c('topic 1', { 't.txt': 't\n' })
        await checkout({ fs, dir, gitdir, ref: 'master' })
        await remove({ fs, dir, gitdir, filepath: toFile ? 'd/a' : 'd' })
        await removeD()
        await c('master 1', toFile ? { d: 'file now\n' } : { 'd/a': 'a\n' })
        // Back on topic by hand: checkout itself cannot make this change.
        await removeD()
        await fs.rm(`${gd}/index`)
        await writeRef({
          fs,
          dir,
          gitdir,
          ref: 'HEAD',
          value: 'refs/heads/topic',
          symbolic: true,
          force: true,
        })
        await checkout({ fs, dir, gitdir, ref: 'topic', force: true })

        await rebase({ fs, dir, gitdir, upstream: 'master', committer })
        if (toFile) {
          expect(await fs.read(`${dir}/d`, 'utf8')).toBe('file now\n')
        } else {
          expect(await fs.read(`${dir}/d/a`, 'utf8')).toBe('a\n')
        }
        expect(await fs.read(`${dir}/t.txt`, 'utf8')).toBe('t\n')
        await expectClean(fs, dir, gitdir)
      }
    })

    it('refuses to continue a rebase git started with options it does not follow', async () => {
      const { fs, dir, gitdir, gd, t1, t2, master } = await diverged(
        'tmp-rebase-git-options'
      )
      for (const option of [
        'signoff',
        'gpg_sign_opt',
        'cdate_is_adate',
        'ignore_date',
        'keep_redundant_commits',
        'strategy',
        'strategy_opts',
        'update-refs',
        'squash-onto',
      ]) {
        await checkout({ fs, dir, gitdir, ref: master })
        await writeState(fs, gd, {
          'head-name': 'refs/heads/topic\n',
          onto: `${master}\n`,
          'orig-head': `${t2}\n`,
          'git-rebase-todo': `pick ${t1} topic 1\npick ${t2} topic 2\n`,
          done: '',
          interactive: '',
          [option]: '',
        })
        const error = await catchError(
          continueRebase({ fs, dir, gitdir, committer })
        )
        expect(error && error.code).toBe(Errors.RebaseNotSupportedError.code)
        expect(error.data.feature).toBe(
          `the option git recorded in rebase-merge/${option}`
        )
        expect(await fs.exists(`${gd}/rebase-merge/${option}`)).toBe(true)
        // None of them changes an abort.
        await abortRebase({ fs, dir, gitdir })
        expect(await resolveRef({ fs, dir, gitdir, ref: 'topic' })).toBe(t2)
        expect(await fs.read(`${gd}/HEAD`, 'utf8')).toBe(
          'ref: refs/heads/topic\n'
        )
      }
    })

    it('continues an edit stop, then a later stop, leaving ORIG_HEAD alone', async () => {
      const { fs, dir, gitdir, gd, c } = await repo('tmp-rebase-edit-then-stop')
      await c('base', { 'f.txt': 'f\n' })
      await branch({ fs, dir, gitdir, ref: 'topic', checkout: true })
      const t1 = await c('topic 1', { 't1.txt': '1\n' })
      const t2 = await c('topic 2', { 't2.txt': '2\n' })
      await checkout({ fs, dir, gitdir, ref: 'master' })
      const master = await c('master 1', { 't2.txt': 'M\n' })
      // As git leaves `edit` on "topic 1".
      await checkout({ fs, dir, gitdir, ref: master })
      const edited = await c('topic 1', { 't1.txt': '1\n' })
      await writeState(fs, gd, {
        'head-name': 'refs/heads/topic\n',
        onto: `${master}\n`,
        'orig-head': `${t2}\n`,
        'git-rebase-todo': `pick ${t2} topic 2\n`,
        done: `edit ${t1} topic 1\n`,
        'stopped-sha': `${t1}\n`,
        amend: `${edited}\n`,
        message: 'topic 1\n',
        interactive: '',
      })
      await fs.write(`${gd}/ORIG_HEAD`, `${t1}\n`)
      const error = await catchError(
        continueRebase({ fs, dir, gitdir, committer })
      )
      expect(error && error.code).toBe(Errors.MergeConflictError.code)
      await fs.write(`${dir}/t2.txt`, 'resolved\n')
      await add({ fs, dir, gitdir, filepath: 't2.txt' })
      await continueRebase({ fs, dir, gitdir, committer })
      expect(await history(fs, gitdir, 'topic')).toEqual([
        'topic 2',
        'topic 1',
        'master 1',
        'base',
      ])
      // Like git, ORIG_HEAD is only written when a rebase starts.
      expect(await fs.read(`${gd}/ORIG_HEAD`, 'utf8')).toBe(`${t1}\n`)
    })

    it('ignores submodules when checking for local changes, like git', async () => {
      const { fs, dir, gitdir, gd, c } = await repo('tmp-rebase-gitlink')
      const sub = await c('for the submodule', { 'f.txt': 'f\n' })
      // A submodule entry, with nothing checked out for it.
      await GitIndexManager.acquire({ fs, gitdir: gd, cache: {} }, index => {
        index.insert({ filepath: 'sub', oid: sub, mode: 0o160000 })
      })
      await c('base', { 'g.txt': 'g\n' })
      await branch({ fs, dir, gitdir, ref: 'topic', checkout: true })
      await c('topic 1', { 't.txt': 't\n' })
      await checkout({ fs, dir, gitdir, ref: 'master' })
      await c('master 1', { 'm.txt': 'm\n' })
      await checkout({ fs, dir, gitdir, ref: 'topic' })

      const { oid } = await rebase({
        fs,
        dir,
        gitdir,
        upstream: 'master',
        committer,
      })
      expect(await history(fs, gitdir, oid)).toEqual([
        'topic 1',
        'master 1',
        'base',
        'for the submodule',
      ])
    })

    it('only replaces ignored files and directories when the ignore rules are simple enough', async () => {
      // With `!`, `[...]` and the like, the library cannot be sure git
      // ignores the file too, so it is kept and the rebase refused.
      const cases = [
        { rules: '*.log\n', path: 'x.log', replaced: true },
        { rules: '*.log\n!keep.log\n', path: 'x.log', replaced: false },
        { rules: '*.[l]og\n', path: 'x.log', replaced: false },
        { rules: 'build/\n', path: 'build', replaced: true },
        { rules: 'build/\n!build/keep\n', path: 'build', replaced: false },
        { rules: '[b]uild/\n', path: 'build', replaced: false },
      ]
      for (const [n, { rules, path, replaced }] of cases.entries()) {
        const { fs, dir, gitdir, c } = await repo(`tmp-rebase-strict-${n}`)
        await c('base', { 'f.txt': 'f\n', '.gitignore': rules })
        await branch({ fs, dir, gitdir, ref: 'topic', checkout: true })
        await c('topic 1', { 't.txt': 't\n' })
        await checkout({ fs, dir, gitdir, ref: 'master' })
        await fs.write(`${dir}/${path}`, 'upstream\n')
        await add({ fs, dir, gitdir, filepath: path, force: true })
        await c('master 1')
        await checkout({ fs, dir, gitdir, ref: 'topic' })
        const mine = path === 'build' ? 'build/a.log' : path
        await fs.write(`${dir}/${mine}`, 'mine\n')

        const error = await catchError(
          rebase({ fs, dir, gitdir, upstream: 'master', committer })
        )
        if (replaced) {
          expect(error).toBeNull()
          expect(await fs.read(`${dir}/${path}`, 'utf8')).toBe('upstream\n')
        } else {
          expect(error && error.code).toBe(Errors.RebaseLocalChangesError.code)
          expect(await fs.read(`${dir}/${mine}`, 'utf8')).toBe('mine\n')
        }
      }
    })

    it('never replaces an ignored directory that holds a repository', async () => {
      const { fs, dir, gitdir, c } = await repo('tmp-rebase-nested-repo')
      await c('base', { 'f.txt': 'f\n', '.gitignore': 'build/\n' })
      await branch({ fs, dir, gitdir, ref: 'topic', checkout: true })
      await c('topic 1', { 't.txt': 't\n' })
      await checkout({ fs, dir, gitdir, ref: 'master' })
      await c('master 1', { build: 'upstream\n' })
      await checkout({ fs, dir, gitdir, ref: 'topic' })
      await fs.write(`${dir}/build/sub/.git/HEAD`, 'ref: refs/heads/main\n')

      const error = await catchError(
        rebase({ fs, dir, gitdir, upstream: 'master', committer })
      )
      expect(error && error.code).toBe(Errors.RebaseLocalChangesError.code)
      expect(await fs.read(`${dir}/build/sub/.git/HEAD`, 'utf8')).toBe(
        'ref: refs/heads/main\n'
      )

      // Nor an ignored file inside a repository nested in the working tree.
      const r = await repo('tmp-rebase-nested-repo-file')
      await r.c('base', { 'f.txt': 'f\n', '.gitignore': '*.log\n' })
      await branch({ fs: r.fs, dir: r.dir, gitdir: r.gitdir, ref: 'topic' })
      await r.fs.write(`${r.dir}/sub/x.log`, 'upstream\n')
      await add({
        fs: r.fs,
        dir: r.dir,
        gitdir: r.gitdir,
        filepath: 'sub/x.log',
        force: true,
      })
      await r.c('master 1')
      await checkout({ fs: r.fs, dir: r.dir, gitdir: r.gitdir, ref: 'topic' })
      await r.fs.write(`${r.dir}/sub/.git/HEAD`, 'ref: refs/heads/main\n')
      await r.fs.write(`${r.dir}/sub/x.log`, 'nested work\n')
      const nested = await catchError(
        rebase({
          fs: r.fs,
          dir: r.dir,
          gitdir: r.gitdir,
          upstream: 'master',
          committer,
        })
      )
      expect(nested && nested.code).toBe(Errors.RebaseLocalChangesError.code)
      expect(await r.fs.read(`${r.dir}/sub/x.log`, 'utf8')).toBe(
        'nested work\n'
      )
    })

    it('refuses to replace a submodule by a directory or the reverse, keeping what is in it', async () => {
      for (const toDirectory of [true, false]) {
        const { fs, dir, gitdir, gd, c } = await repo(
          `tmp-rebase-submodule-${toDirectory}`
        )
        const other = await c('for the submodule', { 'f.txt': 'f\n' })
        const gitlink = async () =>
          GitIndexManager.acquire({ fs, gitdir: gd, cache: {} }, index => {
            index.insert({ filepath: 'd', oid: other, mode: 0o160000 })
          })
        if (toDirectory) await gitlink()
        await c('base', toDirectory ? {} : { 'd/a': 'a\n' })
        // topic has nothing of its own: it is fast-forwarded.
        const topic = await resolveRef({ fs, dir, gitdir, ref: 'HEAD' })
        await branch({ fs, dir, gitdir, ref: 'topic' })
        if (toDirectory) {
          await remove({ fs, dir, gitdir, filepath: 'd' })
          await fs.write(`${dir}/d/a`, 'a\n')
          await add({ fs, dir, gitdir, filepath: 'd/a' })
          await c('master 1')
          await fs.rmdir(`${dir}/d`, { recursive: true })
        } else {
          await remove({ fs, dir, gitdir, filepath: 'd/a' })
          await fs.rmdir(`${dir}/d`, { recursive: true })
          await gitlink()
          await c('master 1')
        }
        // Back on topic, with the submodule checked out (its own .git) or the
        // directory holding an untracked file.
        await fs.rm(`${gd}/index`)
        await writeRef({
          fs,
          dir,
          gitdir,
          ref: 'HEAD',
          value: 'refs/heads/topic',
          symbolic: true,
          force: true,
        })
        await checkout({ fs, dir, gitdir, ref: 'topic', force: true })
        if (toDirectory) {
          await fs.write(`${dir}/d/.git/HEAD`, 'ref: refs/heads/main\n')
          await fs.write(`${dir}/d/work.txt`, 'unpushed work\n')
        } else {
          await fs.write(`${dir}/d/u.txt`, 'mine\n')
        }

        const error = await catchError(
          rebase({ fs, dir, gitdir, upstream: 'master', committer })
        )
        expect(error && error.code).toBe(Errors.RebaseNotSupportedError.code)
        expect(await resolveRef({ fs, dir, gitdir, ref: 'topic' })).toBe(topic)
        if (toDirectory) {
          expect(await fs.read(`${dir}/d/.git/HEAD`, 'utf8')).toBe(
            'ref: refs/heads/main\n'
          )
          expect(await fs.read(`${dir}/d/work.txt`, 'utf8')).toBe(
            'unpushed work\n'
          )
        } else {
          expect(await fs.read(`${dir}/d/u.txt`, 'utf8')).toBe('mine\n')
        }
      }
    })

    it('refuses, with nothing changed, to stop on a commit whose files an untracked file is in the way of', async () => {
      for (const asDirectory of [false, true]) {
        const { fs, dir, gitdir, gd, c } = await repo(
          `tmp-rebase-stop-untracked-${asDirectory}`
        )
        await c('base', { 'f.txt': 'a\nb\nc\n' })
        await branch({ fs, dir, gitdir, ref: 'topic', checkout: true })
        // topic 1 conflicts and adds u.txt, which topic 2 deletes again.
        await c('topic 1', { 'f.txt': 'a\nT\nc\n', 'u.txt': 'from topic\n' })
        const tip = await c('topic 2', { 'u.txt': null })
        await checkout({ fs, dir, gitdir, ref: 'master' })
        await c('master 1', { 'f.txt': 'a\nM\nc\n' })
        await checkout({ fs, dir, gitdir, ref: 'topic' })
        const mine = asDirectory ? 'u.txt/mine.txt' : 'u.txt'
        await fs.write(`${dir}/${mine}`, 'precious\n')

        const error = await catchError(
          rebase({
            fs,
            dir,
            gitdir,
            upstream: 'master',
            committer,
            abortOnConflict: false,
          })
        )
        expect(error && error.code).toBe(Errors.RebaseLocalChangesError.code)
        expect(await fs.read(`${dir}/${mine}`, 'utf8')).toBe('precious\n')
        expect(await fs.read(`${dir}/f.txt`, 'utf8')).toBe('a\nT\nc\n')
        expect(await fs.read(`${gd}/HEAD`, 'utf8')).toBe(
          'ref: refs/heads/topic\n'
        )
        expect(await resolveRef({ fs, dir, gitdir, ref: 'topic' })).toBe(tip)
        expect(await fs.exists(`${gd}/rebase-merge`)).toBe(false)
      }
    })

    it('refuses to abort over an untracked file the branch has, even an ignored one', async () => {
      // git refuses too, but replaces ignored files and directories.
      for (const kind of ['file', 'ignored', 'directory', 'ignored-dir']) {
        const { fs, dir, gitdir, gd, c } = await repo(
          `tmp-rebase-abort-untracked-${kind}`
        )
        await c('base', { 'f.txt': 'a\nb\nc\n', '.gitignore': '*.log\n' })
        await branch({ fs, dir, gitdir, ref: 'topic', checkout: true })
        await c('topic 1', { 'f.txt': 'a\nT\nc\n' })
        const file = kind === 'ignored' ? 'u.log' : 'u.txt'
        await fs.write(`${dir}/${file}`, 'from topic\n')
        await add({ fs, dir, gitdir, filepath: file, force: true })
        await c('topic 2')
        await checkout({ fs, dir, gitdir, ref: 'master' })
        await c('master 1', { 'f.txt': 'a\nM\nc\n' })
        await checkout({ fs, dir, gitdir, ref: 'topic' })
        await catchError(
          rebase({
            fs,
            dir,
            gitdir,
            upstream: 'master',
            committer,
            abortOnConflict: false,
          })
        )
        // During the stop, the user creates the file (even an ignored one),
        // or a directory with a file in it (even an ignored one).
        const mine =
          kind === 'directory'
            ? `${file}/mine.txt`
            : kind === 'ignored-dir'
              ? `${file}/mine.log`
              : file
        await fs.write(`${dir}/${mine}`, 'precious\n')

        const error = await catchError(abortRebase({ fs, dir, gitdir }))
        expect(error && error.code).toBe(Errors.RebaseLocalChangesError.code)
        expect(error.data.filepaths).toEqual([file])
        expect(await fs.read(`${dir}/${mine}`, 'utf8')).toBe('precious\n')
        expect(await fs.exists(`${gd}/rebase-merge`)).toBe(true)
        // Once it is out of the way, the abort goes through.
        if (kind === 'directory' || kind === 'ignored-dir') {
          await fs.rmdir(`${dir}/${file}`, { recursive: true })
        } else {
          await fs.rm(`${dir}/${file}`)
        }
        await abortRebase({ fs, dir, gitdir })
        expect(await fs.read(`${dir}/${file}`, 'utf8')).toBe('from topic\n')
      }
    })

    it('replaces an ignored directory where a conflicting commit adds a file, like git', async () => {
      const { fs, dir, gitdir, gd, c } = await repo('tmp-rebase-stop-room')
      await c('base', { 'f.txt': 'a\nb\nc\n', '.gitignore': '*.log\n' })
      await branch({ fs, dir, gitdir, ref: 'topic', checkout: true })
      const t1 = await c('topic 1', { 'f.txt': 'a\nT\nc\n', build: 'b\n' })
      await c('topic 2', { build: null })
      await checkout({ fs, dir, gitdir, ref: 'master' })
      const master = await c('master 1', { 'f.txt': 'a\nM\nc\n' })
      await checkout({ fs, dir, gitdir, ref: 'topic' })
      // An ignored directory where topic 1 adds the file `build`.
      await fs.write(`${dir}/build/out.log`, 'ignored\n')

      const error = await catchError(
        rebase({
          fs,
          dir,
          gitdir,
          upstream: 'master',
          committer,
          abortOnConflict: false,
        })
      )
      expect(error && error.code).toBe(Errors.MergeConflictError.code)
      expect(await fs.read(`${gd}/HEAD`, 'utf8')).toBe(`${master}\n`)
      expect(await fs.read(`${gd}/rebase-merge/stopped-sha`, 'utf8')).toBe(
        `${t1}\n`
      )
      expect(await fs.read(`${dir}/build`, 'utf8')).toBe('b\n')
      const staged = await GitIndexManager.acquire(
        { fs, gitdir: gd, cache: {} },
        async index => [index.entriesMap.get('build').stages[0].oid]
      )
      expect(staged).toEqual(['61780798228d17af2d34fce4cfbdf35556832472'])
    })

    it('puts back a file that upstream turned into a directory when aborting, like git', async () => {
      const { fs, dir, gitdir, gd, c } = await repo('tmp-rebase-abort-dir-file')
      await c('base', { 'f.txt': 'a\nb\nc\n', d: 'file d\n' })
      await branch({ fs, dir, gitdir, ref: 'topic' })
      await c('master 1', { 'f.txt': 'a\nM\nc\n', d: null, 'd/x.txt': 'x\n' })
      // Back on topic by hand: checkout itself cannot make this change.
      await fs.rmdir(`${dir}/d`, { recursive: true })
      await fs.rm(`${gd}/index`)
      await writeRef({
        fs,
        dir,
        gitdir,
        ref: 'HEAD',
        value: 'refs/heads/topic',
        symbolic: true,
        force: true,
      })
      await checkout({ fs, dir, gitdir, ref: 'topic', force: true })
      const topic = await c('topic 1', { 'f.txt': 'a\nT\nc\n' })
      const error = await catchError(
        rebase({
          fs,
          dir,
          gitdir,
          upstream: 'master',
          committer,
          abortOnConflict: false,
        })
      )
      expect(error && error.code).toBe(Errors.MergeConflictError.code)
      expect(await fs.read(`${dir}/d/x.txt`, 'utf8')).toBe('x\n')

      await abortRebase({ fs, dir, gitdir })
      expect(await resolveRef({ fs, dir, gitdir, ref: 'HEAD' })).toBe(topic)
      expect(await fs.read(`${dir}/d`, 'utf8')).toBe('file d\n')
      expect(await fs.read(`${dir}/f.txt`, 'utf8')).toBe('a\nT\nc\n')
      await expectClean(fs, dir, gitdir)
    })

    it('aborts in a repository with a submodule, keeping its checkout', async () => {
      const { fs, dir, gitdir, gd, c } = await repo(
        'tmp-rebase-abort-submodule'
      )
      const other = await c('for the submodule', { 'g.txt': 'g\n' })
      await GitIndexManager.acquire({ fs, gitdir: gd, cache: {} }, index => {
        index.insert({ filepath: 's', oid: other, mode: 0o160000 })
      })
      await c('base', { 'f.txt': 'a\nb\nc\n' })
      // The submodule's checkout, with work of its own.
      await fs.write(`${dir}/s/.git/HEAD`, 'ref: refs/heads/main\n')
      await fs.write(`${dir}/s/work.txt`, 'unpushed work\n')
      await branch({ fs, dir, gitdir, ref: 'topic', checkout: true })
      const topic = await c('topic 1', { 'f.txt': 'a\nT\nc\n' })
      await checkout({ fs, dir, gitdir, ref: 'master' })
      await c('master 1', { 'f.txt': 'a\nM\nc\n' })
      await checkout({ fs, dir, gitdir, ref: 'topic' })
      const error = await catchError(
        rebase({
          fs,
          dir,
          gitdir,
          upstream: 'master',
          committer,
          abortOnConflict: false,
        })
      )
      expect(error && error.code).toBe(Errors.MergeConflictError.code)

      await abortRebase({ fs, dir, gitdir })
      expect(await fs.read(`${gd}/HEAD`, 'utf8')).toBe(
        'ref: refs/heads/topic\n'
      )
      expect(await resolveRef({ fs, dir, gitdir, ref: 'topic' })).toBe(topic)
      expect(await fs.read(`${dir}/f.txt`, 'utf8')).toBe('a\nT\nc\n')
      expect(await fs.read(`${dir}/s/.git/HEAD`, 'utf8')).toBe(
        'ref: refs/heads/main\n'
      )
      expect(await fs.read(`${dir}/s/work.txt`, 'utf8')).toBe('unpushed work\n')
      expect(await fs.exists(`${gd}/rebase-merge`)).toBe(false)
    })

    it('stops on a commit that becomes empty when git started the rebase to stop there', async () => {
      const { fs, dir, gitdir, gd, c } = await repo('tmp-rebase-empty-stop')
      await c('base', { 'f.txt': 'f\n' })
      await branch({ fs, dir, gitdir, ref: 'topic', checkout: true })
      const t1 = await c('topic 1', { 'g.txt': 'g\n' })
      const t2 = await c('topic 2', { 'h.txt': 'h\n' })
      await checkout({ fs, dir, gitdir, ref: 'master' })
      const master = await c('master 1', { 'g.txt': 'g\n', 'm.txt': 'm\n' })
      // As `git rebase -i` leaves a `break` before topic 1: no
      // drop_redundant_commits, so a commit that becomes empty stops it.
      await checkout({ fs, dir, gitdir, ref: master })
      await writeState(fs, gd, {
        'head-name': 'refs/heads/topic\n',
        onto: `${master}\n`,
        'orig-head': `${t2}\n`,
        'git-rebase-todo': `pick ${t1} topic 1\npick ${t2} topic 2\n`,
        done: '',
        interactive: '',
      })
      const error = await catchError(
        continueRebase({ fs, dir, gitdir, committer })
      )
      expect(error && error.code).toBe(Errors.EmptyCommitError.code)
      expect(await fs.read(`${gd}/rebase-merge/stopped-sha`, 'utf8')).toBe(
        `${t1}\n`
      )
      expect(await fs.read(`${gd}/CHERRY_PICK_HEAD`, 'utf8')).toBe(`${t1}\n`)
      expect(await fs.exists(`${gd}/rebase-merge/drop_redundant_commits`)).toBe(
        false
      )
      // Like `git rebase --continue`, continuing drops it.
      const { oid } = await continueRebase({ fs, dir, gitdir, committer })
      expect(await history(fs, gitdir, oid)).toEqual([
        'topic 2',
        'master 1',
        'base',
      ])
    })

    it('keeps 3 lines of context in patch ids', async () => {
      for (const other of [1, 7]) {
        const { fs, dir, gitdir, c } = await repo(`tmp-rebase-context-${other}`)
        const lines = changes =>
          ['1', '2', '3', '4', '5', '6', '7', '8', '9']
            .map((line, i) => (changes.includes(i) ? `X${line}` : line))
            .join('\n') + '\n'
        await c('base', { 'f.txt': lines([]) })
        await branch({ fs, dir, gitdir, ref: 'topic', checkout: true })
        await c('topic', { 'f.txt': lines([4]) })
        await checkout({ fs, dir, gitdir, ref: 'master' })
        // Line 5 changes the same way, but 3 lines away another line differs
        // first: the context differs, so git applies topic.
        await c('other edit', { 'f.txt': lines([other]) })
        await c('same edit', { 'f.txt': lines([other, 4]) })
        await c('revert it', { 'f.txt': lines([other]) })
        await checkout({ fs, dir, gitdir, ref: 'topic' })

        await rebase({ fs, dir, gitdir, upstream: 'master', committer })
        expect((await history(fs, gitdir, 'topic'))[0]).toBe('topic')
        expect(await fs.read(`${dir}/f.txt`, 'utf8')).toBe(lines([other, 4]))
      }
    })

    it('does not take a submodule moving from another commit for the same change', async () => {
      const { fs, dir, gitdir, gd, c } = await repo('tmp-rebase-gitlink-id')
      const [a, b, cc] = [await c('A'), await c('B'), await c('C')]
      const point = async (message, oid) => {
        await GitIndexManager.acquire({ fs, gitdir: gd, cache: {} }, index => {
          index.insert({ filepath: 'sub', oid, mode: 0o160000 })
        })
        return c(message)
      }
      await point('base', a)
      await branch({ fs, dir, gitdir, ref: 'topic', checkout: true })
      await point('topic', b)
      await checkout({ fs, dir, gitdir, ref: 'master' })
      // To B again, but from C: git's patch ids differ, so git applies topic.
      await point('other', cc)
      await point('same', b)
      await point('revert it', cc)
      await checkout({ fs, dir, gitdir, ref: 'topic' })
      // topic is replayed, and the submodule conflicts.
      const error = await catchError(
        rebase({ fs, dir, gitdir, upstream: 'master', committer })
      )
      expect(error).not.toBeNull()
      expect(await resolveRef({ fs, dir, gitdir, ref: 'topic' })).not.toBe(
        await resolveRef({ fs, dir, gitdir, ref: 'master' })
      )
    })

    it('replaces an ignored file where upstream adds a directory, like git', async () => {
      const { fs, dir, gitdir, c } = await repo('tmp-rebase-ignored-to-dir')
      await c('base', { 'f.txt': 'f\n', '.gitignore': '*.log\n' })
      await branch({ fs, dir, gitdir, ref: 'topic', checkout: true })
      await c('topic 1', { 't.txt': 't\n' })
      await checkout({ fs, dir, gitdir, ref: 'master' })
      await fs.write(`${dir}/x.log/inner.txt`, 'inner\n')
      await add({ fs, dir, gitdir, filepath: 'x.log/inner.txt', force: true })
      await c('master 1')
      await checkout({ fs, dir, gitdir, ref: 'topic' })
      if (await fs.exists(`${dir}/x.log`)) {
        await fs.rmdir(`${dir}/x.log`, { recursive: true })
      }
      await fs.write(`${dir}/x.log`, 'junk\n')

      await rebase({ fs, dir, gitdir, upstream: 'master', committer })
      expect(await fs.read(`${dir}/x.log/inner.txt`, 'utf8')).toBe('inner\n')
    })

    it('uses the merge driver', async () => {
      const { fs, dir, gitdir } = await diverged('tmp-rebase-driver', {
        conflict: true,
      })
      const mergeDriver = ({ contents }) => ({
        cleanMerge: true,
        mergedText: contents[1] + contents[2],
      })
      await rebase({
        fs,
        dir,
        gitdir,
        upstream: 'master',
        committer,
        mergeDriver,
      })
      expect(await fs.read(`${dir}/f.txt`, 'utf8')).toBe(
        'a\nMASTER\nc\na\nTOPIC\nc\n'
      )
    })

    it('replaces an untracked directory that holds only ignored files, like git', async () => {
      for (const keep of [false, true]) {
        const { fs, dir, gitdir, c } = await repo(
          `tmp-rebase-ignored-dir-${keep}`
        )
        await c('base', { 'f.txt': 'a\n', '.gitignore': '*.log\n' })
        await branch({ fs, dir, gitdir, ref: 'topic', checkout: true })
        await c('topic 1', { 't.txt': 't\n' })
        await checkout({ fs, dir, gitdir, ref: 'master' })
        await c('master 1', { build: 'now a file\n' })
        await checkout({ fs, dir, gitdir, ref: 'topic' })
        await fs.write(`${dir}/build/a.log`, 'junk\n')
        await fs.write(`${dir}/build/deep/b.log`, 'junk\n')
        if (keep) await fs.write(`${dir}/build/keep.txt`, 'mine\n')

        const error = await catchError(
          rebase({ fs, dir, gitdir, upstream: 'master', committer })
        )
        if (keep) {
          expect(error && error.code).toBe(Errors.RebaseLocalChangesError.code)
          expect(error.data.filepaths).toEqual(['build', 'build/keep.txt'])
          expect(await fs.read(`${dir}/build/keep.txt`, 'utf8')).toBe('mine\n')
        } else {
          expect(error).toBeNull()
          expect(await fs.read(`${dir}/build`, 'utf8')).toBe('now a file\n')
        }
      }
    })
  })
})
