import {
  init,
  clone,
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

export default function git (dir) {
  return dir === undefined
    ? new Git()
    : new Git().workdir(dir).gitdir(`${dir}/.git`)
}

const extend = (self, array) => {
  for (let fn of array) {
    self[fn] = val => self.set(fn, val)
  }
}

// The class is merely a fluent command/query builder
class Git extends Map {
  // @constructor
  constructor (parent) {
    super(parent)
    extend(this, [
      'workdir',
      'gitdir',
      'remote',
      'branch',
      'author',
      'email',
      'datetime',
      'depth',
      'timestamp',
      'signingKey',
      'verificationKey',
      'outputStream',
      'inputStream',
      'username',
      'password',
      'url',
      'outputStream',
      'inputStream'
    ])
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
      } else {
        password = '' // Enables the .auth(GITHUB_TOKEN) no-username shorthand
      }
    }
    this.set('username', username)
    this.set('password', password)
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
        this.set('username', token)
        this.set('password', 'x-oauth-basic')
        break
      case 'bitbucket':
        this.set('username', 'x-token-auth')
        this.set('password', token)
        break
      case 'gitlab':
        this.set('username', 'oauth2')
        this.set('password', token)
        break
      default:
        throw new Error(
          `I don't know how ${company} expects its Basic Auth headers to be formatted for OAuth2 usage. If you do, you can use the regular '.auth(username, password)' to set the basic auth header yourself.`
        )
    }
    return this
  }
  async findRoot (dir) {
    return findRoot(dir)
  }
  async init () {
    await init({
      gitdir: this.get('gitdir')
    })
  }
  async fetch (ref) {
    await fetch({
      gitdir: this.get('gitdir'),
      ref,
      url: this.get('url'),
      depth: this.get('depth'),
      remote: this.get('remote'),
      authUsername: this.get('username'),
      authPassword: this.get('password')
    })
  }
  async checkout (ref) {
    await checkout({
      workdir: this.get('workdir'),
      gitdir: this.get('gitdir'),
      ref,
      remote: this.get('remote')
    })
  }
  async clone (url) {
    await clone({
      workdir: this.get('workdir'),
      gitdir: this.get('gitdir'),
      url,
      remote: this.get('remote'),
      ref: this.get('branch'),
      depth: this.get('depth'),
      authUsername: this.get('username'),
      authPassword: this.get('password')
    })
  }
  async list () {
    return list({
      gitdir: this.get('gitdir')
    })
  }
  async add (filepath) {
    return add({
      gitdir: this.get('gitdir'),
      workdir: this.get('workdir'),
      filepath
    })
  }
  async remove (filepath) {
    return remove({
      gitdir: this.get('gitdir'),
      filepath
    })
  }
  async commit (message) {
    return commit({
      gitdir: this.get('gitdir'),
      author: {
        name: this.get('author'),
        email: this.get('email'),
        timestamp: this.get('timestamp'),
        date: this.get('datetime')
      },
      committer: {
        name: this.get('author'),
        email: this.get('email'),
        timestamp: this.get('timestamp'),
        date: this.get('datetime')
      },
      message,
      privateKeys: this.get('signingKey')
    })
  }
  async verify (ref) {
    return verify({
      gitdir: this.get('gitdir'),
      publicKeys: this.get('verificationKey'),
      ref
    })
  }
  async pack (oids) {
    return pack({
      gitdir: this.get('gitdir'),
      outputStream: this.get('outputStream'),
      oids
    })
  }
  async unpack (oids) {
    return unpack({
      gitdir: this.get('gitdir'),
      inputStream: this.get('inputStream')
    })
  }
  async push (ref) {
    return push({
      gitdir: this.get('gitdir'),
      ref,
      remote: this.get('remote'),
      url: this.get('url'),
      authUsername: this.get('username'),
      authPassword: this.get('password')
    })
  }
  async pull (ref) {
    return fetch({
      gitdir: this.get('gitdir'),
      ref,
      remote: this.get('remote'),
      authUsername: this.get('username'),
      authPassword: this.get('password')
    })
  }
  async getConfig (path) {
    return getConfig({
      gitdir: this.get('gitdir'),
      path
    })
  }
  async setConfig (path, value) {
    return setConfig({
      gitdir: this.get('gitdir'),
      path,
      value
    })
  }
  async status (pathname) {
    return status({
      gitdir: this.get('gitdir'),
      workdir: this.get('workdir'),
      pathname
    })
  }
  async listBranches () {
    return listBranches({
      gitdir: this.get('gitdir')
    })
  }
}
