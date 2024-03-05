// @ts-check

import { add } from '../api/add.js'
import { readBlob } from '../api/readBlob.js'
import { STAGE } from '../commands/STAGE.js'
import { TREE } from '../commands/TREE.js'
import { WORKDIR } from '../commands/WORKDIR.js'
import { _walk } from '../commands/walk.js'
import { _writeTree } from '../commands/writeTree.js'
import { InternalError } from '../errors/InternalError.js'
import { NotFoundError } from '../errors/NotFoundError.js'
import { GitIgnoreManager } from '../managers/GitIgnoreManager.js'
import { readObjectLoose } from '../storage/readObjectLoose.js'
import { _writeObject } from '../storage/writeObject'

import { join } from './join.js'
import { posixifyPathBuffer } from './posixifyPathBuffer.js'

const _TreeMap = {
  stage: STAGE,
  workdir: WORKDIR,
}

// make sure filepath, blob type and blob object (from loose objects) plus oid are in sync and valid
async function checkAndWriteBlob(fs, gitdir, dir, filepath, oid = null) {
  const currentFilepath = join(dir, filepath)
  const stats = await fs.lstat(currentFilepath)
  if (!stats) throw new NotFoundError(currentFilepath)
  if (stats.isDirectory())
    throw new InternalError(
      `${currentFilepath}: file expected, but found directory`
    )

  // Look for it in the loose object directory.
  const objContent = oid
    ? await readObjectLoose({ fs, gitdir, oid })
    : undefined
  let retOid = objContent ? oid : undefined
  if (!objContent) {
    const object = stats.isSymbolicLink()
      ? await fs.readlink(currentFilepath).then(posixifyPathBuffer)
      : await fs.read(currentFilepath)

    if (object === null) throw new NotFoundError(currentFilepath)

    retOid = await _writeObject({ fs, gitdir, type: 'blob', object })
    if (retOid !== oid && oid !== null) {
      throw new InternalError(
        `SHA check failed: Expected ${oid}, created ${retOid}`
      )
    }
  }

  return retOid
}

async function processTreeEntries(fs, dir, gitdir, entries) {
  // make sure each tree entry has valid oid
  async function processTreeEntry(entry) {
    if (entry.type === 'tree') {
      if (!entry.oid) {
        // Process children entries if the current entry is a tree
        const children = await Promise.all(entry.children.map(processTreeEntry))
        // Write the tree with the processed children
        entry.oid = await _writeTree({
          fs,
          gitdir,
          tree: children,
        })
        entry.mode = 0o40000 // directory
      }
    } else if (entry.type === 'blob') {
      entry.oid = await checkAndWriteBlob(
        fs,
        gitdir,
        dir,
        entry.path,
        entry.oid
      )
      entry.mode = 0o100644 // file
    }

    // remove path from entry.path
    entry.path = entry.path.split('/').pop()
    return entry
  }

  return Promise.all(entries.map(processTreeEntry))
}

export async function writeTreeChanges(
  fs,
  dir,
  gitdir,
  treePair // [TREE({ ref: 'HEAD' }), 'STAGE'] would be the equivlent of `git write-tree`
) {
  const isStage = treePair[1] === 'stage'
  const trees = treePair.map(t => (typeof t === 'string' ? _TreeMap[t]() : t))

  const changedEntries = []
  // transform WalkerEntry objects into the desired format
  const map = async (filepath, [head, stage]) => {
    if (
      filepath === '.' ||
      (await GitIgnoreManager.isIgnored({ fs, dir, gitdir, filepath }))
    ) {
      return
    }

    if (stage) {
      if (
        !head ||
        ((await head.oid()) !== (await stage.oid()) &&
          (await stage.oid()) !== undefined)
      ) {
        changedEntries.push([head, stage])
      }
      return {
        mode: await stage.mode(),
        path: filepath,
        oid: await stage.oid(),
        type: await stage.type(),
      }
    }
  }

  // combine mapped entries with their parent results
  const reduce = async (parent, children) => {
    children = children.filter(Boolean) // Remove undefined entries
    if (!parent) {
      return children.length > 0 ? children : undefined
    } else {
      parent.children = children
      return parent
    }
  }

  // if parent is skipped, skip the children
  const iterate = async (walk, children) => {
    const filtered = []
    for (const child of children) {
      const [head, stage] = child
      if (isStage) {
        if (stage) {
          // for deleted file in work dir, it also needs to be added on stage
          if (await fs.exists(`${dir}/${stage.toString()}`)) {
            filtered.push(child)
          } else {
            changedEntries.push([null, stage]) // record the change (deletion) while stop the iteration
          }
        }
      } else {
        if (head) {
          // for deleted file in workdir, "stage" (workdir in our case) will be undefined
          if (!stage) {
            changedEntries.push([head, null]) // record the change (deletion) while stop the iteration
          } else {
            filtered.push(child) // workdir, tracked only
          }
        }
      }
    }
    return filtered.length ? Promise.all(filtered.map(walk)) : []
  }

  const entries = await _walk({
    fs,
    cache: {},
    dir,
    gitdir,
    trees,
    map,
    reduce,
    iterate,
  })

  if (changedEntries.length === 0 || entries.length === 0) {
    return null // no changes found to stash
  }

  const processedEntries = await processTreeEntries(fs, dir, gitdir, entries)

  const treeEntries = processedEntries.filter(Boolean).map(entry => ({
    mode: entry.mode,
    path: entry.path,
    oid: entry.oid,
    type: entry.type,
  }))

  return _writeTree({ fs, gitdir, tree: treeEntries })
}

export async function applyTreeChanges(
  fs,
  dir,
  gitdir,
  stashCommit,
  parentCommit,
  wasStaged
) {
  return _walk({
    fs,
    cache: {},
    dir,
    gitdir,
    trees: [TREE({ ref: parentCommit }), TREE({ ref: stashCommit })],
    map: async (filepath, [parent, stash]) => {
      if (
        filepath === '.' ||
        (await GitIgnoreManager.isIgnored({ fs, dir, gitdir, filepath }))
      ) {
        return
      }
      const type = stash ? await stash.type() : await parent.type()
      if (type !== 'tree' && type !== 'blob') {
        return
      }

      const currentFilepath = join(dir, filepath)

      // deleted tree or blob
      if (!stash && parent) {
        if (type === 'tree') {
          await fs.rmdir(currentFilepath)
        } else if (type === 'blob') {
          await fs.rm(currentFilepath)
        }
        return
      }

      const oid = await stash.oid()
      if (!parent || (await parent.oid()) !== oid) {
        // only apply changes if changed from the parent commit or doesn't exist in the parent commit
        if (type === 'tree') {
          await fs.mkdir(currentFilepath)
        } else {
          const { blob } = await readBlob({ fs, dir, gitdir, oid })
          await fs.write(currentFilepath, blob)
          // await fs.chmod(currentFilepath, await stash.mode())
        }
        if (wasStaged) {
          await add({ fs, dir, gitdir, filepath })
        }
      }
      return {
        path: filepath,
        oid: await stash.oid(),
        type: await stash.type(),
      } // return the applied tree entry
    },
  })
}
