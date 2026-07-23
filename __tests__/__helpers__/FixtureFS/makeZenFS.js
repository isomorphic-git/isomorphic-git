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

// The parsed fixtures index (~800 KB of JSON) is loaded once and reused; only the
// expensive JSON parse is memoized here. The Fetch backend itself is rebuilt per
// fixture — see makeReadable.
let indexPromise

function getIndex() {
  if (!indexPromise) {
    // Dynamic import (this is an ES module); eagerly inlined by webpack so it is
    // only evaluated in the browser, where makeZenFS is actually used.
    indexPromise = import(
      /* webpackMode: "eager" */ '../../__fixtures__/index.json'
    ).then(m => m.default)
  }
  return indexPromise
}

// Build a fresh read-only fixtures layer for every fixture.
//
// A fresh Fetch backend per fixture gives each test its own inodes, so nothing
// bleeds across tests. `disableAsyncCache` skips Fetch's "pre-fetch every file"
// startup pass so the rebuild is cheap; contents are fetched on demand and cached
// by utilium's module-level (URL-keyed) request cache, so nothing is re-downloaded.
async function makeReadable() {
  const index = await getIndex()
  const readable = await resolveMountConfig({
    backend: Fetch,
    index,
    // ZenFS' Fetch backend builds request URLs with `new URL()`, which needs an
    // absolute base. Karma serves the fixtures on its own origin.
    baseUrl: `${globalThis.location.origin}/base/__tests__/__fixtures__/`,
    disableAsyncCache: true,
  })

  // Guard against a ZenFS CopyOnWrite bug: copyToWritable() passes the object
  // returned by readable.stat() straight into writable.createFile()/touch(), and
  // the store keeps it by reference — so a later write mutates the *readable's*
  // own inode in place (e.g. its `size` grows from 22 to 28 bytes when checkout
  // rewrites `.git/HEAD`). A subsequent copy-up of the same path then reads past
  // the real file's end and the Fetch backend gets HTTP 416 → ENODATA, surfacing
  // as "SuppressedError: An error was suppressed during disposal". Returning a
  // copy from stat() keeps the readable's inodes immutable.
  const copyInode = inode => new inode.constructor(inode.toJSON())
  const origStat = readable.stat.bind(readable)
  const origStatSync = readable.statSync.bind(readable)
  readable.stat = async path => copyInode(await origStat(path))
  readable.statSync = path => copyInode(origStatSync(path))

  return readable
}

// Every makeFixture() call gets a brand-new in-memory filesystem: a fresh
// writable overlay mounted at '/' on top of a fresh, read-only fixtures layer.
// This mirrors the Node helper, where each fixture is an independent temp dir — a
// test that creates a fixture starts clean, and a fixture built in `beforeAll`
// survives across that suite's specs (they don't create a new fixture, so nothing
// resets).
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

  const readable = await makeReadable()
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
