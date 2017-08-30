import ghurl from 'github-url-to-object'

import GitConfig from './models/GitConfig'

import init from './commands/init.js'
import fetch from './commands/fetch.js'
import checkout from './commands/checkout.js'
import list from './commands/list.js'
import add from './commands/add.js'
import remove from './commands/remove.js'

// Class is merely a fluent command/query builder
export default function git (dir) {
  return new Git(dir)
}

export class Git {
  constructor (dir) {
    this.workdir = dir
    this.gitdir = dir.endsWith('.git') ? dir : `${dir}/.git`
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
  config () {
    return new GitConfig(this.gitdir)
  }
  async init () {
    await init(this.workdir)
    return
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
      remote: this.operateRemote,
    })
  }
  async clone (url) {
    await init(this.workdir)
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
      remote: this.operateRemote,
    })
    return
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
}