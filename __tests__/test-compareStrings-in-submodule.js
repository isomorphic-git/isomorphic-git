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
    for (const path of [...names].reverse()) {
      index.insert({ filepath: path, oid: '1'.repeat(40) })
    }
    expect(index.entries.map(entry => entry.path)).toEqual(
      [...new Set(names)].sort(byBytes)
    )
  })
})
