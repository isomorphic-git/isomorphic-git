import path from 'path'
import { PassThrough } from 'stream'
import pad from 'pad'
import pako from 'pako'
import createHash from 'sha.js'

import { log } from './log'

import { GitObjectManager } from '../managers'
import { FileSystem, GitCommit, GitTree } from '../models'

const types = {
  commit: 0b0010000,
  tree: 0b0100000,
  blob: 0b0110000,
  tag: 0b1000000,
  ofs_delta: 0b1100000,
  ref_delta: 0b1110000
}

/**
 * Create a packfile stream
 *
 * @link https://isomorphic-git.github.io/docs/packObjects.html
 */
export async function packObjects ({
  dir,
  gitdir = path.join(dir, '.git'),
  fs: _fs,
  emitter,
  refs,
  depth,
  since,
  exclude,
  relative,
  tags
}) {
  const fs = new FileSystem(_fs)
  let oids = new Set()
  for (const ref of refs) {
    let commits = await log({
      dir,
      gitdir,
      fs,
      emitter,
      ref,
      depth,
      since
    })
    for (const commit of commits) {
      oids.add(commit.oid)
    }
  }
  let objects = await listObjects({ fs, gitdir, oids })
  let packstream = new PassThrough()
  pack({
    fs,
    gitdir,
    oids: [...objects],
    outputStream: packstream
  })
  return { packstream }
}

export async function listObjects ({
  dir,
  gitdir = path.join(dir, '.git'),
  fs: _fs,
  oids
}) {
  const fs = new FileSystem(_fs)
  let commits = new Set()
  let trees = new Set()
  let blobs = new Set()

  // We don't do the purest simplest recursion, because we can
  // avoid reading Blob objects entirely since the Tree objects
  // tell us which oids are Blobs and which are Trees. And we
  // do not need to recurse through commit parents.
  async function walk (oid) {
    let { type, object } = await GitObjectManager.read({ fs, gitdir, oid })
    if (type === 'commit') {
      commits.add(oid)
      let commit = GitCommit.from(object)
      let tree = commit.headers().tree
      await walk(tree)
    } else if (type === 'tree') {
      trees.add(oid)
      let tree = GitTree.from(object)
      for (let entry of tree) {
        if (entry.type === 'blob') {
          blobs.add(entry.oid)
        }
        // only recurse for trees
        if (entry.type === 'tree') {
          await walk(entry.oid)
        }
      }
    }
  }

  // Let's go walking!
  for (let oid of oids) {
    await walk(oid)
  }
  return [...commits, ...trees, ...blobs]
}

export async function pack ({
  dir,
  gitdir = path.join(dir, '.git'),
  fs: _fs,
  oids,
  outputStream
}) {
  const fs = new FileSystem(_fs)
  let hash = createHash('sha1')
  function write (chunk, enc) {
    outputStream.write(chunk, enc)
    hash.update(chunk, enc)
  }
  function writeObject ({ stype, object }) {
    let lastFour, multibyte, length
    // Object type is encoded in bits 654
    let type = types[stype]
    if (type === undefined) throw new Error('Unrecognized type: ' + stype)
    // The length encoding get complicated.
    length = object.length
    // Whether the next byte is part of the variable-length encoded number
    // is encoded in bit 7
    multibyte = length > 0b1111 ? 0b10000000 : 0b0
    // Last four bits of length is encoded in bits 3210
    lastFour = length & 0b1111
    // Discard those bits
    length = length >>> 4
    // The first byte is then (1-bit multibyte?), (3-bit type), (4-bit least sig 4-bits of length)
    let byte = (multibyte | type | lastFour).toString(16)
    write(byte, 'hex')
    // Now we keep chopping away at length 7-bits at a time until its zero,
    // writing out the bytes in what amounts to little-endian order.
    while (multibyte) {
      multibyte = length > 0b01111111 ? 0b10000000 : 0b0
      byte = multibyte | (length & 0b01111111)
      write(pad(2, byte.toString(16), '0'), 'hex')
      length = length >>> 7
    }
    // Lastly, we can compress and write the object.
    write(Buffer.from(pako.deflate(object)))
  }

  write('PACK')
  write('00000002', 'hex')
  // Write a 4 byte (32-bit) int
  write(pad(8, oids.length.toString(16), '0'), 'hex')
  for (let oid of oids) {
    let { type, object } = await GitObjectManager.read({ fs, gitdir, oid })
    writeObject({ write, object, stype: type })
  }
  // Write SHA1 checksum
  let digest = hash.digest()
  outputStream.end(digest)
  return outputStream
}
