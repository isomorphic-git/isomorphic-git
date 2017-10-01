import ghurl from 'github-url-to-object';
import path from 'path';
import pify from 'pify';
import { Buffer } from 'buffer';
import { HKP, key, message, sign, util } from 'openpgp/dist/openpgp.min.js';
import ini from 'ini';
import get from 'lodash/get';
import set from 'lodash/set';
import BufferCursor from 'buffercursor';
import pad from 'pad';
import { readBytes } from 'gartal';
import sortby from 'lodash/sortBy';
import systemfs from 'fs';
import AsyncLock from 'async-lock';
import pako from 'pako';
import shasum from 'shasum';
import simpleGet from 'simple-get';
import concat from 'simple-concat';
import stream, { PassThrough } from 'stream';
import listpack from 'git-list-pack';
import thru from 'thru';
import peek from 'buffer-peek-stream';
import applyDelta from 'git-apply-delta';
import parseLinkHeader from 'parse-link-header';
import crypto from 'crypto';

// @flow
function formatTimezoneOffset(minutes /*: number */) {
  let sign$$1 = Math.sign(minutes) || 1;
  minutes = Math.abs(minutes);
  let hours = Math.floor(minutes / 60);
  minutes -= hours * 60;
  let strHours = String(hours);
  let strMinutes = String(minutes);
  if (strHours.length < 2) strHours = '0' + strHours;
  if (strMinutes.length < 2) strMinutes = '0' + strMinutes;
  return (sign$$1 === 1 ? '-' : '+') + strHours + strMinutes;
}

function parseTimezoneOffset(offset) {
  let [, sign$$1, hours, minutes] = offset.match(/(\+|-)(\d\d)(\d\d)/);
  minutes = (sign$$1 === '-' ? 1 : -1) * Number(hours) * 60 + Number(minutes);
  return minutes;
}

function parseAuthor(author) {
  let [, name, email, timestamp, offset] = author.match(/^(.*) <(.*)> (.*) (.*)$/);
  return {
    name: name,
    email: email,
    timestamp: Number(timestamp),
    timezoneOffset: parseTimezoneOffset(offset)
  };
}

function normalize(str) {
  // remove all <CR>
  str = str.replace(/\r/g, '');
  // no extra newlines up front
  str = str.replace(/^\n+/, '');
  // and a single newline at the end
  str = str.replace(/\n+$/, '') + '\n';
  return str;
}

function indent(str) {
  return str.trim().split('\n').map(x => ' ' + x).join('\n') + '\n';
}

function outdent(str) {
  return str.split('\n').map(x => x.replace(/^ /, '')).join('\n');
}

// TODO: Make all functions have static async signature?

class GitCommit {
  /*::
  _commit : string
  */
  constructor(commit /*: string|Buffer|Object */) {
    if (typeof commit === 'string') {
      this._commit = commit;
    } else if (Buffer.isBuffer(commit)) {
      this._commit = commit.toString('utf8');
    } else if (typeof commit === 'object') {
      this._commit = GitCommit.render(commit);
    } else {
      throw new Error('invalid type passed to GitCommit constructor');
    }
  }

  static fromPayloadSignature({ payload, signature }) {
    let headers = GitCommit.justHeaders(payload);
    let message$$1 = GitCommit.justMessage(payload);
    let commit = normalize(headers + '\ngpgsig' + indent(signature) + '\n' + message$$1);
    return new GitCommit(commit);
  }

  static from(commit) {
    return new GitCommit(commit);
  }

  toObject() {
    return Buffer.from(this._commit, 'utf8');
  }

  // Todo: allow setting the headers and message
  headers() {
    return this.parseHeaders();
  }

  // Todo: allow setting the headers and message
  message() {
    return GitCommit.justMessage(this._commit);
  }

  static justMessage(commit) {
    return normalize(commit.slice(commit.indexOf('\n\n') + 2));
  }

  static justHeaders(commit) {
    return commit.slice(0, commit.indexOf('\n\n'));
  }

  parseHeaders() {
    let headers = GitCommit.justHeaders(this._commit).split('\n');
    let hs = [];
    for (let h of headers) {
      if (h[0] === ' ') {
        // combine with previous header (without space indent)
        hs[hs.length - 1] += '\n' + h.slice(1);
      } else {
        hs.push(h);
      }
    }
    let obj = {};
    for (let h of hs) {
      let key$$1 = h.slice(0, h.indexOf(' '));
      let value = h.slice(h.indexOf(' ') + 1);
      obj[key$$1] = value;
    }
    obj.parent = obj.parent ? obj.parent.split(' ') : [];
    if (obj.author) {
      obj.author = parseAuthor(obj.author);
    }
    if (obj.committer) {
      obj.committer = parseAuthor(obj.committer);
    }
    return obj;
  }

  static renderHeaders(obj) {
    let headers = '';
    if (obj.tree) {
      headers += `tree ${obj.tree}\n`;
    } else {
      headers += `tree 4b825dc642cb6eb9a060e54bf8d69288fbee4904\n`; // the null tree
    }
    if (obj.parent) {
      headers += 'parent';
      for (let p of obj.parent) {
        headers += ' ' + p;
      }
      headers += '\n';
    }
    let author = obj.author;
    headers += `author ${author.name} <${author.email}> ${author.timestamp} ${formatTimezoneOffset(author.timezoneOffset)}\n`;
    let committer = obj.committer || obj.author;
    headers += `committer ${committer.name} <${committer.email}> ${committer.timestamp} ${formatTimezoneOffset(committer.timezoneOffset)}\n`;
    if (obj.gpgsig) {
      headers += 'gpgsig' + indent(obj.gpgsig);
    }
    return headers;
  }

  static render(obj) {
    return GitCommit.renderHeaders(obj) + '\n' + normalize(obj.message);
  }

  render() {
    return this._commit;
  }

  withoutSignature() {
    let commit = normalize(this._commit);
    if (commit.indexOf('\ngpgsig') === -1) return commit;
    let headers = commit.slice(0, commit.indexOf('\ngpgsig'));
    let message$$1 = commit.slice(commit.indexOf('-----END PGP SIGNATURE-----\n') + '-----END PGP SIGNATURE-----\n'.length);
    return normalize(headers + '\n' + message$$1);
  }

  isolateSignature() {
    let signature = this._commit.slice(this._commit.indexOf('-----BEGIN PGP SIGNATURE-----'), this._commit.indexOf('-----END PGP SIGNATURE-----') + '-----END PGP SIGNATURE-----'.length);
    return outdent(signature);
  }

  async sign(privateKeys /*: string */) {
    let commit = this.withoutSignature();
    let headers = GitCommit.justHeaders(this._commit);
    let message$$1 = GitCommit.justMessage(this._commit);
    let privKeyObj = key.readArmored(privateKeys).keys;
    let { signature } = await sign({
      data: util.str2Uint8Array(commit),
      privateKeys: privKeyObj,
      detached: true,
      armor: true
    });
    // renormalize the line endings to the one true line-ending
    signature = normalize(signature);
    let signedCommit = headers + '\n' + 'gpgsig' + indent(signature) + '\n' + message$$1;
    // return a new commit object
    return GitCommit.from(signedCommit);
  }

