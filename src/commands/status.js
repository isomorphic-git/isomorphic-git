import path from 'path'

import { GitIgnoreManager } from '../managers/GitIgnoreManager.js'
import { GitIndexManager } from '../managers/GitIndexManager.js'
import { GitRefManager } from '../managers/GitRefManager.js'
import { FileSystem } from '../models/FileSystem.js'
import { GitCommit } from '../models/GitCommit.js'
import { E, GitError } from '../models/GitError.js'
import { GitTree } from '../models/GitTree.js'
import { readObject } from '../storage/readObject.js'
import { compareStats } from '../utils/compareStats.js'
import { hashObject } from '../utils/hashObject.js'
import { cores } from '../utils/plugins.js'

/**
 * Tell whether a file has been changed
 *
 * @link https://isomorphic-git.github.io/docs/status.html
 */
export async function status ({
  core = 'default',
  dir,
  gitdir = path.join(dir, '.git'),
  fs: _fs = cores.get(core).get('fs'),
  filepath
}) {
  try {
    const fs = new FileSystem(_fs)
    let ignored = await GitIgnoreManager.isIgnored({
      gitdir,
      dir,
      filepath,
      fs
    })
    if (ignored) {
      return 'ignored'
    }
    let headTree = await getHeadTree({ fs, gitdir })
    let treeOid = await getOidAtPath({
      fs,
      gitdir,
      tree: headTree,
      path: filepath
    })
    let indexEntry = null
    // Acquire a lock on the index
    await GitIndexManager.acquire(
      { fs, filepath: `${gitdir}/index` },
      async function (index) {
        for (let entry of index) {
          if (entry.path === filepath) {
            indexEntry = entry
            break
          }
        }
      }
    )
    let stats = await fs.lstat(path.join(dir, filepath))

    let H = treeOid !== null // head
    let I = indexEntry !== null // index
    let W = stats !== null // working dir

    const getWorkdirOid = async () => {
      if (I && !compareStats(indexEntry, stats)) {
        return indexEntry.oid
      } else {
        let object = await fs.read(path.join(dir, filepath))
        let workdirOid = await hashObject({
          gitdir,
          type: 'blob',
          object
        })
        // If the oid in the index === working dir oid but stats differed update cache
        if (I && indexEntry.oid === workdirOid) {
          // and as long as our fs.stats aren't bad.
          // size of -1 happens over a BrowserFS HTTP Backend that doesn't serve Content-Length headers
          // (like the Karma webserver) because BrowserFS HTTP Backend uses HTTP HEAD requests to do fs.stat
          if (stats.size !== -1) {
            // We don't await this so we can return faster for one-off cases.
            GitIndexManager.acquire(
              { fs, filepath: `${gitdir}/index` },
              async function (index) {
                index.insert({ filepath, stats, oid: workdirOid })
              }
            )
          }
        }
        return workdirOid
      }
    }

    if (!H && !W && !I) return 'absent' // ---
    if (!H && !W && I) return '*absent' // -A-
    if (!H && W && !I) return '*added' // --A
    if (!H && W && I) {
      let workdirOid = await getWorkdirOid()
      return workdirOid === indexEntry.oid ? 'added' : '*added' // -AA : -AB
    }
    if (H && !W && !I) return 'deleted' // A--
    if (H && !W && I) {
      return treeOid === indexEntry.oid ? '*deleted' : '*deleted' // AA- : AB-
    }
    if (H && W && !I) {
      let workdirOid = await getWorkdirOid()
      return workdirOid === treeOid ? '*undeleted' : '*undeletemodified' // A-A : A-B
    }
    if (H && W && I) {
      let workdirOid = await getWorkdirOid()
      if (workdirOid === treeOid) {
        return workdirOid === indexEntry.oid ? 'unmodified' : '*unmodified' // AAA : ABA
      } else {
        return workdirOid === indexEntry.oid ? 'modified' : '*modified' // ABB : AAB
      }
    }
    /*
    ---
    -A-
    --A
    -AA
    -AB
    A--
    AA-
    AB-
    A-A
    A-B
    AAA
    ABA
    ABB
    AAB
    */
  } catch (err) {
    err.caller = 'git.status'
    throw err
  }
}

async function getOidAtPath ({ fs, gitdir, tree, path }) {
  if (typeof path === 'string') path = path.split('/')
  let dirname = path.shift()
  for (let entry of tree) {
    if (entry.path === dirname) {
      if (path.length === 0) {
        return entry.oid
      }
      let { type, object } = await readObject({
        fs,
        gitdir,
        oid: entry.oid
      })
      if (type === 'tree') {
        let tree = GitTree.from(object)
        return getOidAtPath({ fs, gitdir, tree, path })
      }
      if (type === 'blob') {
        throw new GitError(E.ObjectTypeAssertionInPathFail, {
          oid: entry.oid,
          path: path.join('/')
        })
      }
    }
  }
  return null
}

async function getHeadTree ({ fs, gitdir }) {
  // Get the tree from the HEAD commit.
  let oid = await GitRefManager.resolve({ fs, gitdir, ref: 'HEAD' })
  let { type, object } = await readObject({ fs, gitdir, oid })
  if (type !== 'commit') {
    throw new GitError(E.ResolveCommitError, { oid })
  }
  let commit = GitCommit.from(object)
  oid = commit.parseHeaders().tree
  return getTree({ fs, gitdir, oid })
}

async function getTree ({ fs, gitdir, oid }) {
  let { type, object } = await readObject({
    fs,
    gitdir,
    oid
  })
  if (type !== 'tree') {
    throw new GitError(E.ResolveTreeError, { oid })
  }
  let tree = GitTree.from(object).entries()
  return tree
}
