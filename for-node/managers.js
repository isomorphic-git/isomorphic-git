'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var models_js = require('./models.js');
var utils_js = require('./utils.js');
var path = _interopDefault(require('path'));
var AsyncLock = _interopDefault(require('async-lock'));
var buffer = require('buffer');
var pako = _interopDefault(require('pako'));
var shasum = _interopDefault(require('shasum'));
var simpleGet = _interopDefault(require('simple-get'));
var concat = _interopDefault(require('simple-concat'));
var pify = _interopDefault(require('pify'));
var stream = require('stream');

// @flow
class GitConfigManager {
  static async get({ gitdir }) {
    // We can improve efficiency later if needed.
    // TODO: read from full list of git config files
    let text = await utils_js.read(`${gitdir}/config`, { encoding: 'utf8' });
    return models_js.GitConfig.from(text);
  }
  static async save({ gitdir, config }) {
    // We can improve efficiency later if needed.
    // TODO: handle saving to the correct global/user/repo location
    await utils_js.write(`${gitdir}/config`, config.toString(), {
      encoding: 'utf8'
    });
  }
}

// @flow
// TODO: Add file locks.
class GitShallowManager {
  static async read({ gitdir }) {
    let oids = new Set();
    let text = await utils_js.read(path.join(gitdir, 'shallow'), { encoding: 'utf8' });
    if (text === null) return oids;
    text.trim().split('\n').map(oid => oids.add(oid));
    return oids;
  }
  static async write({ gitdir, oids }) {
    let text = '';
    for (let oid of oids) {
      text += `${oid}\n`;
    }
    await utils_js.write(path.join(gitdir, 'shallow'), text, {
      encoding: 'utf8'
    });
  }
}

// @flow
// import LockManager from 'travix-lock-manager'
// import Lock from '../utils'

// TODO: replace with an LRU cache?
const map /*: Map<string, GitIndex> */ = new Map();
// const lm = new LockManager()
const lock = new AsyncLock();

class GitIndexManager {
  static async acquire(filepath, closure) {
    await lock.acquire(filepath, async function () {
      let index = map.get(filepath);
      if (index === undefined) {
        // Acquire a file lock while we're reading the index
        // to make sure other processes aren't writing to it
        // simultaneously, which could result in a corrupted index.
        // const fileLock = await Lock(filepath)
        const rawIndexFile = await utils_js.read(filepath);
        index = models_js.GitIndex.from(rawIndexFile);
        // cache the GitIndex object so we don't need to re-read it
        // every time.
        // TODO: save the stat data for the index so we know whether
        // the cached file is stale (modified by an outside process).
        map.set(filepath, index);
        // await fileLock.cancel()
      }
      await closure(index);
      if (index._dirty) {
        // Acquire a file lock while we're writing the index file
        // let fileLock = await Lock(filepath)
        const buffer$$1 = index.toObject();
        await utils_js.write(filepath, buffer$$1);
        index._dirty = false;
      }
      // For now, discard our cached object so that external index
      // manipulation is picked up. TODO: use lstat and compare
      // file times to determine if our cached object should be
      // discarded.
      map.delete(filepath);
    });
  }
}

// @flow
function wrapObject({ type, object /*: {type: string, object: Buffer} */ }) {
  let buffer$$1 = buffer.Buffer.concat([buffer.Buffer.from(type + ' '), buffer.Buffer.from(object.byteLength.toString()), buffer.Buffer.from([0]), buffer.Buffer.from(object)]);
  let oid = shasum(buffer$$1);
  return {
    oid,
    file: buffer.Buffer.from(pako.deflate(buffer$$1))
  };
}

function unwrapObject({ oid, file /*: {oid: string, file: Buffer} */ }) {
  let inflated = buffer.Buffer.from(pako.inflate(file));
  if (oid) {
    let sha = shasum(inflated);
    if (sha !== oid) {
      throw new Error(`SHA check failed! Expected ${oid}, computed ${sha}`);
    }
  }
  let s = inflated.indexOf(32); // first space
  let i = inflated.indexOf(0); // first null value
  let type = inflated.slice(0, s).toString('utf8'); // get type of object
  let length = inflated.slice(s + 1, i).toString('utf8'); // get type of object
  let actualLength = inflated.length - (i + 1);
  // verify length
  if (parseInt(length) !== actualLength) {
    throw new Error(`Length mismatch: expected ${length} bytes but got ${actualLength} instead.`);
  }
  return {
    type,
    object: buffer.Buffer.from(inflated.slice(i + 1))
  };
}

class GitObjectManager {
  static async read({ gitdir, oid /*: {gitdir: string, oid: string} */ }) {
    let file = await utils_js.read(`${gitdir}/objects/${oid.slice(0, 2)}/${oid.slice(2)}`);
    if (!file) throw new Error(`Git object with oid ${oid} not found`);
    let { type, object } = unwrapObject({ oid, file });
    return { type, object };
  }

  static async write({ gitdir, type, object }) /*: Promise<string> */{
    let { file, oid } = wrapObject({ type, object });
    let filepath = `${gitdir}/objects/${oid.slice(0, 2)}/${oid.slice(2)}`;
    // Don't overwrite existing git objects - this helps avoid EPERM errors.
    // Although I don't know how we'd fix corrupted objects then. Perhaps delete them
    // on read?
    if (!(await utils_js.exists(filepath))) await utils_js.write(filepath, file);
    return oid;
  } /*: {gitdir: string, type: string, object: Buffer} */
}

