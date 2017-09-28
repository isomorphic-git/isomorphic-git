import ghurl from 'github-url-to-object'
import { init } from './init'
import { fetch as fetchGithubApi } from './github-api-fetch'
import { checkout } from './checkout.js'
import { list } from './list.js'
import { add } from './add.js'
import { remove } from './remove.js'
import { commit } from './commit.js'
import { verify } from './verify.js'
import { pack } from './pack-objects.js'
import { unpack } from './unpack-objects.js'
import { push } from './push.js'
import { fetch } from './fetch.js'
import { getConfig } from './getConfig.js'
import { setConfig } from './setConfig.js'

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
  inputStream (stream) {
    this.inputStream = stream
    return this
  }
  async init () {
    await init(this.gitdir)
  }
  async fetch (url) {
    await fetchGithubApi({
      gitdir: this.gitdir,
      // TODO: make this not Github-specific
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
      // TODO: make this not Github-specific
      user: ghurl(url).user,
      repo: ghurl(url).repo,
      ref: ghurl(url).branch,
      remote: this.operateRemote,
      token: this.operateToken
    })
    await checkout({
      workdir: this.workdir,
      gitdir: this.gitdir,
      // TODO: make this not Github-specific
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
  async unpack (oids) {
    return unpack({
      gitdir: this.gitdir,
      inputStream: this.inputStream
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
  async pull (ref) {
    let params = {}
    params.url = await getConfig({
      gitdir: this.gitdir,
      path: `remote "${this.operateRemote}".url`
    })
    console.log('url =', params.url)
    if (this.operateToken) {
      params.auth = {
        username: this.operateToken,
        password: this.operateToken
      }
    }
    params.gitdir = this.gitdir
    params.ref = ref
    return fetch(params)
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
