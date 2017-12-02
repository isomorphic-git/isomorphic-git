import { GitIndexManager } from '../managers'
import { fs as defaultfs, setfs } from '../utils'

export async function list ({ gitdir, fs = defaultfs() }) {
  setfs(fs)
  let filenames
  await GitIndexManager.acquire(`${gitdir}/index`, async function (index) {
    filenames = index.entries.map(x => x.path)
  })
  return filenames
}

export function mixinList (BaseClass) {
  return class extends BaseClass {
    constructor (...args) {
      super(...args)
    }
    async list () {
      return list({
        gitdir: this.gitdir,
        fs: this.fs
      })
    }
  }
}
