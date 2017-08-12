//@flow
import {Buffer} from 'buffer'
import pako from 'pako'
import shasum from 'shasum'
import read from '../utils/read'
import write from '../utils/write'

function wrapObject ({type, object} /*: {type: string, object: Buffer}*/) {
  let buffer = Buffer.concat([
    Buffer.from(type + ' '),
    Buffer.from(object.length.toString()),
    Buffer.from([0]),
    object,
  ])
  let oid = shasum(buffer)
  return {
    oid,
    file: pako.deflate(buffer)
  }
}

function unwrapObject ({oid, file} /*: {oid: string, file: Buffer}*/) {
  let inflated = Buffer.from(pako.inflate(file))
  if (oid) {
    let sha = shasum(inflated)
    if (sha !== oid) throw new Error(`SHA check failed! Expected ${oid}, computed ${sha}`)
  }
  let i = inflated.indexOf(0) // first null value
  let type = inflated.slice(0, i).toString('utf8') // get type of object
  return {
    type,
    object: Buffer.from(inflated.slice(i+1))
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
