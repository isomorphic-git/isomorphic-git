import path from 'path'

import { FileSystem } from '../models/FileSystem.js'
import { E, GitError } from '../models/GitError.js'
import { GitPackIndex } from '../models/GitPackIndex.js'

const PackfileCache = new Map()

export async function read ({ fs: _fs, gitdir, oid, format = 'content', getExternalRefDelta }) {
  const fs = new FileSystem(_fs)
  // Check to see if it's in a packfile.
  // Iterate through all the .pack files
  let list = await fs.readdir(path.join(gitdir, '/objects/pack'))
  list = list.filter(x => x.endsWith('.pack'))
  for (let filename of list) {
    // Try to get the packfile from the in-memory cache
    let p = PackfileCache.get(filename)
    const packFile = `${gitdir}/objects/pack/${filename}`
    if (!p) {
      p = loadPack(fs, packFile, getExternalRefDelta)
      PackfileCache.set(filename, p)
    }
    // If the packfile DOES have the oid we're looking for...
    p = await p
    if (p.error) throw new GitError(E.InternalFail, { message: p.error })
    if (p.offsets.has(oid)) {
      // Get the resolved git object from the packfile
      if (!p.pack) {
        p.pack = fs.read(packFile)
      }
      let result = await p.read({ oid, getExternalRefDelta })
      result.format = 'content'
      result.source = `objects/pack/${filename}`
      return result
    }
  }
  // Failed to find it
  return null
}

export async function expandOid ({ fs: _fs, gitdir, oid: short, getExternalRefDelta }) {
  const fs = new FileSystem(_fs)
  // Iterate through all the .pack files
  let results = []
  let list = await fs.readdir(path.join(gitdir, '/objects/pack'))
  list = list.filter(x => x.endsWith('.pack'))
  for (let filename of list) {
    // Try to get the packfile from the in-memory cache
    let p = PackfileCache.get(filename)
    const packFile = `${gitdir}/objects/pack/${filename}`
    if (!p) {
      p = loadPack(fs, packFile, getExternalRefDelta)
      PackfileCache.set(filename, p)
    }
    p = await p
    if (p.error) throw new GitError(E.InternalFail, { message: p.error })
    // Search through the list of oids in the packfile
    for (let oid of p.offsets.keys()) {
      if (oid.startsWith(short)) results.push(oid)
    }
  }
  return results
}

export async function write ({ fs: _fs, gitdir, type, object, format, oid }) {
  // Not supported
}

async function loadPack (fs, filename, getExternalRefDelta) {
  // If not there, load it from a .idx file
  const idxName = filename.replace(/pack$/, 'idx')
  if (await fs.exists(idxName)) {
    const idx = await fs.read(idxName)
    return GitPackIndex.fromIdx({ idx, getExternalRefDelta })
  }
  // If the .idx file isn't available, generate one.
  const pack = await fs.read(filename)
  // Sanity check. 12 byte header + 20 byte shasum
  if (pack.length < 32) {
    return { error: `Unable to load packfile ${filename}. It's suspiciously short - try deleting it; it may be corrupt.` }
  }
  const p = await GitPackIndex.fromPack({ pack, getExternalRefDelta })
  // Save .idx file
  fs.write(idxName, p.toBuffer())
  return p
}
