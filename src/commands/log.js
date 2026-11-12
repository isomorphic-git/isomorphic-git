// @ts-check
import '../typedefs.js'

import { TREE } from '../commands/TREE.js'
import { _readCommit } from '../commands/readCommit.js'
import { _walk } from '../commands/walk.js'
import { NotFoundError } from '../errors/NotFoundError.js'
import { GitRefManager } from '../managers/GitRefManager.js'
import { GitShallowManager } from '../managers/GitShallowManager.js'
import { compareAge } from '../utils/compareAge.js'
import { resolveFileIdInTree } from '../utils/resolveFileIdInTree.js'
import { resolveFilepathEntry } from '../utils/resolveFilepath.js'

/**
 * Get commit descriptions from the git history
 *
 * @param {object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {any} args.cache
 * @param {string} args.gitdir
 * @param {string=} args.filepath optional get the commit for the filepath only
 * @param {string} args.ref
 * @param {number|void} args.depth
 * @param {string} [args.author] - Return only commits whose author matches this case-insensitive JavaScript regular expression, tested against the author's `Name <email>` string
 * @param {boolean=} [args.force=false] do not throw error if filepath is not exist (works only for a single file). defaults to false
 * @param {boolean=} [args.follow=false] Continue listing the history of a file beyond renames (works only for a single file). defaults to false
 * @param {boolean=} [args.includeChanges=false] Include changed file object ids for each commit.
 *
 * @returns {Promise<Array<ReadCommitResult>>} Resolves to an array of ReadCommitResult objects
 * @see ReadCommitResult
 * @see CommitObject
 *
 * @example
 * let commits = await git.log({ dir: '$input((/))', depth: $input((5)), ref: '$input((master))' })
 * console.log(commits)
 *
 */
