// @flow
import path from 'path'
import pify from 'pify'
import { GitCommit, GitTree } from '../models'
import {
  GitRefManager,
  GitObjectManager,
  GitIndexManager,
  GitIgnoreManager
} from '../managers'
import { read, fs as defaultfs, setfs } from '../utils'
/*::
import type { Stats } from 'fs'
import type { CacheEntry } from '../models/GitIndex'
*/

function cacheIsStale (
  { entry, stats } /*: {
    entry: CacheEntry,
    stats: Stats
  } */
) {
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

async function getOidAtPath (
  {
    gitdir,
    tree,
    path
  } /*: {
    gitdir: string,
    tree: GitTree,
    path: string|Array<string>
  } */
) {
  if (typeof path === 'string') path = path.split('/')
  let dirname = path.shift()
  for (let entry of tree) {
    if (entry.path === dirname) {
      if (path.length === 0) {
        return entry.oid
      }
      let { type, object } = await GitObjectManager.read({
        gitdir,
        oid: entry.oid
      })
      if (type === 'tree') {
        let tree = GitTree.from(object)
        return getOidAtPath({ gitdir, tree, path })
      }
      if (type === 'blob') {
        throw new Error(`Blob found where tree expected.`)
      }
    }
  }
  return null
}

async function getHeadTree ({ gitdir }) {
  // Get the tree from the HEAD commit.
  let oid = await GitRefManager.resolve({ gitdir, ref: 'HEAD' })
  let { object: cobject } = await GitObjectManager.read({ gitdir, oid })
  let commit = GitCommit.from(cobject)
  let { object: tobject } = await GitObjectManager.read({
    gitdir,
    oid: commit.parseHeaders().tree
  })
  let tree = GitTree.from(tobject).entries()
  return tree
}

// For now we're just diffing individual files
export async function status (
  {
    workdir,
    gitdir,
    pathname,
    fs = defaultfs()
  } /*: {
  workdir: string,
  gitdir: string,
  pathname: string
} */
) {
  setfs(fs)
  let ignored = await GitIgnoreManager.isIgnored({ gitdir, workdir, pathname })
  if (ignored) {
    return 'ignored'
  }
  let headTree = await getHeadTree({ gitdir })
  let treeOid = await getOidAtPath({ gitdir, tree: headTree, path: pathname })
  let indexEntry = null
  // Acquire a lock on the index
  await GitIndexManager.acquire(`${gitdir}/index`, async function (index) {
    for (let entry of index) {
      if (entry.path === pathname) {
        indexEntry = entry
        break
      }
    }
  })
  let stats = null
  try {
    stats = await pify(fs.lstat)(path.join(workdir, pathname))
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
      let object = await read(path.join(workdir, pathname))
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
}
