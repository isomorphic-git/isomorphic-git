// @ts-check
import '../typedefs.js'

import { arrayRange } from '../utils/arrayRange.js'
import { flat } from '../utils/flat.js'
import { GitWalkSymbol } from '../utils/symbols.js'
import { unionOfIterators } from '../utils/unionOfIterators.js'

/**
 * @param {object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {object} args.cache
 * @param {string} [args.dir]
 * @param {string} [args.gitdir=join(dir,'.git')]
 * @param {Walker[]} args.trees
 * @param {WalkerMap} [args.map]
 * @param {WalkerReduce} [args.reduce]
 * @param {WalkerIterate} [args.iterate]
 *
 * @returns {Promise<any>} The finished tree-walking result
 *
 * @see {WalkerMap}
 *
 */
export async function _walk({
  fs,
  cache,
  dir,
  gitdir,
  trees,
  // @ts-ignore
  map = async (_, entry) => entry,
  // The default reducer is a flatmap that filters out undefineds.
  reduce = async (parent, children) => {
    const flatten = flat(children)
    if (parent !== undefined) flatten.unshift(parent)
    return flatten
  },
  // The default iterate function walks all children concurrently
  iterate = (walk, children) => Promise.all([...children].map(walk)),
}) {
  const walkers = trees.map(proxy =>
    proxy[GitWalkSymbol]({ fs, dir, gitdir, cache })
  )

  const root = new Array(walkers.length).fill('.')
  const range = arrayRange(0, walkers.length)
  const unionWalkerFromReaddir = async entries => {
    range.map(i => {
      entries[i] = entries[i] && new walkers[i].ConstructEntry(entries[i])
    })
    const subdirs = await Promise.all(
      range.map(i => (entries[i] ? walkers[i].readdir(entries[i]) : []))
    )
    // Now process child directories
    const iterators = subdirs
      .map(array => (array === null ? [] : array))
      .map(array => array[Symbol.iterator]())
    return {
      entries,
      children: unionOfIterators(iterators),
    }
  }

  const walk = async root => {
    const { entries, children } = await unionWalkerFromReaddir(root)
    const fullpath = entries.find(entry => entry && entry._fullpath)._fullpath
    const parent = await map(fullpath, entries)
    if (parent !== null) {
      let walkedChildren = await iterate(walk, children)
      walkedChildren = walkedChildren.filter(x => x !== undefined)
      return reduce(parent, walkedChildren)
    }
  }
  return walk(root)
}
