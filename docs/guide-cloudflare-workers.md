---
id: guide-cloudflare-workers
title: Using isomorphic-git in Cloudflare Workers
sidebar_label: Cloudflare Workers Guide
---

Cloudflare Workers is a popular edge computing platform that runs JavaScript in a V8
isolate environment. It does **not** support IndexedDB — which is the storage backend
used by `@isomorphic-git/lightning-fs` by default.

This guide explains how to use `isomorphic-git` inside a Cloudflare Worker using
`LightningFS`'s pluggable backend system.

---

## Why does LightningFS need a custom backend?

`LightningFS` separates the **filesystem logic** (directory trees, stat objects, path
resolution) from the **storage layer**. The storage layer is a plain object that
implements five methods:

| Method | Purpose |
|---|---|
| `saveSuperblock(superblock)` | Persist the serialised directory tree |
| `loadSuperblock()` | Load the directory tree on startup |
| `readFile(inode)` | Read raw file bytes by inode key |
| `writeFile(inode, data)` | Write raw file bytes by inode key |
| `unlink(inode)` | Delete a file by inode key |

The default storage layer (`IdbBackend`) uses IndexedDB. Swap it out and you can
run LightningFS — and therefore `isomorphic-git` — anywhere.

---

## Option 1 — Ephemeral in-memory (MemoryBackend)

For workflows that only need to run Git operations within a **single request** (e.g.
clone a repo, read a file, return a response), an in-memory backend is ideal:

```js
// MemoryBackend.js
export class MemoryBackend {
  constructor() {
    this._map = new Map()
  }
  saveSuperblock(superblock) { this._map.set('!root', superblock) }
  loadSuperblock()           { return this._map.get('!root') || null }
  readFile(inode)            { return this._map.get(inode) || null }
  writeFile(inode, data)     { this._map.set(inode, data) }
  unlink(inode)              { this._map.delete(inode) }
  async wipe()               { this._map.clear() }
}
```

> **Note:** `MemoryBackend` is tracked for inclusion in `@isomorphic-git/lightning-fs`
> as a first-class export. Until then, paste the class above into your project.

Use it with LightningFS and isomorphic-git:

```js
// worker.js
import LightningFS from '@isomorphic-git/lightning-fs'
import git from 'isomorphic-git'
import http from 'isomorphic-git/http/web'
import { MemoryBackend } from './MemoryBackend.js'

export default {
  async fetch(request, env) {
    // Each request gets a fresh in-memory filesystem
    const fs = new LightningFS('mem', { db: new MemoryBackend() })

    await git.clone({
      fs,
      http,
      dir: '/',
      url: 'https://github.com/isomorphic-git/isomorphic-git',
      singleBranch: true,
      depth: 1,
    })

    const commits = await git.log({ fs, dir: '/', depth: 5 })
    return new Response(JSON.stringify(commits, null, 2), {
      headers: { 'content-type': 'application/json' },
    })
  },
}
```

This is perfect for:
- Cloning a repo to read a config file at the edge
- Rendering markdown from a git tree
- Running `git log` / `git diff` in response to a webhook
- Building a static site at the edge on every deploy

---

## Option 2 — ZenFS InMemory backend

[ZenFS](https://github.com/zen-fs/core) is a separate library that also provides an
`InMemory` backend and implements the full `fs.promises` API without going through
LightningFS:

```toml
# wrangler.toml
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]
```

```js
import { fs, configureSingle } from '@zenfs/core'
import { InMemory } from '@zenfs/core'
import git from 'isomorphic-git'
import http from 'isomorphic-git/http/web'

export default {
  async fetch(request) {
    await configureSingle({ backend: InMemory })

    await git.clone({ fs, http, dir: '/', url: 'https://github.com/example/repo', singleBranch: true, depth: 1 })

    return new Response('ok')
  },
}
```

> **Warning:** `configureSingle` sets a global filesystem. If requests run concurrently
> in the same isolate, they share state. Prefer `MemoryBackend` with LightningFS if you
> need per-request isolation.

---

## Option 3 — Persistent storage (Durable Objects backend)

If the repository must **survive across requests**, replace `MemoryBackend` with a backend
that persists to [Durable Object storage](https://developers.cloudflare.com/durable-objects/).
The five-method interface is the same — only the storage medium changes:

```js
// DurableBackend.js
export class DurableBackend {
  constructor(storage) {
    // `storage` is `this.ctx.storage` from inside a Durable Object
    this._storage = storage
  }
  async saveSuperblock(superblock) { await this._storage.put('!root', superblock) }
  async loadSuperblock()           { return (await this._storage.get('!root')) || null }
  async readFile(inode)            { return (await this._storage.get(inode)) || null }
  async writeFile(inode, data)     { await this._storage.put(inode, data) }
  async unlink(inode)              { await this._storage.delete(inode) }
  async wipe()                     { await this._storage.deleteAll() }
}
```

Use it inside a Durable Object class:

```js
// GitRepository.js — the Durable Object
import LightningFS from '@isomorphic-git/lightning-fs'
import git from 'isomorphic-git'
import http from 'isomorphic-git/http/web'
import { DurableBackend } from './DurableBackend.js'

export class GitRepository {
  constructor(state, env) {
    this.ctx = state
  }

  async fetch(request) {
    const fs = new LightningFS('repo', { db: new DurableBackend(this.ctx.storage) })
    const url = new URL(request.url)

    if (url.pathname === '/init') {
      await git.init({ fs, dir: '/' })
      return new Response('initialized')
    }
    if (url.pathname === '/log') {
      const log = await git.log({ fs, dir: '/', depth: 10 })
      return new Response(JSON.stringify(log), { headers: { 'content-type': 'application/json' } })
    }

    return new Response('not found', { status: 404 })
  }
}

// worker.js
export default {
  async fetch(request, env) {
    const id = env.GIT_REPO.idFromName('my-repo')
    return env.GIT_REPO.get(id).fetch(request)
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

> **Storage limits:** Durable Object values have a **128 KiB** limit. For repos with
> large binary blobs, store file data in [R2](https://developers.cloudflare.com/r2/) and
> keep only the superblock + inode metadata in Durable Object storage.

---

## Troubleshooting

### `ReferenceError: indexedDB is not defined`
You are using the default `LightningFS` without a custom `db` backend. Pass
`{ db: new MemoryBackend() }` as shown above.

### `ReferenceError: Buffer is not defined`
Add `nodejs_compat` to `wrangler.toml`:
```toml
compatibility_flags = ["nodejs_compat"]
```

### `TypeError: Failed to fetch` on clone
Remove `corsProxy` — Cloudflare Workers can make cross-origin `fetch` requests natively.

### Cloning a private repo
Pass credentials via `onAuth`:
```js
await git.clone({
  fs, http, dir: '/',
  url: 'https://github.com/org/private-repo',
  onAuth: () => ({ username: 'token', password: env.GITHUB_TOKEN }),
})
```

---

## Summary

| Goal | Recommended approach |
|---|---|
| Read-only, single request | LightningFS + `MemoryBackend` |
| Read-write, single request | LightningFS + `MemoryBackend` |
| Persistent across requests | LightningFS + `DurableBackend` |

Further reading:
- [fs documentation](./fs.md) — the `fs.promises` interface and custom backend docs
- [Cloudflare Durable Objects](https://developers.cloudflare.com/durable-objects/)
- [LightningFS custom backends](https://github.com/isomorphic-git/lightning-fs)
