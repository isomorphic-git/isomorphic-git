import path from 'path'

import {
  GitIgnoreManager,
  GitIndexManager,
  GitObjectManager
} from '../managers'
import { FileSystem } from '../models'
import { cacheIsStale, getHeadTree, getOidAtPath } from '../utils'

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
