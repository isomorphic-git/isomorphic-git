'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var ghurl = _interopDefault(require('github-url-to-object'));
var commands_js = require('./commands.js');

function git(dir) {
  return new Git(dir);
}

// The class is merely a fluent command/query builder
class Git {
  constructor(dir) {
    if (dir) {
      this.workdir = dir;
      this.gitdir = `${dir}/.git`;
    }
    this.operateRemote = 'origin';
    this.operateDepth = 0;
  }
  workdir(dir) {
    this.workdir = dir;
    return this;
  }
  gitdir(dir) {
    this.gitdir = dir;
    return this;
  }
  githubToken(token) {
    this.operateToken = token;
    return this;
  }
  remote(name) {
    this.operateRemote = name;
    return this;
  }
  author(name) {
    this.operateAuthorName = name;
    return this;
  }
  email(email) {
    this.operateAuthorEmail = email;
    return this;
  }
  datetime(date) {
    this.operateAuthorDateTime = date;
    return this;
  }
  depth(depth) {
    this.operateDepth = parseInt(depth);
    return this;
  }
  timestamp(seconds) {
    // seconds since unix epoch
    this.operateAuthorTimestamp = seconds;
    return this;
  }
  signingKey(asciiarmor) {
    this.privateKeys = asciiarmor;
    return this;
  }
  verificationKey(asciiarmor) {
    this.publicKeys = asciiarmor;
    return this;
  }
  outputStream(stream) {
    this.outputStream = stream;
    return this;
  }
  inputStream(stream) {
    this.inputStream = stream;
    return this;
  }
  async init() {
    await commands_js.init(this.gitdir);
  }
  async fetch(ref) {
    // TODO replace "auth" with just basicAuthUser and basicAuthPassword
    let params = {};
    params.remote = this.operateRemote;
    if (this.operateToken) {
      params.auth = {
        username: this.operateToken,
        password: this.operateToken
      };
    }
    params.gitdir = this.gitdir;
    params.ref = ref;
    params.depth = this.operateDepth;
    await commands_js.fetch(params);
  }
  async checkout(ref) {
    await commands_js.checkout({
      workdir: this.workdir,
      gitdir: this.gitdir,
      ref,
      remote: this.operateRemote
    });
  }
  async clone(url) {
    await commands_js.init(this.gitdir);
    // await addRemote()
    await commands_js.GithubFetch({
      gitdir: this.gitdir,
      // TODO: make this not Github-specific
      user: ghurl(url).user,
      repo: ghurl(url).repo,
      ref: ghurl(url).branch,
      remote: this.operateRemote,
      token: this.operateToken
    });
    await commands_js.checkout({
      workdir: this.workdir,
      gitdir: this.gitdir,
      // TODO: make this not Github-specific
      ref: ghurl(url).branch,
      remote: this.operateRemote
    });
  }
  async list() {
    return commands_js.list({
      gitdir: this.gitdir
    });
  }
  async add(filepath) {
    return commands_js.add({
      gitdir: this.gitdir,
      workdir: this.workdir,
      filepath
    });
  }
  async remove(filepath) {
    return commands_js.remove({
      gitdir: this.gitdir,
      filepath
    });
  }
  async commit(message) {
    return commands_js.commit({
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
    });
  }
  async verify(ref) {
    return commands_js.verify({
      gitdir: this.gitdir,
      publicKeys: this.publicKeys,
      ref
    });
  }
  async pack(oids) {
    return commands_js.pack({
      gitdir: this.gitdir,
      outputStream: this.outputStream,
      oids
    });
  }
  async unpack(oids) {
    return commands_js.unpack({
      gitdir: this.gitdir,
      inputStream: this.inputStream
    });
  }
  async push(ref) {
    let url = await commands_js.getConfig({
      gitdir: this.gitdir,
      path: `remote.${this.operateRemote}.url`
    });
    console.log('url =', url);
    return commands_js.push({
      gitdir: this.gitdir,
      ref,
      url,
      auth: {
        username: this.operateToken,
        password: this.operateToken
      }
    });
  }
  async pull(ref) {
    let params = {};
    params.remote = this.operateRemote;
    if (this.operateToken) {
      params.auth = {
        username: this.operateToken,
        password: this.operateToken
      };
    }
    params.gitdir = this.gitdir;
    params.ref = ref;
    return commands_js.fetch(params);
  }
  async getConfig(path) {
    return commands_js.getConfig({
      gitdir: this.gitdir,
      path
    });
  }
  async setConfig(path, value) {
    return commands_js.setConfig({
      gitdir: this.gitdir,
      path,
      value
    });
  }
}

module.exports = git;
