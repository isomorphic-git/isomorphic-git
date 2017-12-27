import path from 'path'
import { Buffer } from 'buffer'
import { PassThrough } from 'stream'
import through2 from 'through2'
import listpack from 'git-list-pack'
import peek from 'buffer-peek-stream'
import applyDelta from 'git-apply-delta'
import marky from 'marky'
import { config } from './config'
import {
  GitRemoteHTTP,
  GitRefManager,
  GitShallowManager,
  GitObjectManager
} from '../managers'
import { FileSystem, GitPktLine } from '../models'
import { pkg } from '../utils'

/**
 * Fetch commits
 *
 * @param {Object} args - Arguments object
 * @param {FSModule} args.fs - The filesystem holding the git repo
 * @param {string} args.dir - The path to the [working tree](index.html#dir-vs-gitdir) directory
 * @param {string} [args.gitdir=path.join(dir, '.git')] - The path to the [git directory](index.html#dir-vs-gitdir)
 * @param {string} [args.url=undefined] - The URL of the remote git server. The default is the value set in the git config for that remote.
 * @param {string} [args.remote='origin'] - If `url` is not specified, determines which remote to use.
 * @param {string} [args.ref=undefined] - Which branch to fetch from. By default this is the currently checked out branch.
 * @param {string} [args.authUsername=undefined] - The username to use with Basic Auth
 * @param {string} [args.authPassword=undefined] - The password to use with Basic Auth
 * @param {integer} [args.depth=undefined] - Determines how much of the git repository's history to retrieve.
 * @param {Date} [args.since=undefined] - Only fetch commits created after the given date. Mutually exclusive with `depth`.
 * @param {string[]} [args.exclude=[]] - A list of branches or tags. Instructs the remote server not to send us any commits reachable from these refs.
 * @param {boolean} [args.relative=false] - Changes the meaning of `depth` to be measured from the current shallow depth rather than from the branch tip.
 * @param {Function} [args.onprogress=undefined] - Callback to receive [ProgressEvent](https://developer.mozilla.org/en-US/docs/Web/API/ProgressEvent)s for the operation.
 * @returns {Promise<void>} - Resolves successfully when clone completes
 *
 * @example
 * let repo = {fs, dir: '.'}
 * await fetch({
 *   ...repo,
 *   url: 'https://cors-buster-jfpactjnem.now.sh/github.com/wmhilton/isomorphic-git',
 *   depth: 1
 * })
 */
export async function fetch ({
  dir,
  gitdir = path.join(dir, '.git'),
  fs,
  ref = 'HEAD',
  remote,
  url,
  authUsername,
  authPassword,
  depth,
  since,
  exclude,
  relative,
  onprogress
}) {
  let response = await fetchPackfile({
    gitdir,
    fs,
    ref,
    remote,
    url,
    authUsername,
    authPassword,
    depth,
    since,
    exclude,
    relative
  })
  await unpack({ fs, gitdir, inputStream: response.packfile, onprogress })
}

