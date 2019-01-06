import { getIterator } from './getIterator.js'

// Currently 'for await' upsets my linters.
export async function forAwait (iterable, cb) {
  let iter = getIterator(iterable)
  while (true) {
    let { value, done } = await iter.next()
    if (value) await cb(value)
    if (done) break
  }
  if (iter.return) iter.return()
}