  async listSigningKeys() {
    let msg = message.readSignedContent(this.withoutSignature(), this.isolateSignature());
    return msg.getSigningKeyIds().map(keyid => keyid.toHex());
  }

  async verify(publicKeys /*: string */) {
    let pubKeyObj = key.readArmored(publicKeys).keys;
    let msg = message.readSignedContent(this.withoutSignature(), this.isolateSignature());
    let results = msg.verify(pubKeyObj);
    let validity = results.reduce((a, b) => a.valid && b.valid, { valid: true });
    return validity;
  }
}

class GitConfig {
  constructor(text) {
    this.ini = ini.decode(text);
  }
  static from(text) {
    return new GitConfig(text);
  }
  async get(path$$1) {
    return get(this.ini, path$$1);
  }
  async set(path$$1, value) {
    return set(this.ini, path$$1, value);
  }
  toString() {
    return ini.encode(this.ini, { whitespace: true });
  }
}

// @flow
/**
pkt-line Format
---------------

Much (but not all) of the payload is described around pkt-lines.

A pkt-line is a variable length binary string.  The first four bytes
of the line, the pkt-len, indicates the total length of the line,
in hexadecimal.  The pkt-len includes the 4 bytes used to contain
the length's hexadecimal representation.

A pkt-line MAY contain binary data, so implementors MUST ensure
pkt-line parsing/formatting routines are 8-bit clean.

A non-binary line SHOULD BE terminated by an LF, which if present
MUST be included in the total length. Receivers MUST treat pkt-lines
with non-binary data the same whether or not they contain the trailing
LF (stripping the LF if present, and not complaining when it is
missing).

The maximum length of a pkt-line's data component is 65516 bytes.
Implementations MUST NOT send pkt-line whose length exceeds 65520
(65516 bytes of payload + 4 bytes of length data).

Implementations SHOULD NOT send an empty pkt-line ("0004").

A pkt-line with a length field of 0 ("0000"), called a flush-pkt,
is a special case and MUST be handled differently than an empty
pkt-line ("0004").

----
  pkt-line     =  data-pkt / flush-pkt

  data-pkt     =  pkt-len pkt-payload
  pkt-len      =  4*(HEXDIG)
  pkt-payload  =  (pkt-len - 4)*(OCTET)

  flush-pkt    = "0000"
----

Examples (as C-style strings):

----
  pkt-line          actual value
  ---------------------------------
  "0006a\n"         "a\n"
  "0005a"           "a"
  "000bfoobar\n"    "foobar\n"
  "0004"            ""
----
*/
class GitPktLine {
  static flush() {
    return Buffer.from('0000', 'utf8');
  }

  static encode(line /*: string|Buffer */) /*: Buffer */{
    if (typeof line === 'string') {
      line = Buffer.from(line);
    }
    let length = line.length + 4;
    let hexlength = pad(4, length.toString(16), '0');
    return Buffer.concat([Buffer.from(hexlength, 'utf8'), line]);
  }

  static reader(buffer$$1 /*: Buffer */) {
    let buffercursor = new BufferCursor(buffer$$1);
    return function read() {
      if (buffercursor.eof()) return true;
      let length = parseInt(buffercursor.slice(4).toString('utf8'), 16);
      if (length === 0) return null;
      return buffercursor.slice(length - 4).buffer;
    };
  }
  static streamReader(stream$$1 /*: ReadableStream */) {
    return async function read() {
      let hexlength = await readBytes(stream$$1, 4);
      let length = parseInt(hexlength.toString('utf8'), 16);
      if (length === 0) return null;
      let bytes = await readBytes(stream$$1, length - 4);
      return bytes;
    };
  }
}

// @flow
function parseBuffer(buffer$$1) {
  let reader = new BufferCursor(buffer$$1);
  let _entries /*: Map<string, CacheEntry> */ = new Map();
  let magic = reader.toString('utf8', 4);
  if (magic !== 'DIRC') {
    throw new Error(`Inavlid dircache magic file number: ${magic}`);
  }
  let version = reader.readUInt32BE();
  if (version !== 2) throw new Error(`Unsupported dircache version: ${version}`);
  let numEntries = reader.readUInt32BE();
  let i = 0;
  while (!reader.eof() && i < numEntries) {
    let entry = {};
    let ctimeSeconds = reader.readUInt32BE();
    let ctimeNanoseconds = reader.readUInt32BE();
    entry.ctime = new Date(ctimeSeconds * 1000 + ctimeNanoseconds / 1000000);
    entry.ctimeNanoseconds = ctimeNanoseconds;
    let mtimeSeconds = reader.readUInt32BE();
    let mtimeNanoseconds = reader.readUInt32BE();
    entry.mtime = new Date(mtimeSeconds * 1000 + mtimeNanoseconds / 1000000);
    entry.mtimeNanoseconds = mtimeNanoseconds;
    entry.dev = reader.readUInt32BE();
    entry.ino = reader.readUInt32BE();
    entry.mode = reader.readUInt32BE();
    entry.uid = reader.readUInt32BE();
    entry.gid = reader.readUInt32BE();
    entry.size = reader.readUInt32BE();
    entry.oid = reader.slice(20).toString('hex');
    entry.flags = reader.readUInt16BE(); // TODO: extract 1-bit assume-valid, 1-bit extended flag, 2-bit merge state flag, 12-bit path length flag
    // TODO: handle if (version === 3 && entry.flags.extended)
    let pathlength = buffer$$1.indexOf(0, reader.tell() + 1) - reader.tell();
    if (pathlength < 1) throw new Error(`Got a path length of: ${pathlength}`);
    entry.path = reader.toString('utf8', pathlength);
    // The next bit is awkward. We expect 1 to 8 null characters
    let tmp = reader.readUInt8();
    if (tmp !== 0) {
      throw new Error(`Expected 1-8 null characters but got '${tmp}'`);
    }
    let numnull = 1;
    while (!reader.eof() && reader.readUInt8() === 0 && numnull < 9) numnull++;
    reader.seek(reader.tell() - 1);
    // end of awkward part
    _entries.set(entry.path, entry);
    i++;
  }

  return _entries;
}

