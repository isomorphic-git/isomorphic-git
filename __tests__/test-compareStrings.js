/* eslint-env node, browser, jasmine */
import { GitIndex, comparePath } from 'isomorphic-git/internal-apis'

// Git sorts paths by their UTF-8 bytes.
const byBytes = (a, b) => Buffer.compare(Buffer.from(a), Buffer.from(b))

const names = [
  'a',
  'a/b',
  'a b',
  'ab',
  'z',
  'é',
  'ü/x',
  '߿', // the last two-byte character
  'ࠀ', // the first three-byte character
  '퟿',
  '',
  '～', // a full-width tilde
  '￿',
  '\u{10000}', // the first four-byte character
  '\u{1f600}', // an emoji
  '\u{10ffff}',
  'dir/～',
  'dir/\u{1f600}',
  'dir/\u{1f601}',
]

// A lone surrogate is not valid Unicode. Buffer.from writes it as U+FFFD (EF BF BD).
const loneSurrogates = [
  '\udfff',
  '\ud800',
  '\udbff',
  '\ude00\ud83d', // a low surrogate, then a high surrogate
  '\ud83dx', // a high surrogate with no low surrogate after it
  'x\ud83d',
  'dir/\udfff',
  '\ufffd',
  '\ufffe',
]

describe('comparePath', () => {
  it('orders paths like the UTF-8 bytes', () => {
    for (const a of names) {
      for (const b of names) {
        expect(Math.sign(comparePath({ path: a }, { path: b }))).toBe(
          Math.sign(byBytes(a, b))
        )
      }
    }
  })

  it('orders a lone surrogate like the U+FFFD that Buffer.from writes', () => {
    const all = [...names, ...loneSurrogates]
    for (const a of all) {
      for (const b of all) {
        expect(Math.sign(comparePath({ path: a }, { path: b }))).toBe(
          Math.sign(byBytes(a, b))
        )
      }
    }
    expect(comparePath({ path: '\udfff' }, { path: '\ufffe' })).toBe(-1)
    expect(comparePath({ path: '\ufffe' }, { path: '\udfff' })).toBe(1)
    expect(comparePath({ path: '\ud800' }, { path: '\ufffd' })).toBe(0)
  })

  it('puts a character above U+FFFF after U+FF5E', () => {
    expect(comparePath({ path: '\u{1f600}' }, { path: '～' })).toBe(1)
    expect(comparePath({ path: '～' }, { path: '\u{1f600}' })).toBe(-1)
  })

  it('treats equal strings as equal and a prefix as smaller', () => {
    expect(comparePath({ path: 'abc' }, { path: 'abc' })).toBe(0)
    expect(comparePath({ path: 'ab' }, { path: 'abc' })).toBe(-1)
    expect(comparePath({ path: 'abc' }, { path: 'ab' })).toBe(1)
  })
})

describe('GitIndex order', () => {
  it('lists the entries in the order that git needs', () => {
    const index = new GitIndex()
    const paths = [...names, '\udfff', '\ufffe']
    for (const path of [...paths].reverse()) {
      index.insert({ filepath: path, oid: '1'.repeat(40) })
    }
    expect(index.entries.map(entry => entry.path)).toEqual(
      [...new Set(paths)].sort(byBytes)
    )
  })
})
