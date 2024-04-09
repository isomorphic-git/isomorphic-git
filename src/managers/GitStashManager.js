import { _readCommit } from '../commands/readCommit'
import { _writeCommit } from '../commands/writeCommit'
import { MissingNameError } from '../errors/MissingNameError'
import { GitRefStash } from '../models/GitRefStash'
import { join } from '../utils/join'
import { normalizeAuthorObject } from '../utils/normalizeAuthorObject'
import { acquireLock } from '../utils/walkerToTreeEntryMap'

import { GitRefManager } from './GitRefManager'

export class GitStashManager {
  constructor({ fs, dir, gitdir = join(dir, '.git') }) {
    Object.assign(this, {
      fs,
      dir,
      gitdir,
      _author: null,
    })
  }

  static get refStash() {
    return 'refs/stash'
  }

  static get refLogsStash() {
    return 'logs/refs/stash'
  }

  get refStashPath() {
    return join(this.gitdir, GitStashManager.refStash)
  }

  get refLogsStashPath() {
    return join(this.gitdir, GitStashManager.refLogsStash)
  }

  async getAuthor() {
    if (!this._author) {
      this._author = await normalizeAuthorObject({
        fs: this.fs,
        gitdir: this.gitdir,
        author: {},
      })
      if (!this._author) throw new MissingNameError('author')
    }
    return this._author
  }

  async getStashSHA() {
    if (!(await this.fs.exists(this.refStashPath))) {
      return null
    }

    return GitRefManager.resolve({
      fs: this.fs,
      gitdir: this.gitdir,
      ref: GitStashManager.refStash,
    })
  }

  async writeStashCommit({ message, tree, parent }) {
    return _writeCommit({
      fs: this.fs,
      gitdir: this.gitdir,
      commit: {
        message,
        tree,
        parent,
        author: await this.getAuthor(),
        committer: await this.getAuthor(),
      },
    })
  }

  async readStashCommit() {
    const stashSHA = await this.getStashSHA()
    if (!stashSHA) {
      return {} // no stash found
    }

    // get the stash commit object
    return _readCommit({
      fs: this.fs,
      cache: {},
      gitdir: this.gitdir,
      oid: stashSHA,
    })
  }

  async writeStashRef(stashCommit) {
    return GitRefManager.writeRef({
      fs: this.fs,
      gitdir: this.gitdir,
      ref: GitStashManager.refStash,
      value: stashCommit,
    })
  }

  async writeStashReflogEntry({ stashCommit, message }) {
    const author = await this.getAuthor()
    const entry = GitRefStash.createStashReflogEntry(
      author,
      stashCommit,
      message
    )
    const filepath = this.refLogsStashPath

    await acquireLock({ filepath, entry }, async () => {
      const appendTo = (await this.fs.exists(filepath))
        ? await this.fs.read(filepath, 'utf8')
        : ''
      await this.fs.write(filepath, appendTo + entry, 'utf8')
    })
  }

  async readStashReflogs({ parsed = false }) {
    if (!(await this.fs.exists(this.refLogsStashPath))) {
      return []
    }

    const reflogBuffer = await this.fs.read(this.refLogsStashPath)
    const reflogString = reflogBuffer.toString()

    return GitRefStash.getStashReflogEntry(reflogString, parsed)
  }
}