class GitIndex {
  /*::
   _entries: Map<string, CacheEntry>
   _dirty: boolean // Used to determine if index needs to be saved to filesystem
   */
  constructor(index /*: any */) {
    this._dirty = false;
    if (Buffer.isBuffer(index)) {
      this._entries = parseBuffer(index);
    } else if (index === null) {
      this._entries = new Map();
    } else {
      throw new Error('invalid type passed to GitIndex constructor');
    }
  }
  static from(buffer$$1) {
    return new GitIndex(buffer$$1);
  }
  get entries() /*: Array<CacheEntry> */{
    return sortby([...this._entries.values()], 'path');
  }
  *[Symbol.iterator]() {
    for (let entry of this.entries) {
      yield entry;
    }
  }
  insert({ filepath, stats, oid }) {
    let entry = {
      ctime: stats.ctime,
      mtime: stats.mtime,
      dev: stats.dev,
      ino: stats.ino,
      mode: stats.mode,
      uid: stats.uid,
      gid: stats.gid,
      size: stats.size,
      path: filepath,
      oid: oid,
      flags: 0
    };
    this._entries.set(entry.path, entry);
    this._dirty = true;
  } /*: {filepath: string, stats: Stats, oid: string } */
  delete({ filepath /*: {filepath: string} */ }) {
    if (this._entries.has(filepath)) {
      this._entries.delete(filepath);
    } else {
      for (let key$$1 of this._entries.keys()) {
        if (key$$1.startsWith(filepath + '/')) {
          this._entries.delete(key$$1);
        }
      }
    }
    this._dirty = true;
  }
  render() {
    return this.entries.map(entry => `${entry.mode.toString(8)} ${entry.oid}    ${entry.path}`).join('\n');
  }
  toObject() {
    let header = Buffer.alloc(12);
    let writer = new BufferCursor(header);
    writer.write('DIRC', 4, 'utf8');
    writer.writeUInt32BE(2);
    writer.writeUInt32BE(this.entries.length);
    let body = Buffer.concat(this.entries.map(entry => {
      // the fixed length + the filename + at least one null char => align by 8
      let length = Math.ceil((62 + entry.path.length + 1) / 8) * 8;
      let written = Buffer.alloc(length);
      let writer = new BufferCursor(written);
      let ctimeMilliseconds = entry.ctime.valueOf();
      let ctimeSeconds = Math.floor(ctimeMilliseconds / 1000);
      let ctimeNanoseconds = entry.ctimeNanoseconds || ctimeMilliseconds * 1000000 - ctimeSeconds * 1000000 * 1000;
      let mtimeMilliseconds = entry.mtime.valueOf();
      let mtimeSeconds = Math.floor(mtimeMilliseconds / 1000);
      let mtimeNanoseconds = entry.mtimeNanoseconds || mtimeMilliseconds * 1000000 - mtimeSeconds * 1000000 * 1000;
      writer.writeUInt32BE(ctimeSeconds);
      writer.writeUInt32BE(ctimeNanoseconds);
      writer.writeUInt32BE(mtimeSeconds);
      writer.writeUInt32BE(mtimeNanoseconds);
      writer.writeUInt32BE(entry.dev);
      writer.writeUInt32BE(entry.ino);
      writer.writeUInt32BE(entry.mode);
      writer.writeUInt32BE(entry.uid);
      writer.writeUInt32BE(entry.gid);
      writer.writeUInt32BE(entry.size);
      writer.write(entry.oid, 20, 'hex');
      writer.writeUInt16BE(entry.flags);
      writer.write(entry.path, entry.path.length, 'utf8');
      return written;
    }));
    return Buffer.concat([header, body]);
  }
}

// @flow
function parseBuffer$1(buffer$$1) /*: Array<TreeEntry> */{
  let _entries = [];
  let cursor = 0;
  while (cursor < buffer$$1.length) {
    let space = buffer$$1.indexOf(32, cursor);
    if (space === -1) {
      throw new Error(`GitTree: Error parsing buffer at byte location ${cursor}: Could not find the next space character.`);
    }
    let nullchar = buffer$$1.indexOf(0, cursor);
    if (nullchar === -1) {
      throw new Error(`GitTree: Error parsing buffer at byte location ${cursor}: Could not find the next null character.`);
    }
    let mode = buffer$$1.slice(cursor, space).toString('utf8');
    if (mode === '40000') mode = '040000'; // makes it line up neater in printed output
    let type = mode === '040000' ? 'tree' : 'blob';
    let path$$1 = buffer$$1.slice(space + 1, nullchar).toString('utf8');
    let oid = buffer$$1.slice(nullchar + 1, nullchar + 21).toString('hex');
    cursor = nullchar + 21;
    _entries.push({ mode, path: path$$1, oid, type });
  }
  return _entries;
}

function nudgeIntoShape(entry) {
  if (!entry.oid && entry.sha) {
    entry.oid = entry.sha; // Github
  }
  if (typeof entry.mode === 'number') {
    entry.mode = entry.mode.toString(8); // index
  }
  if (!entry.type) {
    entry.type = 'blob'; // index
  }
  return entry;
}

class GitTree {
  /*::
  _entries: Array<TreeEntry>
  */
  constructor(entries /*: any */) {
    if (Buffer.isBuffer(entries)) {
      this._entries = parseBuffer$1(entries);
    } else if (Array.isArray(entries)) {
      this._entries = entries.map(nudgeIntoShape);
    } else {
      throw new Error('invalid type passed to GitTree constructor');
    }
  }
  static from(tree) {
    return new GitTree(tree);
  }
  render() {
    return this._entries.map(entry => `${entry.mode} ${entry.type} ${entry.oid}    ${entry.path}`).join('\n');
  }
  toObject() {
    return Buffer.concat(this._entries.map(entry => {
      let mode = Buffer.from(entry.mode.replace(/^0/, ''));
      let space = Buffer.from(' ');
      let path$$1 = Buffer.from(entry.path, { encoding: 'utf8' });
      let nullchar = Buffer.from([0]);
      let oid = Buffer.from(entry.oid.match(/../g).map(n => parseInt(n, 16)));
      return Buffer.concat([mode, space, path$$1, nullchar, oid]);
    }));
  }
  entries() {
    return this._entries;
  }
  *[Symbol.iterator]() {
    for (let entry of this._entries) {
      yield entry;
    }
  }
}

var fs = function () {
  return global.fs || systemfs;
};

async function exists(file, options) {
  return new Promise(function (resolve, reject) {
    fs().stat(file, (err, stats) => {
      if (err) return err.code === 'ENOENT' ? resolve(false) : reject(err);
      resolve(true);
    });
  });
}

// @flow
function flatFileListToDirectoryStructure(files /*: Array<{path: string}> */
) /*: Node|void */{
  const inodes /*: Map<string, Node> */ = new Map();
  const mkdir = function (name) /*: Node|void */{
    if (!inodes.has(name)) {
      let dir /*: Node */ = {
        type: 'tree',
        fullpath: name,
        basename: path.basename(name),
        metadata: {},
        children: []
      };
      inodes.set(name, dir);
      // This recursively generates any missing parent folders.
      // We do it after we've added the inode to the set so that
      // we don't recurse infinitely trying to create the root '.' dirname.
      dir.parent = mkdir(path.dirname(name));
      if (dir.parent && dir.parent !== dir) dir.parent.children.push(dir);
    }
    return inodes.get(name);
  };

  const mkfile = function (name, metadata) /*: Node|void */{
    if (!inodes.has(name)) {
      let file /*: Node */ = {
        type: 'blob',
        fullpath: name,
        basename: path.basename(name),
        metadata: metadata,
        // This recursively generates any missing parent folders.
        parent: mkdir(path.dirname(name)),
        children: []
      };
      if (file.parent) file.parent.children.push(file);
      inodes.set(name, file);
    }
    return inodes.get(name);
  };

  for (let file of files) {
    mkfile(file.path, file);
  }
  return inodes.get('.');
}

