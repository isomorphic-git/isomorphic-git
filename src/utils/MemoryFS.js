/**
 * MemoryFS — a zero-dependency, in-memory filesystem for isomorphic-git.
 *
 * Works in **any** JavaScript environment: Cloudflare Workers, Deno Deploy,
 * browsers, Node.js, Bun — anything that lacks IndexedDB or a native `fs`
 * module.
 *
 * Usage:
 * ```js
 * import git from 'isomorphic-git'
 * import { MemoryFS } from 'isomorphic-git/src/utils/MemoryFS.js'
 *
 * const fs = new MemoryFS()
 * await git.init({ fs, dir: '/' })
 * ```
 *
 * ⚠️  **Persistence**: all data lives in JavaScript heap memory.
 *    When the runtime process / Worker terminates the data is lost.
 *    For persistence see the Cloudflare Durable Objects adapter example in
 *    `docs/guide-cloudflare-workers.md`.
 */

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function normalizePath(path) {
  // Collapse multiple slashes, ensure leading slash, strip trailing slash
  let p = ('/' + path).replace(/\/+/g, '/')
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1)
  return p
}

function dirname(path) {
  const p = normalizePath(path)
  const idx = p.lastIndexOf('/')
  return idx === 0 ? '/' : p.slice(0, idx)
}

function basename(path) {
  const p = normalizePath(path)
  return p.slice(p.lastIndexOf('/') + 1)
}

/**
 * @typedef {{ type: 'file' | 'dir', content: Uint8Array | null, mode: number, mtimeMs: number, ctimeMs: number }} Entry
 */

// ---------------------------------------------------------------------------
// Stat object
// ---------------------------------------------------------------------------

class Stats {
  constructor({ type, mode, size, mtimeMs, ctimeMs }) {
    this.type = type
    this.mode = mode
    this.size = size
    this.mtimeMs = mtimeMs
    this.ctimeMs = ctimeMs
    this.mtime = new Date(mtimeMs)
    this.ctime = new Date(ctimeMs)
  }

  isFile() {
    return this.type === 'file'
  }

  isDirectory() {
    return this.type === 'dir'
  }

  isSymbolicLink() {
    return false
  }
}

// ---------------------------------------------------------------------------
// MemoryFS class
// ---------------------------------------------------------------------------

