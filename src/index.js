import {
  init,
  checkout,
  list,
  add,
  remove,
  commit,
  verify,
  pack,
  unpack,
  push,
  fetch,
  getConfig,
  setConfig,
  status,
  findRoot,
  listBranches
} from './commands'

/**
 * @param {string} dir
 * @returns {Git}
 */
export default function git (dir) {
  return new Git(dir)
}

// The class is merely a fluent command/query builder
/**
 * @public
 */
export class Git {
  // @constructor
  constructor (dir) {
    if (dir) {
      this._workdir = dir
      this._gitdir = `${dir}/.git`
    }
    this._operateDepth = 0
  }
  /**
   * @param {string} dir The path to the working directory.
   *
   * The working directory is where your files are checked out.
   * Usually this is the parent directory of ".git" but it doesn't have to be.
   * @returns {Git} this
   */
  workdir (dir) {
    this._workdir = dir
    return this
  }
  /**
   * @param {string} dir The path to the git directory.
   *
   * The git directory is where your git repository history is stored.
   * Usually this is a directory called ".git" inside your working directory.
   * @returns {Git} this
   */
  gitdir (dir) {
    this._gitdir = dir
    return this
  }
  /**
   * @param {string} username
   * @param {string} password
   * @returns {Git} this
   *
   * Use with {@link #gitpush .push} and {@link #gitpull .pull} to set Basic Authentication headers.
   * This works for basic username / password auth, or the newer username / token auth
   * that is often required if 2FA is enabled.
   */
  auth (username, password) {
    // Allow specifying it as one argument (mostly for CLI inputability)
    if (password === undefined) {
      let i = username.indexOf(':')
      if (i > -1) {
        password = username.slice(i + 1)
        username = username.slice(0, i)
      }
    }
    this.operateUsername = username
    this.operatePassword = password || '' // Enables the .auth(GITHUB_TOKEN) no-username shorthand
    return this
  }
  /**
   * @param {string} company
   * @param {string} token
   * @returns {Git} this
   *
   * Use with {@link #gitpush .push} and {@link #gitpull .pull} to set Basic Authentication headers.
   * This for is for *actual* OAuth2 tokens (not "personal access tokens").
   * Unfortunately, all the major git hosting companies have chosen different conventions!
   * Lucky for you, I already looked up and codified it for you.
   *
   * - oauth2('github', token) - Github uses `token` as the username, and 'x-oauth-basic' as the password.
   * - oauth2('bitbucket', token) - Bitbucket uses 'x-token-auth' as the username, and `token` as the password.
   * - oauth2('gitlab', token) - Gitlab uses 'oauth2' as the username, and `token` as the password.
   *
   * I will gladly accept pull requests for more companies' conventions.
   */
  oauth2 (company, token) {
    switch (company) {
      case 'github':
        this.operateUsername = token
        this.operatePassword = 'x-oauth-basic'
        break
      case 'bitbucket':
        this.operateUsername = 'x-token-auth'
        this.operatePassword = token
        break
      case 'gitlab':
        this.operateUsername = 'oauth2'
        this.operatePassword = token
        break
      default:
        throw new Error(
          `I don't know how ${company} expects its Basic Auth headers to be formatted for OAuth2 usage. If you do, you can use the regular '.auth(username, password)' to set the basic auth header yourself.`
        )
    }
    return this
  }
  /**
   * @param {string} name
   * @returns {Git} this
   *
   * The name of the remote to use in this operation. This is usually 'origin' unless you have more than one remote.
   */
  remote (name) {
    this.operateRemote = name
    return this
  }
  /**
   * @param {string} name
   * @returns {Git} this
   *
   * Use with {@link #gitcommit .commit} to set the author name field. If not specified, {@link #gitcommit .commit}
   * will use the `user.name` field of the `.git/config` file.
   */
  author (name) {
    this.operateAuthorName = name
    return this
  }
  /**
   * @param {string} name
   * @returns {Git} this
   *
   * Use with {@link #gitclone .clone} to set the remote branch to clone.
   */
  branch (name) {
    this.operateBranch = name
    return this
  }
  /**
   * @param {string} email
   * @returns {Git} this
   *
   * Use with {@link #gitcommit .commit} to set the author email field. If not specified, {@link #gitcommit .commit}
   * will use the `user.email` field of the `.git/config` file.
   */
  email (email) {
    this.operateAuthorEmail = email
    return this
  }
  /**
   * @param {Date} date
   * @returns {Git} this
   *
   * Use with {@link #gitcommit .commit} to set the author timestamp field. If not specified, {@link #gitcommit .commit}
   * will use the current time.
   * @see #gittimestamp
   */
  datetime (date) {
    this.operateAuthorDateTime = date
    return this
  }
  /**
   * @param {string} email
   * @returns {Git} this
   *
   * Use with {@link #gitfetch .fetch} or {@link #gitclone .clone} to determine how much of the git repository's
   * history to retrieve. If not specified it defaults to 0 which actually means Infinity or the entire repo history.
   */
  depth (depth) {
    this._operateDepth = parseInt(depth)
    return this
  }
  /**
   * @param {Number} seconds
   * @returns {Git} this
   *
   * Use with {@link #gitcommit .commit} to set the author timestamp field. This is an alternative to using
   * {@link #gitdatetime .datetime} that accepts an integer number of seconds since the Unix epoch instead of
   * a JavaScript date object.
   * @see #gitdatetime
   */
  timestamp (seconds) {
    // seconds since unix epoch
    this.operateAuthorTimestamp = seconds
    return this
  }
  /**
   * @param {String} key
   * @returns {Git} this
   *
   * Use with {@link #gitcommit .commit} to sign the commit.
   * The key should be a PGP private key in ASCII armor format.
   */
  signingKey (key) {
    this.privateKeys = key
    return this
  }
  /**
   * @param {String} key
   * @returns {Git} this
   *
   * Use with {@link #gitverify .verify} to verify a signed commit.
   * The key should be a PGP public key in ASCII armor format.
   * If no key is specified then it will look up the list of public keys
   * associated with the commit author on a public PGP keyserver.
   */
  verificationKey (key) {
    this.publicKeys = key
    return this
  }
  /**
   * @param {WritableStream} stream
   * @returns {Git} this
   *
   * For use with {@link #gitpack .pack}. Where the packfile stream will be written to.
   */
  outputStream (stream) {
    this.outputStream = stream
    return this
  }
  /**
   * @param {ReadableStream} stream
   * @returns {Git} this
   *
   * For use with {@link #gitunpack .unpack}. A packfile stream source.
   */
  inputStream (stream) {
    this.inputStream = stream
    return this
  }
  /**
   * @param {String} dir
   * @returns {String}
   *
   * Starting at directory {dir}, walk upwards until you find a directory that contains a '.git' directory.
   * Returns that directory, which is presumably the root directory of the git repository containing {dir}.
   */
  async findRoot (dir) {
    return findRoot(dir)
  }
  /**
   * @returns Promise<void>
   *
   * Initialize a git repository.
   */
  async init () {
    await init(this._gitdir)
  }
  /**
   * @param {String} ref
   * @returns Promise<void>
   *
   * Fetch a branch from the specified repository.
   */
  async fetch (ref) {
    await fetch({
      gitdir: this._gitdir,
      ref,
      depth: this._operateDepth,
      remote: this.operateRemote || 'origin',
      authUsername: this.operateUsername,
      authPassword: this.operatePassword
    })
  }
  async checkout (ref) {
    await checkout({
      workdir: this._workdir,
      gitdir: this._gitdir,
      ref,
      remote: this.operateRemote
    })
  }
  async clone (url) {
    await init(this._gitdir)
    // Add remote
    await setConfig({
      gitdir: this._gitdir,
      path: 'remote.origin.url',
      value: url
    })
    // Fetch commits
    await fetch({
      gitdir: this._gitdir,
      ref: this.operateBranch,
      depth: this._operateDepth,
      remote: this.operateRemote || 'origin',
      authUsername: this.operateUsername,
      authPassword: this.operatePassword
    })
    // Checkout branch
    await checkout({
      workdir: this._workdir,
      gitdir: this._gitdir,
      ref: this.operateBranch,
      remote: this.operateRemote || 'origin'
    })
  }
  async list () {
    return list({
      gitdir: this._gitdir
    })
  }
  async add (filepath) {
    return add({
      gitdir: this._gitdir,
      workdir: this._workdir,
      filepath
    })
  }
  async remove (filepath) {
    return remove({
      gitdir: this._gitdir,
      filepath
    })
  }
  async commit (message) {
    return commit({
      gitdir: this._gitdir,
      author: {
        name: this.operateAuthorName || (await this.getConfig('user.name')),
        email: this.operateAuthorEmail || (await this.getConfig('user.email')),
        timestamp: this.operateAuthorTimestamp,
        date: this.operateAuthorDateTime
      },
      committer: {
        name: this.operateAuthorName || (await this.getConfig('user.name')),
        email: this.operateAuthorEmail || (await this.getConfig('user.email')),
        timestamp: this.operateAuthorTimestamp,
        date: this.operateAuthorDateTime
      },
      message,
      privateKeys: this.privateKeys
    })
  }
  async verify (ref) {
    return verify({
      gitdir: this._gitdir,
      publicKeys: this.publicKeys,
      ref
    })
  }
  async pack (oids) {
    return pack({
      gitdir: this._gitdir,
      outputStream: this.outputStream,
      oids
    })
  }
  async unpack (oids) {
    return unpack({
      gitdir: this._gitdir,
      inputStream: this.inputStream
    })
  }
  /**
   * @param {string} ref
   * @return {Promise<void>}
   */
  async push (ref) {
    let url = await getConfig({
      gitdir: this._gitdir,
      path: `remote.${this.operateRemote || 'origin'}.url`
    })
    console.log('url =', url)
    return push({
      gitdir: this._gitdir,
      ref,
      url,
      authUsername: this.operateUsername,
      authPassword: this.operatePassword
    })
  }
  async pull (ref) {
    return fetch({
      gitdir: this._gitdir,
      ref,
      remote: this.operateRemote || 'origin',
      authUsername: this.operateUsername,
      authPassword: this.operatePassword
    })
  }
  async getConfig (path) {
    return getConfig({
      gitdir: this._gitdir,
      path
    })
  }
  async setConfig (path, value) {
    return setConfig({
      gitdir: this._gitdir,
      path,
      value
    })
  }
  async status (pathname) {
    return status({
      gitdir: this._gitdir,
      workdir: this._workdir,
      pathname
    })
  }
  async listBranches () {
    return listBranches({
      gitdir: this._gitdir
    })
  }
}
