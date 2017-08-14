//@flow
import {Buffer} from 'buffer'
import pako from 'pako'
import shasum from 'shasum'
import read from '../utils/read'
import write from '../utils/write'

function wrapObject ({type, object} /*: {type: string, object: Buffer}*/) {
  let buffer = Buffer.concat([
    Buffer.from(type + ' '),
    Buffer.from(object.byteLength.toString()),
    Buffer.from([0]),
    Buffer.from(object),
  ])
  let oid = shasum(buffer)
  return {
    oid,
    file: Buffer.from(pako.deflate(buffer))
  }
}

function unwrapObject ({oid, file} /*: {oid: string, file: Buffer}*/) {
  let inflated = Buffer.from(pako.inflate(file))
  if (oid) {
    let sha = shasum(inflated)
    if (sha !== oid) throw new Error(`SHA check failed! Expected ${oid}, computed ${sha}`)
  }
  let s = inflated.indexOf(32) // first space
  let i = inflated.indexOf(0) // first null value
  let type = inflated.slice(0, s).toString('utf8') // get type of object
  console.log(`type = '${type}' ${type.length}`)
  let length = inflated.slice(s+1, i).toString('utf8') // get type of object
  console.log(`length = '${length}' ${length.length}`)
  let actualLength = inflated.length - (i + 1)
  // verify length
  if (parseInt(length) !== actualLength) throw new Error(`Length mismatch: expected ${length} bytes but got ${actualLength} instead.`)
  return {
    type,
    object: Buffer.from(inflated.slice(i + 1))
  }
}

export default class GitObject {
  
  static async read ({dir, oid} /*: {dir: string, oid: string}*/) {
    let file = await read(`${dir}/.git/objects/${oid.slice(0, 2)}/${oid.slice(2)}`)
    if (!file) throw new Error(`Git object with oid ${oid} not found`)
    let {type, object} = unwrapObject({oid, file})
    return {type, object}
  }
  
  static async write ({dir, type, object} /*: {dir: string, type: string, object: Buffer}*/) {
    let {file, oid} = wrapObject({type, object})
    await write(`${dir}/.git/objects/${oid.slice(0, 2)}/${oid.slice(2)}`, file)
    return oid
  }

}
