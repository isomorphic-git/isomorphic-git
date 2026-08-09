import '../typedefs.js'
import { join } from '../utils/join.js'
import { acquireLock } from '../utils/lock.js'

export class GitShallowManager {
  /**
   * Reads the `shallow` file in the Git repository and returns a set of object IDs (OIDs).
   *
   * @param {Object} args
   * @param {FSClient} args.fs - A file system implementation.
   * @param {string} [args.gitdir] - [required] The [git directory](dir-vs-gitdir.md) path
   * @returns {Promise<Set<string>>} - A set of shallow object IDs.
   */
  static async read({ fs, gitdir }) {
    const filepath = join(gitdir, 'shallow')
    const oids = new Set()
    await acquireLock(filepath, async function () {
      const text = await fs.read(filepath, { encoding: 'utf8' })
      if (text === null) return oids // no file
      if (text.trim() === '') return oids // empty file
      text
        .trim()
        .split('\n')
        .map(oid => oids.add(oid))
    })
    return oids
  }

  /**
   * Writes a set of object IDs (OIDs) to the `shallow` file in the Git repository.
   * If the set is empty, the `shallow` file is removed.
   *
   * @param {Object} args
   * @param {FSClient} args.fs - A file system implementation.
   * @param {string} [args.gitdir] - [required] The [git directory](dir-vs-gitdir.md) path
   * @param {Set<string>} args.oids - A set of shallow object IDs to write.
   * @returns {Promise<void>}
   */
  static async write({ fs, gitdir, oids }) {
    const filepath = join(gitdir, 'shallow')
    if (oids.size > 0) {
      const text = [...oids].join('\n') + '\n'
      await acquireLock(filepath, async function () {
        await fs.write(filepath, text, {
          encoding: 'utf8',
        })
      })
    } else {
      // No shallows
      await acquireLock(filepath, async function () {
        await fs.rm(filepath)
      })
    }
  }
}