export async function _log({
  fs,
  cache,
  gitdir,
  filepath,
  ref,
  depth,
  since,
  author,
  force,
  follow,
  includeChanges,
}) {
  const sinceTimestamp =
    typeof since === 'undefined'
      ? undefined
      : Math.floor(since.valueOf() / 1000)
  // The pattern is a case-insensitive JavaScript regular expression that is
  // matched against the author's "Name <email>" string.
  const authorRegex =
    author === undefined || author === null
      ? undefined
      : new RegExp(author, 'i')
  const matchesAuthor = ({ commit }) => {
    if (authorRegex === undefined) return true
    if (!commit.author) return false
    return authorRegex.test(`${commit.author.name} <${commit.author.email}>`)
  }
  const commits = []
  // TODO: In the future, we may want to have an API where we return a
  // async iterator that emits commits.
  // Commits that do not match the author pattern are omitted from the
  // result, but their history is still traversed so that file tracking and
  // `depth` behave as they do without a filter.
  const pushCommit = commit => {
    if (matchesAuthor(commit)) commits.push(commit)
  }
  const shallowCommits = await GitShallowManager.read({ fs, gitdir })
  const oid = await GitRefManager.resolve({ fs, gitdir, ref })
  const tips = [await _readCommit({ fs, cache, gitdir, oid })]
  const visited = new Set()
  let lastFileOid
  let lastFileMode
  let lastCommit
  let isOk

  function endCommit(commit) {
    if (isOk && filepath) pushCommit(commit)
  }

  async function popNextTip() {
    tips.sort((a, b) => compareAge(a.commit, b.commit))
    const maxTs = tips[tips.length - 1].commit.committer.timestamp
    let tieStart = tips.length - 1
    while (
      tieStart > 0 &&
      tips[tieStart - 1].commit.committer.timestamp === maxTs
    ) {
      tieStart--
    }
    if (tieStart === tips.length - 1) {
      return tips.pop()
    }

    const tied = tips.slice(tieStart)
    const tiedOids = new Set(tied.map(c => c.oid))
    const ancestorsInTied = new Set()

    for (const root of tied) {
      const queue = shallowCommits.has(root.oid) ? [] : [...root.commit.parent]
      const seen = new Set()
      while (queue.length > 0) {
        const oid = queue.shift()
        if (seen.has(oid) || visited.has(oid)) continue
        seen.add(oid)
        if (tiedOids.has(oid) && oid !== root.oid) {
          ancestorsInTied.add(oid)
          continue
        }
        if (shallowCommits.has(oid)) continue
        const parentCommit = await _readCommit({ fs, cache, gitdir, oid })
        if (parentCommit.commit.committer.timestamp >= maxTs) {
          queue.push(...parentCommit.commit.parent)
        }
      }
    }

    for (let i = tips.length - 1; i >= tieStart; i--) {
      if (!ancestorsInTied.has(tips[i].oid)) {
        return tips.splice(i, 1)[0]
      }
    }
    return tips.pop()
  }

  while (tips.length > 0) {
    const commit = await popNextTip()
    if (visited.has(commit.oid)) continue
    visited.add(commit.oid)

    // Stop the log if we've hit the age limit
    if (
      sinceTimestamp !== undefined &&
      commit.commit.committer.timestamp <= sinceTimestamp
    ) {
      break
    }

    if (filepath) {
      let vFileEntry
      try {
        vFileEntry = await resolveFilepathEntry({
          fs,
          cache,
          gitdir,
          oid: commit.commit.tree,
          filepath,
        })
        if (
          lastCommit &&
          (lastFileOid !== vFileEntry.oid || lastFileMode !== vFileEntry.mode)
        ) {
          pushCommit(lastCommit)
        }
        lastFileOid = vFileEntry.oid
        lastFileMode = vFileEntry.mode
        lastCommit = commit
        isOk = true
      } catch (e) {
        if (e instanceof NotFoundError) {
          let found = follow && lastFileOid
          if (found) {
            found = await resolveFileIdInTree({
              fs,
              cache,
              gitdir,
              oid: commit.commit.tree,
              fileId: lastFileOid,
            })
            if (found) {
              if (Array.isArray(found)) {
                if (lastCommit) {
                  const lastFound = await resolveFileIdInTree({
                    fs,
                    cache,
                    gitdir,
                    oid: lastCommit.commit.tree,
                    fileId: lastFileOid,
                  })
                  if (Array.isArray(lastFound)) {
                    found = found.filter(p => lastFound.indexOf(p) === -1)
                    if (found.length === 1) {
                      found = found[0]
                      filepath = found
                      if (lastCommit) pushCommit(lastCommit)
                    } else {
                      found = false
                      if (lastCommit) pushCommit(lastCommit)
                      break
                    }
                  }
                }
              } else {
                filepath = found
                if (lastCommit) pushCommit(lastCommit)
              }
            }
          }
          if (!found) {
            if (isOk && lastFileOid) {
              pushCommit(lastCommit)
              if (!force) break
            }
            if (!force && !follow) throw e
          }
          lastCommit = commit
          isOk = false
        } else throw e
      }
    } else {
      pushCommit(commit)
    }

    // Stop the loop if we have enough commits now.
    if (depth !== undefined && commits.length === depth) {
      endCommit(commit)
      break
    }

    // If this is not a shallow commit...
    if (!shallowCommits.has(commit.oid)) {
      // Add the parents of this commit to the queue in reverse order so parent[0] is popped first on ties
      // Note: for the case of a commit with no parents, it will concat an empty array, having no net effect.
      for (const oid of [...commit.commit.parent].reverse()) {
        if (!visited.has(oid) && !tips.some(c => c.oid === oid)) {
          const commit = await _readCommit({ fs, cache, gitdir, oid })
          tips.push(commit)
        }
      }
    }

    // Stop the loop if there are no more commit parents
    if (tips.length === 0) {
      endCommit(commit)
    }
  }
  if (includeChanges) {
    for (const commit of commits) {
      commit.commit.changes = await getChanges({
        fs,
        cache,
        gitdir,
        commit,
        shallow: shallowCommits.has(commit.oid),
      })
    }
  }
  return commits
}

async function getChanges({ fs, cache, gitdir, commit, shallow }) {
  const parent =
    shallow || !commit.commit.parent[0]
      ? '4b825dc642cb6eb9a060e54bf8d69288fbee4904'
      : commit.commit.parent[0]
  return _walk({
    fs,
    cache,
    gitdir,
    trees: [TREE({ ref: commit.oid }), TREE({ ref: parent })],
    map: async (filepath, [current, previous]) => {
      const [currentType, previousType] = await Promise.all([
        current && current.type(),
        previous && previous.type(),
      ])
      if (currentType === 'tree') {
        if (previousType && previousType !== 'tree') {
          return [null, await previous.oid(), filepath]
        }
        return
      }
      if (previousType === 'tree') {
        if (currentType) {
          return [await current.oid(), null, filepath]
        }
        return
      }
      const [newOid, oldOid] = await Promise.all([
        current ? current.oid() : null,
        previous ? previous.oid() : null,
      ])
      if (newOid === oldOid) return
      return [newOid, oldOid, filepath]
    },
  })
}
