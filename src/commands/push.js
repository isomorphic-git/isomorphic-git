import { Buffer } from 'buffer'
import { PassThrough } from 'stream'
import pad from 'pad'
import pako from 'pako'
import crypto from 'crypto'
import { config } from './config'
import { GitRefManager, GitObjectManager, GitRemoteHTTP } from '../managers'
import { GitCommit, GitTree, GitPktLine } from '../models'
import { fs as defaultfs, setfs } from '../utils'

const types = {
  commit: 0b0010000,
  tree: 0b0100000,
  blob: 0b0110000,
  tag: 0b1000000
}

/**
 * Push a branch
 *
 * @param {GitRepo} repo - A {@link Git} object matching `{gitdir, fs}`
 * @param {Object} args - Arguments object
 * @param {integer} [args.depth=0] - Determines how much of the git repository's history to retrieve. If not specified it defaults to 0 which means the entire repo history.
 * @param {string} [args.ref=undefined] - Which branch to push. By default this is the currently checked out branch of the repository.
 * @param {string} [args.authUsername=undefined] - The username to use with Basic Auth
 * @param {string} [args.authPassword=undefined] - The password to use with Basic Auth
 * @param {string} [args.url=undefined] - The URL of the remote git server. The default is the value set in the git config for that remote.
 * @param {string} [args.remote='origin'] - If URL is not specified, determines which remote to use.
 * @returns {Promise<void>} - Resolves successfully when push completes
 *
 * @example
 * let repo = new Git({fs, dir: '.'})
 * await push(repo, {
 *   remote: 'origin',
 *   ref: 'master',
 *   authUsername: process.env.GITHUB_TOKEN,
 *   authPassword: process.env.GITHUB_TOKEN
 * })
 */
export async function push (
  { gitdir, fs = defaultfs() },
  { ref, remote, url, authUsername, authPassword }
) {
  setfs(fs)
  // TODO: Figure out how pushing tags works. (This only works for branches.)
  remote = remote || 'origin'
  if (url === undefined) {
    url = await config(
      {
        gitdir
      },
      {
        path: `remote.${remote}.url`
      }
    )
  }
  let fullRef = ref.startsWith('refs/') ? ref : `refs/heads/${ref}`
  let oid = await GitRefManager.resolve({ gitdir, ref })
  let httpRemote = new GitRemoteHTTP(url)
  if (authUsername !== undefined && authPassword !== undefined) {
    httpRemote.auth = {
      username: authUsername,
      password: authPassword
    }
  }
  await httpRemote.preparePush()
  let commits = await listCommits(
    {
      gitdir,
      fs
    },
    {
      start: [oid],
      finish: httpRemote.refs.values()
    }
  )
  let objects = await listObjects({ gitdir, fs }, { oids: commits })
  let packstream = new PassThrough()
  let oldoid =
    httpRemote.refs.get(fullRef) || '0000000000000000000000000000000000000000'
  packstream.write(
    GitPktLine.encode(`${oldoid} ${oid} ${fullRef}\0 report-status\n`)
  )
  packstream.write(GitPktLine.flush())
  pack(
    {
      gitdir,
      fs
    },
    {
      oids: [...objects],
      outputStream: packstream
    }
  )
  let response = await httpRemote.push(packstream)
  return response
}

/**
 * @ignore
 */
export async function listCommits (
  { gitdir, fs = defaultfs() },
  { start, finish }
) {
  setfs(fs)
  let startingSet = new Set()
  let finishingSet = new Set()
  for (let ref of start) {
    startingSet.add(await GitRefManager.resolve({ gitdir, ref }))
  }
  for (let ref of finish) {
    // We may not have these refs locally so we must try/catch
    try {
      let oid = await GitRefManager.resolve({ gitdir, ref })
      finishingSet.add(oid)
    } catch (err) {}
  }
  let visited /*: Set<string> */ = new Set()

  // Because git commits are named by their hash, there is no
  // way to construct a cycle. Therefore we won't worry about
  // setting a default recursion limit.
  async function walk (oid) {
    visited.add(oid)
    let { type, object } = await GitObjectManager.read({ gitdir, oid })
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

/**
 * @ignore
 */
export async function listObjects (
  { gitdir, fs = defaultfs() },
  { oids } /*: { oids: Set<string> } */
) {
  setfs(fs)
  let visited /*: Set<string> */ = new Set()

  // We don't do the purest simplest recursion, because we can
  // avoid reading Blob objects entirely since the Tree objects
  // tell us which oids are Blobs and which are Trees.
  async function walk (oid) {
    visited.add(oid)
    let { type, object } = await GitObjectManager.read({ gitdir, oid })
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

/**
 * @ignore
 */
export async function pack (
  { gitdir, fs = defaultfs() },
  { oids, outputStream }
) {
  setfs(fs)
  let hash = crypto.createHash('sha1')
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
    let { type, object } = await GitObjectManager.read({ gitdir, oid })
    writeObject({ write, object, stype: type })
  }
  // Write SHA1 checksum
  let digest = hash.digest()
  outputStream.end(digest)
  return outputStream
}