async function fetchPackfile ({
  gitdir,
  fs: _fs,
  ref,
  remote,
  url,
  authUsername,
  authPassword,
  depth = null,
  since = null,
  exclude = [],
  relative = false
}) {
  const fs = new FileSystem(_fs)
  if (depth !== null) {
    if (Number.isNaN(parseInt(depth))) {
      throw new Error(`Invalid value for depth argument: ${depth}`)
    }
    depth = parseInt(depth)
  }
  remote = remote || 'origin'
  if (url === undefined) {
    url = await config({
      fs,
      gitdir,
      path: `remote.${remote}.url`
    })
  }
  let remoteHTTP = new GitRemoteHTTP(url)
  if (authUsername !== undefined && authPassword !== undefined) {
    remoteHTTP.auth = {
      username: authUsername,
      password: authPassword
    }
  }
  await remoteHTTP.preparePull()
  // Check server supports shallow cloning
  if (depth !== null && !remoteHTTP.capabilities.has('shallow')) {
    throw new Error(`Remote does not support shallow fetches`)
  }
  if (since !== null && !remoteHTTP.capabilities.has('deepen-since')) {
    throw new Error(`Remote does not support shallow fetches by date`)
  }
  if (exclude.length > 0 && !remoteHTTP.capabilities.has('deepen-not')) {
    throw new Error(
      `Remote does not support shallow fetches excluding commits reachable by refs`
    )
  }
  if (relative === true && !remoteHTTP.capabilities.has('deepen-relative')) {
    throw new Error(
      `Remote does not support shallow fetches relative to the current shallow depth`
    )
  }
  await GitRefManager.updateRemoteRefs({
    fs,
    gitdir,
    remote,
    refs: remoteHTTP.refs,
    symrefs: remoteHTTP.symrefs
  })
  let want = await GitRefManager.resolve({
    fs,
    gitdir,
    ref: `refs/remotes/${remote}/${ref}`
  })
  // Note: I removed "ofs-delta" from the capabilities list and now
  // Github uses all ref-deltas when I fetch packfiles instead of all ofs-deltas. Nice!
  const capabilities = `multi_ack_detailed no-done side-band-64k thin-pack agent=git/${pkg.name}@${pkg.version}${relative
    ? ' deepen-relative'
    : ''}`
  let packstream = new PassThrough()
  packstream.write(GitPktLine.encode(`want ${want} ${capabilities}\n`))
  let oids = await GitShallowManager.read({ fs, gitdir })
  if (oids.size > 0 && remoteHTTP.capabilities.has('shallow')) {
    for (let oid of oids) {
      packstream.write(GitPktLine.encode(`shallow ${oid}\n`))
    }
  }
  if (depth !== null) {
    packstream.write(GitPktLine.encode(`deepen ${depth}\n`))
  }
  if (since !== null) {
    packstream.write(
      GitPktLine.encode(`deepen-since ${Math.floor(since.valueOf() / 1000)}\n`)
    )
  }
  for (let x of exclude) {
    packstream.write(GitPktLine.encode(`deepen-not ${x}\n`))
  }
  packstream.write(GitPktLine.flush())
  let have = null
  try {
    have = await GitRefManager.resolve({ fs, gitdir, ref })
  } catch (err) {}
  if (have) {
    packstream.write(GitPktLine.encode(`have ${have}\n`))
    packstream.write(GitPktLine.flush())
  }
  packstream.end(GitPktLine.encode(`done\n`))
  let response = await remoteHTTP.pull(packstream)
  response.packetlines.pipe(
    through2(async (data, enc, next) => {
      let line = data.toString('utf8')
      if (line.startsWith('shallow')) {
        let oid = line.slice(-41).trim()
        if (oid.length !== 40) {
          throw new Error(`non-40 character 'shallow' oid: ${oid}`)
        }
        oids.add(oid)
        await GitShallowManager.write({ fs, gitdir, oids })
      } else if (line.startsWith('unshallow')) {
        let oid = line.slice(-41).trim()
        if (oid.length !== 40) {
          throw new Error(`non-40 character 'shallow' oid: ${oid}`)
        }
        oids.delete(oid)
        await GitShallowManager.write({ fs, gitdir, oids })
      }
      next(null, data)
    })
  )
  return response
}

const types = {
  1: 'commit',
  2: 'tree',
  3: 'blob',
  4: 'tag',
  6: 'ofs-delta',
  7: 'ref-delta'
}

function parseVarInt (buffer /*: Buffer */) {
  let n = 0
  for (var i = 0; i < buffer.byteLength; i++) {
    n = (buffer[i] & 0b01111111) + (n << 7)
    if ((buffer[i] & 0b10000000) === 0) {
      if (i !== buffer.byteLength - 1) throw new Error('Invalid varint buffer')
      return n
    }
  }
  throw new Error('Invalid varint buffer')
}

/**
 * @ignore
 * @param {Object} args - Arguments object
 * @param {FSModule} args.fs - The filesystem holding the git repo
 * @param {string} args.dir - The path to the [working tree](index.html#dir-vs-gitdir) directory
 * @param {string} [args.gitdir=path.join(dir, '.git')] - The path to the [git directory](index.html#dir-vs-gitdir)
 * @param {ReadableStream} args.inputStream
 * @param {Function} args.onprogress
 */
