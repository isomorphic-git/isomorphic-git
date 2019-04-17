// @ts-check
import globrex from 'globrex'

import { GitIgnoreManager } from '../managers/GitIgnoreManager.js'
import { FileSystem } from '../models/FileSystem.js'
import { join } from '../utils/join.js'
import { patternRoot } from '../utils/patternRoot.js'
import { cores } from '../utils/plugins.js'
import { worthWalking } from '../utils/worthWalking.js'

import { STAGE } from './STAGE.js'
import { TREE } from './TREE.js'
import { WORKDIR } from './WORKDIR.js'
import { walkBeta1 } from './walkBeta1.js'

/**
 * Efficiently get the status of multiple files at once.
 *
 * The returned `StatusMatrix` is admittedly not the easiest format to read.
 * However it conveys a large amount of information in dense format that should make it easy to create reports about the current state of the repository;
 * without having to do multiple, time-consuming isomorphic-git calls.
 * My hope is that the speed and flexibility of the function will make up for the learning curve of interpreting the return value.
 *
 * ```js live
 * // get the status of all the files in 'src'
 * let status = await git.statusMatrix({ dir: '$input((/))', pattern: '$input((src/**))' })
 * console.log(status)
 * ```
 *
 * ```js live
 * // get the status of all the JSON and Markdown files
 * let status = await git.statusMatrix({ dir: '$input((/))', pattern: '$input((**\/*.{json,md}))' })
 * console.log(status)
 * ```
 *
 * The result is returned as a 2D array.
 * The outer array represents the files and/or blobs in the repo, in alphabetical order.
 * The inner arrays describe the status of the file:
 * the first value is the filepath, and the next three are integers
 * representing the HEAD status, WORKDIR status, and STAGE status of the entry.
 *
 * ```js
 * // example StatusMatrix
 * [
 *   ["a.txt", 0, 2, 0], // new, untracked
 *   ["b.txt", 0, 2, 2], // added, staged
 *   ["c.txt", 0, 2, 3], // added, staged, with unstaged changes
 *   ["d.txt", 1, 1, 1], // unmodified
 *   ["e.txt", 1, 2, 1], // modified, unstaged
 *   ["f.txt", 1, 2, 2], // modified, staged
 *   ["g.txt", 1, 2, 3], // modified, staged, with unstaged changes
 *   ["h.txt", 1, 0, 1], // deleted, unstaged
 *   ["i.txt", 1, 0, 0], // deleted, staged
 * ]
 * ```
 *
 * - The HEAD status is either absent (0) or present (1).
 * - The WORKDIR status is either absent (0), identical to HEAD (1), or different from HEAD (2).
 * - The STAGE status is either absent (0), identical to HEAD (1), identical to WORKDIR (2), or different from WORKDIR (3).
 *
 * ```ts
 * type Filename      = string
 * type HeadStatus    = 0 | 1
 * type WorkdirStatus = 0 | 1 | 2
 * type StageStatus   = 0 | 1 | 2 | 3
 *
 * type StatusRow     = [Filename, HeadStatus, WorkdirStatus, StageStatus]
 *
 * type StatusMatrix  = StatusRow[]
 * ```
 *
 * > Think of the natural progression of file modifications as being from HEAD (previous) -> WORKDIR (current) -> STAGE (next).
 * > Then HEAD is "version 1", WORKDIR is "version 2", and STAGE is "version 3".
 * > Then, imagine a "version 0" which is before the file was created.
 * > Then the status value in each column corresponds to the oldest version of the file it is identical to.
 * > (For a file to be identical to "version 0" means the file is deleted.)
 *
 * Here are some examples of queries you can answer using the result:
 *
 * #### Q: What files have been deleted?
 * ```js
 * const FILE = 0, WORKDIR = 2
 *
 * const filenames = (await statusMatrix({ dir }))
 *   .filter(row => row[WORKDIR] === 0)
 *   .map(row => row[FILE])
 * ```
 *
 * #### Q: What files have unstaged changes?
 * ```js
 * const FILE = 0, WORKDIR = 2, STAGE = 3
 *
 * const filenames = (await statusMatrix({ dir }))
 *   .filter(row => row[WORKDIR] !== row[STAGE])
 *   .map(row => row[FILE])
 * ```
 *
 * #### Q: What files have been modified since the last commit?
 * ```js
 * const FILE = 0, HEAD = 1, WORKDIR = 2
 *
 * const filenames = (await statusMatrix({ dir }))
 *   .filter(row => row[HEAD] !== row[WORKDIR])
 *   .map(row => row[FILE])
 * ```
 *
 * #### Q: What files will NOT be changed if I commit right now?
 * ```js
 * const FILE = 0, HEAD = 1, STAGE = 3
 *
 * const filenames = (await statusMatrix({ dir }))
 *   .filter(row => row[HEAD] === row[STAGE])
 *   .map(row => row[FILE])
 * ```
 *
 * For reference, here are all possible combinations:
 *
 * | HEAD | WORKDIR | STAGE | `git status --short` equivalent |
 * | ---- | ------- | ----- | ------------------------------- |
 * | 0    | 0       | 0     | ``                              |
 * | 0    | 0       | 3     | `AD`                            |
 * | 0    | 2       | 0     | `??`                            |
 * | 0    | 2       | 2     | `A `                            |
 * | 0    | 2       | 3     | `AM`                            |
 * | 1    | 0       | 0     | `D `                            |
 * | 1    | 0       | 1     | ` D`                            |
 * | 1    | 0       | 3     | `MD`                            |
 * | 1    | 1       | 0     | `D ` + `??`                     |
 * | 1    | 1       | 1     | ``                              |
 * | 1    | 1       | 3     | `MM`                            |
 * | 1    | 2       | 0     | `D ` + `??`                     |
 * | 1    | 2       | 1     | ` M`                            |
 * | 1    | 2       | 2     | `M `                            |
 * | 1    | 2       | 3     | `MM`                            |
 *
 * @param {object} args
 * @param {string} [args.core = 'default'] - The plugin core identifier to use for plugin injection
 * @param {FileSystem} [args.fs] - [deprecated] The filesystem containing the git repo. Overrides the fs provided by the [plugin system](./plugin_fs.md).
 * @param {string} args.dir - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir, '.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} [args.ref = 'HEAD'] - Optionally specify a different commit to compare against the workdir and stage instead of the HEAD
 * @param {string} [args.pattern] - Filter the results to only those whose filepath matches a glob pattern
 *
 * @returns {Promise<number[][]>} Resolves with a status matrix, described below.
 */
