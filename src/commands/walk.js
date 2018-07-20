import path from 'path'

import { FileSystem } from '../models/FileSystem.js'
import { arrayRange } from '../utils/arrayRange.js'
import { GitWalkerSymbol } from '../utils/symbols.js'
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
  trees,
  filterDirectory,
  filterFile,
  reduce,
  iterate
}) {
  try {
    const fs = new FileSystem(_fs)

    let walkers = trees.map(proxy => {
      return proxy[GitWalkerSymbol]({ fs, gitdir, dir })
    })

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
    return results
  } catch (err) {
    err.caller = 'git.walk'
    throw err
  }
}
