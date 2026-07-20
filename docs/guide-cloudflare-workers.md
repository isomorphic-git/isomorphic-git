---
id: guide-cloudflare-workers
title: Using isomorphic-git in Cloudflare Workers
sidebar_label: Cloudflare Workers Guide
---

Cloudflare Workers is a popular edge computing platform that runs JavaScript in a V8
isolate environment. While it is extremely capable, it does **not** support IndexedDB —
which is the storage backend used by the default browser filesystem
(`@isomorphic-git/lightning-fs`).

This guide walks through everything you need to run `isomorphic-git` inside a Cloudflare
Worker, from ephemeral in-memory operations all the way to a fully persistent
Git repository backed by Durable Objects.

---

## Why does isomorphic-git need a special fs?

`isomorphic-git` stores all of its Git data (objects, refs, config, index) on a
filesystem. In Node.js this is the native `fs` module. In browsers, `LightningFS` uses
IndexedDB as the underlying store.

Cloudflare Workers provide neither of these. Instead you must pass a custom `fs` object
that implements the subset of the Node.js `fs.promises` API that `isomorphic-git`
requires:

```
readFile · writeFile · unlink
readdir  · mkdir     · rmdir
stat     · lstat     · rm (optional)
```

---

## Option 1 — Ephemeral in-memory operations (MemoryFS)

If you only need to run Git operations **within a single request** (e.g. clone a repo,
read a file, return a response), an in-memory filesystem is the simplest approach.

`isomorphic-git` ships a reference implementation called `MemoryFS`:

```js
// worker.js
import { MemoryFS } from 'isomorphic-git/src/utils/MemoryFS.js'
import git from 'isomorphic-git'
import http from 'isomorphic-git/http/web'

export default {
  async fetch(request, env) {
    const fs = new MemoryFS()

    await git.clone({
      fs,
      http,
      dir: '/repo',
      url: 'https://github.com/isomorphic-git/isomorphic-git',
      singleBranch: true,
      depth: 1,
    })

    const commits = await git.log({ fs, dir: '/repo', depth: 5 })
    return new Response(JSON.stringify(commits, null, 2), {
      headers: { 'content-type': 'application/json' },
    })
  },
}
```

### What MemoryFS stores

Everything is kept in a JavaScript `Map` keyed by file path. When the Worker isolate is
destroyed, all data disappears. This is fine for read-only workflows like:

- Cloning a repo to read a config file
- Rendering markdown from a git tree
- Running `git log` or `git diff` in response to a webhook
- Building a static site at edge on every deploy

---

## Option 2 — Ephemeral with ZenFS InMemory backend

