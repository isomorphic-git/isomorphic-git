// @ts-check
import globrex from 'globrex'

import { GitIndexManager } from '../managers/GitIndexManager.js'
import { GitRefManager } from '../managers/GitRefManager.js'
import { FileSystem } from '../models/FileSystem.js'
import { E, GitError } from '../models/GitError.js'
import { join } from '../utils/join.js'
import { patternRoot } from '../utils/patternRoot.js'
import { cores } from '../utils/plugins.js'
import { worthWalking } from '../utils/worthWalking.js'

import { TREE } from './TREE.js'
import { WORKDIR } from './WORKDIR'
import { config } from './config'
import { walkBeta1 } from './walkBeta1.js'

/**
 * Checkout a branch
 *
 * If the branch already exists it will check out that branch. Otherwise, it will create a new remote tracking branch set to track the remote branch of that name.
 *
 * @param {object} args
 * @param {string} [args.core = 'default'] - The plugin core identifier to use for plugin injection
 * @param {FileSystem} [args.fs] - [deprecated] The filesystem containing the git repo. Overrides the fs provided by the [plugin system](./plugin_fs.md).
 * @param {string} args.dir - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {import('events').EventEmitter} [args.emitter] - [deprecated] Overrides the emitter set via the ['emitter' plugin](./plugin_emitter.md)
 * @param {string} [args.emitterPrefix = ''] - Scope emitted events by prepending `emitterPrefix` to the event name
 * @param {string} args.ref - Which branch to checkout
 * @param {string} [args.pattern = null] - Filter the results to only those filepath matches a glob pattern
 * @param {string} [args.remote = 'origin'] - Which remote repository to use
 * @param {boolean} [args.noCheckout = false] - If true, will update HEAD but won't update the working directory
 *
 * @returns {Promise<void>} Resolves successfully when filesystem operations are complete
 *
 * @example
 * // checkout the master branch
 * await git.checkout({ dir: '$input((/))', ref: '$input((master))' })
 * console.log('done')
 *
 * @example
 * // checkout only JSON and Markdown files from master branch
 * await git.checkout({ dir: '$input((/))', ref: '$input((master))', pattern: '$input((**\/*.{json,md}))' })
 * console.log('done')
 *
 */
export async function checkout ({
  core = 'default',
  dir,
  gitdir = join(dir, '.git'),
  fs: _fs = cores.get(core).get('fs'),
  emitter = cores.get(core).get('emitter'),
  emitterPrefix = '',
  remote = 'origin',
  ref,
  pattern = null,
  noCheckout = false
}) {
  try {
    const fs = new FileSystem(_fs)
    if (ref === undefined) {
      throw new GitError(E.MissingRequiredParameterError, {
        function: 'checkout',
        parameter: 'ref'
      })
    }
    let patternGlobrex =
      pattern && globrex(pattern, { globstar: true, extended: true })
    let patternBase = pattern && patternRoot(pattern)
    // Get tree oid
    let oid
    try {
      oid = await GitRefManager.resolve({ fs, gitdir, ref })
      // TODO: Figure out what to do if both 'ref' and 'remote' are specified, ref already exists,
      // and is configured to track a different remote.
    } catch (err) {
      // If `ref` doesn't exist, create a new remote tracking branch
      // Figure out the commit to checkout
      let remoteRef = `${remote}/${ref}`
      oid = await GitRefManager.resolve({
        fs,
        gitdir,
        ref: remoteRef
      })
      // Set up remote tracking branch
      await config({
        gitdir,
        fs,
        path: `branch.${ref}.remote`,
        value: `${remote}`
      })
      await config({
        gitdir,
        fs,
        path: `branch.${ref}.merge`,
        value: `refs/heads/${ref}`
      })
      // Create a new branch that points at that same commit
      await fs.write(`${gitdir}/refs/heads/${ref}`, oid + '\n')
    }
    let fullRef = await GitRefManager.expand({ fs, gitdir, ref })

    if (!noCheckout) {
      let count = 0
      // Acquire a lock on the index
      await GitIndexManager.acquire(
        { fs, filepath: `${gitdir}/index` },
        async function (index) {
          // TODO: Big optimization possible here.
          // Instead of deleting and rewriting everything, only delete files
          // that are not present in the new branch, and only write files that
          // are not in the index or are in the index but have the wrong SHA.
          for (let entry of index) {
            try {
              await fs.rm(join(dir, entry.path))
              if (emitter) {
                emitter.emit(`${emitterPrefix}progress`, {
                  phase: 'Updating workdir',
                  loaded: ++count,
                  lengthComputable: false
                })
              }
            } catch (err) {}
          }
          index.clear()
          try {
            await walkBeta1({
              trees: [TREE({ fs, gitdir, ref }), WORKDIR({ fs, dir, gitdir })],
              filter: async function ([head, workdir]) {
                // match against 'pattern' parameter
                if (pattern == null) return true
                return worthWalking(head.fullpath, patternBase)
              },
              map: async function ([head, workdir]) {
                if (head.fullpath === '.') return
                if (!head.exists) return
                // Late filter against file names
                if (
                  patternGlobrex &&
                  !patternGlobrex.regex.test(head.fullpath)
                ) {
                  return
                }
                await head.populateStat()
                const filepath = `${dir}/${head.fullpath}`
                switch (head.type) {
                  case 'tree': {
                    // ignore directories for now
                    if (!workdir.exists) await fs.mkdir(filepath)
                    break
                  }
                  case 'commit': {
                    // gitlinks
                    console.log(
                      new GitError(E.NotImplementedFail, {
                        thing: 'submodule support'
                      })
                    )
                    break
                  }
                  case 'blob': {
                    await head.populateContent()
                    await head.populateHash()
                    if (head.mode === '100644') {
                      // regular file
                      await fs.write(filepath, head.content)
                    } else if (head.mode === '100755') {
                      // executable file
                      await fs.write(filepath, head.content, { mode: 0o777 })
                    } else if (head.mode === '120000') {
                      // symlink
                      await fs.writelink(filepath, head.content)
                    } else {
                      throw new GitError(E.InternalFail, {
                        message: `Invalid mode "${
                          head.mode
                        }" detected in blob ${head.oid}`
                      })
                    }
                    let stats = await fs.lstat(filepath)
                    // We can't trust the executable bit returned by lstat on Windows,
                    // so we need to preserve this value from the TREE.
                    // TODO: Figure out how git handles this internally.
                    if (head.mode === '100755') {
                      stats.mode = 0o755
                    }
                    index.insert({
                      filepath: head.fullpath,
                      stats,
                      oid: head.oid
                    })
                    if (emitter) {
                      emitter.emit(`${emitterPrefix}progress`, {
                        phase: 'Updating workdir',
                        loaded: ++count,
                        lengthComputable: false
                      })
                    }
                    break
                  }
                  default: {
                    throw new GitError(E.ObjectTypeAssertionInTreeFail, {
                      type: head.type,
                      oid: head.oid,
                      entrypath: head.fullpath
                    })
                  }
                }
              }
            })
          } catch (err) {
            // Throw a more helpful error message for this common mistake.
            if (err.code === E.ReadObjectFail && err.data.oid === oid) {
              throw new GitError(E.CommitNotFetchedError, { ref, oid })
            } else {
              throw err
            }
          }
        }
      )
    }
    // Update HEAD
    const content = fullRef.startsWith('refs/heads') ? `ref: ${fullRef}` : oid
    await fs.write(`${gitdir}/HEAD`, `${content}\n`)
  } catch (err) {
    err.caller = 'git.checkout'
    throw err
  }
}
