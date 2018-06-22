import path from 'path'

import {
  GitIgnoreManager,
  GitIndexManager,
  GitObjectManager,
  GitRefManager
} from '../managers'
import { E, FileSystem, GitCommit, GitError, GitTree } from '../models'

/**
 * Tell whether a file has been changed
 *
 * @link https://isomorphic-git.github.io/docs/status.html
 */
export async function status ({
  dir,
  gitdir = path.join(dir, '.git'),
  fs: _fs,
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
    let stats = null
    try {
      stats = await fs._lstat(path.join(dir, filepath))
    } catch (err) {
      if (err.code !== 'ENOENT') {
        throw err
      }
    }

    let H = treeOid !== null // head
    let I = indexEntry !== null // index
    let W = stats !== null // working dir

    const getWorkdirOid = async () => {
      if (I && !cacheIsStale({ entry: indexEntry, stats })) {
        return indexEntry.oid
      } else {
        let object = await fs.read(path.join(dir, filepath))
        let workdirOid = await GitObjectManager.hash({
          gitdir,
          type: 'blob',
          object
        })
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

function cacheIsStale ({ entry, stats }) {
  // Comparison based on the description in Paragraph 4 of
  // https://www.kernel.org/pub/software/scm/git/docs/technical/racy-git.txt
  return (
    entry.mode !== stats.mode ||
    entry.mtime.valueOf() !== stats.mtime.valueOf() ||
    entry.ctime.valueOf() !== stats.ctime.valueOf() ||
    entry.uid !== stats.uid ||
    entry.gid !== stats.gid ||
    entry.ino !== stats.ino >> 0 ||
    entry.size !== stats.size
  )
}

async function getOidAtPath ({ fs, gitdir, tree, path }) {
  if (typeof path === 'string') path = path.split('/')
  let dirname = path.shift()
  for (let entry of tree) {
    if (entry.path === dirname) {
      if (path.length === 0) {
        return entry.oid
      }
      let { type, object } = await GitObjectManager.read({
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
  let { object: cobject } = await GitObjectManager.read({ fs, gitdir, oid })
  let commit = GitCommit.from(cobject)
  let { object: tobject } = await GitObjectManager.read({
    fs,
    gitdir,
    oid: commit.parseHeaders().tree
  })
  let tree = GitTree.from(tobject).entries()
  return tree
}
