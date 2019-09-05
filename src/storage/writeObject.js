import pako from 'pako'

import { FileSystem } from '../models/FileSystem.js'
import { GitObject } from '../models/GitObject.js'
import { writeObjectLoose } from '../storage/writeObjectLoose.js'
import { shasum } from '../utils/shasum.js'

export async function writeObject ({
  fs: _fs,
  gitdir,
  type,
  object,
  format = 'content',
  oid = undefined,
  dryRun = false
}) {
  if (format !== 'deflated') {
    if (format !== 'wrapped') {
      object = GitObject.wrap({ type, object })
    }
    oid = shasum(object)
    object = Buffer.from(pako.deflate(object))
  }
  if (!dryRun) {
    const fs = new FileSystem(_fs)
    await writeObjectLoose({ fs, gitdir, object, format: 'deflated', oid })
  }
  return oid
}
