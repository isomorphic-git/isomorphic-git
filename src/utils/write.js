// @flow
import path from 'path'
import pify from 'pify'
import { mkdir } from './mkdirs'
import fs from 'fs'
// An async writeFile variant that automatically creates missing directories,
// and returns null instead of throwing errors.
export default async function write (
  filepath /*: string */,
  contents /*: string|Buffer */
) {
  try {
    await pify(fs.writeFile)(filepath, contents)
    return
  } catch (err) {
    // Hmm. Let's try mkdirp and try again.
    await mkdir(path.dirname(filepath))
    await pify(fs.writeFile)(filepath, contents)
  }
}