export class MemoryFS {
  constructor() {
    /** @type {Map<string, Entry>} */
    this._store = new Map()
    // Pre-create the root directory
    this._store.set('/', {
      type: 'dir',
      content: null,
      mode: 0o755,
      mtimeMs: Date.now(),
      ctimeMs: Date.now(),
    })

    // isomorphic-git always reads via fs.promises
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
      // Symlinks — MemoryFS does not support symlinks but must expose the
      // methods so isomorphic-git's FileSystem wrapper can bind them.
      readlink:  this.readlink.bind(this),
      symlink:   this.symlink.bind(this),
      chmod:     this.chmod.bind(this),
    }
  }

  // -------------------------------------------------------------------------
  // readFile
  // -------------------------------------------------------------------------

  /**
   * @param {string} path
   * @param {{ encoding?: string } | string} [options]
   * @returns {Promise<Buffer | string>}
   */
  async readFile(path, options) {
    const p = normalizePath(path)
    const entry = this._store.get(p)

    if (!entry) {
      const err = new Error(`ENOENT: no such file or directory, open '${p}'`)
      err.code = 'ENOENT'
      throw err
    }

    if (entry.type !== 'file') {
      const err = new Error(`EISDIR: illegal operation on a directory, read '${p}'`)
      err.code = 'EISDIR'
      throw err
    }

    const encoding =
      typeof options === 'string'
        ? options
        : options && options.encoding
        ? options.encoding
        : null

    if (encoding) {
      return new TextDecoder(encoding).decode(entry.content)
    }

    // Return a Buffer-like Uint8Array; isomorphic-git handles both
    return Buffer.from(entry.content)
  }

  // -------------------------------------------------------------------------
  // writeFile
  // -------------------------------------------------------------------------

  /**
   * @param {string} path
   * @param {string | Uint8Array | Buffer} data
   * @param {{ encoding?: string, mode?: number } | string} [options]
   */
  async writeFile(path, data, options) {
    const p = normalizePath(path)

    // Ensure parent directory exists
    const parent = dirname(p)
    if (!this._store.has(parent)) {
      const err = new Error(`ENOENT: no such file or directory, open '${p}'`)
      err.code = 'ENOENT'
      throw err
    }
    if (this._store.get(parent).type !== 'dir') {
      const err = new Error(`ENOTDIR: not a directory, open '${p}'`)
      err.code = 'ENOTDIR'
      throw err
    }

    let content
    if (typeof data === 'string') {
      const encoding =
        typeof options === 'string'
          ? options
          : options && options.encoding
          ? options.encoding
          : 'utf8'
      content = new TextEncoder().encode(data)
      void encoding // encoding is effectively handled by TextEncoder above
    } else {
      content = data instanceof Uint8Array ? data : new Uint8Array(data)
    }

    const mode =
      options && typeof options === 'object' && options.mode != null
        ? options.mode
        : 0o666

    const now = Date.now()
    this._store.set(p, {
      type: 'file',
      content: new Uint8Array(content),
      mode,
      mtimeMs: now,
      ctimeMs: now,
    })
  }

  // -------------------------------------------------------------------------
  // unlink
  // -------------------------------------------------------------------------

  /** @param {string} path */
  async unlink(path) {
    const p = normalizePath(path)
    const entry = this._store.get(p)

    if (!entry) {
      const err = new Error(`ENOENT: no such file or directory, unlink '${p}'`)
      err.code = 'ENOENT'
      throw err
    }
    if (entry.type !== 'file') {
      const err = new Error(`EISDIR: illegal operation on a directory, unlink '${p}'`)
      err.code = 'EISDIR'
      throw err
    }

    this._store.delete(p)
  }

  // -------------------------------------------------------------------------
  // readdir
  // -------------------------------------------------------------------------

  /** @param {string} path */
  async readdir(path) {
    const p = normalizePath(path)
    const entry = this._store.get(p)

    if (!entry) {
      const err = new Error(`ENOENT: no such file or directory, scandir '${p}'`)
      err.code = 'ENOENT'
      throw err
    }
    if (entry.type !== 'dir') {
      const err = new Error(`ENOTDIR: not a directory, scandir '${p}'`)
      err.code = 'ENOTDIR'
      throw err
    }

    const prefix = p === '/' ? '/' : p + '/'
    const children = new Set()

    for (const key of this._store.keys()) {
      if (key === p) continue
      if (key.startsWith(prefix)) {
        // Only immediate children (no nested slashes after the prefix)
        const rest = key.slice(prefix.length)
        if (!rest.includes('/')) {
          children.add(rest)
        }
      }
    }

    return [...children].sort()
  }

  // -------------------------------------------------------------------------
  // mkdir
  // -------------------------------------------------------------------------

  /**
   * @param {string} path
   * @param {{ recursive?: boolean, mode?: number } | number} [options]
   */
  async mkdir(path, options) {
    const p = normalizePath(path)
    const recursive =
      options && typeof options === 'object' ? !!options.recursive : false
    const mode =
      options && typeof options === 'object' && options.mode != null
        ? options.mode
        : typeof options === 'number'
        ? options
        : 0o755

    if (this._store.has(p)) {
      if (recursive) return // already exists — not an error in recursive mode
      const err = new Error(`EEXIST: file already exists, mkdir '${p}'`)
      err.code = 'EEXIST'
      throw err
    }

    if (recursive) {
      // Create all missing ancestor directories
      const parts = p.split('/').filter(Boolean)
      let current = ''
      for (const part of parts) {
        current += '/' + part
        if (!this._store.has(current)) {
          const now = Date.now()
          this._store.set(current, {
            type: 'dir',
            content: null,
            mode,
            mtimeMs: now,
            ctimeMs: now,
          })
        }
      }
      return
    }

    // Non-recursive: parent must exist
    const parent = dirname(p)
    if (!this._store.has(parent)) {
      const err = new Error(`ENOENT: no such file or directory, mkdir '${p}'`)
      err.code = 'ENOENT'
      throw err
    }

    const now = Date.now()
    this._store.set(p, {
      type: 'dir',
      content: null,
      mode,
      mtimeMs: now,
      ctimeMs: now,
    })
  }

  // -------------------------------------------------------------------------
  // rmdir
  // -------------------------------------------------------------------------

  /** @param {string} path */
  async rmdir(path) {
    const p = normalizePath(path)
    const entry = this._store.get(p)

    if (!entry) {
      const err = new Error(`ENOENT: no such file or directory, rmdir '${p}'`)
      err.code = 'ENOENT'
      throw err
    }
    if (entry.type !== 'dir') {
      const err = new Error(`ENOTDIR: not a directory, rmdir '${p}'`)
      err.code = 'ENOTDIR'
      throw err
    }

    // Check the directory is empty
    const children = await this.readdir(p)
    if (children.length > 0) {
      const err = new Error(`ENOTEMPTY: directory not empty, rmdir '${p}'`)
      err.code = 'ENOTEMPTY'
      throw err
    }

    this._store.delete(p)
  }

  // -------------------------------------------------------------------------
  // stat / lstat (identical — MemoryFS has no symlinks)
  // -------------------------------------------------------------------------

  /** @param {string} path */
  async stat(path) {
    const p = normalizePath(path)
    const entry = this._store.get(p)

    if (!entry) {
      const err = new Error(`ENOENT: no such file or directory, stat '${p}'`)
      err.code = 'ENOENT'
      throw err
    }

    return new Stats({
      type: entry.type,
      mode: entry.mode,
      size: entry.content ? entry.content.byteLength : 0,
      mtimeMs: entry.mtimeMs,
      ctimeMs: entry.ctimeMs,
    })
  }

  /** @param {string} path */
  async lstat(path) {
    return this.stat(path)
  }

  // -------------------------------------------------------------------------
  // readlink / symlink / chmod  (MemoryFS has no symlink support)
  // -------------------------------------------------------------------------

  /**
   * MemoryFS does not support symlinks. Throws ENOENT, which causes
   * isomorphic-git to treat the path as a regular file (safe fallback).
   * @param {string} path
   */
  async readlink(path) {
    const err = new Error(`ENOENT: no such file or directory, readlink '${path}'`)
    err.code = 'ENOENT'
    throw err
  }

  /**
   * MemoryFS does not support symlinks. Throws ENOSYS.
   * @param {string} _target
   * @param {string} _path
   */
  async symlink(_target, _path) {
    const err = new Error('ENOSYS: function not implemented, symlink')
    err.code = 'ENOSYS'
    throw err
  }

  /**
   * chmod is a no-op in MemoryFS (mode is stored but not enforced).
   * @param {string} path
   * @param {number} mode
   */
  async chmod(path, mode) {
    const p = normalizePath(path)
    const entry = this._store.get(p)
    if (!entry) {
      const err = new Error(`ENOENT: no such file or directory, chmod '${p}'`)
      err.code = 'ENOENT'
      throw err
    }
    entry.mode = mode
  }

  // -------------------------------------------------------------------------
  // rm  (recursive remove — used internally by isomorphic-git)
  // -------------------------------------------------------------------------

  /**
   * @param {string} path
   * @param {{ recursive?: boolean, force?: boolean }} [options]
   */
  async rm(path, options) {
    const p = normalizePath(path)
    const recursive = options && options.recursive
    const force = options && options.force

    const entry = this._store.get(p)

    if (!entry) {
      if (force) return
      const err = new Error(`ENOENT: no such file or directory, rm '${p}'`)
      err.code = 'ENOENT'
      throw err
    }

    if (entry.type === 'dir' && !recursive) {
      const err = new Error(`EISDIR: illegal operation on a directory, rm '${p}'`)
      err.code = 'EISDIR'
      throw err
    }

    // Delete the entry and everything beneath it
    const prefix = p === '/' ? '/' : p + '/'
    for (const key of [...this._store.keys()]) {
      if (key === p || key.startsWith(prefix)) {
        this._store.delete(key)
      }
    }
  }
}

export default MemoryFS
