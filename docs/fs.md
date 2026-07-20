---
title: fs
sidebar_label: fs
---

You need to pass a file system into `isomorphic-git` functions that do anything that involves files (which is most things in git).

In Node, you can pass the builtin `fs` module.
In the browser it's more involved because there's no standard 'fs' module.
But you can use any module that implements enough of the `fs` API.


## Node's fs

If you're only using isomorphic-git in Node, you can just use the native `fs` module:

```js
const git = require('isomorphic-git');
const fs = require('fs');
const files = await git.listFiles({ fs, dir: __dirname });
console.log(files)
```

## LightningFS

If you are writing code for the browser, you will need something that emulates the `fs` API.
While ZenFS (see next section) has more features, [LightningFS](https://github.com/isomorphic-git/lightning-fs) might very well fit your needs.
It was designed from scratch for `isomorphic-git` (by the same author) to eek out more performance
for fewer bytes. As an added bonus it's dead simple to configure.

```html
<script src="https://unpkg.com/@isomorphic-git/lightning-fs"></script>
<script src="https://unpkg.com/isomorphic-git"></script>
<script>
const fs = new LightningFS('my-app')
const files = git.listFiles({ fs, dir: '/' });
console.log(files);
</script>
```

You can configure LightningFS to load files from an HTTP server as well, which makes it easy to prepopulate a browser file system
with a directory on your server. See the LightningFS documentation for an example of how to do this.

## ZenFS

At the time of writing, the most complete option is [ZenFS](https://github.com/zen-fs/core).
It has a few more steps involved to set up than in Node, as seen below:

```html
<script type="importmap">
  {
    "imports": {
      "isomorphic-git": "https://esm.sh/isomorphic-git",
      "@zenfs/core": "https://esm.sh/@zenfs/core",
      "@zenfs/dom": "https://esm.sh/@zenfs/dom"
    }
  }
</script>
<script type="module">
import { fs, configureSingle } from "@zenfs/core";
import { IndexedDB } from "@zenfs/dom";
import git from "isomorphic-git";

await configureSingle({ backend: IndexedDB });

const files = git.listFiles({ fs, dir: '/' });
console.log(files);

</script>
```

Besides IndexedDB, ZenFS supports many different backends with different performance characteristics (all backends support sync operations), as well as different features such as proxying a static file server as a read-only file system, mounting ZIP files as file systems, or overlaying a writeable in-memory filesystem on top of a read-only filesystem.
You don't need to know all these features, but familiarizing yourself with the different options may be necessary if you hit a storage limit or performance bottleneck in the IndexedDB backend I suggested above.

An [advanced example usage](https://github.com/isomorphic-git/isomorphic-git/blob/53f2e909030adb1c6ae855b14f3a2474ca93ce71/__tests__/__helpers__/FixtureFS.js#L12) is in the old unit tests for isomorphic-git.
It uses the `Fetch` backend to mount (read-only) the test fixtures directory which is stored on the server, then adds a read-write `InMemory` layer using the `Overlay` backend so that the tests can modify files locally.
In between tests it empties the `InMemory`, restoring the file system to a pristine state.
The current unit tests use LightningFS instead, which was built with this HTTP-backed overlay behavior by default, because I find it so useful.


## Environments without IndexedDB (e.g. Cloudflare Workers, Deno Deploy)

Cloudflare Workers, Deno Deploy, and other **edge runtimes** do not expose `IndexedDB`.
This means that `LightningFS` will throw a `ReferenceError: indexedDB is not defined` at
startup, and ZenFS's `IndexedDB` backend won't work either.

The good news is that `isomorphic-git` itself has **no dependency on IndexedDB** — it
just needs *any* object that implements the `fs.promises` interface described below.
You have two main options.

### Option 1 — ZenFS with the InMemory backend (zero extra deps)

[ZenFS](https://github.com/zen-fs/core) ships an `InMemory` backend that works in every
JavaScript environment. It is the quickest path to get `isomorphic-git` running inside
a Cloudflare Worker:

```js
// wrangler.toml: compatibility_flags = ["nodejs_compat"]
import { fs, configureSingle } from '@zenfs/core'
import { InMemory } from '@zenfs/core'
import git from 'isomorphic-git'
import http from 'isomorphic-git/http/web'

await configureSingle({ backend: InMemory })

await git.clone({
  fs,
  http,
  dir: '/',
  url: 'https://github.com/example/repo',
  singleBranch: true,
  depth: 1,
})
```

> **Note:** All data is ephemeral — it is lost when the Worker terminates.
> For persistence across requests see [Option 3](#option-3-persisting-across-requests-cloudflare-durable-objects) below.

### Option 2 — MemoryFS (built-in, zero dependencies)

`isomorphic-git` ships a minimal in-memory filesystem implementation called `MemoryFS`
that works in *any* JavaScript runtime without any additional packages:

```js
import { MemoryFS } from 'isomorphic-git/src/utils/MemoryFS.js'
import git from 'isomorphic-git'
import http from 'isomorphic-git/http/web'

const fs = new MemoryFS()

await git.init({ fs, dir: '/' })
await git.clone({
  fs,
  http,
  dir: '/',
  url: 'https://github.com/example/repo',
  singleBranch: true,
  depth: 1,
})

const files = await fs.promises.readdir('/')
console.log(files)
```

`MemoryFS` implements the full `fs.promises` interface expected by `isomorphic-git`:
`readFile`, `writeFile`, `unlink`, `readdir`, `mkdir`, `rmdir`, `stat`, `lstat`, and `rm`.

> **Note:** Like Option 1, this is ephemeral — the entire filesystem lives in the Worker's
> JavaScript heap and is discarded when the isolate is destroyed.

### Option 3 — Persisting across requests (Cloudflare Durable Objects)

If you need the Git repository to **survive** between Worker requests, you must use a
persistent storage primitive. On Cloudflare, the right tool is
[Durable Objects](https://developers.cloudflare.com/durable-objects/).

The pattern is to build a thin adapter that maps `fs.promises` calls onto Durable Object
storage. Here is a minimal sketch:

```js
// do-fs.js — Durable Object filesystem adapter for isomorphic-git
export class DurableObjectFS {
  constructor(storage) {
    // `storage` is a Cloudflare Durable Object Storage instance
    this._storage = storage
    this.promises = {
      readFile:  this.readFile.bind(this),
      writeFile: this.writeFile.bind(this),
      unlink:    this.unlink.bind(this),
      readdir:   this.readdir.bind(this),
      mkdir:     this.mkdir.bind(this),
      rmdir:     this.rmdir.bind(this),
      stat:      this.stat.bind(this),
      lstat:     this.lstat.bind(this),
    }
  }

  async writeFile(path, data) {
    const bytes = typeof data === 'string'
      ? new TextEncoder().encode(data)
      : data
    await this._storage.put(`f:${path}`, [...bytes])
  }

  async readFile(path, opts) {
    const raw = await this._storage.get(`f:${path}`)
    if (raw == null) { const e = new Error('ENOENT'); e.code = 'ENOENT'; throw e }
    const bytes = new Uint8Array(raw)
    return (opts === 'utf8' || opts?.encoding === 'utf8')
      ? new TextDecoder().decode(bytes)
      : Buffer.from(bytes)
  }

  async unlink(path)      { await this._storage.delete(`f:${path}`) }
  async mkdir(path)       { await this._storage.put(`d:${path}`, 1) }
  async rmdir(path)       { await this._storage.delete(`d:${path}`) }
  async lstat(path)       { return this.stat(path) }

  async stat(path) {
    const isDir  = await this._storage.get(`d:${path}`) != null
    const isFile = await this._storage.get(`f:${path}`) != null
    if (!isDir && !isFile) { const e = new Error('ENOENT'); e.code = 'ENOENT'; throw e }
    return {
      isFile: ()      => isFile,
      isDirectory: () => isDir,
      isSymbolicLink: () => false,
      size: 0,
      mode: isDir ? 0o755 : 0o644,
      mtimeMs: Date.now(),
      ctimeMs: Date.now(),
      mtime: new Date(),
      ctime: new Date(),
    }
  }

  async readdir(path) {
    // List all keys in storage and filter for immediate children
    const all   = await this._storage.list()
    const prefix = path === '/' ? '/' : path + '/'
    const children = new Set()
    for (const key of all.keys()) {
      for (const pfx of [`f:${prefix}`, `d:${prefix}`]) {
        if (key.startsWith(pfx)) {
          const rest = key.slice(pfx.length)
          if (!rest.includes('/')) children.add(rest)
        }
      }
    }
    return [...children].sort()
  }
}
```

> **Tip:** Durable Object storage has a **128 KiB** per-value limit. For repositories
> with large binary blobs, chunk file writes into smaller pieces or use
> [R2](https://developers.cloudflare.com/r2/) for blob storage and Durable Objects only
> for the metadata/directory tree.

### Compatibility notes

| Runtime | LightningFS | ZenFS InMemory | MemoryFS | DO Adapter |
|---|---|---|---|---|
| Node.js | ✅ (IndexedDB not needed — use `fs` module instead) | ✅ | ✅ | — |
| Browser | ✅ | ✅ | ✅ | — |
| Cloudflare Workers | ❌ (no IndexedDB) | ✅ | ✅ | ✅ (persistent) |
| Deno Deploy | ❌ (no IndexedDB) | ✅ | ✅ | — |
| Bun | ✅ (IndexedDB available) | ✅ | ✅ | — |

---

# Implementing your own `fs`

There are actually TWO possible interfaces for an `fs` object: the classic "callback" API and the newer "promise" API. If your `fs` object provides an enumerable `promises` property, `isomorphic-git` will use the "promise" API _exclusively_.

## Using the "callback" API

A "callback" `fs` object must implement the following subset of node's `fs` module:

  - [fs.readFile(path[, options], callback)](https://nodejs.org/api/fs.html#fs_fs_readfile_path_options_callback)
  - [fs.writeFile(file, data[, options], callback)](https://nodejs.org/api/fs.html#fs_fs_writefile_file_data_options_callback)
  - [fs.unlink(path, callback)](https://nodejs.org/api/fs.html#fs_fs_unlink_path_callback)
  - [fs.readdir(path[, options], callback)](https://nodejs.org/api/fs.html#fs_fs_readdir_path_options_callback)
  - [fs.mkdir(path[, mode], callback)](https://nodejs.org/api/fs.html#fs_fs_mkdir_path_mode_callback)
  - [fs.rmdir(path, callback)](https://nodejs.org/api/fs.html#fs_fs_rmdir_path_callback)
  - [fs.stat(path[, options], callback)](https://nodejs.org/api/fs.html#fs_fs_stat_path_options_callback)
  - [fs.lstat(path[, options], callback)](https://nodejs.org/api/fs.html#fs_fs_lstat_path_options_callback)
  - [fs.readlink(path[, options], callback)](https://nodejs.org/api/fs.html#fs_fs_readlink_path_options_callback) (optional [¹](#footnote-1))
  - [fs.symlink(target, path[, type], callback)](https://nodejs.org/api/fs.html#fs_fs_symlink_target_path_type_callback) (optional [¹](#footnote-1))
  - [fs.chmod(path, mode, callback)](https://nodejs.org/api/fs.html#fs_fs_chmod_path_mode_callback) (optional [²](#footnote-2))
  - [fs.rm(path[, options], callback)](https://nodejs.org/api/fs.html#fs_fs_rm_path_options_callback) (optional [³](#footnote-3))

Internally, `isomorphic-git` wraps the provided "callback" API functions using [`pify`](https://www.npmjs.com/package/pify).

As of node v12 the `fs.promises` API has been stabilized. (`lightning-fs` also provides a `fs.promises` API!) Nowadays, wrapping the callback functions
with `pify` is redundant and potentially less performant than using the native promisified versions. Plus, if you're writing your own `fs` implementation,
the `fs.promises` API lets you write straightforward implementations using `async / await` without the messy optional argument handling the callback API needs.
Therefore a second API is now supported...

## Using the "promise" API (preferred)

A "promise" `fs` object must implement the same set functions as a "callback" implementation, but it implements the promisified versions, and they should all be on a property called `promises`:

  - [fs.promises.readFile(path[, options])](https://nodejs.org/api/fs.html#fs_fspromises_readfile_path_options)
  - [fs.promises.writeFile(file, data[, options])](https://nodejs.org/api/fs.html#fs_fspromises_writefile_file_data_options)
  - [fs.promises.unlink(path)](https://nodejs.org/api/fs.html#fs_fspromises_unlink_path)
  - [fs.promises.readdir(path[, options])](https://nodejs.org/api/fs.html#fs_fspromises_readdir_path_options)
  - [fs.promises.mkdir(path[, mode])](https://nodejs.org/api/fs.html#fs_fspromises_mkdir_path_options)
  - [fs.promises.rmdir(path)](https://nodejs.org/api/fs.html#fs_fspromises_rmdir_path)
  - [fs.promises.stat(path[, options])](https://nodejs.org/api/fs.html#fs_fspromises_stat_path_options)
  - [fs.promises.lstat(path[, options])](https://nodejs.org/api/fs.html#fs_fspromises_lstat_path_options)
  - [fs.promises.readlink(path[, options])](https://nodejs.org/api/fs.html#fs_fspromises_readlink_path_options) (optional [¹](#footnote-1))
  - [fs.promises.symlink(target, path[, type])](https://nodejs.org/api/fs.html#fs_fspromises_symlink_target_path_type) (optional [¹](#footnote-1))
  - [fs.promises.chmod(path, mode)](https://nodejs.org/api/fs.html#fs_fspromises_chmod_path_mode) (optional [²](#footnote-2))
  - [fs.promises.rm(path[, options])](https://nodejs.org/api/fs.html#fs_fspromises_rm_path_options) (optional [³](#footnote-3))

---

<a id="footnote-1">¹</a> `readlink` and `symlink` are only needed to work with git repos that contain symlinks.

<a id="footnote-2">²</a> Right now, isomorphic-git rewrites the file if it needs to change its mode. In the future, if `chmod` is available it will use that.

<a id="footnote-3">³</a> Only called with `recursive: true` option. A fallback implementation is provided if not implemented.
