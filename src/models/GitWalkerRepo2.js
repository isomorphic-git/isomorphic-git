import { GitRefManager } from '../managers/GitRefManager.js'
import { E, GitError } from '../models/GitError.js'
import { readObject } from '../storage/readObject.js'
import { join } from '../utils/join'
import { normalizeMode } from '../utils/normalizeMode.js'
import { resolveTree } from '../utils/resolveTree.js'

import { FileSystem } from './FileSystem.js'
import { GitTree } from './GitTree.js'

export class GitWalkerRepo2 {
  constructor ({ fs: _fs, gitdir, ref }) {
    const fs = new FileSystem(_fs)
    this.fs = fs
    this.gitdir = gitdir
    this.mapPromise = (async () => {
      const map = new Map()
      let oid
      try {
        oid = await GitRefManager.resolve({ fs, gitdir, ref })
      } catch (e) {
        // Handle fresh branches with no commits
        if (e.code === E.ResolveRefError) {
          oid = '4b825dc642cb6eb9a060e54bf8d69288fbee4904'
        }
      }
      const tree = await resolveTree({ fs, gitdir, oid })
      tree.type = 'tree'
      tree.mode = '40000'
      map.set('.', tree)
      return map
    })()
    const walker = this
    this.ConstructEntry = class TreeEntry {
      constructor (entry) {
        Object.assign(this, entry)
        this._type = false
        this._mode = false
        this._stat = false
        this._content = false
        this._oid = false
      }

      async type () {
        return walker.type(this)
      }

      async mode () {
        return walker.mode(this)
      }

      async stat () {
        return walker.stat(this)
      }

      async content () {
        return walker.content(this)
      }

      async oid () {
        return walker.oid(this)
      }
    }
  }

  async readdir (entry) {
    if (!entry.exists) return []
    const filepath = entry.fullpath
    const { fs, gitdir } = this
    const map = await this.mapPromise
    const obj = map.get(filepath)
    if (!obj) throw new Error(`No obj for ${filepath}`)
    const oid = obj.oid
    if (!oid) throw new Error(`No oid for obj ${JSON.stringify(obj)}`)
    if (obj.type !== 'tree') {
      // TODO: support submodules (type === 'commit')
      return null
    }
    const { type, object } = await readObject({ fs, gitdir, oid })
    if (type !== obj.type) {
      throw new GitError(E.ObjectTypeAssertionFail, {
        oid,
        expected: obj.type,
        type
      })
    }
    const tree = GitTree.from(object)
    // cache all entries
    for (const entry of tree) {
      map.set(join(filepath, entry.path), entry)
    }
    return tree.entries().map(entry => ({
      fullpath: join(filepath, entry.path),
      basename: entry.path,
      exists: true
    }))
  }

  async type (entry) {
    if (!entry.exists) return
    if (entry._type === false) {
      const map = await this.mapPromise
      const { type } = map.get(entry.fullpath)
      entry._type = type
    }
    return entry._type
  }

  async mode (entry) {
    if (!entry.exists) return
    if (entry._mode === false) {
      const map = await this.mapPromise
      const { mode } = map.get(entry.fullpath)
      entry._mode = normalizeMode(parseInt(mode, 8))
    }
    return entry._mode
  }

  async stat (_entry) {
    return
  }

  async content (entry) {
    if (!entry.exists) return
    if (entry._content === false) {
      const map = await this.mapPromise
      const { fs, gitdir } = this
      const obj = map.get(entry.fullpath)
      const oid = obj.oid
      const { type, object } = await readObject({ fs, gitdir, oid })
      if (type !== 'blob') {
        entry._content = void 0
      } else {
        entry._content = object
      }
    }
    return entry._content
  }

  async oid (entry) {
    if (!entry.exists) return
    if (entry._oid === false) {
      const map = await this.mapPromise
      const obj = map.get(entry.fullpath)
      entry._oid = obj.oid
    }
    return entry._oid
  }
}