// @flow
// This is modeled after the lockfile strategy used by the git source code.

// @flow
async function mkdir(dirpath /*: string */) {
  try {
    await pify(fs().mkdir)(dirpath);
    return;
  } catch (err) {
    // If err is null then operation succeeded!
    if (err === null) return;
    // If the directory already exists, that's OK!
    if (err.code === 'EEXIST') return;
    // If we got a "no such file or directory error" backup and try again.
    if (err.code === 'ENOENT') {
      let parent = path.dirname(dirpath);
      // Check to see if we've gone too far
      if (parent === '.' || parent === '/' || parent === dirpath) throw err;
      // Infinite recursion, what could go wrong?
      await mkdir(parent);
      await mkdir(dirpath);
    }
  }
}

async function mkdirs(dirlist /*: string[] */) {
  return Promise.all(dirlist.map(mkdir));
}

async function read(file, options) {
  return new Promise(function (resolve, reject) {
    fs().readFile(file, options, (err, file) => err ? resolve(null) : resolve(file));
  });
}

async function resolveRef({ gitdir, ref, depth }) {
  if (depth !== undefined) {
    depth--;
    if (depth === -1) {
      return ref;
    }
  }
  let sha;
  // Is it a ref pointer?
  if (ref.startsWith('ref: ')) {
    ref = ref.slice('ref: '.length);
    return resolveRef({ gitdir, ref, depth });
  }
  // Is it a complete and valid SHA?
  if (ref.length === 40) {
    if (await exists(`${gitdir}/objects/${ref.slice(0, 2)}/${ref.slice(2)}`)) {
      return ref;
    }
  }
  // Is it a special ref?
  if (ref === 'HEAD' || ref === 'MERGE_HEAD') {
    sha = await read(`${gitdir}/${ref}`, { encoding: 'utf8' });
    if (sha) return resolveRef({ gitdir, ref: sha.trim(), depth });
  }
  // Is it a full ref?
  if (ref.startsWith('refs/')) {
    sha = await read(`${gitdir}/${ref}`, { encoding: 'utf8' });
    if (sha) return resolveRef({ gitdir, ref: sha.trim(), depth });
  }
  // Is it a (local) branch?
  sha = await read(`${gitdir}/refs/heads/${ref}`, { encoding: 'utf8' });
  if (sha) return resolveRef({ gitdir, ref: sha.trim(), depth });
  // Is it a tag?
  sha = await read(`${gitdir}/refs/tags/${ref}`, { encoding: 'utf8' });
  if (sha) return resolveRef({ gitdir, ref: sha.trim(), depth });
  // Is it remote branch?
  sha = await read(`${gitdir}/refs/remotes/${ref}`, { encoding: 'utf8' });
  if (sha) return resolveRef({ gitdir, ref: sha.trim(), depth });
  // Do we give up?
  throw new Error(`Could not resolve reference ${ref}`);
}

// @flow
async function write(filepath /*: string */
, contents /*: string|Buffer */
, options /*: Object */ = {}) {
  try {
    await pify(fs().writeFile)(filepath, contents, options);
    return;
  } catch (err) {
    // Hmm. Let's try mkdirp and try again.
    await mkdir(path.dirname(filepath));
    await pify(fs().writeFile)(filepath, contents, options);
  }
}

var name = "isomorphic-git";
var version = "0.0.5";

// @flow
class GitConfigManager {
  static async get({ gitdir }) {
    // We can improve efficiency later if needed.
    // TODO: read from full list of git config files
    let text = await read(`${gitdir}/config`, { encoding: 'utf8' });
    return GitConfig.from(text);
  }
  static async save({ gitdir, config }) {
    // We can improve efficiency later if needed.
    // TODO: handle saving to the correct global/user/repo location
    await write(`${gitdir}/config`, config.toString(), {
      encoding: 'utf8'
    });
  }
}

// @flow
// import LockManager from 'travix-lock-manager'
const map /*: Map<string, GitIndex> */ = new Map();
// const lm = new LockManager()
const lock$1 = new AsyncLock();

