import path from 'path'
import { Buffer } from 'buffer'
import { PassThrough } from 'stream'
import pad from 'pad'
import pako from 'pako'
import createHash from 'sha.js'
import { config } from './config'
import { GitRefManager, GitObjectManager, GitRemoteHTTP } from '../managers'
import { FileSystem, GitCommit, GitTree, GitPktLine } from '../models'

const types = {
  commit: 0b0010000,
  tree: 0b0100000,
  blob: 0b0110000,
  tag: 0b1000000,
  ofs_delta: 0b1100000,
  ref_delta: 0b1110000
}

/**
 *
 * If there were no errors, then there will be no `errors` property.
 * There can be a mix of `ok` messages and `errors` messages.
 *
 * @typedef {Object} PushResponse
 * @property {Array<string>} [ok] - The first item is "unpack" if the overall operation was successful. The remaining items are the names of refs that were updated successfully.
 * @property {Array<string>} [errors] - If the overall operation threw and error, the first item will be "unpack {Overall error message}". The remaining items are individual refs that failed to be updated in the format "{ref name} {error message}".
 */

/**
 * Push a branch
 *
 * @param {Object} args - Arguments object
 * @param {FSModule} args.fs - The filesystem holding the git repo
 * @param {string} args.dir - The path to the [working tree](index.html#dir-vs-gitdir) directory
 * @param {string} [args.gitdir=path.join(dir, '.git')] - The path to the [git directory](index.html#dir-vs-gitdir)
 * @param {string} [args.ref=undefined] - Which branch to push. By default this is the currently checked out branch of the repository.
 * @param {string} [args.remote='origin'] - If URL is not specified, determines which remote to use.
 * @param {string} [args.url=undefined] - The URL of the remote git server. The default is the value set in the git config for that remote.
 * @param {string} [args.authUsername=undefined] - The username to use with Basic Auth
 * @param {string} [args.authPassword=undefined] - The password to use with Basic Auth
 * @returns {Promise<PushResponse>} - Resolves successfully when push completes with a detailed description of the operation from the server.
 *
 * @example
 * let repo = {fs, dir: '<@.@>'}
 * let pushResponse = await git.push({
 *   ...repo,
 *   remote: '<@origin@>',
 *   ref: '<@master@>',
 *   authUsername: <@process.env.GITHUB_TOKEN@>,
 *   authPassword: <@process.env.GITHUB_TOKEN@>
 * })
 * console.log(pushResponse)
 */
export async function push ({
  fs: _fs,
  dir,
  gitdir = path.join(dir, '.git'),
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
  let fullRef = ref.startsWith('refs/') ? ref : `refs/heads/${ref}`
  let oid = await GitRefManager.resolve({ fs, gitdir, ref })
  let httpRemote = new GitRemoteHTTP(url)
  if (authUsername !== undefined && authPassword !== undefined) {
    httpRemote.auth = {
      username: authUsername,
      password: authPassword
    }
  }
  await httpRemote.preparePush()
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
  packstream.write(
    GitPktLine.encode(`${oldoid} ${oid} ${fullRef}\0 report-status\n`)
  )
  packstream.write(GitPktLine.flush())
  pack({
    fs,
    gitdir,
    oids: [...objects],
    outputStream: packstream
  })
  let response = await httpRemote.push(packstream)
  return response
}

/** @ignore */
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
  let visited /*: Set<string> */ = new Set()

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

/** @ignore */
export async function listObjects ({
  dir,
  gitdir = path.join(dir, '.git'),
  fs: _fs,
  oids
}) {
  const fs = new FileSystem(_fs)
  let visited /*: Set<string> */ = new Set()

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
      for (let entry /*: TreeEntry */ of tree) {
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

/** @ignore */
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
