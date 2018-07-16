import path from 'path'

import { FileSystem } from '../models/FileSystem.js'
import { GitWalkerFs } from '../models/GitWalkerFs.js'
import { GitWalkerIndex } from '../models/GitWalkerIndex.js'
import { GitWalkerRepo } from '../models/GitWalkerRepo.js'
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

    // let WORKDIR = await walkers[2].readdir('.')
    // console.log('WORKDIR', WORKDIR.map(x => x.fullpath))
    // let STAGE = await walkers[1].readdir('.')
    // console.log('STAGE', STAGE.map(x => x.fullpath))
    // let HEAD = await walkers[0].readdir('.')
    // console.log('HEAD', HEAD.map(x => x.fullpath))
    let roots = await Promise.all(walkers.map(walker => walker.readdir('.')))
    console.log(roots)
    let iterators = roots.map(array => array[Symbol.iterator]())
    console.log(iterators)
    let unionWalker = unionOfIterators(iterators)
    console.log(unionWalker)
    for (const entry of unionWalker) {
      console.log(entry)
    }
  } catch (err) {
    err.caller = 'git.walk'
    throw err
  }
}
