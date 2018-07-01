import pako from 'pako'
import path from 'path'

import { FileSystem } from '../models/FileSystem.js'
import { E, GitError } from '../models/GitError.js'
import { GitObject } from '../models/GitObject.js'
import { GitPackIndex } from '../models/GitPackIndex.js'
import { shasum } from '../utils/shasum.js'

const PackfileCache = new Map()

export class GitObjectManager {
  static async read ({ fs: _fs, gitdir, oid, format = 'content' }) {
    const fs = new FileSystem(_fs)
    // Look for it in the loose object directory.
    let file = await fs.read(
      `${gitdir}/objects/${oid.slice(0, 2)}/${oid.slice(2)}`
    )
    let source = `./objects/${oid.slice(0, 2)}/${oid.slice(2)}`
    // Check to see if it's in a packfile.
    if (!file) {
      // Curry the current read method so that the packfile un-deltification
      // process can acquire external ref-deltas.
      const getExternalRefDelta = oid =>
        GitObjectManager.read({ fs: _fs, gitdir, oid })
      // Iterate through all the .pack files
      let list = await fs.readdir(path.join(gitdir, '/objects/pack'))
      list = list.filter(x => x.endsWith('.pack'))
      for (let filename of list) {
        // Try to get the packfile from the in-memory cache
        let p = PackfileCache.get(filename)
        const packFile = `${gitdir}/objects/pack/${filename}`
        if (!p) {
          p = GitObjectManager.loadPack(fs, packFile, getExternalRefDelta)
          PackfileCache.set(filename, p)
        }
        // console.log(p)
        // If the packfile DOES have the oid we're looking for...
        p = await p
        if (p.offsets.has(oid)) {
          // Get the resolved git object from the packfile
          if (!p.pack) {
            p.pack = fs.read(packFile)
          }
          let result = await p.read({ oid, getExternalRefDelta })
          result.source = `./objects/pack/${filename}`
          return result
        }
      }
    }
    // Finally
    if (!file) {
      throw new GitError(E.ReadObjectFail, { oid })
    }
    if (format === 'deflated') {
      return { format: 'deflated', object: file, source }
    }
    let buffer = Buffer.from(pako.inflate(file))
    if (format === 'wrapped') {
      return { format: 'wrapped', object: buffer, source }
    }
    let { type, object } = GitObject.unwrap({ oid, buffer })
    if (format === 'content') return { type, format: 'content', object, source }
  }
  static async loadPack (fs, filename, getExternalRefDelta) {
    // If not there, load it from a .idx file
    const idxName = filename.replace(/pack$/, 'idx')
    if (await fs.exists(idxName)) {
      const idx = await fs.read(idxName)
      return GitPackIndex.fromIdx({ idx, getExternalRefDelta })
    }
    // If the .idx file isn't available, generate one.
    const pack = await fs.read(filename)
    const p = await GitPackIndex.fromPack({ pack, getExternalRefDelta })
    // Save .idx file
    fs.write(idxName, p.toBuffer())
    return p
  }
  static async hash ({ gitdir, type, object }) {
    let buffer = Buffer.concat([
      Buffer.from(type + ' '),
      Buffer.from(object.byteLength.toString()),
      Buffer.from([0]),
      Buffer.from(object)
    ])
    let oid = shasum(buffer)
    return oid
  }

  static async write ({ fs: _fs, gitdir, type, object }) {
    const fs = new FileSystem(_fs)
    let { buffer, oid } = GitObject.wrap({ type, object })
    let file = Buffer.from(pako.deflate(buffer))
    let filepath = `${gitdir}/objects/${oid.slice(0, 2)}/${oid.slice(2)}`
    // Don't overwrite existing git objects - this helps avoid EPERM errors.
    // Although I don't know how we'd fix corrupted objects then. Perhaps delete them
    // on read?
    if (!await fs.exists(filepath)) await fs.write(filepath, file)
    return oid
  }
}
