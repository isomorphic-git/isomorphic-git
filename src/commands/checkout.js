import path from 'path'
import pify from 'pify'
import { GitCommit, GitTree } from '../models'
import { GitRefManager, GitObjectManager, GitIndexManager } from '../managers'
import { rm, write, fs as defaultfs, setfs } from '../utils'

async function writeTreeToDisk ({ gitdir, workdir, index, prefix, tree, fs }) {
  for (let entry of tree) {
    let { type, object } = await GitObjectManager.read({
      gitdir,
      oid: entry.oid
    })
    let entrypath = prefix === '' ? entry.path : `${prefix}/${entry.path}`
    let filepath = path.join(workdir, prefix, entry.path)
    switch (type) {
      case 'blob':
        await write(filepath, object)
        let stats = await pify(fs.lstat)(filepath)
        index.insert({
          filepath: entrypath,
          stats,
          oid: entry.oid
        })
        break
      case 'tree':
        let tree = GitTree.from(object)
        await writeTreeToDisk({
          gitdir,
          workdir,
          index,
          prefix: entrypath,
          tree,
          fs
        })
        break
      default:
        throw new Error(
          `Unexpected object type ${type} found in tree for '${entrypath}'`
        )
    }
  }
}

/**
 * Checkout a branch
 * @param {GitRepo} repo - A {@link Git} object matching `{workdir, gitdir, fs}`
 * @param {Object} args - Arguments object
 * @param {string} [args.remote='origin'] - What to name the remote that is created. The default is 'origin'.
 * @param {string} [args.ref=undefined] - Which branch to clone. By default this is the designated "main branch" of the repository.
 * @returns {Promise<void>} - Resolves successfully when filesystem operations are complete.
 *
 * @example
 * let repo = new Git({fs, dir: '.'})
 * await checkout(repo, {ref: 'master'})
 */
export async function checkout (
  { workdir, gitdir, fs = defaultfs() },
  { remote, ref }
) {
  setfs(fs)
  // Get tree oid
  let oid
  if (remote) {
    let remoteRef
    if (ref === undefined) {
      remoteRef = await GitRefManager.resolve({
        gitdir,
        ref: `${remote}/HEAD`,
        depth: 2
      })
      ref = path.basename(remoteRef)
    } else {
      remoteRef = `${remote}/${ref}`
    }
    oid = await GitRefManager.resolve({ gitdir, ref: remoteRef })
    // Make the remote ref our own!
    await write(`${gitdir}/refs/heads/${ref}`, oid + '\n')
  } else {
    if (ref === undefined) {
      throw new Error('Cannot checkout ref "undefined"')
    }
    oid = await GitRefManager.resolve({ gitdir, ref })
  }
  let commit = await GitObjectManager.read({ gitdir, oid })
  if (commit.type !== 'commit') {
    throw new Error(`Unexpected type: ${commit.type}`)
  }
  let comm = GitCommit.from(commit.object.toString('utf8'))
  let sha = comm.headers().tree
  // Get top-level tree
  let { type, object } = await GitObjectManager.read({ gitdir, oid: sha })
  if (type !== 'tree') throw new Error(`Unexpected type: ${type}`)
  let tree = GitTree.from(object)
  // Acquire a lock on the index
  await GitIndexManager.acquire(`${gitdir}/index`, async function (index) {
    // TODO: Big optimization possible here.
    // Instead of deleting and rewriting everything, only delete files
    // that are not present in the new branch, and only write files that
    // are not in the index or are in the index but have the wrong SHA.
    for (let entry of index) {
      try {
        await rm(path.join(workdir, entry.path))
      } catch (err) {}
    }
    index.clear()
    // Write files. TODO: Write them atomically
    await writeTreeToDisk({ fs, gitdir, workdir, index, prefix: '', tree })
    // Update HEAD TODO: Handle non-branch cases
    write(`${gitdir}/HEAD`, `ref: refs/heads/${ref}`)
  })
}
