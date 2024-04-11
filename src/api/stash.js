// @ts-check
import {
  _stashPush,
  _stashApply,
  _stashDrop,
  _stashList,
  _stashClear,
  _stashPop,
} from '../commands/stash.js'
import { InvalidRefNameError } from '../errors/InvalidRefNameError.js'
import { FileSystem } from '../models/FileSystem.js'
import { assertParameter } from '../utils/assertParameter.js'
import { join } from '../utils/join.js'

/**
 * stash api, supports  {'push' | 'pop' | 'apply' | 'drop' | 'list' | 'clear'} StashOp
 * _note_,
 * - all stash operations are done on tracked files only with loose objects, no packed objects
 * - when op === 'push', both working directory and index (staged) changes will be stashed, tracked files only
 * - when op === 'push', message is optional, and only applicable when op === 'push'
 * - when op === 'apply | pop', the stashed changes will overwrite the working directory, no abort when conflicts
 *
 * @param {object} args
 * @param {FsClient} args.fs - [required] a file system client
 * @param {string} [args.dir] - [required] The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [optional] The [git directory](dir-vs-gitdir.md) path
 * @param {'push' | 'pop' | 'apply' | 'drop' | 'list' | 'clear'} [args.op = 'push'] - [optional] name of stash operation, default to 'push'
 * @param {string} [args.message = ''] - [optional] message to be used for the stash entry, only applicable when op === 'push'
 * @param {number} [args.refIdx = 0] - [optional - Number] stash ref index of entry, only applicable when op === ['apply' | 'drop' | 'pop'], refIdx >= 0 and < num of stash pushed
 * @returns {Promise<string | void>}  Resolves successfully when stash operations are complete
 *
 * @example
 * // stash changes in the working directory and index
 * let dir = '/tutorial'
 * await fs.promises.writeFile(`${dir}/a.txt`, 'original content - a')
 * await fs.promises.writeFile(`${dir}/b.js`, 'original content - b')
 * await git.add({ fs, dir, filepath: [`a.txt`,`b.txt`] })
 * let sha = await git.commit({
 *   fs,
 *   dir,
 *   author: {
 *     name: 'Mr. Stash',
 *     email: 'mstasher@stash.com',
 *   },
 *   message: 'add a.txt and b.txt to test stash'
 * })
 * console.log(sha)
 *
 * await fs.promises.writeFile(`${dir}/a.txt`, 'stashed chang- a')
 * await git.add({ fs, dir, filepath: `${dir}/a.txt` })
 * await fs.promises.writeFile(`${dir}/b.js`, 'work dir change. not stashed - b')
 *
 * await git.stash({ fs, dir }) // default gitdir and op
 *
 * console.log(await git.status({ fs, dir, filepath: 'a.txt' })) // 'unmodified'
 * console.log(await git.status({ fs, dir, filepath: 'b.txt' })) // 'unmodified'
 *
 * const refLog = await git.stash({ fs, dir, op: 'list' })
 * console.log(refLog) // [{stash{#} message}]
 *
 * await git.stash({ fs, dir, op: 'apply' }) // apply the stash
 *
 * console.log(await git.status({ fs, dir, filepath: 'a.txt' })) // 'modified'
 * console.log(await git.status({ fs, dir, filepath: 'b.txt' })) // '*modified'
 */

export async function stash({
  fs,
  dir,
  gitdir = join(dir, '.git'),
  op = 'push',
  message = '',
  refIdx = 0,
}) {
  assertParameter('fs', fs)
  assertParameter('dir', dir)
  assertParameter('gitdir', gitdir)
  assertParameter('op', op)

  const stashMap = {
    push: _stashPush,
    apply: _stashApply,
    drop: _stashDrop,
    list: _stashList,
    clear: _stashClear,
    pop: _stashPop,
  }

  const opsNeedRefIdx = ['apply', 'drop', 'pop']

  try {
    const _fs = new FileSystem(fs)
    const folders = ['refs', 'logs', 'logs/refs']
    folders
      .map(f => join(gitdir, f))
      .forEach(async folder => {
        if (!(await _fs.exists(folder))) {
          await _fs.mkdir(folder)
        }
      })

    const opFunc = stashMap[op]
    if (opFunc) {
      if (opsNeedRefIdx.includes(op) && refIdx < 0) {
        throw new InvalidRefNameError(
          `stash@${refIdx}`,
          'number that is in range of [0, num of stash pushed]'
        )
      }
      return await opFunc({ fs: _fs, dir, gitdir, message, refIdx })
    }
    throw new Error(`To be implemented: ${op}`)
  } catch (err) {
    err.caller = 'git.stash'
    throw err
  }
}
