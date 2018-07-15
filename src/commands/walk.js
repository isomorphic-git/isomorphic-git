import path from 'path'

import { FileSystem } from '../models/FileSystem.js'
import { E, GitError } from '../models/GitError.js'
import { GitRefManager } from '../managers/GitRefManager.js';
import { GitWalkerIndex } from '../models/GitWalkerIndex.js';
import { GitWalkerFs } from '../models/GitWalkerFs.js';
import { GitWalkerRepo } from '../models/GitWalkerRepo.js';

/**
 * Add a file to the git index (aka staging area)
 *
 * @link https://isomorphic-git.github.io/docs/add.html
 */
export async function walk ({
  dir,
  gitdir = path.join(dir, '.git'),
  fs: _fs,
  trees = ['HEAD', 'STAGE', 'WORKDIR'],
  filterDirectory,
  filterFile,
  reduce,
  iterate
}) {
  try {
    const fs = new FileSystem(_fs)

    let walkers = Promise.all(trees.map(async ref => {
      let walker
      if (ref === 'STAGE') {
        await GitIndexManager.acquire(
          { fs, filepath: `${gitdir}/index` },
          async function (index) {
            walker = new GitWalkerIndex({index})
          }
        )
      } else if (ref === 'WORKDIR') {
        walker = new GitWalkerFs({fs, dir})
      } else {
        let oid = await GitRefManager.resolve(ref)
        walker = new GitWalkerRepo({fs, gitdir, oid})
      }
      return walker
    }))

    console.log(walkers)

  } catch (err) {
    err.caller = 'git.walk'
    throw err
  }
}
