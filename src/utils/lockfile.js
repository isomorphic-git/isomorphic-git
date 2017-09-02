//@flow
// This is modeled after the lockfile strategy used by the git source code.
import fs from 'fs'
import pify from 'pify'
import lockFile from 'lockfile'
import writeFileAtomic from 'write-file-atomic'
const lockfile = pify(lockFile)
const writeAtomic = pify(writeFileAtomic)

class Lockfile {
  /*::
  _filename : string;
  */
  constructor ({filename}) {
    this._filename = filename
  }
  async cancel () {
    console.log('CANCEL', this._filename)
    await lockfile.unlock(`${this._filename}.lock`)
  }
  async update (buffer /*: Buffer */) {
    // TODO: support streams?
    console.log('UPDATE', this._filename)
    try {
      await writeAtomic(this._filename, buffer)
      await lockfile.unlock(`${this._filename}.lock`)
    } catch (err) {
      console.log(err)
      throw err
    }
    console.log('updated', this._filename)
  }
}

export default async function Lock (filename /*: string */) {
  const lockfileOpts = {
    retries: 100,
    retryWait: 100
  }
  // try {
    await lockfile.lock(`${filename}.lock`, lockfileOpts)
    return new Lockfile({filename})
  // } catch (err) {
    // throw new Error(`Unable to create lockfile: ${filename}.lock`)
  // }
}