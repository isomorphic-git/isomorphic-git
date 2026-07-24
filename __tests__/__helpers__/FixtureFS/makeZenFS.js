import {
  fs as _fs,
  resolveMountConfig,
  CopyOnWrite,
  Fetch,
  InMemory,
} from '@zenfs/core'
import { FileSystem } from 'isomorphic-git/internal-apis'
// @ts-ignore — utilium exposes the `requests` subpath at runtime (used by
// @zenfs/core's Fetch backend) but ships no type declarations for it.
import { resourcesCache } from 'utilium/requests'

// The read-only fixtures layer is built from the Fetch index once and reused for
// every test (rebuilding it from the ~800 KB index on every call took seconds).
//
// Sharing it is safe as of @zenfs/core >= 2.5.8: IndexFS.stat() now returns an
// inode *copy*, so CopyOnWrite's copy-up can no longer mutate the read-only
// layer's inodes. (Before 2.5.8 a write through the overlay grew the base inode's
// `size` in place, which leaked across tests and made a later copy-up read past
// EOF → HTTP 416 → ENODATA → "SuppressedError: An error was suppressed during
// disposal"; we worked around it with a stat() wrapper + a per-test readable,
// both now unnecessary.)
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
        disableAsyncCache: true,
      })
    })()
  }
  return readablePromise
}

// Every makeFixture() call gets a brand-new in-memory filesystem: a fresh
// writable overlay mounted at '/' on top of the shared, read-only fixtures. This
// mirrors the Node helper, where each fixture is an independent temp dir — a test
// that creates a fixture starts clean, and a fixture built in `beforeAll` survives
// across that suite's specs (they don't create a new fixture, so nothing resets).
//
// Note: makeFixtureAsSubmodule needs two fixtures in ONE fs, so it calls makeZenFS
// only once and builds the second fixture itself (see FixtureFSSubmodule.js).
export async function makeZenFS(dir) {
  // Isolate each fixture from utilium's module-level (shared) per-URL request
  // cache. The Fetch backend fires off un-awaited background fetches
  // (FetchFS._async) that write into this cache; combined with remounting the
  // global fs per fixture, stale/in-flight entries leak across tests and make
  // packed-object reads flaky (intermittent "NotFoundError: Could not find <oid>").
  resourcesCache.clear()

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
