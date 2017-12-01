import {
  init,
  clone,
  checkout,
  list,
  log,
  add,
  remove,
  commit,
  verify,
  pack,
  unpack,
  push,
  fetch,
  config,
  status,
  findRoot,
  listBranches,
  version
} from './commands'

import * as commands from './commands'
import * as managers from './managers'
import * as models from './models'
import * as utils from './utils'
import { createClass } from './utils'

export const Git = createClass(commands)

export function git (dir) {
  return dir === undefined
    ? new OldGit()
    : new OldGit().workdir(dir).gitdir(`${dir}/.git`)
}
git.commands = commands
git.managers = managers
git.models = models
git.utils = utils

const extend = (self, array) => {
  for (let fn of array) {
    self[fn] = val => self.set(fn, val)
  }
}

// This is so git().relative() is the same as git().relative(true)
// but you can still undo the flag later with git().relative(false)
const extendBool = (self, array) => {
  for (let fn of array) {
    self[fn] = val => self.set(fn, val !== false)
  }
}

// The class is merely a fluent command/query builder
export class OldGit extends Map {
  // @constructor
  constructor ({ fs, dir, workdir, gitdir } = {}) {
    super()
    extend(this, [
      'workdir',
      'gitdir',
      'remote',
      'branch',
      'author',
      'email',
      'datetime',
      'depth',
      'since',
      'exclude',
      'timestamp',
      'signingKey',
      'verificationKey',
      'username',
      'password',
      'url',
      'outputStream',
      'inputStream',
      'onprogress',
      'fs'
    ])
    extendBool(this, ['relative'])
    if (fs) {
      this.set('fs', fs)
      utils.setfs(fs)
    }
    if (dir) {
      this.set('workdir', dir)
      this.set('gitdir', `${dir}/.git`)
    }
    if (workdir) {
      this.set('workdir', workdir)
    }
    if (gitdir) {
      this.set('gitdir', gitdir)
    }
  }
  version () {
    return version()
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
    return findRoot({
      filepath: dir,
      fs: this.get('fs')
    })
  }
  async init () {
    await init({
      gitdir: this.get('gitdir'),
      fs: this.get('fs')
    })
  }
  async fetch (ref) {
    await fetch({
      gitdir: this.get('gitdir'),
      ref,
      url: this.get('url'),
      remote: this.get('remote'),
      authUsername: this.get('username'),
      authPassword: this.get('password'),
      depth: this.get('depth'),
      since: this.get('since'),
      exclude: this.get('exclude'),
      relative: this.get('relative'),
      onprogress: this.get('onprogress'),
      fs: this.get('fs')
    })
  }
  async checkout (ref) {
    await checkout({
      workdir: this.get('workdir'),
      gitdir: this.get('gitdir'),
      ref,
      remote: this.get('remote'),
      fs: this.get('fs')
    })
  }
  async clone (url) {
    await clone({
      workdir: this.get('workdir'),
      gitdir: this.get('gitdir'),
      url,
      remote: this.get('remote'),
      ref: this.get('branch'),
      authUsername: this.get('username'),
      authPassword: this.get('password'),
      depth: this.get('depth'),
      since: this.get('since'),
      exclude: this.get('exclude'),
      relative: this.get('relative'),
      onprogress: this.get('onprogress'),
      fs: this.get('fs')
    })
  }
  async list () {
    return list({
      gitdir: this.get('gitdir'),
      fs: this.get('fs')
    })
  }
  async log (ref) {
    return log({
      gitdir: this.get('gitdir'),
      ref,
      depth: this.get('depth'),
      since: this.get('since'),
      fs: this.get('fs')
    })
  }
  async add (filepath) {
    return add({
      gitdir: this.get('gitdir'),
      workdir: this.get('workdir'),
      filepath,
      fs: this.get('fs')
    })
  }
  async remove (filepath) {
    return remove({
      gitdir: this.get('gitdir'),
      filepath,
      fs: this.get('fs')
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
      privateKeys: this.get('signingKey'),
      fs: this.get('fs')
    })
  }
  async verify (ref) {
    return verify({
      gitdir: this.get('gitdir'),
      publicKeys: this.get('verificationKey'),
      ref,
      fs: this.get('fs')
    })
  }
  async pack (oids) {
    return pack({
      gitdir: this.get('gitdir'),
      outputStream: this.get('outputStream'),
      oids,
      fs: this.get('fs')
    })
  }
  async unpack (oids) {
    return unpack({
      gitdir: this.get('gitdir'),
      inputStream: this.get('inputStream'),
      fs: this.get('fs')
    })
  }
  async push (ref) {
    return push({
      gitdir: this.get('gitdir'),
      ref,
      remote: this.get('remote'),
      url: this.get('url'),
      authUsername: this.get('username'),
      authPassword: this.get('password'),
      fs: this.get('fs')
    })
  }
  async pull (ref) {
    return fetch({
      gitdir: this.get('gitdir'),
      ref,
      remote: this.get('remote'),
      authUsername: this.get('username'),
      authPassword: this.get('password'),
      fs: this.get('fs')
    })
  }
  async config (path, value) {
    if (arguments.length === 1) {
      return config({
        gitdir: this.get('gitdir'),
        path,
        fs: this.get('fs')
      })
    } else {
      return config({
        gitdir: this.get('gitdir'),
        path,
        value,
        fs: this.get('fs')
      })
    }
  }
  async status (filepath) {
    return status({
      gitdir: this.get('gitdir'),
      workdir: this.get('workdir'),
      filepath,
      fs: this.get('fs')
    })
  }
  async listBranches () {
    return listBranches({
      gitdir: this.get('gitdir'),
      fs: this.get('fs')
    })
  }
}

git.Git = OldGit
