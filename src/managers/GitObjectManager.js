import pako from 'pako'
import path from 'path'
import shasum from 'shasum'

import { FileSystem, GitObject, GitPackIndex } from '../models'

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
        if (!p) {
          // If not there, load it from a .idx file
          const idxName = filename.replace(/pack$/, 'idx')
          if (await fs.exists(`${gitdir}/objects/pack/${idxName}`)) {
            const idx = await fs.read(`${gitdir}/objects/pack/${idxName}`)
            p = await GitPackIndex.fromIdx({ idx, getExternalRefDelta })
          } else {
            // If the .idx file isn't available, generate one.
            const pack = await fs.read(`${gitdir}/objects/pack/${filename}`)
            p = await GitPackIndex.fromPack({ pack, getExternalRefDelta })
            // Save .idx file
            await fs.write(`${gitdir}/objects/pack/${idxName}`, p.toBuffer())
          }
          PackfileCache.set(filename, p)
        }
        // console.log(p)
        // If the packfile DOES have the oid we're looking for...
        if (p.hashes.includes(oid)) {
          // Make sure the packfile is loaded in memory
          if (!p.pack) {
            const pack = await fs.read(`${gitdir}/objects/pack/${filename}`)
            await p.load({ pack })
          }
          // Get the resolved git object from the packfile
          let result = await p.read({ oid, getExternalRefDelta })
          result.source = `./objects/pack/${filename}`
          return result
        }
      }
    }
    // Check to see if it's in shallow commits.
    if (!file) {
      let text = await fs.read(`${gitdir}/shallow`, { encoding: 'utf8' })
      if (text !== null && text.includes(oid)) {
        throw new Error(
          `GitObjectManager.js:64 E33 Failed to read git object with oid ${oid} because it is a shallow commit`
        )
      }
    }
    // Finally
    if (!file) {
      throw new Error(`GitObjectManager.js:70 E34 Failed to read git object with oid ${oid}`)
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
