// @ts-check
import { _readTree } from '../commands/readTree.js'
import { NotFoundError } from '../errors/NotFoundError.js'
import { ObjectTypeError } from '../errors/ObjectTypeError'
import { GitIgnoreManager } from '../managers/GitIgnoreManager.js'
import { GitIndexManager } from '../managers/GitIndexManager.js'
import { GitRefManager } from '../managers/GitRefManager.js'
import { FileSystem } from '../models/FileSystem.js'
import { GitTree } from '../models/GitTree.js'
import { _readObject } from '../storage/readObject.js'
import { assertParameter } from '../utils/assertParameter.js'
import { compareStats } from '../utils/compareStats.js'
import { hashObject } from '../utils/hashObject.js'
import { join } from '../utils/join.js'

/**
 * Tell whether a file has been changed
 *
 * The possible resolve values are:
 *
 * | status                | description                                                                           |
 * | --------------------- | ------------------------------------------------------------------------------------- |
 * | `"ignored"`           | file ignored by a .gitignore rule                                                     |
 * | `"unmodified"`        | file unchanged from HEAD commit                                                       |
 * | `"*modified"`         | file has modifications, not yet staged                                                |
 * | `"*deleted"`          | file has been removed, but the removal is not yet staged                              |
 * | `"*added"`            | file is untracked, not yet staged                                                     |
 * | `"absent"`            | file not present in HEAD commit, staging area, or working dir                         |
 * | `"modified"`          | file has modifications, staged                                                        |
 * | `"deleted"`           | file has been removed, staged                                                         |
 * | `"added"`             | previously untracked file, staged                                                     |
 * | `"*unmodified"`       | working dir and HEAD commit match, but index differs                                  |
 * | `"*absent"`           | file not present in working dir or HEAD commit, but present in the index              |
 * | `"*undeleted"`        | file was deleted from the index, but is still in the working dir                      |
 * | `"*undeletemodified"` | file was deleted from the index, but is present with modifications in the working dir |
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system client
 * @param {string} args.dir - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir, '.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} args.filepath - The path to the file to query
 * @param {object} [args.cache] - a [cache](cache.md) object
 *
 * @returns {Promise<'ignored'|'unmodified'|'*modified'|'*deleted'|'*added'|'absent'|'modified'|'deleted'|'added'|'*unmodified'|'*absent'|'*undeleted'|'*undeletemodified'>} Resolves successfully with the file's git status
 *
 * @example
 * let status = await git.status({ fs, dir: '/tutorial', filepath: 'README.md' })
 * console.log(status)
 *
 */
export async function status({
  fs: _fs,
  dir,
  gitdir = join(dir, '.git'),
  filepath,
  cache = {},
}) {
  try {
    assertParameter('fs', _fs)
    assertParameter('gitdir', gitdir)
    assertParameter('filepath', filepath)

    const fs = new FileSystem(_fs)
    const ignored = await GitIgnoreManager.isIgnored({
      fs,
      gitdir,
      dir,
      filepath,
    })
    if (ignored) {
      return 'ignored'
    }
    const headTree = await getHeadTree({ fs, cache, gitdir })
    const treeOid = await getOidAtPath({
      fs,
      cache,
      gitdir,
      tree: headTree,
      path: filepath,
    })
    const indexEntry = await GitIndexManager.acquire(
      { fs, gitdir, cache },
      async function(index) {
        for (const entry of index) {
          if (entry.path === filepath) return entry
        }
        return null
      }
    )
    const stats = await fs.lstat(join(dir, filepath))

    const H = treeOid !== null // head
    const I = indexEntry !== null // index
    const W = stats !== null // working dir

    const getWorkdirOid = async () => {
      if (I && !compareStats(indexEntry, stats)) {
        return indexEntry.oid
      } else {
        const object = await fs.read(join(dir, filepath))
        const workdirOid = await hashObject({
          gitdir,
          type: 'blob',
          object,
        })
        // If the oid in the index === working dir oid but stats differed update cache
        if (I && indexEntry.oid === workdirOid) {
          // and as long as our fs.stats aren't bad.
          // size of -1 happens over a BrowserFS HTTP Backend that doesn't serve Content-Length headers
          // (like the Karma webserver) because BrowserFS HTTP Backend uses HTTP HEAD requests to do fs.stat
          if (stats.size !== -1) {
            // We don't await this so we can return faster for one-off cases.
            GitIndexManager.acquire({ fs, gitdir, cache }, async function(
              index
            ) {
              index.insert({ filepath, stats, oid: workdirOid })
            })
          }
        }
        return workdirOid
      }
    }

    if (!H && !W && !I) return 'absent' // ---
    if (!H && !W && I) return '*absent' // -A-
    if (!H && W && !I) return '*added' // --A
    if (!H && W && I) {
      const workdirOid = await getWorkdirOid()
      // @ts-ignore
      return workdirOid === indexEntry.oid ? 'added' : '*added' // -AA : -AB
    }
    if (H && !W && !I) return 'deleted' // A--
    if (H && !W && I) {
      // @ts-ignore
      return treeOid === indexEntry.oid ? '*deleted' : '*deleted' // AA- : AB-
    }
    if (H && W && !I) {
      const workdirOid = await getWorkdirOid()
      return workdirOid === treeOid ? '*undeleted' : '*undeletemodified' // A-A : A-B
    }
    if (H && W && I) {
      const workdirOid = await getWorkdirOid()
      if (workdirOid === treeOid) {
        // @ts-ignore
        return workdirOid === indexEntry.oid ? 'unmodified' : '*unmodified' // AAA : ABA
      } else {
        // @ts-ignore
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

async function getOidAtPath({ fs, cache, gitdir, tree, path }) {
  if (typeof path === 'string') path = path.split('/')
  const dirname = path.shift()
  for (const entry of tree) {
    if (entry.path === dirname) {
      if (path.length === 0) {
        return entry.oid
      }
      const { type, object } = await _readObject({
        fs,
        cache,
        gitdir,
        oid: entry.oid,
      })
      if (type === 'tree') {
        const tree = GitTree.from(object)
        return getOidAtPath({ fs, cache, gitdir, tree, path })
      }
      if (type === 'blob') {
        throw new ObjectTypeError(entry.oid, type, 'blob', path.join('/'))
      }
    }
  }
  return null
}

async function getHeadTree({ fs, cache, gitdir }) {
  // Get the tree from the HEAD commit.
  let oid
  try {
    oid = await GitRefManager.resolve({ fs, gitdir, ref: 'HEAD' })
  } catch (e) {
    // Handle fresh branches with no commits
    if (e instanceof NotFoundError) {
      return []
    }
  }
  const { tree } = await _readTree({ fs, cache, gitdir, oid })
  return tree
}
