/* eslint-env node, browser, jasmine */
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

  it('invalidates a same-size file modified within the same second', () => {
    expect(compareStats(entry, { ...stats, mtimeMs: 1200 })).toBe(true)
  })

  it('invalidates a same-size file whose change time advanced within the same second', () => {
    expect(compareStats(entry, { ...stats, ctimeMs: 1200 })).toBe(true)
  })
})
