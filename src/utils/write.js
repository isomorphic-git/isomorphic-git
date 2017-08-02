//@flow
import path from 'path'
import pify from 'pify'
import {mkdir} from './mkdirs'
import fs from 'fs'

export default async function write (filepath /*: string */, contents /*: string | buffer */) {
  try {
    await pify(fs.writeFile)(filepath, contents)
    return
  } catch (err) {
    // Hmm. Let's try mkdirp and try again.
    await mkdir(path.dirname(filepath))
    await pify(fs.writeFile)(filepath, contents)
    return
  }
}