export async function unpack ({
  dir,
  gitdir = path.join(dir, '.git'),
  fs: _fs,
  inputStream,
  onprogress
}) {
  const fs = new FileSystem(_fs)
  return new Promise(function (resolve, reject) {
    // Read header
    peek(inputStream, 12, (err, data, inputStream) => {
      if (err) return reject(err)
      let iden = data.slice(0, 4).toString('utf8')
      if (iden !== 'PACK') {
        throw new Error(`Packfile started with '${iden}'. Expected 'PACK'`)
      }
      let ver = data.slice(4, 8).toString('hex')
      if (ver !== '00000002') {
        throw new Error(`Unknown packfile version '${ver}'. Expected 00000002.`)
      }
      // Read a 4 byte (32-bit) int
      let numObjects = data.readInt32BE(8)
      if (onprogress !== undefined) {
        onprogress({ loaded: 0, total: numObjects, lengthComputable: true })
      }
      if (numObjects === 0) return resolve()
      // And on our merry way
      let totalTime = 0
      let totalApplyDeltaTime = 0
      let totalWriteFileTime = 0
      let totalReadFileTime = 0
      let offsetMap = new Map()
      inputStream
        .pipe(listpack())
        .pipe(
          through2.obj(
            async ({ data, type, reference, offset, num }, enc, next) => {
              type = types[type]
              marky.mark(`${type} #${num} ${data.length}B`)
              if (type === 'ref-delta') {
                let oid = Buffer.from(reference).toString('hex')
                try {
                  marky.mark(`readFile`)
                  let { object, type } = await GitObjectManager.read({
                    fs,
                    gitdir,
                    oid
                  })
                  totalReadFileTime += marky.stop(`readFile`).duration
                  marky.mark(`applyDelta`)
                  let result = applyDelta(data, object)
                  totalApplyDeltaTime += marky.stop(`applyDelta`).duration
                  marky.mark(`writeFile`)
                  let newoid = await GitObjectManager.write({
                    fs,
                    gitdir,
                    type,
                    object: result
                  })
                  totalWriteFileTime += marky.stop(`writeFile`).duration
                  // console.log(`${type} ${newoid} ref-delta ${oid}`)
                  offsetMap.set(offset, newoid)
                } catch (err) {
                  throw new Error(
                    `Could not find object ${reference} ${oid} that is referenced by a ref-delta object in packfile at byte offset ${offset}.`
                  )
                }
              } else if (type === 'ofs-delta') {
                // Note: this might be not working because offsets might not be
                // guaranteed to be on object boundaries? In which case we'd need
                // to write the packfile to disk first, I think.
                // For now I've "solved" it by simply not advertising ofs-delta as a capability
                // during the HTTP request, so Github will only send ref-deltas not ofs-deltas.
                let absoluteOffset = offset - parseVarInt(reference)
                let referenceOid = offsetMap.get(absoluteOffset)
                // console.log(`${offset} ofs-delta ${absoluteOffset} ${referenceOid}`)
                let { type, object } = await GitObjectManager.read({
                  fs,
                  gitdir,
                  oid: referenceOid
                })
                let result = applyDelta(data, object)
                let oid = await GitObjectManager.write({
                  fs,
                  gitdir,
                  type,
                  object: result
                })
                // console.log(`${offset} ${type} ${oid} ofs-delta ${referenceOid}`)
                offsetMap.set(offset, oid)
              } else {
                marky.mark(`writeFile`)
                let oid = await GitObjectManager.write({
                  fs,
                  gitdir,
                  type,
                  object: data
                })
                totalWriteFileTime += marky.stop(`writeFile`).duration
                // console.log(`${offset} ${type} ${oid}`)
                offsetMap.set(offset, oid)
              }
              if (onprogress !== undefined) {
                onprogress({
                  loaded: numObjects - num,
                  total: numObjects,
                  lengthComputable: true
                })
              }
              let perfentry = marky.stop(`${type} #${num} ${data.length}B`)
              totalTime += perfentry.duration
              if (num === 0) {
                console.log(`Total time unpacking objects: ${totalTime}`)
                console.log(
                  `Total time applying deltas: ${totalApplyDeltaTime}`
                )
                console.log(`Total time reading files: ${totalReadFileTime}`)
                console.log(`Total time writing files: ${totalWriteFileTime}`)
                return resolve()
              }
              next(null)
            }
          )
        )
        .on('error', reject)
        .on('finish', resolve)
    })
  })
}
