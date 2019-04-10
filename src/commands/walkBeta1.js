// @ts-check
import { arrayRange } from '../utils/arrayRange.js'
import { GitWalkerSymbol } from '../utils/symbols.js'
import { unionOfIterators } from '../utils/unionOfIterators.js'

/**
 *
 * @typedef Walker
 * @property {Symbol} Symbol('GitWalkerSymbol')
 */

/**
 *
 * @typedef WalkerEntry
 * @property {string} fullpath
 * @property {string} basename
 * @property {boolean} exists
 * @property {Function} populateStat
 * @property {'tree'|'blob'} [type]
 * @property {number} [ctimeSeconds]
 * @property {number} [ctimeNanoseconds]
 * @property {number} [mtimeSeconds]
 * @property {number} [mtimeNanoseconds]
 * @property {number} [dev]
 * @property {number} [ino]
 * @property {number} [mode]
 * @property {number} [uid]
 * @property {number} [gid]
 * @property {number} [size]
 * @property {Function} populateContent
 * @property {Buffer} [content]
 * @property {Function} populateHash
 * @property {string} [oid]
 */

/**
 * A powerful recursive tree-walking utility.
 *
 * @param {object} args
 * @param {Walker[]} args.trees - The trees you want to traverse
 * @param {(entry: WalkerEntry) => Promise<boolean>} args.filter - Filter which `WalkerEntry`s to process
 * @param {<T>(entry: WalkerEntry) => Promise<T>} args.map - Transform `WalkerEntry`s into a result form
 * @param {<T, U>(parent: T, child: T[]) => Promise<U[]>} args.reduce - Control how mapped entries are combined with their parent result
 * @param {<U>(walk: (root: WalkerEntry[]) => Promise<U>, children: IterableIterator<WalkerEntry[]>) => Promise<U[]>} args.iterate - Fine-tune how entries within a tree are iterated over
 * 
 * @returns {Promise<false | string[]>} The value `false` or the valid key ids (in hex format) used to sign the commit.
 *
 * @example
  *
 */
export async function walkBeta1 ({
  trees,
  filter = async () => true,
  // @ts-ignore
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
        let walkedChildren = await iterate(walk, children)
        walkedChildren = walkedChildren.filter(x => x !== undefined)
        return reduce(parent, walkedChildren)
      }
    }
    return walk(root)
  } catch (err) {
    err.caller = 'git.walk'
    throw err
  }
}
