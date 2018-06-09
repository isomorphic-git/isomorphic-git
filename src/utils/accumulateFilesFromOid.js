import { readObject } from '../commands'

import { posixJoin } from './posixJoin'

export async function accumulateFilesFromOid ({
  gitdir,
  fs,
  oid,
  filenames,
  prefix
}) {
  const { object } = await readObject({ gitdir, fs, oid, filepath: '' })
  // Note: this isn't parallelized because I'm too lazy to figure that out right now
  for (const entry of object.entries) {
    if (entry.type === 'tree') {
      await accumulateFilesFromOid({
        gitdir,
        fs,
        oid: entry.oid,
        filenames,
        prefix: posixJoin(prefix, entry.path)
      })
    } else {
      filenames.push(posixJoin(prefix, entry.path))
    }
  }
}
