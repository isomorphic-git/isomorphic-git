import path from 'path'
import { config } from './config'
import { FileSystem, GitCommit, GitTree } from '../models'
import { GitRefManager, GitObjectManager, GitIndexManager } from '../managers'
import { log } from '../utils'

const entryjoin = (prefix, filepath) =>
  prefix === '' ? filepath : `${prefix}/${filepath}`

async function writeFileIfChanged ({ fs, gitdir, dir, prefix, entry, index }) {
  let oid = entry.oid
  let entrypath = entryjoin(prefix, entry.path)
  let filepath = path.join(dir, prefix, entry.path)
  let stats = await fs.lstat(filepath)
  // If the file exists...
  if (stats) {
    log(`comparing ${entrypath} and ${filepath}`)
    // If the oid in the git index is not stale, use it. Otherwise compute the hash again.
    let indexEntry = index.get(entrypath)
    let unchanged = fs.statsAreEqual(indexEntry, stats)
    if (!unchanged) {
      log(`CACHE MISS! computing SHA1...`)
    }
    let currentOid = unchanged
      ? indexEntry.oid
      : await GitObjectManager.hash({
        gitdir,
        type: 'blob',
        object: await fs.read(filepath)
      })
    // If the hash is the same...
    if (oid === currentOid) {
      // there's (almost) nothing to do.
      log(entrypath + ' did not change.')
      if (!unchanged) {
        index.insert({
          filepath: entrypath,
          stats,
          oid
        })
      }
      return
    } else {
      log(entrypath + ' changed!')
      log(`${currentOid} -> ${oid}`)
    }
  }
  let { object } = await GitObjectManager.read({
    fs,
    gitdir,
    oid
  })
  await fs.write(filepath, object)
  stats = await fs.lstat(filepath)
  index.insert({
    filepath: entrypath,
    stats,
    oid
  })
}

async function writeTreeToDisk ({ fs: _fs, dir, gitdir, index, prefix, tree }) {
  const fs = new FileSystem(_fs)
  const treeEntries = [...tree]
  // Files currently in the index but not in the tree should be deleted.
  // We do deletions first in order to free up disk space.
  const currentFiles = [...index]
    .map(entry => entry.path)
    .filter(filepath => filepath.startsWith(prefix))
  const desiredFiles = treeEntries.map(entry => entryjoin(prefix, entry.path))
  // This is potentially a little faster, and a bit more elegant, than filtering with Array.includes for each item.
  const setOfDesiredFiles = new Set(desiredFiles)
  const deleteFiles = currentFiles.filter(path => !setOfDesiredFiles.has(path))
  for (const filepath of deleteFiles) {
    await fs.rm(path.join(dir, filepath))
    index.delete({ filepath })
  }

  // Write entries out breadth first-ish, so applications can start
  // displaying top-level file directory data like README or package.json
  // as soon as possible.
  const blobs = treeEntries.filter(entry => entry.type === 'blob')
  const trees = treeEntries.filter(entry => entry.type === 'tree')
  for (const entry of blobs) {
    await writeFileIfChanged({ fs, gitdir, dir, prefix, entry, index })
  }
  for (const entry of trees) {
    let entrypath = entryjoin(prefix, entry.path)
    let { object } = await GitObjectManager.read({
      fs,
      gitdir,
      oid: entry.oid
    })
    let tree = GitTree.from(object)
    await writeTreeToDisk({
      fs,
      dir,
      gitdir,
      index,
      prefix: entrypath,
      tree
    })
  }
}

export async function checkout ({
  dir,
  gitdir = path.join(dir, '.git'),
  fs: _fs,
  remote = 'origin',
  ref
}) {
  const fs = new FileSystem(_fs)
  if (ref === undefined) {
    throw new Error('Cannot checkout ref "undefined"')
  }
  // Get tree oid
  let oid
  try {
    oid = await GitRefManager.resolve({ fs, gitdir, ref })
    // TODO: Figure out what to do if both 'ref' and 'remote' are specified, ref already exists,
    // and is configured to track a different remote.
  } catch (err) {
    // If `ref` doesn't exist, create a new remote tracking branch
    // Figure out the commit to checkout
    let remoteRef = `${remote}/${ref}`
    oid = await GitRefManager.resolve({
      fs,
      gitdir,
      ref: remoteRef
    })
    // Set up remote tracking branch
    await config({
      gitdir,
      fs,
      path: `branch.${ref}.remote`,
      value: `${remote}`
    })
    await config({
      gitdir,
      fs,
      path: `branch.${ref}.merge`,
      value: `refs/heads/${ref}`
    })
    // Create a new branch that points at that same commit
    await fs.write(`${gitdir}/refs/heads/${ref}`, oid + '\n')
  }
  let commit = {}
  try {
    commit = await GitObjectManager.read({ fs, gitdir, oid })
  } catch (err) {
    throw new Error(
      `Failed to checkout ref '${ref}' because commit ${oid} is not available locally. Do a git fetch to make the branch available locally.`
    )
  }
  if (commit.type !== 'commit') {
    throw new Error(`Unexpected type: ${commit.type}`)
  }
  let comm = GitCommit.from(commit.object.toString('utf8'))
  let sha = comm.headers().tree
  // Get top-level tree
  let { type, object } = await GitObjectManager.read({ fs, gitdir, oid: sha })
  if (type !== 'tree') throw new Error(`Unexpected type: ${type}`)
  let tree = GitTree.from(object)
  // Acquire a lock on the index
  await GitIndexManager.acquire(
    { fs, filepath: `${gitdir}/index` },
    async function (index) {
      // Write files. TODO: Write them atomically
      await writeTreeToDisk({ fs, gitdir, dir, index, prefix: '', tree })
      // Update HEAD TODO: Handle non-branch cases
      await fs.write(`${gitdir}/HEAD`, `ref: refs/heads/${ref}`)
    }
  )
}