export async function statusMatrix ({
  core = 'default',
  dir,
  gitdir = join(dir, '.git'),
  fs: _fs = cores.get(core).get('fs'),
  ref = 'HEAD',
  pattern = null
}) {
  try {
    const fs = new FileSystem(_fs)
    let patternGlobrex =
      pattern && globrex(pattern, { globstar: true, extended: true })
    let patternBase = pattern && patternRoot(pattern)
    let results = await walkBeta1({
      trees: [
        TREE({ fs, gitdir, ref }),
        WORKDIR({ fs, dir, gitdir }),
        STAGE({ fs, gitdir })
      ],
      filter: async function ([head, workdir, stage]) {
        // We need an awkward exception for the root directory
        if (head.fullpath === '.') return true
        // Ignore ignored files, but only if they are not already tracked.
        if (!head.exists && !stage.exists && workdir.exists) {
          if (
            await GitIgnoreManager.isIgnored({
              fs,
              dir,
              filepath: workdir.fullpath
            })
          ) {
            return false
          }
        }
        // match against 'pattern' parameter
        if (pattern === null) return true
        return worthWalking(head.fullpath, patternBase)
      },
      map: async function ([head, workdir, stage]) {
        // Late filter against file names
        if (patternGlobrex && !patternGlobrex.regex.test(head.fullpath)) return
        // For now, just bail on directories
        await head.populateStat()
        if (head.type === 'tree' || head.type === 'special') return
        await workdir.populateStat()
        if (workdir.type === 'tree' || workdir.type === 'special') return
        await stage.populateStat()
        if (stage.type === 'tree' || stage.type === 'special') return
        // Figure out the oids, using the staged oid for the working dir oid if the stats match.
        await head.populateHash()
        await stage.populateHash()
        if (!head.exists && workdir.exists && !stage.exists) {
          // We don't actually NEED the sha. Any sha will do
          // TODO: update this logic to handle N trees instead of just 3.
          workdir.oid = '42'
        } else if (workdir.exists) {
          await workdir.populateHash()
        }
        let entry = [undefined, head.oid, workdir.oid, stage.oid]
        let result = entry.map(value => entry.indexOf(value))
        result.shift() // remove leading undefined entry
        let fullpath = head.fullpath || workdir.fullpath || stage.fullpath
        return [fullpath, ...result]
      }
    })
    return results
  } catch (err) {
    err.caller = 'git.statusMatrix'
    throw err
  }
}
