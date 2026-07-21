import {
  fs as _fs,
  resolveMountConfig,
  CopyOnWrite,
  Fetch,
  InMemory,
} from '@zenfs/core'
import { FileSystem } from 'isomorphic-git/internal-apis'

// The read-only fixtures layer is built from the Fetch index once and reused for
// every test. Rebuilding it per test (the previous behaviour) rebuilt the whole
// filesystem from the ~800 KB index on every test — several seconds each, which
// blew past the CI timeout.
let readablePromise

function getReadable() {
  if (!readablePromise) {
    readablePromise = (async () => {
      // Dynamic import (this is an ES module); eagerly inlined by webpack so it
      // is only evaluated in the browser, where makeZenFS is actually used.
      const { default: index } = await import(
        /* webpackMode: "eager" */ '../../__fixtures__/index.json'
      )
      return resolveMountConfig({
        backend: Fetch,
        index,
        // ZenFS' Fetch backend builds request URLs with `new URL()`, which needs
        // an absolute base. Karma serves the fixtures on its own origin.
        baseUrl: `${globalThis.location.origin}/base/__tests__/__fixtures__/`,
      })
    })()
  }
  return readablePromise
}

let mounted = false

// Give the current test a clean writable overlay on top of the shared, read-only
// fixtures. Called once per test (see FixtureFS.js) so tests stay isolated, while
// multiple makeFixture() calls within a single test share one filesystem — which
// the submodule helper relies on (it copies between two fixtures in one fs).
export async function resetZenFS() {
  const readable = await getReadable()
  const root = await resolveMountConfig({
    backend: CopyOnWrite,
    readable,
    writable: { backend: InMemory },
  })
  try {
    _fs.umount('/')
  } catch {}
  _fs.mount('/', root)
  mounted = true
}

export async function makeZenFS(dir) {
  // The filesystem is reset before each test in FixtureFS.js; this fallback keeps
  // makeFixture working if a test sets up its fixture in `beforeAll` (which runs
  // before the first `beforeEach`).
  if (!mounted) await resetZenFS()

  const fs = new FileSystem(_fs)
  dir = `/${dir}`
  const gitdir = `${dir}.git`
  await fs.mkdir(dir)
  await fs.mkdir(gitdir)
  return {
    _fs,
    fs,
    dir,
    gitdir,
  }
}
