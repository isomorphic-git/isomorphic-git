// @flow
// This is modeled after the lockfile strategy used by the git source code.
import pify from 'pify'
import lockFile from 'lockfile'
import writeFileAtomic from 'write-file-atomic'
const lockfile = pify(lockFile)
const writeAtomic = pify(writeFileAtomic)

class Lockfile {
  /*::
  _filename : string;
  */
  constructor ({ filename }) {
    this._filename = filename
  }
  async cancel () {
    console.log(`${this._filename}.lock`, 'unlocking...')
    await lockfile.unlock(`${this._filename}.lock`)
    console.log(`${this._filename}.lock`, 'unlocked.')
  }
  async update (buffer /*: Buffer */) {
    // TODO: support streams?
    try {
      console.log(this._filename, 'updating...')
      await writeAtomic(this._filename, buffer)
      console.log(this._filename, 'updated.')
      console.log(`${this._filename}.lock`, 'unlocking...')
      await lockfile.unlock(`${this._filename}.lock`)
      console.log(`${this._filename}.lock`, 'unlocked.')
    } catch (err) {
      console.log(err)
      throw err
    }
  }
}

export default async function Lock (filename /*: string */) {
  const lockfileOpts = {
    retries: 100,
    retryWait: 100
  }
  console.log(`${filename}.lock`, 'locking...')
  await lockfile.lock(`${filename}.lock`, lockfileOpts)
  console.log(`${filename}.lock`, 'locked.')
  return new Lockfile({ filename })
}
