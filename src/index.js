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
  findRoot
} from './commands'

export default function git (dir) {
  return new Git(dir)
}

// The class is merely a fluent command/query builder
class Git {
  constructor (dir) {
    if (dir) {
      this.workdir = dir
      this.gitdir = `${dir}/.git`
    }
    this.operateDepth = 0
  }
  workdir (dir) {
    this.workdir = dir
    return this
  }
  gitdir (dir) {
    this.gitdir = dir
    return this
  }
  // This form works for basic username / password auth, or
  // the newer username / token auth that is often required if
  // 2FA is enabled.
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
  // This for is for actual OAuth2 uses. Unfortunately, the
  // major players all have different conventions.
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
  remote (name) {
    this.operateRemote = name
    return this
  }
  author (name) {
    this.operateAuthorName = name
    return this
  }
  branch (name) {
    this.operateBranch = name
    return this
  }
  email (email) {
    this.operateAuthorEmail = email
    return this
  }
  datetime (date) {
    this.operateAuthorDateTime = date
    return this
  }
  depth (depth) {
    this.operateDepth = parseInt(depth)
    return this
  }
  timestamp (seconds) {
    // seconds since unix epoch
    this.operateAuthorTimestamp = seconds
    return this
  }
  signingKey (asciiarmor) {
    this.privateKeys = asciiarmor
    return this
  }
  verificationKey (asciiarmor) {
    this.publicKeys = asciiarmor
    return this
  }
  outputStream (stream) {
    this.outputStream = stream
    return this
  }
  inputStream (stream) {
    this.inputStream = stream
    return this
  }
  async findRoot (dir) {
    return findRoot(dir)
  }
  async init () {
    await init(this.gitdir)
  }
  async fetch (ref) {
    await fetch({
      gitdir: this.gitdir,
      ref,
      depth: this.operateDepth,
      remote: this.operateRemote || 'origin',
      authUsername: this.operateUsername,
      authPassword: this.operatePassword
    })
  }
  async checkout (ref) {
    await checkout({
      workdir: this.workdir,
      gitdir: this.gitdir,
      ref,
      remote: this.operateRemote
    })
  }
  async clone (url) {
    await init(this.gitdir)
    // Add remote
    await setConfig({
      gitdir: this.gitdir,
      path: 'remote.origin.url',
      value: url
    })
    // Fetch commits
    await fetch({
      gitdir: this.gitdir,
      ref: this.operateBranch,
      depth: this.operateDepth,
      remote: this.operateRemote || 'origin',
      authUsername: this.operateUsername,
      authPassword: this.operatePassword
    })
    // Checkout branch
    await checkout({
      workdir: this.workdir,
      gitdir: this.gitdir,
      ref: this.operateBranch,
      remote: this.operateRemote || 'origin'
    })
  }
  async list () {
    return list({
      gitdir: this.gitdir
    })
  }
  async add (filepath) {
    return add({
      gitdir: this.gitdir,
      workdir: this.workdir,
      filepath
    })
  }
  async remove (filepath) {
    return remove({
      gitdir: this.gitdir,
      filepath
    })
  }
  async commit (message) {
    return commit({
      gitdir: this.gitdir,
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
      gitdir: this.gitdir,
      publicKeys: this.publicKeys,
      ref
    })
  }
  async pack (oids) {
    return pack({
      gitdir: this.gitdir,
      outputStream: this.outputStream,
      oids
    })
  }
  async unpack (oids) {
    return unpack({
      gitdir: this.gitdir,
      inputStream: this.inputStream
    })
  }
  async push (ref) {
    let url = await getConfig({
      gitdir: this.gitdir,
      path: `remote.${this.operateRemote || 'origin'}.url`
    })
    console.log('url =', url)
    return push({
      gitdir: this.gitdir,
      ref,
      url,
      authUsername: this.operateUsername,
      authPassword: this.operatePassword
    })
  }
  async pull (ref) {
    return fetch({
      gitdir: this.gitdir,
      ref,
      remote: this.operateRemote || 'origin',
      authUsername: this.operateUsername,
      authPassword: this.operatePassword
    })
  }
  async getConfig (path) {
    return getConfig({
      gitdir: this.gitdir,
      path
    })
  }
  async setConfig (path, value) {
    return setConfig({
      gitdir: this.gitdir,
      path,
      value
    })
  }
  async status (pathname) {
    return status({
      gitdir: this.gitdir,
      workdir: this.workdir,
      pathname
    })
  }
}
