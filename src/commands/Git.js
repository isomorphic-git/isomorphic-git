import path from 'path'
import { pkg, setfs } from '../utils'

/**
 * @external {FSModule} http://ghub.io/browserfs
 */

/**
 * @typedef {Object} GitRepo
 * @property {FSModule} fs
 * @property {string} workdir
 * @property {string} gitdir
 */

/**
 *
 * The "state" of a git repo is pretty darn simple. It consists of three things:
 *
 * - `fs` - the filesystem the repo lives in
 * - `workdir` - the directory path where files are checked out
 * - `gitdir` - the directory path where the git object database lives
 *
 * However most of the time, the relationship between `workdir` and `gitdir` is simply `gitdir = path.join(workdir, '.git')`.
 * So as a shorthand, you can use the `Git` constructor with `{fs, dir}`.
 *
 * If you are working with bare repositories, that relationship between the gitdir and workdir does not hold.
 * In this case, you need to specify the directories explicitly.
 *
 * @implements {GitRepo}
 * @prop {string} gitdir
 * @prop {string} workdir
 *
 * @example
 * import fs from 'fs'
 * import { Git } from 'isomorphic-git'
 * // shorthand
 * let repo = new Git({fs, dir: './path/to/repo'})
 * // second way
 * let repo2 = new Git({fs, gitdir: './my-bare-repo', workdir: '/var/www/website'})
 */
export class Git {
  /**
   * @constructor
   * @param {Object} args
   * @param {FSModule} args.fs - The filesystem holding the git repo
   * @param {string} args.dir
   * @param {string} [args.gitdir=dir]
   * @param {string} [args.workdir=path.join(dir, '.git')]
   */
  constructor ({ fs, dir, workdir, gitdir }) {
    if (fs) {
      /**
       * @type {FSModule}
       */
      this.fs = fs
      setfs(fs)
    }
    if (dir) {
      /**
       * The directory where your files are checked out.
       * Usually this is the parent directory of ".git" but it doesn't have to be.
       *
       * @type {string}
       */
      this.workdir = dir
      /**
       * The directory where your git repository history is stored.
       * Usually this is a directory called ".git" inside your working directory.
       *
       * @type {string}
       */
      this.gitdir = path.join(dir, '.git')
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
  /**
   * @returns {string} - The version of `isomorphic-git` (taken from `package.json` at publish time)
   */
  static version () {
    return pkg.version
  }
}
