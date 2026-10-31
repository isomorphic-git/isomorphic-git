/* eslint-env node, browser, jasmine */
import { GitIndex } from 'isomorphic-git/internal-apis'

import { compareStats } from '../src/utils/compareStats.js'
import { normalizeStats } from '../src/utils/normalizeStats.js'

describe('utils/compareStats', () => {
  const stats = {
    ctimeMs: 1100,
    mtimeMs: 1100,
    dev: 1,
    ino: 1,
    mode: 0o100644,
    uid: 0,
    gid: 0,
    size: 16,
  }
  const entry = normalizeStats(stats)

  it('matches an index entry against unchanged filesystem timestamps', () => {
    expect(compareStats(entry, stats)).toBe(false)
  })

  it('matches fractional millisecond timestamps after an index round trip', async () => {
    const fractionalStats = {
      ...stats,
      ctimeMs: 1100.123456,
      mtimeMs: 1100.654321,
    }
    const index = new GitIndex()
    index.insert({
      filepath: 'note.md',
      oid: 'e69de29bb2d1d6434b8b29ae775ad8c2e48c5391',
      stats: fractionalStats,
    })
    const restored = await GitIndex.from(await index.toObject())
    const storedEntry = restored.entries[0]

    expect(compareStats(storedEntry, fractionalStats)).toBe(false)
    expect(
      compareStats(storedEntry, { ...fractionalStats, ctimeMs: 1100.123458 })
    ).toBe(true)
    expect(
      compareStats(storedEntry, { ...fractionalStats, mtimeMs: 1100.654323 })
    ).toBe(true)
  })

  it('invalidates a same-size file modified within the same second', () => {
    expect(compareStats(entry, { ...stats, mtimeMs: 1200 })).toBe(true)
  })

  it('invalidates a same-size file whose change time advanced within the same second', () => {
    expect(compareStats(entry, { ...stats, ctimeMs: 1200 })).toBe(true)
  })
})
