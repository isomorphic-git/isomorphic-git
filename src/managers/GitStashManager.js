import '../typedefs.js'

import { _readCommit } from '../commands/readCommit'
import { _writeCommit } from '../commands/writeCommit'
import { InvalidRefNameError } from '../errors/InvalidRefNameError.js'
import { MissingNameError } from '../errors/MissingNameError'
import { GitRefStash } from '../models/GitRefStash'
import { join } from '../utils/join'
import { normalizeAuthorObject } from '../utils/normalizeAuthorObject'
import { acquireLock } from '../utils/walkerToTreeEntryMap'

import { GitRefManager } from './GitRefManager'

export class GitStashManager {
  /**
   * Creates an instance of GitStashManager.
   *
   * @param {Object} args
   * @param {FSClient} args.fs - A file system implementation.
   * @param {string} args.dir - The working directory.
   * @param {string}[args.gitdir=join(dir, '.git')] - [required] The [git directory](dir-vs-gitdir.md) path
   */
  constructor({ fs, dir, gitdir = join(dir, '.git') }) {
    Object.assign(this, {
      fs,
      dir,
      gitdir,
      _author: null,
    })
  }

  /**
   * Gets the reference name for the stash.
   *
   * @returns {string} - The stash reference name.
   */
  static get refStash() {
    return 'refs/stash'
  }

  /**
   * Gets the reference name for the stash reflogs.
   *
   * @returns {string} - The stash reflogs reference name.
   */
  static get refLogsStash() {
    return 'logs/refs/stash'
  }

  /**
   * Gets the file path for the stash reference.
   *
   * @returns {string} - The file path for the stash reference.
   */
  get refStashPath() {
    return join(this.gitdir, GitStashManager.refStash)
  }

  /**
   * Gets the file path for the stash reflogs.
   *
   * @returns {string} - The file path for the stash reflogs.
   */
  get refLogsStashPath() {
    return join(this.gitdir, GitStashManager.refLogsStash)
  }

  /**
   * Retrieves the author information for the stash.
   *
   * @returns {Promise<Object>} - The author object.
   * @throws {MissingNameError} - If the author name is missing.
   */
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

  /**
   * Gets the SHA of a stash entry by its index.
   *
   * @param {number} refIdx - The index of the stash entry.
   * @param {string[]} [stashEntries] - Optional preloaded stash entries.
   * @returns {Promise<string|null>} - The SHA of the stash entry or `null` if not found.
   */
  async getStashSHA(refIdx, stashEntries) {
    if (!(await this.fs.exists(this.refStashPath))) {
      return null
    }

    const entries =
      stashEntries || (await this.readStashReflogs({ parsed: false }))
    return entries[refIdx].split(' ')[1]
  }

  /**
   * Writes a stash commit to the repository.
   *
   * @param {Object} args
   * @param {string} args.message - The commit message.
   * @param {string} args.tree - The tree object ID.
   * @param {string[]} args.parent - The parent commit object IDs.
   * @returns {Promise<string>} - The object ID of the written commit.
   */
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

  /**
   * Reads a stash commit by its index.
   *
   * @param {number} refIdx - The index of the stash entry.
   * @returns {Promise<Object>} - The stash commit object.
   * @throws {InvalidRefNameError} - If the index is invalid.
   */
  async readStashCommit(refIdx) {
    const stashEntries = await this.readStashReflogs({ parsed: false })
    if (refIdx !== 0) {
      // non-default case, throw exceptions if not valid
      if (refIdx < 0 || refIdx > stashEntries.length - 1) {
        throw new InvalidRefNameError(
          `stash@${refIdx}`,
          'number that is in range of [0, num of stash pushed]'
        )
      }
    }

    const stashSHA = await this.getStashSHA(refIdx, stashEntries)
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

  /**
   * Writes a stash reference to the repository.
   *
   * @param {string} stashCommit - The object ID of the stash commit.
   * @returns {Promise<void>}
   */
  async writeStashRef(stashCommit) {
    return GitRefManager.writeRef({
      fs: this.fs,
      gitdir: this.gitdir,
      ref: GitStashManager.refStash,
      value: stashCommit,
    })
  }

  /**
   * Writes a reflog entry for a stash commit.
   *
   * @param {Object} args
   * @param {string} args.stashCommit - The object ID of the stash commit.
   * @param {string} args.message - The reflog message.
   * @returns {Promise<void>}
   */
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

  /**
   * Reads the stash reflogs.
   *
   * @param {Object} args
   * @param {boolean} [args.parsed=false] - Whether to parse the reflog entries.
   * @returns {Promise<string[]|Object[]>} - The reflog entries as strings or parsed objects.
   */
  async readStashReflogs({ parsed = false }) {
    if (!(await this.fs.exists(this.refLogsStashPath))) {
      return []
    }

    const reflogBuffer = await this.fs.read(this.refLogsStashPath)
    const reflogString = reflogBuffer.toString()

    return GitRefStash.getStashReflogEntry(reflogString, parsed)
  }
}
