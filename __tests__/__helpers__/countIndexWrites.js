/* eslint-env node, browser, jasmine */

/**
 * Wrap a `FileSystem` instance so that every write to a path that ends in
 * `/index` increments a counter. Use it to count how often isomorphic-git
 * writes the whole index file.
 *
 * @param {object} fs - a `FileSystem` instance, as returned by `makeFixture`
 * @returns {{ fs: object, counter: { count: number, reset: function(): void } }}
 */
export function countIndexWrites(fs) {
  const counter = {
    count: 0,
    reset() {
      counter.count = 0
    },
  }
  // The `FileSystem` constructor returns any object that has
  // `_original_unwrapped_fs`, so isomorphic-git uses this object as is.
  const counted = Object.create(fs)
  counted._writeFile = function (filepath, ...args) {
    if (/[\\/]index$/.test(String(filepath))) counter.count++
    return fs._writeFile(filepath, ...args)
  }
  return { fs: counted, counter }
}
