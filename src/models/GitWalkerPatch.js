import { join } from '../utils/join'

export class GitWalkerPatch {
  constructor ({ patch }) {
    this.map = new Map()

    const cachePatch = (patch, root) => {
      const fullpath = root && root !== '.' ? `${root}/${patch.basename}` : patch.basename
      this.map.set(fullpath, patch)
      if (patch.subOps) {
        for (const subOp of patch.subOps) {
          cachePatch(subOp, fullpath)
        }
      }
    }
    cachePatch(patch)

    const walker = this
    this.ConstructEntry = class PatchEntry {
      constructor (entry) {
        Object.assign(this, entry)
      }

      async populateStat () {
        if (!this.exists) return
        await walker.populateStat(this)
      }

      async populateContent () {
        if (!this.exists) return
        await walker.populateContent(this)
      }

      async populateHash () {
        if (!this.exists) return
        await walker.populateHash(this)
      }
    }
  }

  async readdir (entry) {
    if (!entry.exists) return []
    const filepath = entry.fullpath
    const children = this.map.get(filepath).subOps
    if (!children) return []
    return children.map(entry => ({
      fullpath: join(filepath, entry.basename),
      basename: entry.basename,
      exists: true,
      // and here we kinda break the rules but whatever
      after: entry.after,
      before: entry.before,
      ops: entry.ops
    }))
  }

  async populateStat (entry) {
    // Not implemented
  }

  async populateContent (entry) {
    // Not implemented
  }

  async populateHash (entry) {
    // Not implemented
  }
}
