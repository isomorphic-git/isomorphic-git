import 'babel-polyfill'
import fs from 'fs'
import path from 'path'
import ghurl from 'github-url-to-object'

import GitConfig from './models/GitConfig'

import init from './commands/init.js'
import fetch from './commands/fetch.js'
import checkout from './commands/checkout.js'

// We want to be able to do

// git('.').branch('master').tree.checkout()
// git('.').head('master').tree.checkout()
// git('.').tag('v1.0').tree.checkout()
// git('.').tree.addFile(filepath)
// git('.').branch('master').commit(author, etc)
// git('.').branch('master').push(upstream, upstreambranch)
// git('.').fetch(upstream, upstreambranch)
// git('.').branch('master').merge(git('.').remotes('origin/master'))
// or should it be assumed we have all remotes/heads/tags fetched and explore directly
// git('.').branch.master.merge(git('.').remotes.origin.master

// then it's hard to tell that master is a name and merge is an operation. Maybe putting names in strings is good.
// we could though, do this:
// git('.').branch('master').merge(git('.').remotes('origin').branch('master'))
// That's probably the clearest by far.

// Class is merely a fluent command/query builder
export default function git (dir) {
  return new Git(dir)
}

export class Git {
  constructor (dir) {
    this.root = dir
  }
  branch (name) {
    this.operateBranch = name
  }
  remote (name) {
    this.operateRemote = name
  }
  config () {
    return new GitConfig(this.root)
  }
  async init () {
    await init(this.root)
    return
  }
  async fetch (url) {
    await fetch({
      dir: this.root,
      user: ghurl(url).user,
      repo: ghurl(url).repo,
      branch: ghurl(url).branch,
      remote: this.operateRemote || 'origin',
      token: process.env.GITHUB_TOKEN
    })
  }
  async clone (url) {
    await init(this.root)
    await fetch({
      dir: this.root,
      user: ghurl(url).user,
      repo: ghurl(url).repo,
      branch: ghurl(url).branch,
      remote: this.operateRemote || 'origin',
      token: process.env.GITHUB_TOKEN
    })
    await checkout({
     
    })
    return
  }
}