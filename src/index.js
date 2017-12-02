export * from './commands'
import * as managers from './managers'
export { managers }
import * as models from './models'
export { models }
import * as utils from './utils'
export { utils }

import { pkg } from './utils/pkg'

export class Git {
  constructor ({ fs, dir, workdir, gitdir }) {
    if (fs) this.fs = fs
    if (dir) {
      this.workdir = dir
      this.gitdir = `${dir}/.git`
    }
    if (workdir) this.workdir = workdir
    if (gitdir) this.gitdir = gitdir
    if (!this.fs) {
      throw new Error("Missing required argument 'fs' in Git constructor.")
    }
    if (!this.gitdir) {
      throw new Error("Missing required argument 'gitdir' in Git constructor.")
    }
  }
  static version () {
    return pkg.version
  }
}
