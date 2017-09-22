import ghurl from 'github-url-to-object'
import { init } from './commands/init'
import { fetch } from './commands/fetch'
import { checkout } from './commands/checkout.js'
import { list } from './commands/list.js'
import { add } from './commands/add.js'
import { remove } from './commands/remove.js'
import { commit } from './commands/commit.js'
import { verify } from './commands/verify.js'
import { pack } from './commands/pack-objects.js'
import { push } from './commands/push.js'
import { getConfig } from './commands/getConfig.js'
import { setConfig } from './commands/setConfig.js'

// Class is merely a fluent command/query builder
export default function git (dir) {
  return new Git(dir)
}

class Git {
  constructor (dir) {
    if (dir) {
      this.workdir = dir
      this.gitdir = `${dir}/.git`
    }
    this.operateRemote = 'origin'
  }
  workdir (dir) {
    this.workdir = dir
    return this
  }
  gitdir (dir) {
    this.gitdir = dir
    return this
  }
  githubToken (token) {
    this.operateToken = token
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
  email (email) {
    this.operateAuthorEmail = email
    return this
  }
  datetime (date) {
    this.operateAuthorDateTime = date
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
  async init () {
    await init(this.gitdir)
  }
  async fetch (url) {
    await fetch({
      gitdir: this.gitdir,
      user: ghurl(url).user,
      repo: ghurl(url).repo,
      ref: ghurl(url).branch,
      remote: this.operateRemote,
      token: this.operateToken
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
    await fetch({
      gitdir: this.gitdir,
      user: ghurl(url).user,
      repo: ghurl(url).repo,
      ref: ghurl(url).branch,
      remote: this.operateRemote,
      token: this.operateToken
    })
    await checkout({
      workdir: this.workdir,
      gitdir: this.gitdir,
      ref: ghurl(url).branch,
      remote: this.operateRemote
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
  async push (ref) {
    let url = await getConfig({
      gitdir: this.gitdir,
      path: `remote "${this.operateRemote}".url`
    })
    console.log('url =', url)
    return push({
      gitdir: this.gitdir,
      ref,
      url,
      auth: {
        username: this.operateToken,
        password: this.operateToken
      }
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
}
