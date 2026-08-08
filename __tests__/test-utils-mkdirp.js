/* eslint-env node, browser, jasmine */
import { mkdirp } from '../src/utils/mkdirp.js'

// Minimal in-memory mock of the single-level `_mkdir` primitive that iso-git's
// `fs` wrapper exposes. `_pre` is an optional hook that runs before each mkdir
// and may throw to simulate backend-specific behavior (e.g. an eventually
// consistent overlay reporting a transient ENOENT).
function makeFs() {
  const errno = code => Object.assign(new Error(code), { code })
  return {
    dirs: new Set(['']), // the root always exists
    _pre: null,
    async _mkdir(filepath) {
      if (this._pre) this._pre(filepath)
      const parent = filepath.slice(0, filepath.lastIndexOf('/'))
      if (!this.dirs.has(parent)) throw errno('ENOENT')
      if (this.dirs.has(filepath)) throw errno('EEXIST')
      this.dirs.add(filepath)
    },
  }
}

const errno = code => Object.assign(new Error(code), { code })

describe('utils/mkdirp', () => {
  it('creates all missing parent directories', async () => {
    const fs = makeFs()
    await mkdirp(fs, '/a/b/c')
    expect(fs.dirs.has('/a')).toBe(true)
    expect(fs.dirs.has('/a/b')).toBe(true)
    expect(fs.dirs.has('/a/b/c')).toBe(true)
  })

  it('is idempotent (EEXIST is treated as success)', async () => {
    const fs = makeFs()
    await mkdirp(fs, '/a/b')
    // Running again must not throw even though everything already exists.
    await mkdirp(fs, '/a/b')
    expect(fs.dirs.has('/a/b')).toBe(true)
  })

  it('retries a transient ENOENT after the parent exists', async () => {
    // Simulate an eventually-consistent backend: after '/a' is created, the
    // first few attempts to create '/a/b' still report ENOENT before settling.
    const fs = makeFs()
    let flaky = 3
    fs._pre = filepath => {
      if (filepath === '/a/b' && fs.dirs.has('/a') && flaky > 0) {
        flaky--
        throw errno('ENOENT')
      }
    }
    await mkdirp(fs, '/a/b')
    expect(fs.dirs.has('/a/b')).toBe(true)
    expect(flaky).toBe(0) // all transient failures were absorbed
  })

  it('gives up after exhausting retries on a persistent ENOENT', async () => {
    const fs = makeFs()
    fs._pre = filepath => {
      if (filepath === '/a/b') throw errno('ENOENT')
    }
    let err
    try {
      await mkdirp(fs, '/a/b', 2)
    } catch (e) {
      err = e
    }
    expect(err && err.code).toBe('ENOENT')
  })

  it('propagates a non-ENOENT/EEXIST error immediately', async () => {
    const fs = makeFs()
    fs._pre = filepath => {
      if (filepath === '/a') throw errno('EACCES')
    }
    let err
    try {
      await mkdirp(fs, '/a')
    } catch (e) {
      err = e
    }
    expect(err && err.code).toBe('EACCES')
  })

  it('treats a null error (some fs backends) as success', async () => {
    const fs = {
      async _mkdir() {
        throw null // eslint-disable-line no-throw-literal
      },
    }
    // Should resolve rather than reject.
    await mkdirp(fs, '/a')
    expect(true).toBe(true)
  })
})
