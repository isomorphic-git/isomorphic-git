import { RunningMinimum } from '../models/RunningMinimum'

// Take an array of length N of
//   iterators of length Q_n
//     of strings
// and return an iterator of length max(Q_n) for all n
//   of arrays of length N
//     of string|null who all have the same string value
export function* unionOfIterators(sets) {
  /* NOTE: We can assume all arrays are sorted.
   * Indexes are sorted because they are defined that way:
   *
   * > Index entries are sorted in ascending order on the name field,
   * > interpreted as a string of unsigned bytes (i.e. memcmp() order, no
   * > localization, no special casing of directory separator '/'). Entries
   * > with the same name are sorted by their stage field.
   *
   * Trees should be sorted because they are created directly from indexes.
   * They definitely should be sorted, or else they wouldn't have a unique SHA1.
   * So that would be very naughty on the part of the tree-creator.
   *
   * Lastly, the working dir entries are sorted because I choose to sort them
   * in my FileSystem.readdir() implementation.
   */

  // Init
  const min = new RunningMinimum()
  let minimum
  const heads = []
  const numsets = sets.length
  for (let i = 0; i < numsets; i++) {
    // Abuse the fact that iterators continue to return 'undefined' for value
    // once they are done
    heads[i] = sets[i].next().value
    if (heads[i] !== undefined) {
      min.consider(heads[i])
    }
  }
  if (min.value === null) return
  // Iterate
  while (true) {
    const result = []
    minimum = min.value
    min.reset()
    for (let i = 0; i < numsets; i++) {
      if (heads[i] !== undefined && heads[i] === minimum) {
        result[i] = heads[i]
        heads[i] = sets[i].next().value
      } else {
        // A little hacky, but eh
        result[i] = null
      }
      if (heads[i] !== undefined) {
        min.consider(heads[i])
      }
    }
    yield result
    if (min.value === null) return
  }
}
