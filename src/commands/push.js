// @flow
import stream from 'stream'
import { config } from './config'
import { pack } from './pack'
import { GitRefManager, GitObjectManager, GitRemoteHTTP } from '../managers'
import { GitCommit, GitTree, GitPktLine } from '../models'

export async function listCommits (
  {
    gitdir,
    start,
    finish
  } /*: {
  gitdir: string,
  start: Array<string>,
  finish: Array<string>
} */
) {
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
  let visited = new Set() /*: Set<string> */

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

export async function listObjects (
  { gitdir, oids } /*: {
  gitdir: string,
  oids: Array<string>
} */
) {
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

export async function push ({
  gitdir,
  ref,
  remote,
  url,
  authUsername,
  authPassword
}) {
  // TODO: Figure out how pushing tags works. (This only works for branches.)
  remote = remote || 'origin'
  if (url === undefined) {
    url = await config({
      gitdir,
      path: `remote.${remote}.url`
    })
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
  let commits = await listCommits({
    gitdir,
    start: [oid],
    finish: httpRemote.refs.values()
  })
  let objects = await listObjects({ gitdir, oids: commits })
  let packstream = new stream.PassThrough()
  let oldoid =
    httpRemote.refs.get(fullRef) || '0000000000000000000000000000000000000000'
  packstream.write(
    GitPktLine.encode(`${oldoid} ${oid} ${fullRef}\0 report-status\n`)
  )
  packstream.write(GitPktLine.flush())
  pack({
    gitdir,
    oids: [...objects],
    outputStream: packstream
  })
  let response = await httpRemote.push(packstream)
  return response
}