[ZenFS](https://github.com/zen-fs/core) is a more full-featured filesystem library that
also provides an `InMemory` backend. It works in Workers and gives you access to ZenFS's
broader ecosystem of backends if you later need to switch to something persistent.

```toml
# wrangler.toml
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]
```

```js
// worker.js
import { fs, configureSingle } from '@zenfs/core'
import { InMemory } from '@zenfs/core'
import git from 'isomorphic-git'
import http from 'isomorphic-git/http/web'

export default {
  async fetch(request) {
    // Each request gets a fresh filesystem
    await configureSingle({ backend: InMemory })

    await git.init({ fs, dir: '/' })

    const branch = await git.currentBranch({ fs, dir: '/' })
    return new Response(`on branch: ${branch}`)
  },
}
```

> **Warning:** `configureSingle` sets up a single global filesystem. If multiple
> requests run concurrently in the same isolate, they will share state. In production,
> consider constructing a new `MemoryFS` per request instead, which avoids this issue.

---

## Option 3 — Persistent storage with Durable Objects

For use cases where the Git repository must **persist across requests** (e.g. a
collaborative editor, a CI/CD cache, or a personal git host), you need Durable Objects.

A Durable Object is a Cloudflare primitive that gives you a single-threaded, globally-
consistent JavaScript class with its own persistent KV storage.

### Architecture

```
HTTP Request
    │
    ▼
 Worker (stateless)
    │ stub.fetch()
    ▼
 Durable Object (stateful, has storage)
    │  this.storage.*
    ▼
  Persistent KV store (SQLite-backed)
```

The key insight is to implement the `fs.promises` interface on top of
`this.storage` inside the Durable Object.

### Minimal Durable Object filesystem adapter

```js
// do-fs.js
export class DurableObjectFS {
  /**
   * @param {DurableObjectStorage} storage - `this.ctx.storage` from inside a DO
   */
  constructor(storage) {
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
      rm:        this.rm.bind(this),
    }
  }

  // ---- helpers -------------------------------------------------------

  _err(code, msg) {
    const e = new Error(msg)
    e.code = code
    throw e
  }

  // ---- readFile / writeFile ------------------------------------------

  async writeFile(path, data, opts) {
    const bytes =
      typeof data === 'string' ? new TextEncoder().encode(data) : data
    // Store as a plain Array so Durable Objects can serialise it
    await this._storage.put(`f:${path}`, Array.from(bytes))
    // Mark all ancestor directories as existing
    await this._ensureDirs(path)
  }

  async readFile(path, opts) {
    const raw = await this._storage.get(`f:${path}`)
    if (raw == null) this._err('ENOENT', `ENOENT: no such file '${path}'`)
    const bytes = new Uint8Array(raw)
    const enc = typeof opts === 'string' ? opts : opts?.encoding
    return enc ? new TextDecoder(enc).decode(bytes) : Buffer.from(bytes)
  }

  // ---- unlink --------------------------------------------------------

  async unlink(path) {
    const existed = await this._storage.get(`f:${path}`)
    if (existed == null) this._err('ENOENT', `ENOENT: '${path}'`)
    await this._storage.delete(`f:${path}`)
  }

  // ---- mkdir / rmdir -------------------------------------------------

  async mkdir(path, opts) {
    if (await this._storage.get(`d:${path}`) != null) {
      if (opts?.recursive) return
      this._err('EEXIST', `EEXIST: '${path}'`)
    }
    await this._storage.put(`d:${path}`, 1)
    if (opts?.recursive) await this._ensureDirs(path)
  }

  async rmdir(path) {
    const children = await this.readdir(path)
    if (children.length > 0) this._err('ENOTEMPTY', `ENOTEMPTY: '${path}'`)
    await this._storage.delete(`d:${path}`)
  }

  // ---- stat / lstat --------------------------------------------------

  async stat(path) {
    const isDir  = (await this._storage.get(`d:${path}`)) != null
    const isFile = (await this._storage.get(`f:${path}`)) != null
    if (!isDir && !isFile) this._err('ENOENT', `ENOENT: '${path}'`)
    return {
      isFile:         () => isFile,
      isDirectory:    () => isDir,
      isSymbolicLink: () => false,
      size:    0,
      mode:    isDir ? 0o755 : 0o644,
      mtimeMs: Date.now(),
      ctimeMs: Date.now(),
      mtime:   new Date(),
      ctime:   new Date(),
    }
  }

  async lstat(path) { return this.stat(path) }

  // ---- readdir -------------------------------------------------------

  async readdir(path) {
    // Ensure the directory itself exists
    if (path !== '/') {
      const d = await this._storage.get(`d:${path}`)
      if (d == null) this._err('ENOENT', `ENOENT: '${path}'`)
    }
    const prefix = path === '/' ? '/' : path + '/'
    const all = await this._storage.list()
    const children = new Set()
    for (const key of all.keys()) {
      for (const tag of ['f:', 'd:']) {
        const full = tag + prefix
        if (key.startsWith(full)) {
          const rest = key.slice(full.length)
          const name = rest.split('/')[0]
          if (name) children.add(name)
        }
      }
    }
    return [...children].sort()
  }

  // ---- rm (recursive) ------------------------------------------------

  async rm(path, opts) {
    const force = opts?.force ?? false
    const stat = await this._storage.get(`d:${path}`) != null ? 'dir'
               : await this._storage.get(`f:${path}`) != null ? 'file'
               : null
    if (!stat && force) return
    if (!stat) this._err('ENOENT', `ENOENT: '${path}'`)

    if (stat === 'file') {
      await this._storage.delete(`f:${path}`)
      return
    }

    if (!opts?.recursive) this._err('EISDIR', `EISDIR: '${path}'`)

    // Delete the directory and all descendants
    const all = await this._storage.list()
    const toDelete = []
    const prefix = path === '/' ? '/' : path + '/'
    for (const key of all.keys()) {
      if (key === `d:${path}` || key.startsWith(`f:${prefix}`) || key.startsWith(`d:${prefix}`)) {
        toDelete.push(key)
      }
    }
    await this._storage.delete(toDelete)
  }

  // ---- internal: ensure ancestor dirs exist --------------------------

  async _ensureDirs(filePath) {
    const parts = filePath.split('/').filter(Boolean)
    let current = ''
    for (let i = 0; i < parts.length - 1; i++) {
      current += '/' + parts[i]
      if ((await this._storage.get(`d:${current}`)) == null) {
        await this._storage.put(`d:${current}`, 1)
      }
    }
    // Always ensure root
    if ((await this._storage.get('d:/')) == null) {
      await this._storage.put('d:/', 1)
    }
  }
}
```

### Complete Durable Object Worker example

```js
// git-do.js — the Durable Object
import { DurableObjectFS } from './do-fs.js'
import git from 'isomorphic-git'
import http from 'isomorphic-git/http/web'

export class GitRepository {
  constructor(state, env) {
    this.ctx = state
    this.env = env
  }

  async fetch(request) {
    const fs = new DurableObjectFS(this.ctx.storage)
    const url = new URL(request.url)

    if (url.pathname === '/init') {
      await git.init({ fs, dir: '/' })
      return new Response('repo initialized')
    }

    if (url.pathname === '/log') {
      const commits = await git.log({ fs, dir: '/', depth: 10 })
      return new Response(JSON.stringify(commits), {
        headers: { 'content-type': 'application/json' },
      })
    }

    return new Response('Not found', { status: 404 })
  }
}

// worker.js — the stateless Worker entrypoint
export default {
  async fetch(request, env) {
    const id = env.GIT_REPO.idFromName('my-repo')
    const stub = env.GIT_REPO.get(id)
    return stub.fetch(request)
  },
}
```

```toml
# wrangler.toml
name = "git-worker"
main = "worker.js"
compatibility_date = "2024-01-01"

[[durable_objects.bindings]]
name = "GIT_REPO"
class_name = "GitRepository"

[[migrations]]
tag = "v1"
new_classes = ["GitRepository"]
```

> **Storage limits:**
> - Each Durable Object storage key: max **128 KiB** value size
> - For packfiles or large blobs, split them into chunks or use R2 for blob storage
>   and keep only the Git metadata (tree, commit, ref) in Durable Object storage.

---

## Troubleshooting

### `ReferenceError: indexedDB is not defined`

You are using `LightningFS` or `ZenFS` with the `IndexedDB` backend. Switch to
`MemoryFS` or `ZenFS` with the `InMemory` backend.

### `ReferenceError: Buffer is not defined`

Enable the `nodejs_compat` compatibility flag in `wrangler.toml`:

```toml
compatibility_flags = ["nodejs_compat"]
```

### `Error: CORS`

Cloudflare Workers can make cross-origin `fetch` requests natively — you do not need a
CORS proxy for Workers-to-GitHub traffic. Remove `corsProxy` from your `git.clone` call.

### `TypeError: Failed to fetch` (private repos)

Pass an `onAuth` callback to provide credentials:

```js
await git.clone({
  fs,
  http,
  dir: '/repo',
  url: 'https://github.com/org/private-repo',
  onAuth: () => ({
    username: 'token',
    password: env.GITHUB_TOKEN,
  }),
})
```

---

## Summary

| Need | Solution |
|---|---|
| Read-only, single request | `MemoryFS` (built-in) |
| Read-write, single request | `MemoryFS` or ZenFS `InMemory` |
| Persistent across requests | Durable Objects + `DurableObjectFS` adapter |
| Very large repos / blobs | Durable Objects for metadata + R2 for blobs |

Further reading:
- [fs documentation](./fs.md) — full `fs.promises` interface reference
- [Cloudflare Durable Objects docs](https://developers.cloudflare.com/durable-objects/)
- [ZenFS backends](https://github.com/zen-fs/core#backends)
