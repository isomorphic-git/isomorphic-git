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
  filter = async () => true,
  map = async entry => entry,
  // The default reducer is a flatmap that filters out undefineds.
  reduce = async (parent, children) => {
    // TODO: replace with `[parent, children].flat()` once that gets standardized
    let flatten = children.reduce((acc, x) => acc.concat(x), [])
    if (parent !== undefined) flatten.unshift(parent)
    return flatten
  },
  // The default iterate function walks all children concurrently
  iterate = (walk, children) => Promise.all([...children].map(walk))
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

    const walk = async root => {
      let { children, entry } = await unionWalkerFromReaddir(root)
      if (await filter(entry)) {
        let parent = await map(entry)
        children = await iterate(walk, children)
        children = children.filter(x => x !== undefined)
        return reduce(parent, children)
      }
    }
    return walk(root)
  } catch (err) {
    err.caller = 'git.walk'
    throw err
  }
}
