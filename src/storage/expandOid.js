import { FileSystem } from '../models/FileSystem.js'
import { E, GitError } from '../models/GitError.js'
import { expandOidLoose } from '../storage/expandOidLoose.js'
import { expandOidPacked } from '../storage/expandOidPacked.js'
import { readObject } from '../storage/readObject.js'

export async function expandOid ({ fs: _fs, gitdir, oid: short }) {
  const fs = new FileSystem(_fs)
  // Curry the current read method so that the packfile un-deltification
  // process can acquire external ref-deltas.
  const getExternalRefDelta = oid => readObject({ fs: _fs, gitdir, oid })

  const results1 = await expandOidLoose({ fs, gitdir, oid: short })
  const results2 = await expandOidPacked({
    fs,
    gitdir,
    oid: short,
    getExternalRefDelta
  })
  const results = results1.concat(results2)

  if (results.length === 1) {
    return results[0]
  }
  if (results.length > 1) {
    throw new GitError(E.AmbiguousShortOid, {
      short,
      matches: results.join(', ')
    })
  }
  throw new GitError(E.ShortOidNotFound, { short })
}
