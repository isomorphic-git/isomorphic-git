import path from 'path'

import { GitIndexManager } from '../managers/GitIndexManager.js'
import { GitObjectManager } from '../managers/GitObjectManager.js'
import { GitRefManager } from '../managers/GitRefManager.js'
import { FileSystem } from '../models/FileSystem.js'
import { GitCommit } from '../models/GitCommit.js'
import { E, GitError } from '../models/GitError.js'
import { GitTree } from '../models/GitTree.js'

import { config } from './config'

/**
 * Checkout a branch
 *
 * @link https://isomorphic-git.github.io/docs/checkout.html
 */
export async function checkout ({
  dir,
  gitdir = path.join(dir, '.git'),
  fs: _fs,
  remote = 'origin',
  ref
}) {
  try {
    const fs = new FileSystem(_fs)
    if (ref === undefined) {
      throw new GitError(E.MissingRequiredParameterError, {
        function: 'checkout',
        parameter: 'ref'
      })
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
      throw new GitError(E.CommitNotFetchedError, { ref, oid })
    }
    if (commit.type !== 'commit') {
      throw new GitError(E.ObjectTypeAssertionFail, {
        type: commit.type,
        oid,
        expected: 'commit'
      })
    }
    let comm = GitCommit.from(commit.object.toString('utf8'))
    let sha = comm.headers().tree
    // Get top-level tree
    let { type, object } = await GitObjectManager.read({ fs, gitdir, oid: sha })
    if (type !== 'tree') {
      throw new GitError(E.ObjectTypeAssertionFail, {
        type,
        oid: sha,
        expected: 'tree'
      })
    }
    let tree = GitTree.from(object)
    // Acquire a lock on the index
    await GitIndexManager.acquire(
      { fs, filepath: `${gitdir}/index` },
      async function (index) {
        // TODO: Big optimization possible here.
        // Instead of deleting and rewriting everything, only delete files
        // that are not present in the new branch, and only write files that
        // are not in the index or are in the index but have the wrong SHA.
        for (let entry of index) {
          try {
            await fs.rm(path.join(dir, entry.path))
          } catch (err) {}
        }
        index.clear()
        // Write files. TODO: Write them atomically
        await writeTreeToDisk({ fs, gitdir, dir, index, prefix: '', tree })
        // Update HEAD TODO: Handle non-branch cases
        await fs.write(`${gitdir}/HEAD`, `ref: refs/heads/${ref}`)
      }
    )
  } catch (err) {
    err.caller = 'git.checkout'
    throw err
  }
}

async function writeTreeToDisk ({ fs: _fs, dir, gitdir, index, prefix, tree }) {
  const fs = new FileSystem(_fs)
  for (let entry of tree) {
    let { type, object } = await GitObjectManager.read({
      fs,
      gitdir,
      oid: entry.oid
    })
    let entrypath = prefix === '' ? entry.path : `${prefix}/${entry.path}`
    let filepath = path.join(dir, prefix, entry.path)
    switch (type) {
      case 'blob':
        await fs.write(filepath, object)
        let stats = await fs._lstat(filepath)
        index.insert({
          filepath: entrypath,
          stats,
          oid: entry.oid
        })
        break
      case 'tree':
        let tree = GitTree.from(object)
        await writeTreeToDisk({
          fs,
          dir,
          gitdir,
          index,
          prefix: entrypath,
          tree
        })
        break
      default:
        throw new GitError(E.ObjectTypeAssertionInTreeFail, {
          type,
          oid: entry.oid,
          entrypath
        })
    }
  }
}
