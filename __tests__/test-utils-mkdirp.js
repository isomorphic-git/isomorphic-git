/* eslint-env node, browser, jasmine */
import { mkdirp } from '../src/utils/mkdirp.js'

const errno = code => Object.assign(new Error(code), { code })

// Builds a single-level `mkdir(path)` primitive backed by an in-memory set of
// directories — the shape `mkdirp` expects (like the raw `fs._mkdir`). `hook`,
// if set, runs before each mkdir and may throw to simulate backend behavior
// (e.g. a transient ENOENT from an eventually consistent overlay).
function makeMkdir() {
  const dirs = new Set(['']) // the root always exists
  /** @type {((filepath: string) => void) | null} */
  let hook = null
  const mkdir = async filepath => {
    if (hook) hook(filepath)
    const parent = filepath.slice(0, filepath.lastIndexOf('/'))
    if (!dirs.has(parent)) throw errno('ENOENT')
    if (dirs.has(filepath)) throw errno('EEXIST')
    dirs.add(filepath)
  }
  return {
    mkdir,
    dirs,
    setHook(fn) {
      hook = fn
    },
  }
}

describe('utils/mkdirp', () => {
  it('creates all missing parent directories', async () => {
    const fs = makeMkdir()
    await mkdirp(fs.mkdir, '/a/b/c')
    expect(fs.dirs.has('/a')).toBe(true)
    expect(fs.dirs.has('/a/b')).toBe(true)
    expect(fs.dirs.has('/a/b/c')).toBe(true)
  })

  it('is idempotent (EEXIST is treated as success)', async () => {
    const fs = makeMkdir()
    await mkdirp(fs.mkdir, '/a/b')
    // Running again must not throw even though everything already exists.
    await mkdirp(fs.mkdir, '/a/b')
    expect(fs.dirs.has('/a/b')).toBe(true)
  })

  it('retries a transient ENOENT after the parent exists', async () => {
    // Simulate an eventually-consistent backend: after '/a' is created, the
    // first few attempts to create '/a/b' still report ENOENT before settling.
    const fs = makeMkdir()
    let flaky = 3
    fs.setHook(filepath => {
      if (filepath === '/a/b' && fs.dirs.has('/a') && flaky > 0) {
        flaky--
        throw errno('ENOENT')
      }
    })
    await mkdirp(fs.mkdir, '/a/b')
    expect(fs.dirs.has('/a/b')).toBe(true)
    expect(flaky).toBe(0) // all transient failures were absorbed
  })

  it('honors the caller-provided retry limit while creating a parent directory', async () => {
    // '/a/b' (a parent of the requested '/a/b/c') reports a transient ENOENT a
    // configurable number of times after its own parent '/a' exists — exercising
    // the retry budget on parent creation, not just the leaf.
    const makeFlakyParent = flakyCount => {
      const fs = makeMkdir()
      let remaining = flakyCount
      fs.setHook(filepath => {
        if (filepath === '/a/b' && fs.dirs.has('/a') && remaining > 0) {
          remaining--
          throw errno('ENOENT')
        }
      })
      return fs
    }

    // With enough retries the parent settles and the whole path is created.
    const ok = makeFlakyParent(2)
    await mkdirp(ok.mkdir, '/a/b/c', 2)
    expect(ok.dirs.has('/a/b/c')).toBe(true)

    // With too few retries the parent's transient ENOENT surfaces — proving the
    // caller's limit propagates to parent creation (rather than the default).
    const tooFew = makeFlakyParent(3)
    let err
    try {
      await mkdirp(tooFew.mkdir, '/a/b/c', 1)
    } catch (e) {
      err = e
    }
    expect(err && err.code).toBe('ENOENT')
  })

  it('gives up after exhausting retries on a persistent ENOENT', async () => {
    const fs = makeMkdir()
    fs.setHook(filepath => {
      if (filepath === '/a/b') throw errno('ENOENT')
    })
    let err
    try {
      await mkdirp(fs.mkdir, '/a/b', 2)
    } catch (e) {
      err = e
    }
    expect(err && err.code).toBe('ENOENT')
  })

  it('propagates a non-ENOENT/EEXIST error immediately', async () => {
    const fs = makeMkdir()
    fs.setHook(filepath => {
      if (filepath === '/a') throw errno('EACCES')
    })
    let err
    try {
      await mkdirp(fs.mkdir, '/a')
    } catch (e) {
      err = e
    }
    expect(err && err.code).toBe('EACCES')
  })

  it('treats a null error (some fs backends) as success', async () => {
    const mkdir = async () => {
      throw null // eslint-disable-line no-throw-literal
    }
    // Should resolve rather than reject.
    await mkdirp(mkdir, '/a')
    expect(true).toBe(true)
  })
})