class GitIndexManager {
  static async acquire(filepath, closure) {
    await lock$1.acquire(filepath, async function () {
      let index = map.get(filepath);
      if (index === undefined) {
        // Acquire a file lock while we're reading the index
        // to make sure other processes aren't writing to it
        // simultaneously, which could result in a corrupted index.
        // const fileLock = await Lock(filepath)
        const rawIndexFile = await read(filepath);
        index = GitIndex.from(rawIndexFile);
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
        await write(filepath, buffer$$1);
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
  let buffer$$1 = Buffer.concat([Buffer.from(type + ' '), Buffer.from(object.byteLength.toString()), Buffer.from([0]), Buffer.from(object)]);
  let oid = shasum(buffer$$1);
  return {
    oid,
    file: Buffer.from(pako.deflate(buffer$$1))
  };
}

function unwrapObject({ oid, file /*: {oid: string, file: Buffer} */ }) {
  let inflated = Buffer.from(pako.inflate(file));
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
    object: Buffer.from(inflated.slice(i + 1))
  };
}

class GitObjectManager {
  static async read({ gitdir, oid /*: {gitdir: string, oid: string} */ }) {
    let file = await read(`${gitdir}/objects/${oid.slice(0, 2)}/${oid.slice(2)}`);
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
    if (!(await exists(filepath))) await write(filepath, file);
    return oid;
  } /*: {gitdir: string, type: string, object: Buffer} */
}

// @flow
// This is a convenience wrapper for reading and writing files in the 'refs' directory.
class GitRefsManager {
  static async updateRemoteRefs({ gitdir, remote, refs }) {
    // Validate input
    for (let [key$$1, value] of refs) {
      if (!value.match(/[0-9a-f]{40}/)) {
        throw new Error(`Unexpected ref contents: '${value}'`);
      }
    }
    // Update files
    const normalizeValue = value => value.trim() + '\n';
    for (let [key$$1, value] of refs) {
      await write(path.join(gitdir, 'refs', 'remotes', remote, key$$1), normalizeValue(value), 'utf8');
    }
  } /*: { gitdir: string, remote: string, refs: Map<string, string> } */
}

// @flow
function basicAuth(auth) {
  return `Basic ${Buffer.from(auth.username + ':' + auth.password).toString('base64')}`;
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
    let read = GitPktLine.reader(data);
    let lineOne = read();
    // skip past any flushes
    while (lineOne === null) lineOne = read();
    if (lineOne === true) throw new Error('Bad response from git server.');
    if (lineOne.toString('utf8') !== `# service=${service}\n`) {
      throw new Error(`Expected '# service=${service}\\n' but got '${lineOne.toString('utf8')}'`);
    }
    let lineTwo = read();
    // skip past any flushes
    while (lineTwo === null) lineTwo = read();
    // In the edge case of a brand new repo, zero refs (and zero capabilities)
    // are returned.
    if (lineTwo === true) return;
    let [firstRef, capabilities] = lineTwo.toString('utf8').trim().split('\0');
    capabilities.split(' ').map(x => this.capabilities.add(x));
    let [ref, name] = firstRef.split(' ');
    this.refs.set(name, ref);
    while (true) {
      let line = read();
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
  }) /*: Promise<{packfile: ReadableStream, progress: ReadableStream }> */{
    let headers = {};
    headers['content-type'] = `application/x-${service}-request`;
    headers['accept'] = `application/x-${service}-result`;
    headers['user-agent'] = `git/${name}@${version}`;
    if (this.auth) {
      headers['authorization'] = basicAuth(this.auth);
    }
    console.log('headers =', headers);
    let res = await pify(simpleGet)({
      method: 'POST',
      url: `${this.GIT_URL}/${service}`,
      body: stream$$1,
      headers
    });
    // Don't try to parse git pushes for now.
    if (service === 'git-receive-pack') return res;
    // Parse the response!
    let read = GitPktLine.streamReader(res);
    // And now for the ridiculous side-band-64k protocol
    let packetlines = new PassThrough();
    let packfile = new PassThrough();
    let progress = new PassThrough();
    // TODO: Use a proper through stream?
    const nextBit = async function () {
      let line = await read();
      // A made up convention to signal there's no more to read.
      if (line === null) {
        packfile.end();
        progress.end();
        packetlines.end();
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
          packetlines.write(line.slice(1));
      }
      process.nextTick(nextBit);
    };
    process.nextTick(nextBit);
    return {
      packetlines,
      packfile,
      progress
    };
  } /*: {
    stream: ReadableStream,
    service: string}
    */
}

async function add({ gitdir, workdir, filepath }) {
  const type = 'blob';
  const object = await read(path.join(workdir, filepath));
  if (object === null) throw new Error(`Could not read file '${filepath}'`);
  const oid = await GitObjectManager.write({ gitdir, type, object });
  await GitIndexManager.acquire(`${gitdir}/index`, async function (index) {
    let stats = await pify(fs().lstat)(path.join(workdir, filepath));
    index.insert({ filepath, stats, oid });
  });
  // TODO: return oid?
}

async function writeTreeToDisk({ gitdir, dirpath, tree }) {
  for (let entry of tree) {
    let { type, object } = await GitObjectManager.read({
      gitdir,
      oid: entry.oid
    });
    let entrypath = `${dirpath}/${entry.path}`;
    switch (type) {
      case 'blob':
        await write(entrypath, object);
        break;
      case 'tree':
        let tree = GitTree.from(object);
        await writeTreeToDisk({ gitdir, dirpath: entrypath, tree });
        break;
      default:
        throw new Error(`Unexpected object type ${type} found in tree for '${dirpath}'`);
    }
  }
}

async function checkout({ workdir, gitdir, remote, ref }) {
  // Get tree oid
  let oid;
  try {
    oid = await resolveRef({ gitdir, ref });
  } catch (e) {
    oid = await resolveRef({ gitdir, ref: `${remote}/${ref}` });
    await write(`${gitdir}/refs/heads/${ref}`, oid + '\n');
  }
  let commit = await GitObjectManager.read({ gitdir, oid });
  if (commit.type !== 'commit') {
    throw new Error(`Unexpected type: ${commit.type}`);
  }
  let comm = GitCommit.from(commit.object.toString('utf8'));
  let sha = comm.headers().tree;
  // Get top-level tree
  let { type, object } = await GitObjectManager.read({ gitdir, oid: sha });
  if (type !== 'tree') throw new Error(`Unexpected type: ${type}`);
  let tree = GitTree.from(object);
  // Write files. TODO: Write them atomically
  await writeTreeToDisk({ gitdir, dirpath: workdir, tree });
  // Update HEAD TODO: Handle non-branch cases
  write(`${gitdir}/HEAD`, `ref: refs/heads/${ref}`);
}

async function constructTree({ gitdir, inode }) /*: string */{
  // use depth first traversal
  let children = inode.children;
  for (let inode of children) {
    if (inode.type === 'tree') {
      inode.metadata.mode = '040000';
      inode.metadata.oid = await constructTree({ gitdir, inode });
    }
  }
  let entries = children.map(inode => ({
    mode: inode.metadata.mode,
    path: inode.basename,
    oid: inode.metadata.oid,
    type: inode.type
  }));
  const tree = GitTree.from(entries);
  let oid = await GitObjectManager.write({
    gitdir,
    type: 'tree',
    object: tree.toObject()
  });
  return oid;
}

async function commit({
  gitdir,
  author,
  committer,
  message: message$$1,
  privateKeys
}) {
  // Fill in missing arguments with default values
  committer = committer || author;
  let authorDateTime = author.date || new Date();
  let committerDateTime = committer.date || authorDateTime;
  let oid;
  await GitIndexManager.acquire(`${gitdir}/index`, async function (index) {
    const inode = flatFileListToDirectoryStructure(index.entries);
    const treeRef = await constructTree({ gitdir, inode });
    let parents;
    try {
      let parent = await resolveRef({ gitdir, ref: 'HEAD' });
      parents = [parent];
    } catch (err) {
      // Probably an initial commit
      parents = [];
    }
    let comm = GitCommit.from({
      tree: treeRef,
      parent: parents,
      author: {
        name: author.name,
        email: author.email,
        timestamp: author.timestamp || Math.floor(authorDateTime.valueOf() / 1000),
        timezoneOffset: author.timezoneOffset || 0
      },
      committer: {
        name: committer.name,
        email: committer.email,
        timestamp: committer.timestamp || Math.floor(committerDateTime.valueOf() / 1000),
        timezoneOffset: committer.timezoneOffset || 0
      },
      message: message$$1
    });
    if (privateKeys) {
      comm = await comm.sign(privateKeys);
    }
    oid = await GitObjectManager.write({
      gitdir,
      type: 'commit',
      object: comm.toObject()
    });
    // Update branch pointer
    const branch = await resolveRef({ gitdir, ref: 'HEAD', depth: 2 });
    await write(path.join(gitdir, branch), oid + '\n');
  });
  return oid;
}

async function getConfig({ gitdir, path: path$$1 }) {
  const config = await GitConfigManager.get({ gitdir });
  const value = await config.get(path$$1);
  return value;
}

// @flow
const types = {
  1: 'commit',
  2: 'tree',
  3: 'blob',
  4: 'tag',
  6: 'ofs-delta',
  7: 'ref-delta'
};

function parseVarInt(buffer$$1 /*: Buffer */) {
  let n = 0;
  for (var i = 0; i < buffer$$1.byteLength; i++) {
    n = (buffer$$1[i] & 0b01111111) + (n << 7);
    if ((buffer$$1[i] & 0b10000000) === 0) {
      if (i !== buffer$$1.byteLength - 1) throw new Error('Invalid varint buffer');
      return n;
    }
  }
  throw new Error('Invalid varint buffer');
}

// TODO: Move this to 'plumbing'
async function unpack({ gitdir, inputStream /*: {gitdir: string, inputStream: ReadableStream} */
}) {
  return new Promise(function (resolve, reject) {
    // Read header
    peek(inputStream, 12, (err, data, inputStream) => {
      if (err) return reject(err);
      let iden = data.slice(0, 4).toString('utf8');
      if (iden !== 'PACK') {
        throw new Error(`Packfile started with '${iden}'. Expected 'PACK'`);
      }
      let ver = data.slice(4, 8).toString('hex');
      if (ver !== '00000002') {
        throw new Error(`Unknown packfile version '${ver}'. Expected 00000002.`);
      }
      // Read a 4 byte (32-bit) int
      let numObjects = data.readInt32BE(8);
      console.log(`unpacking ${numObjects} objects`);
      if (numObjects === 0) return;
      // And on our merry way
      let offsetMap = new Map();
      inputStream.pipe(listpack()).pipe(thru(async ({ data, type, reference, offset, num }, next) => {
        type = types[type];
        if (type === 'ref-delta') {
          let oid = reference.toString('hex');
          try {
            let { object, type } = await GitObjectManager.read({
              gitdir,
              oid
            });
            let result = applyDelta(data, object);
            let newoid = await GitObjectManager.write({
              gitdir,
              type,
              object: result
            });
            console.log(`${type} ${newoid} ref-delta ${oid}`);
            offsetMap.set(offset, oid);
          } catch (err) {
            throw new Error(`Could not find object ${oid} that is referenced by a ref-delta object in packfile at byte offset ${offset}.`);
          }
        } else if (type === 'ofs-delta') {
          // Note: this might be not working because offsets might not be
          // guaranteed to be on object boundaries? In which case we'd need
          // to write the packfile to disk first, I think.
          // For now I've "solved" it by simply not advertising ofs-delta as a capability
          // during the HTTP request, so Github will only send ref-deltas not ofs-deltas.
          let absoluteOffset = offset - parseVarInt(reference);
          let referenceOid = offsetMap.get(absoluteOffset);
          console.log(`${offset} ofs-delta ${absoluteOffset} ${referenceOid}`);
          let { type, object } = await GitObjectManager.read({
            gitdir,
            oid: referenceOid
          });
          let result = applyDelta(data, object);
          let oid = await GitObjectManager.write({
            gitdir,
            type,
            object: result
          });
          console.log(`${offset} ${type} ${oid} ofs-delta ${referenceOid}`);
          offsetMap.set(offset, oid);
        } else {
          let oid = await GitObjectManager.write({
            gitdir,
            type,
            object: data
          });
          console.log(`${offset} ${type} ${oid}`);
          offsetMap.set(offset, oid);
        }
        if (num === 0) return resolve();
        next(null);
      })).on('error', reject).on('finish', resolve);
    });
  });
}

// @flow
async function fetchPackfile({ gitdir, ref = 'HEAD', remote, auth }) {
  let url = await getConfig({
    gitdir,
    path: `remote "${remote}".url`
  });
  let remoteHTTP = new GitRemoteHTTP(url);
  remoteHTTP.auth = auth;
  await remoteHTTP.preparePull();
  await GitRefsManager.updateRemoteRefs({
    gitdir,
    remote,
    refs: remoteHTTP.refs
  });
  let want = remoteHTTP.refs.get(ref);
  console.log('want =', want);
  // Note: I removed "ofs-delta" from the capabilities list and now
  // Github uses all ref-deltas when I fetch packfiles instead of all ofs-deltas. Nice!
  const capabilities = `multi_ack_detailed no-done side-band-64k thin-pack agent=git/${name}@${version}`;
  let packstream = new stream.PassThrough();
  packstream.write(GitPktLine.encode(`want ${want} ${capabilities}\n`));
  packstream.write(GitPktLine.flush());
  let have = null;
  try {
    have = await resolveRef({ gitdir, ref });
    console.log('have =', have);
  } catch (err) {
    console.log("Looks like we don't have that ref yet.");
  }
  if (have) {
    packstream.write(GitPktLine.encode(`have ${have}\n`));
    packstream.write(GitPktLine.flush());
  }
  packstream.end(GitPktLine.encode(`done\n`));
  let response = await remoteHTTP.pull(packstream);
  return response;
}

async function fetch({ gitdir, ref = 'HEAD', remote, auth }) {
  let response = await fetchPackfile({ gitdir, ref, remote, auth });
  // response.packetlines.pipe(process.stdout)
  response.progress.pipe(process.stdout);
  await unpack({ gitdir, inputStream: response.packfile });
}

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key$$1 in source) { if (Object.prototype.hasOwnProperty.call(source, key$$1)) { target[key$$1] = source[key$$1]; } } } return target; };

