import { arrayRange } from '../utils/arrayRange.js'
import { GitWalkerSymbol } from '../utils/symbols.js'
import { unionOfIterators } from '../utils/unionOfIterators.js'

/**
 * Add a file to the git index (aka staging area)
 *
 * @link https://isomorphic-git.github.io/docs/add.html
 */
export async function walkBeta1 ({
  core = 'default',
  trees,
  map = async entry => entry,
  filter = async () => true,
  // The default reducer is a flatmap that filters out undefineds.
  reduce = async (parent, children) => {
    // TODO: replace with `[parent, children].flat()` once that gets standardized
    let flatten = children.reduce((acc, x) => acc.concat(x), [])
    if (parent !== undefined) flatten.unshift(parent)
    return flatten
  },
  // The default iterate function walks all children concurrently
  iterate = (recurse, children) => Promise.all([...children].map(recurse))
}) {
  try {
    let walkers = trees.map(proxy => proxy[GitWalkerSymbol]())

    let root = new Array(walkers.length).fill({
      fullpath: '.',
      basename: '.',
      exists: true
    })
    const range = arrayRange(0, walkers.length)
    const unionWalkerFromReaddir = async entry => {
      const subdirs = await Promise.all(
        range.map(i => walkers[i].readdir(entry[i]))
      )
      range.map(i => {
        entry[i] = new walkers[i].ConstructEntry(entry[i])
      })
      // Now process child directories
      let iterators = subdirs
        .map(array => (array === null ? [] : array))
        .map(array => array[Symbol.iterator]())
      return {
        entry,
        children: unionOfIterators(iterators)
      }
    }

    const _walk = async root => {
      let { children, entry } = await unionWalkerFromReaddir(root)
      if (await filter(entry)) {
        let mappedResult = await map(entry)
        let results = await iterate(_walk, children)
        results = results.filter(x => x !== undefined)
        return reduce(mappedResult, results)
      }
    }
    return _walk(root)
  } catch (err) {
    err.caller = 'git.walk'
    throw err
  }
}
