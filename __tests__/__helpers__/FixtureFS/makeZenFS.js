import {
  fs as _fs,
  resolveMountConfig,
  bindContext,
  CopyOnWrite,
  Fetch,
  InMemory,
} from '@zenfs/core'
import { FileSystem } from 'isomorphic-git/internal-apis'

// Workaround for @zenfs/core symlink handling (see ../../../bug/05): a symlink
// served through the Fetch backend is dereferenced by the static file server, so
// `readlink()` returns the target's bytes instead of the link string. We
// materialize each symlink (recorded at build time in symlinks.json) into the
// writable overlay, which shadows the broken read-only Fetch entry so `lstat`
// reports mode 0o120000 and `readlink` returns the correct target.
let symlinksPromise
function getSymlinks() {
  if (!symlinksPromise) {
    symlinksPromise = import(
      /* webpackMode: "eager" */ '../../__fixtures__/symlinks.json'
    ).then(m => m.default)
  }
  return symlinksPromise
}

async function putSymlink(pfs, path, target) {
  try {
    await pfs.symlink(target, path)
  } catch (err) {
    // Something already exists at this path (the read-only Fetch entry, or a
    // regular file left by a dereferencing copy). Replace it so the link wins.
    if (err && err.code === 'EEXIST') {
      await pfs.rm(path, { force: true })
      await pfs.symlink(target, path)
    } else {
      throw err
    }
  }
}

async function materializeSymlinks(pfs) {
  const symlinks = await getSymlinks()
  for (const [path, target] of Object.entries(symlinks)) {
    await putSymlink(pfs, path, target)
  }
}

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
        // Pre-fetch every fixture file once (disableAsyncCache:false) so all
        // later reads are served synchronously from utilium's request cache.
        // With pre-caching OFF, sync reads miss the cache, throw EAGAIN, and fire
        // un-awaited background fetches — which both fail intermittently
        // ("Could not find <oid>" / missing files) and leak in-flight entries
        // across the per-fixture remounts. The readable is built once and reused,
        // so this cost is paid a single time for the whole suite.
        disableAsyncCache: false,
      })
    })()
  }
  return readablePromise
}

// Every makeFixture() call gets a FULLY ISOLATED filesystem: a fresh InMemory
// writable overlay on top of the shared, read-only fixtures, mounted at a unique
// path and exposed through its own bound (chrooted) context. Tests keep using
// normal absolute paths (e.g. `/test-foo.git`); the context roots them under
// that unique mount, so nothing — no state, and no leaked or still-pending async
// op — can ever cross between tests. This mirrors the Node helper, where each
// fixture is an independent temp dir.
//
// Note: makeFixtureAsSubmodule needs two fixtures in ONE fs, so it calls
// makeZenFS only once and builds the second fixture as another directory in the
// same (isolated) context (see FixtureFSSubmodule.js).
let fixtureCount = 0
// ZenFS resolves paths by re-sorting the ENTIRE global mount table on every
// operation, so letting per-fixture mounts accumulate makes every fs call
// progressively slower (a full suite has >1000 fixtures — the table sort alone
// balloons the run and trips 60s spec timeouts). We keep only the few most-recent
// fixtures mounted: small enough that resolution stays cheap, but enough of a
// window that a stray op briefly outliving its test still finds its overlay
// instead of throwing an unhandled ENOENT against a torn-down path.
const MAX_LIVE_MOUNTS = 4
const liveMounts = []
export async function makeZenFS(dir) {
  // NB: we deliberately do NOT clear utilium's shared request cache here. The
  // read-only fixtures layer is pre-fetched once (see getReadable) and never
  // mutated — writes go to the per-fixture InMemory overlay — so the cache holds
  // only immutable fixture content and is safe to share across fixtures. Clearing
  // it forced every read to re-fetch (EAGAIN → flaky), which is what we want to
  // avoid.
  const readable = await getReadable()
  const root = await resolveMountConfig({
    backend: CopyOnWrite,
    readable,
    writable: { backend: InMemory },
  })
  const mountpoint = `/fixture-${fixtureCount++}`
  _fs.mount(mountpoint, root)
  liveMounts.push(mountpoint)
  while (liveMounts.length > MAX_LIVE_MOUNTS) {
    try {
      _fs.umount(liveMounts.shift())
    } catch {
      // already gone — fine
    }
  }
  // Root a context at this mount so the fixture has its own chrooted `fs`,
  // isolated from every other fixture's mount in the shared table.
  const ctx = bindContext({ root: mountpoint })
  await materializeSymlinks(ctx.fs.promises)

  const fs = new FileSystem(ctx.fs)
  dir = `/${dir}`
  const gitdir = `${dir}.git`
  await fs.mkdir(dir)
  await fs.mkdir(gitdir)
  return {
    _fs: ctx.fs,
    fs,
    dir,
    gitdir,
  }
}