// We're implementing a non-standard clone based on the Github API first, because of CORS.
// And because we already have the code.
async function request({ url, token, headers }) {
  let res = await pify(simpleGet)({
    url,
    headers: _extends({
      Accept: 'application/vnd.github.v3+json',
      Authorization: 'token ' + token
    }, headers)
  });
  let data = await pify(concat)(res);
  return JSON.parse(data.toString('utf8'));
}

async function fetchRemoteBranches({ gitdir, remote, user, repo, token }) {
  return request({
    token,
    url: `https://api.github.com/repos/${user}/${repo}/branches`
  }).then(json => Promise.all(json.map(branch => write(`${gitdir}/refs/remotes/${remote}/${branch.name}`, branch.commit.sha + '\n', { encoding: 'utf8' }))));
}

async function fetchTags({ gitdir, user, repo, token }) {
  return request({
    token,
    url: `https://api.github.com/repos/${user}/${repo}/tags`
  }).then(json => Promise.all(json.map(tag =>
  // Curiously, tags are not separated between remotes like branches
  write(`${gitdir}/refs/tags/${tag.name}`, tag.commit.sha + '\n', {
    encoding: 'utf8'
  }))));
}

async function fetchCommits({ gitdir, url, user, repo, ref, since, token }) {
  if (!url) {
    url = `https://api.github.com/repos/${user}/${repo}/commits?`;
    if (ref) url += `&sha=${ref}`;
    if (since) {
      let date = new Date(since * 1000).toISOString();
      url += `&since=${date}`;
    }
  }
  let res = await pify(simpleGet)({
    url,
    headers: {
      Accept: 'application/vnd.github.cryptographer-preview',
      Authorization: 'token ' + token
    }
  });
  let data = await pify(concat)(res);
  let json = JSON.parse(data.toString('utf8'));
  let link = parseLinkHeader(res.headers['link']);

  for (let commit of json) {
    if (!commit.commit.verification.payload) {
      console.log(`Commit ${commit.sha} skipped. Due to a technical limitations and my laziness, only signed commits can be cloned from Github over the API`);
      continue;
    }
    let comm = GitCommit.fromPayloadSignature({
      payload: commit.commit.verification.payload,
      signature: commit.commit.verification.signature
    });
    console.log('Created commit', comm);
    let oid = await GitObjectManager.write({
      gitdir,
      type: 'commit',
      object: comm.toObject()
    });
    if (commit.sha !== oid) {
      console.log("AHOY! MATEY! THAR BE TROUBLE WITH 'EM HASHES!");
    }
    console.log(`Stored commit ${commit.sha}`);
  }

  if (link && link.next) {
    return fetchCommits({
      gitdir,
      user,
      repo,
      ref,
      since,
      token,
      url: link.next.url
    });
  }
}

