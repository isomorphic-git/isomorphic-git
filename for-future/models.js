import { Buffer } from 'buffer';
import { key, message, sign, util } from 'openpgp/dist/openpgp.min.js';
import ini from 'ini';
import get from 'lodash/get';
import set from 'lodash/set';
import BufferCursor from 'buffercursor';
import pad from 'pad';
import { readBytes } from 'gartal';
import sortby from 'lodash/sortBy';

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

const complexKeys = ['remote', 'branch'];

const isComplexKey = key$$1 => complexKeys.reduce((x, y) => x || key$$1.startsWith(y), false);

const splitComplexKey = key$$1 => key$$1.split('"').map(x => x.trim()).filter(x => x !== '');

// Note: there are a LOT of edge cases that aren't covered (e.g. keys in sections that also
// have subsections, [include] directives, etc.
class GitConfig {
  constructor(text) {
    this.ini = ini.decode(text);
    // Some mangling to make it easier to work with (honestly)
    for (let key$$1 of Object.keys(this.ini)) {
      if (isComplexKey(key$$1)) {
        let parts = splitComplexKey(key$$1);
        if (parts.length === 2) {
          // just to be cautious
          set(this.ini, [parts[0], parts[1]], this.ini[key$$1]);
          delete this.ini[key$$1];
        }
      }
    }
  }
  static from(text) {
    return new GitConfig(text);
  }
  async get(path) {
    return get(this.ini, path);
  }
  async set(path, value) {
    return set(this.ini, path, value);
  }
  toString() {
    // de-mangle complex keys
    for (let key$$1 of Object.keys(this.ini)) {
      if (isComplexKey(key$$1)) {
        for (let childkey of Object.keys(this.ini[key$$1])) {
          let complexkey = `${key$$1} "${childkey}"`;
          this.ini[complexkey] = this.ini[key$$1][childkey];
          delete this.ini[key$$1][childkey];
        }
        delete this.ini[key$$1];
      }
    }
    let text = ini.encode(this.ini, { whitespace: true });
    return text;
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
// I'm really using this more as a namespace.
// There's not a lot of "state" in a pkt-line
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
  static streamReader(stream /*: ReadableStream */) {
    return async function read() {
      let hexlength, length, bytes;
      try {
        hexlength = await readBytes(stream, 4);
      } catch (err) {
        // No more file to read
        return null;
      }
      length = parseInt(hexlength.toString('utf8'), 16);
      // skip over flush packets
      if (length === 0) return read();
      // otherwise return the packet content
      bytes = await readBytes(stream, length - 4);
      return bytes;
    };
  }
}

// @flow
/*::
import type {Stats} from 'fs'

type CacheEntry = {
  ctime: Date,
  ctimeNanoseconds?: number,
  mtime: Date,
  mtimeNanoseconds?: number,
  dev: number,
  ino: number,
  mode: number,
  uid: number,
  gid: number,
  size: number,
  oid: string,
  flags: number,
  path: string
}
*/

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
  insert({
    filepath,
    stats,
    oid
  }) /*: {filepath: string, stats: Stats, oid: string } */{
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
  }
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
  clear() {
    this._entries.clear();
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
/*::
type TreeEntry = {
  mode: string,
  path: string,
  oid: string,
  type?: string
}
*/

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
    let path = buffer$$1.slice(space + 1, nullchar).toString('utf8');
    let oid = buffer$$1.slice(nullchar + 1, nullchar + 21).toString('hex');
    cursor = nullchar + 21;
    _entries.push({ mode, path, oid, type });
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
      let path = Buffer.from(entry.path, { encoding: 'utf8' });
      let nullchar = Buffer.from([0]);
      let oid = Buffer.from(entry.oid.match(/../g).map(n => parseInt(n, 16)));
      return Buffer.concat([mode, space, path, nullchar, oid]);
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

export { GitCommit, GitConfig, GitPktLine, GitIndex, GitTree };
