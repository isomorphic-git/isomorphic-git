// @ts-check
/** @typedef { import("../typedefs.js").StashOp } StashOp */
/** @typedef { import('../typedefs.js').FsClient } FsClient */

import {
  _stashPush,
  _stashApply,
  _stashDrop,
  _stashList,
  _stashClear,
  _stashPop,
} from '../commands/stash.js'
import { FileSystem } from '../models/FileSystem.js'
import { assertParameter } from '../utils/assertParameter.js'
import { join } from '../utils/join.js'

/**
 * stash api entry point, support ops defined in StashOp
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system client
 * @param {boolean} [args.bare = false] - Initialize a bare repository
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {StashOp} [args.op = 'push'] - The name of stash operation, default to 'push', including both index (staging) and working directory
 * @returns {Promise<string | void>}  Resolves successfully when filesystem operations are complete
 *
 * @example
 * await git.stash({ fs, dir: '/tutorial' })
 * console.log('done')
 *
 */

const stashMap = {
  push: _stashPush,
  apply: _stashApply,
  drop: _stashDrop,
  list: _stashList,
  clear: _stashClear,
  pop: _stashPop,
}

export async function stash({
  fs,
  bare = false,
  dir,
  gitdir = bare ? dir : join(dir, '.git'),
  op = 'push',
}) {
  try {
    assertParameter('fs', fs)
    assertParameter('gitdir', gitdir)
    if (!bare) {
      assertParameter('dir', dir)
    }
    assertParameter('op', op)

    const _fs = new FileSystem(fs)
    const folders = ['logs', 'logs/refs']
    folders
      .map(f => join(gitdir, f))
      .forEach(async folder => {
        if (!(await _fs.exists(gitdir + '/config'))) {
          await _fs.mkdir(folder)
        }
      })

    const opFunc = stashMap[op]
    if (opFunc) {
      return await opFunc({ fs: _fs, dir, gitdir })
    }
    throw new Error(`To be implemented: ${op}`)
  } catch (err) {
    err.caller = 'git.stash'
    throw err
  }
}
