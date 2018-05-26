import pad from 'pad'
import pako from 'pako'
import path from 'path'
import createHash from 'sha.js'
import { PassThrough } from 'stream'

import { GitObjectManager, GitRefManager, GitRemoteManager } from '../managers'
import { FileSystem, GitCommit, GitPktLine, GitTree } from '../models'
import { log, pkg } from '../utils'

import { config } from './config'

const types = {
  commit: 0b0010000,
  tree: 0b0100000,
  blob: 0b0110000,
  tag: 0b1000000,
  ofs_delta: 0b1100000,
  ref_delta: 0b1110000
}

/**
 * Push a branch
 *
 * @link https://isomorphic-git.github.io/docs/push.html
 */
export async function push ({
  dir,
  gitdir = path.join(dir, '.git'),
  fs: _fs,
  emitter,
  ref,
  remote = 'origin',
  url,
  authUsername,
  authPassword
}) {
  const fs = new FileSystem(_fs)
  // TODO: Figure out how pushing tags works. (This only works for branches.)
  if (url === undefined) {
    url = await config({ fs, gitdir, path: `remote.${remote}.url` })
  }
  let fullRef
  if (!ref) {
    ref = await GitRefManager.resolve({ fs, gitdir, ref: 'HEAD', depth: 1 })
    fullRef = ref.replace(/^ref: /, '')
  } else {
    fullRef = ref.startsWith('refs/') ? ref : `refs/heads/${ref}`
  }
  let oid = await GitRefManager.resolve({ fs, gitdir, ref })
  let auth
  if (authUsername !== undefined && authPassword !== undefined) {
    auth = {
      username: authUsername,
      password: authPassword
    }
  }
  let GitRemoteHTTP = GitRemoteManager.getRemoteHelperFor({ url })
  let httpRemote = await GitRemoteHTTP.discover({
    service: 'git-receive-pack',
    url,
    auth
  })
  let commits = await listCommits({
    fs,
    gitdir,
    start: [oid],
    finish: httpRemote.refs.values()
  })
  let objects = await listObjects({ fs, gitdir, oids: commits })
  let packstream = new PassThrough()
  let oldoid =
    httpRemote.refs.get(fullRef) || '0000000000000000000000000000000000000000'
  const capabilities = `report-status side-band-64k agent=git/${pkg.name}@${
    pkg.version
  }`
  packstream.write(
    GitPktLine.encode(`${oldoid} ${oid} ${fullRef}\0 ${capabilities}\n`)
  )
  packstream.write(GitPktLine.flush())
  pack({
    fs,
    gitdir,
    oids: [...objects],
    outputStream: packstream
  })
  let { packfile, progress } = await GitRemoteHTTP.connect({
    service: 'git-receive-pack',
    url,
    auth,
    stream: packstream
  })
  if (emitter) {
    progress.on('data', chunk => {
      let msg = chunk.toString('utf8')
      emitter.emit('message', msg)
    })
  }
  let result = {}
  // Parse the response!
  let response = ''
  let read = GitPktLine.streamReader(packfile)
  let line = await read()
  while (line !== true) {
    if (line !== null) response += line.toString('utf8') + '\n'
    line = await read()
  }

  let lines = response.toString('utf8').split('\n')
  // We're expecting "unpack {unpack-result}"
  line = lines.shift()
  if (!line.startsWith('unpack ')) {
    throw new Error(
      `Unparsable response from server! Expected 'unpack ok' or 'unpack [error message]' but got '${line}'`
    )
  }
  if (line === 'unpack ok') {
    result.ok = ['unpack']
  } else {
    result.errors = [line.trim()]
  }
  for (let line of lines) {
    let status = line.slice(0, 2)
    let refAndMessage = line.slice(3)
    if (status === 'ok') {
      result.ok = result.ok || []
      result.ok.push(refAndMessage)
    } else if (status === 'ng') {
      result.errors = result.errors || []
      result.errors.push(refAndMessage)
    }
  }
  log(result)
  return result
}

export async function listCommits ({
  dir,
  gitdir = path.join(dir, '.git'),
  fs: _fs,
  start,
  finish
}) {
  const fs = new FileSystem(_fs)
  let startingSet = new Set()
  let finishingSet = new Set()
  for (let ref of start) {
    startingSet.add(await GitRefManager.resolve({ fs, gitdir, ref }))
  }
  for (let ref of finish) {
    // We may not have these refs locally so we must try/catch
    try {
      let oid = await GitRefManager.resolve({ fs, gitdir, ref })
      finishingSet.add(oid)
    } catch (err) {}
  }
  let visited = new Set()

  // Because git commits are named by their hash, there is no
  // way to construct a cycle. Therefore we won't worry about
  // setting a default recursion limit.
  async function walk (oid) {
    visited.add(oid)
    let { type, object } = await GitObjectManager.read({ fs, gitdir, oid })
    if (type !== 'commit') {
      throw new Error(`Expected type commit but type is ${type}`)
    }
    let commit = GitCommit.from(object)
    let parents = commit.headers().parent
    for (oid of parents) {
      if (!finishingSet.has(oid) && !visited.has(oid)) {
        await walk(oid)
      }
    }
  }

  // Let's go walking!
  for (let oid of startingSet) {
    await walk(oid)
  }
  return visited
}

export async function listObjects ({
  dir,
  gitdir = path.join(dir, '.git'),
  fs: _fs,
  oids
}) {
  const fs = new FileSystem(_fs)
  let visited = new Set()

  // We don't do the purest simplest recursion, because we can
  // avoid reading Blob objects entirely since the Tree objects
  // tell us which oids are Blobs and which are Trees.
  async function walk (oid) {
    visited.add(oid)
    let { type, object } = await GitObjectManager.read({ fs, gitdir, oid })
    if (type === 'commit') {
      let commit = GitCommit.from(object)
      let tree = commit.headers().tree
      await walk(tree)
    } else if (type === 'tree') {
      let tree = GitTree.from(object)
      for (let entry of tree) {
        visited.add(entry.oid)
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
  return visited
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
