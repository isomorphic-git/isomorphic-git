// @ts-check
import { readTree } from '../commands/readTree'
import { GitIndexManager } from '../managers/GitIndexManager.js'
import { GitRefManager } from '../managers/GitRefManager.js'
import { join } from '../utils/join'

/**
 * @param {object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {string} args.gitdir
 * @param {string} [args.ref]
 *
 * @returns {Promise<Array<string>>}
 */
export async function listFiles ({
  fs,
  gitdir,
  ref
}) {
  if (ref) {
    const oid = await GitRefManager.resolve({ gitdir, fs, ref })
    const filenames = []
    await accumulateFilesFromOid({ fs, gitdir, oid, filenames, prefix: '' })
    return filenames
  } else {
    return GitIndexManager.acquire({ fs, gitdir }, async function (index) {
      return index.entries.map(x => x.path)
    })
  }
}

async function accumulateFilesFromOid ({ fs, gitdir, oid, filenames, prefix }) {
  const { tree } = await readTree({ fs, gitdir, oid })
  // TODO: Use `walk` to do this. Should be faster.
  for (const entry of tree) {
    if (entry.type === 'tree') {
      await accumulateFilesFromOid({
        fs,
        gitdir,
        oid: entry.oid,
        filenames,
        prefix: join(prefix, entry.path)
      })
    } else {
      filenames.push(join(prefix, entry.path))
    }
  }
}
