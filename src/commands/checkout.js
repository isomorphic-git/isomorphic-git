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
import { walkBeta2 } from './walkBeta2.js'

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
 * @param {string[]} [args.filepaths = ['.']] - Limit the checkout to the given files and directories
 * @param {string} [args.pattern = null] - Only checkout the files that match a glob pattern. (Pattern is relative to `filepaths` if `filepaths` is provided.)
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
  filepaths = ['.'],
  pattern = null,
  noCheckout = false,
  noSubmodules = false
}) {
  try {
    const fs = new FileSystem(_fs)
    if (ref === undefined) {
      throw new GitError(E.MissingRequiredParameterError, {
        function: 'checkout',
        parameter: 'ref'
      })
    }
    let patternPart = ''
    let patternGlobrex
    if (pattern) {
      patternPart = patternRoot(pattern)
      if (patternPart) {
        pattern = pattern.replace(patternPart + '/', '')
      }
      patternGlobrex = globrex(pattern, { globstar: true, extended: true })
    }
    const bases = filepaths.map(filepath => join(filepath, patternPart))
    // Get tree oid
    let oid
    try {
      oid = await GitRefManager.resolve({ fs, gitdir, ref })
      // TODO: Figure out what to do if both 'ref' and 'remote' are specified, ref already exists,
      // and is configured to track a different remote.
    } catch (err) {
      // If `ref` doesn't exist, create a new remote tracking branch
      // Figure out the commit to checkout
      const remoteRef = `${remote}/${ref}`
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
    const fullRef = await GitRefManager.expand({ fs, gitdir, ref })

    if (!noCheckout) {
      let count = 0
      // Acquire a lock on the index
      await GitIndexManager.acquire({ fs, gitdir }, async function (index) {
        // TODO: Big optimization possible here.
        // Instead of deleting and rewriting everything, only delete files
        // that are not present in the new branch, and only write files that
        // are not in the index or are in the index but have the wrong SHA.
        for (const entry of index) {
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
          await walkBeta2({
            fs,
            dir,
            gitdir,
            trees: [TREE({ ref }), WORKDIR()],
            map: async function (fullpath, [head, workdir]) {
              // match against base paths
              if (!bases.some(base => worthWalking(fullpath, base))) {
                return null
              }
              if (fullpath === '.') return
              if (!head) return
              // Late filter against file names
              if (patternGlobrex) {
                let match = false
                for (const base of bases) {
                  const partToMatch = fullpath.replace(base + '/', '')
                  if (patternGlobrex.regex.test(partToMatch)) {
                    match = true
                    break
                  }
                }
                if (!match) return
              }
              const filepath = `${dir}/${fullpath}`
              switch (await head.type()) {
                case 'tree': {
                  // ignore directories for now
                  if (!workdir) await fs.mkdir(filepath)
                  break
                }
                case 'commit': {
                  // gitlinks
                  if (!noSubmodules) {
                    console.log(
                      new GitError(E.NotImplementedFail, {
                        thing: 'submodule support'
                      })
                    )
                  }

                  break
                }
                case 'blob': {
                  if ((await head.mode()) === 0o100644) {
                    // regular file
                    await fs.write(filepath, await head.content())
                  } else if ((await head.mode()) === 0o100755) {
                    // executable file
                    await fs.write(filepath, await head.content(), {
                      mode: 0o777
                    })
                  } else if ((await head.mode()) === 0o120000) {
                    // symlink
                    await fs.writelink(filepath, await head.content())
                  } else {
                    throw new GitError(E.InternalFail, {
                      message: `Invalid mode "${await head.mode()}" detected in blob ${await head.oid()}`
                    })
                  }
                  const stats = await fs.lstat(filepath)
                  // We can't trust the executable bit returned by lstat on Windows,
                  // so we need to preserve this value from the TREE.
                  // TODO: Figure out how git handles this internally.
                  if ((await head.mode()) === 0o100755) {
                    stats.mode = 0o100755
                  }
                  index.insert({
                    filepath: fullpath,
                    stats,
                    oid: await head.oid()
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
                    type: await head.type(),
                    oid: await head.oid(),
                    entrypath: fullpath
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
      })
    }
    // Update HEAD
    const content = fullRef.startsWith('refs/heads') ? `ref: ${fullRef}` : oid
    await fs.write(`${gitdir}/HEAD`, `${content}\n`)
  } catch (err) {
    err.caller = 'git.checkout'
    throw err
  }
}
