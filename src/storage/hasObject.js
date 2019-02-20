import { FileSystem } from '../models/FileSystem.js'
import { hasObjectLoose } from '../storage/hasObjectLoose.js'
import { hasObjectPacked } from '../storage/hasObjectPacked.js'
import { readObject } from '../storage/readObject.js'

export async function hasObject ({ fs: _fs, gitdir, oid, format = 'content' }) {
  const fs = new FileSystem(_fs)
  // Curry the current read method so that the packfile un-deltification
  // process can acquire external ref-deltas.
  const getExternalRefDelta = oid => readObject({ fs, gitdir, oid })

  // Look for it in the loose object directory.
  let result = await hasObjectLoose({ fs, gitdir, oid })
  // Check to see if it's in a packfile.
  if (!result) {
    result = await hasObjectPacked({ fs, gitdir, oid, getExternalRefDelta })
  }
  // Finally
  return result
}
