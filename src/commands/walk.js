import path from 'path'

import { FileSystem } from '../models/FileSystem.js'
import { GitWalkerFs } from '../models/GitWalkerFs.js'
import { GitWalkerIndex } from '../models/GitWalkerIndex.js'
import { GitWalkerRepo } from '../models/GitWalkerRepo.js'
import { arrayRange } from '../utils/arrayRange.js'
import { unionOfIterators } from '../utils/unionOfIterators.js'

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

    let walkers = await Promise.all(
      trees.map(async ref => {
        let walker
        if (ref === 'STAGE') {
          walker = new GitWalkerIndex({ fs, gitdir })
        } else if (ref === 'WORKDIR') {
          walker = new GitWalkerFs({ fs, dir })
        } else {
          walker = new GitWalkerRepo({ fs, gitdir, ref })
        }
        return walker
      })
    )

    let root = new Array(walkers.length).fill({
      fullpath: '.',
      basename: '.'
    })
    const range = arrayRange(0, walkers.length)
    const unionWalkerFromReaddir = async entry => {
      const subdirs = await Promise.all(
        range.map(i => walkers[i].readdir(entry[i]))
      )
      // TODO: Here insert leaf node operation where readdir result was null
      // Now process child directories
      let iterators = subdirs
        .map(array => (array === null ? [] : array))
        .map(array => array[Symbol.iterator]())
      return unionOfIterators(iterators)
    }

    const results = []
    const recurse = async root => {
      let unionWalker = await unionWalkerFromReaddir(root)
      for (const entry of unionWalker) {
        results.push(entry.map(e => (e === null ? null : e.fullpath)))
        await recurse(entry)
      }
    }
    await recurse(root)
    console.table(results)
    // let unionWalker = await unionWalkerFromReaddir(root)
    // console.log(range)
    // console.log(unionWalker)
    // for (const entry of unionWalker) {
    //   console.log(entry)
    //   let unionWalker2 = await unionWalkerFromReaddir(entry)
    //   for (const entry2 of unionWalker2) {
    //     console.log(entry2)
    //   }
    // }
  } catch (err) {
    err.caller = 'git.walk'
    throw err
  }
}
