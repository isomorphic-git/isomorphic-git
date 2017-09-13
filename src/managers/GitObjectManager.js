// @flow
import { Buffer } from 'buffer'
import pako from 'pako'
import shasum from 'shasum'
import read from '../utils/read'
import write from '../utils/write'
import exists from '../utils/exists'

function wrapObject ({ type, object } /*: {type: string, object: Buffer} */) {
  let buffer = Buffer.concat([
    Buffer.from(type + ' '),
    Buffer.from(object.byteLength.toString()),
    Buffer.from([0]),
    Buffer.from(object)
  ])
  let oid = shasum(buffer)
  return {
    oid,
    file: Buffer.from(pako.deflate(buffer))
  }
}

function unwrapObject ({ oid, file } /*: {oid: string, file: Buffer} */) {
  let inflated = Buffer.from(pako.inflate(file))
  if (oid) {
    let sha = shasum(inflated)
    if (sha !== oid) {
      throw new Error(`SHA check failed! Expected ${oid}, computed ${sha}`)
    }
  }
  let s = inflated.indexOf(32) // first space
  let i = inflated.indexOf(0) // first null value
  let type = inflated.slice(0, s).toString('utf8') // get type of object
  let length = inflated.slice(s + 1, i).toString('utf8') // get type of object
  let actualLength = inflated.length - (i + 1)
  // verify length
  if (parseInt(length) !== actualLength) {
    throw new Error(
      `Length mismatch: expected ${length} bytes but got ${actualLength} instead.`
    )
  }
  return {
    type,
    object: Buffer.from(inflated.slice(i + 1))
  }
}

export default class GitObjectManager {
  static async read ({ gitdir, oid } /*: {gitdir: string, oid: string} */) {
    let file = await read(
      `${gitdir}/objects/${oid.slice(0, 2)}/${oid.slice(2)}`
    )
    if (!file) throw new Error(`Git object with oid ${oid} not found`)
    let { type, object } = unwrapObject({ oid, file })
    return { type, object }
  }

  static async write ({ gitdir, type, object }) /*: Promise<string> */ {
    let { file, oid } = wrapObject({ type, object })
    let filepath = `${gitdir}/objects/${oid.slice(0, 2)}/${oid.slice(2)}`
    // Don't overwrite existing git objects - this helps avoid EPERM errors.
    // Although I don't know how we'd fix corrupted objects then. Perhaps delete them
    // on read?
    if (!await exists(filepath)) await write(filepath, file)
    return oid
  } /*: {gitdir: string, type: string, object: Buffer} */
}