// @flow
// This is a convenience wrapper for reading and writing files in the 'refs' directory.
class GitRefsManager {
  static async updateRemoteRefs({ gitdir, remote, refs }) {
    // Validate input
    for (let [key, value] of refs) {
      if (!value.match(/[0-9a-f]{40}/)) {
        throw new Error(`Unexpected ref contents: '${value}'`);
      }
    }
    // Update files
    const normalizeValue = value => value.trim() + '\n';
    for (let [key, value] of refs) {
      // For some reason we trim these
      key = key.replace(/^refs\/heads\//, '');
      key = key.replace(/^refs\/tags\//, '');
      await utils_js.write(path.join(gitdir, 'refs', 'remotes', remote, key), normalizeValue(value), 'utf8');
    }
  } /*: {
    gitdir: string,
    remote: string,
    refs: Map<string, string>
    } */
}

// @flow
function basicAuth(auth) {
  return `Basic ${buffer.Buffer.from(auth.username + ':' + auth.password).toString('base64')}`;
}

class GitRemoteHTTP {
  /*::
  GIT_URL : string
  refs : Map<string, string>
  capabilities : Set<string>
  auth : { username : string, password : string }
  */
  constructor(url /*: string */) {
    // Auto-append the (necessary) .git if it's missing.
    if (!url.endsWith('.git')) url = url += '.git';
    this.GIT_URL = url;
  }
  async preparePull() {
    await this.discover('git-upload-pack');
  }
  async preparePush() {
    await this.discover('git-receive-pack');
  }
  async discover(service /*: string */) {
    this.capabilities = new Set();
    this.refs = new Map();
    let headers = {};
    // headers['Accept'] = `application/x-${service}-advertisement`
    if (this.auth) {
      headers['Authorization'] = basicAuth(this.auth);
    }
    let res = await pify(simpleGet)({
      method: 'GET',
      url: `${this.GIT_URL}/info/refs?service=${service}`,
      headers
    });
    if (res.statusCode !== 200) {
      throw new Error(`Bad status code from server: ${res.statusCode}`);
    }
    let data = await pify(concat)(res);
    // There is probably a better way to do this, but for now
    // let's just throw the result parser inline here.
    let read$$1 = models_js.GitPktLine.reader(data);
    let lineOne = read$$1();
    // skip past any flushes
    while (lineOne === null) lineOne = read$$1();
    if (lineOne === true) throw new Error('Bad response from git server.');
    if (lineOne.toString('utf8') !== `# service=${service}\n`) {
      throw new Error(`Expected '# service=${service}\\n' but got '${lineOne.toString('utf8')}'`);
    }
    let lineTwo = read$$1();
    // skip past any flushes
    while (lineTwo === null) lineTwo = read$$1();
    // In the edge case of a brand new repo, zero refs (and zero capabilities)
    // are returned.
    if (lineTwo === true) return;
    let [firstRef, capabilities] = lineTwo.toString('utf8').trim().split('\0');
    capabilities.split(' ').map(x => this.capabilities.add(x));
    let [ref, name] = firstRef.split(' ');
    this.refs.set(name, ref);
    while (true) {
      let line = read$$1();
      if (line === true) break;
      if (line !== null) {
        let [ref, name] = line.toString('utf8').trim().split(' ');
        this.refs.set(name, ref);
      }
    }
  }
  async push(stream$$1 /*: ReadableStream */) {
    const service = 'git-receive-pack';
    let res = await this.stream({ stream: stream$$1, service });
    return res;
  }
  async pull(stream$$1 /*: ReadableStream */) {
    const service = 'git-upload-pack';
    let res = await this.stream({ stream: stream$$1, service });
    return res;
  }
  async stream({
    stream: stream$$1,
    service
  }) /*: Promise<{ packfile: ReadableStream, progress: ReadableStream }> */{
    let headers = {};
    headers['content-type'] = `application/x-${service}-request`;
    headers['accept'] = `application/x-${service}-result`;
    headers['user-agent'] = `git/${utils_js.pkg.name}@${utils_js.pkg.version}`;
    if (this.auth) {
      headers['authorization'] = basicAuth(this.auth);
    }
    let res = await pify(simpleGet)({
      method: 'POST',
      url: `${this.GIT_URL}/${service}`,
      body: stream$$1,
      headers
    });
    // Don't try to parse git pushes for now.
    if (service === 'git-receive-pack') return res;
    // Parse the response!
    let read$$1 = models_js.GitPktLine.streamReader(res);
    // And now for the ridiculous side-band-64k protocol
    let packetlines = new stream.PassThrough();
    let packfile = new stream.PassThrough();
    let progress = new stream.PassThrough();
    // TODO: Use a proper through stream?
    const nextBit = async function () {
      let line = await read$$1();
      // A made up convention to signal there's no more to read.
      if (line === null) {
        packetlines.end();
        progress.end();
        packfile.end();
        return;
      }
      // Examine first byte to determine which output "stream" to use
      switch (line[0]) {
        case 1:
          // pack data
          packfile.write(line.slice(1));
          break;
        case 2:
          // progress message
          progress.write(line.slice(1));
          break;
        case 3:
          // fatal error message just before stream aborts
          let error = line.slice(1);
          progress.write(error);
          packfile.destroy(new Error(error.toString('utf8')));
          return;
        default:
          // Not part of the side-band-64k protocol
          packetlines.write(line.slice(0));
      }
      // Careful not to blow up the stack.
      // I think Promises in a tail-call position should be OK.
      nextBit();
    };
    nextBit();
    return {
      packetlines,
      packfile,
      progress
    };
  } /*: {
    stream: ReadableStream,
    service: string
    } */
}

exports.GitConfigManager = GitConfigManager;
exports.GitShallowManager = GitShallowManager;
exports.GitIndexManager = GitIndexManager;
exports.GitObjectManager = GitObjectManager;
exports.GitRefsManager = GitRefsManager;
exports.GitRemoteHTTP = GitRemoteHTTP;