async function fetchTree({ gitdir, url, user, repo, sha, since, token }) {
  let json = await request({
    token,
    url: `https://api.github.com/repos/${user}/${repo}/git/trees/${sha}`
  });
  let tree = new GitTree(json.tree);
  let oid = await GitObjectManager.write({
    gitdir,
    type: 'tree',
    object: tree.toObject()
  });
  if (sha !== oid) {
    console.log("AHOY! MATEY! THAR BE TROUBLE WITH 'EM HASHES!");
  }
  console.log(tree.render());
  return Promise.all(json.tree.map(async entry => {
    if (entry.type === 'blob') {
      await fetchBlob({
        gitdir,
        url,
        user,
        repo,
        sha: entry.sha,
        since,
        token
      });
    } else if (entry.type === 'tree') {
      await fetchTree({
        gitdir,
        url,
        user,
        repo,
        sha: entry.sha,
        since,
        token
      });
    }
  }));
}

async function fetchBlob({ gitdir, url, user, repo, sha, since, token }) {
  let res = await pify(simpleGet)({
    url: `https://api.github.com/repos/${user}/${repo}/git/blobs/${sha}`,
    headers: {
      Accept: 'application/vnd.github.raw',
      Authorization: 'token ' + token
    }
  });
  let data = await pify(concat)(res);
  let oid = await GitObjectManager.write({
    gitdir,
    type: 'blob',
    object: data
  });
  if (sha !== oid) {
    console.log("AHOY! MATEY! THAR BE TROUBLE WITH 'EM HASHES!");
  }
}

async function GithubFetch({
  gitdir,
  token,
  user,
  repo,
  ref,
  remote,
  since
}) {
  let json;

  if (!ref) {
    console.log('Determining the default branch');
    json = await request({
      token,
      url: `https://api.github.com/repos/${user}/${repo}`
    });
    ref = json.default_branch;
  }

  console.log('Receiving branches list');
  let getBranches = fetchRemoteBranches({ gitdir, remote, user, repo, token });

  console.log('Receiving tags list');
  let getTags = fetchTags({ gitdir, user, repo, token });

  console.log('Receiving commits');
  let getCommits = fetchCommits({ gitdir, user, repo, token, ref });

  await Promise.all([getBranches, getTags, getCommits]);

  // This is all crap to get a tree SHA from a commit SHA. Seriously.
  let oid = await resolveRef({ gitdir, ref: `${remote}/${ref}` });
  let { type, object } = await GitObjectManager.read({ gitdir, oid });
  if (type !== 'commit') throw new Error(`Unexpected type: ${type}`);
  let comm = GitCommit.from(object.toString('utf8'));
  let sha = comm.headers().tree;
  console.log('tree: ', sha);

  await fetchTree({ gitdir, user, repo, token, sha });
}

// @flow
async function init(gitdir /*: string */) {
  let folders = ['hooks', 'info', 'objects/info', 'objects/pack', 'refs/heads', 'refs/tags'];
  folders = folders.map(dir => gitdir + '/' + dir);
  await mkdirs(folders);
  await write(gitdir + '/config', '[core]\n' + '\trepositoryformatversion = 0\n' + '\tfilemode = false\n' + '\tbare = false\n' + '\tlogallrefupdates = true\n' + '\tsymlinks = false\n' + '\tignorecase = true\n');
  await write(gitdir + '/HEAD', 'ref: refs/heads/master\n');
  // await write(gitdir + '/refs/heads/master', '')
}

async function list({ gitdir }) {
  let filenames;
  await GitIndexManager.acquire(`${gitdir}/index`, async function (index) {
    filenames = index.entries.map(x => x.path);
  });
  return filenames;
}

// @flow
async function listCommits({
  gitdir,
  start,
  finish /*: {
         gitdir: string,
         start: Array<string>,
         finish: Array<string>
         } */
}) {
  let startingSet = new Set();
  let finishingSet = new Set();
  for (let ref of start) {
    startingSet.add((await resolveRef({ gitdir, ref })));
  }
  for (let ref of finish) {
    // We may not have these refs locally so we must try/catch
    try {
      let oid = await resolveRef({ gitdir, ref });
      finishingSet.add(oid);
    } catch (err) {}
  }
  let visited = new Set(); /*: Set<string> */

  // Because git commits are named by their hash, there is no
  // way to construct a cycle. Therefore we won't worry about
  // setting a default recursion limit.
  async function walk(oid) {
    visited.add(oid);
    let { type, object } = await GitObjectManager.read({ gitdir, oid });
    if (type !== 'commit') {
      throw new Error(`Expected type commit but type is ${type}`);
    }
    let commit = GitCommit.from(object);
    let parents = commit.headers().parent;
    for (oid of parents) {
      if (!finishingSet.has(oid) && !visited.has(oid)) {
        await walk(oid);
      }
    }
  }

  // Let's go walking!
  for (let oid of startingSet) {
    await walk(oid);
  }
  return visited;
}

// @flow
async function listObjects({ gitdir, oids /*: {
                                                 gitdir: string,
                                                 oids: Array<string>
                                                 } */
}) {
  let visited /*: Set<string> */ = new Set();

  // We don't do the purest simplest recursion, because we can
  // avoid reading Blob objects entirely since the Tree objects
  // tell us which oids are Blobs and which are Trees.
  async function walk(oid) {
    visited.add(oid);
    let { type, object } = await GitObjectManager.read({ gitdir, oid });
    if (type === 'commit') {
      let commit = GitCommit.from(object);
      let tree = commit.headers().tree;
      await walk(tree);
    } else if (type === 'tree') {
      let tree = GitTree.from(object);
      for (let entry /*: TreeEntry */ of tree) {
        visited.add(entry.oid);
        // only recurse for trees
        if (entry.type === 'tree') {
          await walk(entry.oid);
        }
      }
    }
  }

  // Let's go walking!
  for (let oid of oids) {
    await walk(oid);
  }
  return visited;
}

// @flow
const types$1 = {
  commit: 0b0010000,
  tree: 0b0100000,
  blob: 0b0110000,
  tag: 0b1000000
  // TODO: Move this to 'plumbing'
};async function pack({
  oids,
  gitdir,
  outputStream /*: {oids: Array<string>, gitdir: string, outputStream: Writable} */
}) {
  let hash = crypto.createHash('sha1');
  let stream$$1 = outputStream;
  function write(chunk, enc) {
    stream$$1.write(chunk, enc);
    hash.update(chunk, enc);
  }
  function writeObject({ stype, object }) {
    let lastFour, multibyte, length;
    // Object type is encoded in bits 654
    let type = types$1[stype];
    if (type === undefined) throw new Error('Unrecognized type: ' + stype);
    // The length encoding get complicated.
    length = object.length;
    // Whether the next byte is part of the variable-length encoded number
    // is encoded in bit 7
    multibyte = length > 0b1111 ? 0b10000000 : 0b0;
    // Last four bits of length is encoded in bits 3210
    lastFour = length & 0b1111;
    // Discard those bits
    length = length >>> 4;
    // The first byte is then (1-bit multibyte?), (3-bit type), (4-bit least sig 4-bits of length)
    let byte = (multibyte | type | lastFour).toString(16);
    write(byte, 'hex');
    // Now we keep chopping away at length 7-bits at a time until its zero,
    // writing out the bytes in what amounts to little-endian order.
    while (multibyte) {
      multibyte = length > 0b01111111 ? 0b10000000 : 0b0;
      byte = multibyte | length & 0b01111111;
      write(pad(2, byte.toString(16), '0'), 'hex');
      length = length >>> 7;
    }
    // Lastly, we can compress and write the object.
    write(Buffer.from(pako.deflate(object)));
  }

  write('PACK');
  write('00000002', 'hex');
  // Write a 4 byte (32-bit) int
  write(pad(8, oids.length.toString(16), '0'), 'hex');
  for (let oid of oids) {
    let { type, object } = await GitObjectManager.read({ gitdir, oid });
    writeObject({ write, object, stype: type });
  }
  // Write SHA1 checksum
  let digest = hash.digest();
  stream$$1.end(digest);
  return stream$$1;
}

// @flow
async function push({ gitdir, ref = 'HEAD', url, auth }) {
  let oid = await resolveRef({ gitdir, ref });
  let remote = new GitRemoteHTTP(url);
  remote.auth = auth;
  await remote.preparePush();
  let commits = await listCommits({
    gitdir,
    start: [oid],
    finish: remote.refs.values()
  });
  let objects = await listObjects({ gitdir, oids: commits });
  let packstream = new stream.PassThrough();
  let oldoid = remote.refs.get(ref) || '0000000000000000000000000000000000000000';
  packstream.write(GitPktLine.encode(`${oldoid} ${oid} ${ref}\0 report-status\n`));
  packstream.write(GitPktLine.flush());
  pack({
    gitdir,
    oids: [...objects],
    outputStream: packstream
  });
  let response = await remote.push(packstream);
  return response;
}

async function remove({ gitdir, filepath }) {
  await GitIndexManager.acquire(`${gitdir}/index`, async function (index) {
    index.delete({ filepath });
  });
  // TODO: return oid?
}

async function setConfig({ gitdir, path: path$$1, value }) {
  const config = await GitConfigManager.get({ gitdir });
  await config.set(path$$1, value);
  await GitConfigManager.save({ gitdir, config });
}

const HttpKeyServer = new HKP();

async function verify({ gitdir, ref, publicKeys }) {
  const oid = await resolveRef({ gitdir, ref });
  const { type, object } = await GitObjectManager.read({ gitdir, oid });
  if (type !== 'commit') {
    throw new Error(`git.verify() was expecting a ref type 'commit' but got type '${type}'`);
  }
  let commit = GitCommit.from(object);
  let author = commit.headers().author;
  let keys = await commit.listSigningKeys();
  if (!publicKeys) {
    let keyArray = await Promise.all(keys.map(id => HttpKeyServer.lookup({ keyId: id })));
    publicKeys = keyArray.join('\n');
  }
  let validity = await commit.verify(publicKeys);
  if (!validity) return false;
  return { author, keys };
}

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
  outputStream(stream$$1) {
    this.outputStream = stream$$1;
    return this;
  }
  inputStream(stream$$1) {
    this.inputStream = stream$$1;
    return this;
  }
  async init() {
    await init(this.gitdir);
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
    await fetch(params);
  }
  async checkout(ref) {
    await checkout({
      workdir: this.workdir,
      gitdir: this.gitdir,
      ref,
      remote: this.operateRemote
    });
  }
  async clone(url) {
    await init(this.gitdir);
    // await addRemote()
    await GithubFetch({
      gitdir: this.gitdir,
      // TODO: make this not Github-specific
      user: ghurl(url).user,
      repo: ghurl(url).repo,
      ref: ghurl(url).branch,
      remote: this.operateRemote,
      token: this.operateToken
    });
    await checkout({
      workdir: this.workdir,
      gitdir: this.gitdir,
      // TODO: make this not Github-specific
      ref: ghurl(url).branch,
      remote: this.operateRemote
    });
  }
  async list() {
    return list({
      gitdir: this.gitdir
    });
  }
  async add(filepath) {
    return add({
      gitdir: this.gitdir,
      workdir: this.workdir,
      filepath
    });
  }
  async remove(filepath) {
    return remove({
      gitdir: this.gitdir,
      filepath
    });
  }
  async commit(message$$1) {
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
      message: message$$1,
      privateKeys: this.privateKeys
    });
  }
  async verify(ref) {
    return verify({
      gitdir: this.gitdir,
      publicKeys: this.publicKeys,
      ref
    });
  }
  async pack(oids) {
    return pack({
      gitdir: this.gitdir,
      outputStream: this.outputStream,
      oids
    });
  }
  async unpack(oids) {
    return unpack({
      gitdir: this.gitdir,
      inputStream: this.inputStream
    });
  }
  async push(ref) {
    let url = await getConfig({
      gitdir: this.gitdir,
      path: `remote "${this.operateRemote}".url`
    });
    console.log('url =', url);
    return push({
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
    return fetch(params);
  }
  async getConfig(path$$1) {
    return getConfig({
      gitdir: this.gitdir,
      path: path$$1
    });
  }
  async setConfig(path$$1, value) {
    return setConfig({
      gitdir: this.gitdir,
      path: path$$1,
      value
    });
  }
}

export default git;
