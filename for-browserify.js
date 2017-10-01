'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var _regeneratorRuntime = _interopDefault(require('babel-runtime/regenerator'));
var _asyncToGenerator = _interopDefault(require('babel-runtime/helpers/asyncToGenerator'));
var _classCallCheck = _interopDefault(require('babel-runtime/helpers/classCallCheck'));
var _createClass = _interopDefault(require('babel-runtime/helpers/createClass'));
var ghurl = _interopDefault(require('github-url-to-object'));
var path = _interopDefault(require('path'));
var pify = _interopDefault(require('pify'));
var _getIterator = _interopDefault(require('babel-runtime/core-js/get-iterator'));
var _typeof = _interopDefault(require('babel-runtime/helpers/typeof'));
var _slicedToArray = _interopDefault(require('babel-runtime/helpers/slicedToArray'));
var _Math$sign = _interopDefault(require('babel-runtime/core-js/math/sign'));
var buffer = require('buffer');
var openpgp = require('openpgp/dist/openpgp.min.js');
var ini = _interopDefault(require('ini'));
var _get = _interopDefault(require('lodash/get'));
var _set = _interopDefault(require('lodash/set'));
var BufferCursor = _interopDefault(require('buffercursor'));
var pad = _interopDefault(require('pad'));
var gartal = require('gartal');
var _toConsumableArray = _interopDefault(require('babel-runtime/helpers/toConsumableArray'));
var _Symbol$iterator = _interopDefault(require('babel-runtime/core-js/symbol/iterator'));
var _Map = _interopDefault(require('babel-runtime/core-js/map'));
var sortby = _interopDefault(require('lodash/sortBy'));
var systemfs = _interopDefault(require('fs'));
var _Promise = _interopDefault(require('babel-runtime/core-js/promise'));
var AsyncLock = _interopDefault(require('async-lock'));
var pako = _interopDefault(require('pako'));
var shasum = _interopDefault(require('shasum'));
var _Set = _interopDefault(require('babel-runtime/core-js/set'));
var simpleGet = _interopDefault(require('simple-get'));
var concat = _interopDefault(require('simple-concat'));
var stream = require('stream');
var stream__default = _interopDefault(stream);
var listpack = _interopDefault(require('git-list-pack'));
var thru = _interopDefault(require('thru'));
var peek = _interopDefault(require('buffer-peek-stream'));
var applyDelta = _interopDefault(require('git-apply-delta'));
var _extends = _interopDefault(require('babel-runtime/helpers/extends'));
var parseLinkHeader = _interopDefault(require('parse-link-header'));
var crypto = _interopDefault(require('crypto'));

// @flow
function formatTimezoneOffset(minutes /*: number */) {
  var sign$$1 = _Math$sign(minutes) || 1;
  minutes = Math.abs(minutes);
  var hours = Math.floor(minutes / 60);
  minutes -= hours * 60;
  var strHours = String(hours);
  var strMinutes = String(minutes);
  if (strHours.length < 2) strHours = '0' + strHours;
  if (strMinutes.length < 2) strMinutes = '0' + strMinutes;
  return (sign$$1 === 1 ? '-' : '+') + strHours + strMinutes;
}

function parseTimezoneOffset(offset) {
  var _offset$match = offset.match(/(\+|-)(\d\d)(\d\d)/),
      _offset$match2 = _slicedToArray(_offset$match, 4),
      sign$$1 = _offset$match2[1],
      hours = _offset$match2[2],
      minutes = _offset$match2[3];

  minutes = (sign$$1 === '-' ? 1 : -1) * Number(hours) * 60 + Number(minutes);
  return minutes;
}

function parseAuthor(author) {
  var _author$match = author.match(/^(.*) <(.*)> (.*) (.*)$/),
      _author$match2 = _slicedToArray(_author$match, 5),
      name = _author$match2[1],
      email = _author$match2[2],
      timestamp = _author$match2[3],
      offset = _author$match2[4];

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
  return str.trim().split('\n').map(function (x) {
    return ' ' + x;
  }).join('\n') + '\n';
}

function outdent(str) {
  return str.split('\n').map(function (x) {
    return x.replace(/^ /, '');
  }).join('\n');
}

// TODO: Make all functions have static async signature?

var GitCommit = function () {
  /*::
  _commit : string
  */
  function GitCommit(commit /*: string|Buffer|Object */) {
    _classCallCheck(this, GitCommit);

    if (typeof commit === 'string') {
      this._commit = commit;
    } else if (buffer.Buffer.isBuffer(commit)) {
      this._commit = commit.toString('utf8');
    } else if ((typeof commit === 'undefined' ? 'undefined' : _typeof(commit)) === 'object') {
      this._commit = GitCommit.render(commit);
    } else {
      throw new Error('invalid type passed to GitCommit constructor');
    }
  }

  _createClass(GitCommit, [{
    key: 'toObject',
    value: function toObject() {
      return buffer.Buffer.from(this._commit, 'utf8');
    }

    // Todo: allow setting the headers and message

  }, {
    key: 'headers',
    value: function headers() {
      return this.parseHeaders();
    }

    // Todo: allow setting the headers and message

  }, {
    key: 'message',
    value: function message$$1() {
      return GitCommit.justMessage(this._commit);
    }
  }, {
    key: 'parseHeaders',
    value: function parseHeaders() {
      var headers = GitCommit.justHeaders(this._commit).split('\n');
      var hs = [];
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = _getIterator(headers), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var h = _step.value;

          if (h[0] === ' ') {
            // combine with previous header (without space indent)
            hs[hs.length - 1] += '\n' + h.slice(1);
          } else {
            hs.push(h);
          }
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      var obj = {};
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = _getIterator(hs), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var _h = _step2.value;

          var key$$1 = _h.slice(0, _h.indexOf(' '));
          var value = _h.slice(_h.indexOf(' ') + 1);
          obj[key$$1] = value;
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2.return) {
            _iterator2.return();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
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
  }, {
    key: 'render',
    value: function render() {
      return this._commit;
    }
  }, {
    key: 'withoutSignature',
    value: function withoutSignature() {
      var commit = normalize(this._commit);
      if (commit.indexOf('\ngpgsig') === -1) return commit;
      var headers = commit.slice(0, commit.indexOf('\ngpgsig'));
      var message$$1 = commit.slice(commit.indexOf('-----END PGP SIGNATURE-----\n') + '-----END PGP SIGNATURE-----\n'.length);
      return normalize(headers + '\n' + message$$1);
    }
  }, {
    key: 'isolateSignature',
    value: function isolateSignature() {
      var signature = this._commit.slice(this._commit.indexOf('-----BEGIN PGP SIGNATURE-----'), this._commit.indexOf('-----END PGP SIGNATURE-----') + '-----END PGP SIGNATURE-----'.length);
      return outdent(signature);
    }
  }, {
    key: 'sign',
    value: function () {
      var _ref = _asyncToGenerator(_regeneratorRuntime.mark(function _callee(privateKeys /*: string */) {
        var commit, headers, message$$1, privKeyObj, _ref2, signature, signedCommit;

        return _regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                commit = this.withoutSignature();
                headers = GitCommit.justHeaders(this._commit);
                message$$1 = GitCommit.justMessage(this._commit);
                privKeyObj = openpgp.key.readArmored(privateKeys).keys;
                _context.next = 6;
                return openpgp.sign({
                  data: openpgp.util.str2Uint8Array(commit),
                  privateKeys: privKeyObj,
                  detached: true,
                  armor: true
                });

              case 6:
                _ref2 = _context.sent;
                signature = _ref2.signature;

                // renormalize the line endings to the one true line-ending
                signature = normalize(signature);
                signedCommit = headers + '\n' + 'gpgsig' + indent(signature) + '\n' + message$$1;
                // return a new commit object

                return _context.abrupt('return', GitCommit.from(signedCommit));

              case 11:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function sign$$1(_x) {
        return _ref.apply(this, arguments);
      }

      return sign$$1;
    }()
  }, {
    key: 'listSigningKeys',
    value: function () {
      var _ref3 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee2() {
        var msg;
        return _regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                msg = openpgp.message.readSignedContent(this.withoutSignature(), this.isolateSignature());
                return _context2.abrupt('return', msg.getSigningKeyIds().map(function (keyid) {
                  return keyid.toHex();
                }));

              case 2:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function listSigningKeys() {
        return _ref3.apply(this, arguments);
      }

      return listSigningKeys;
    }()
  }, {
    key: 'verify',
    value: function () {
      var _ref4 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee3(publicKeys /*: string */) {
        var pubKeyObj, msg, results, validity;
        return _regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                pubKeyObj = openpgp.key.readArmored(publicKeys).keys;
                msg = openpgp.message.readSignedContent(this.withoutSignature(), this.isolateSignature());
                results = msg.verify(pubKeyObj);
                validity = results.reduce(function (a, b) {
                  return a.valid && b.valid;
                }, { valid: true });
                return _context3.abrupt('return', validity);

              case 5:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function verify(_x2) {
        return _ref4.apply(this, arguments);
      }

      return verify;
    }()
  }], [{
    key: 'fromPayloadSignature',
    value: function fromPayloadSignature(_ref5) {
      var payload = _ref5.payload,
          signature = _ref5.signature;

      var headers = GitCommit.justHeaders(payload);
      var message$$1 = GitCommit.justMessage(payload);
      var commit = normalize(headers + '\ngpgsig' + indent(signature) + '\n' + message$$1);
      return new GitCommit(commit);
    }
  }, {
    key: 'from',
    value: function from(commit) {
      return new GitCommit(commit);
    }
  }, {
    key: 'justMessage',
    value: function justMessage(commit) {
      return normalize(commit.slice(commit.indexOf('\n\n') + 2));
    }
  }, {
    key: 'justHeaders',
    value: function justHeaders(commit) {
      return commit.slice(0, commit.indexOf('\n\n'));
    }
  }, {
    key: 'renderHeaders',
    value: function renderHeaders(obj) {
      var headers = '';
      if (obj.tree) {
        headers += 'tree ' + obj.tree + '\n';
      } else {
        headers += 'tree 4b825dc642cb6eb9a060e54bf8d69288fbee4904\n'; // the null tree
      }
      if (obj.parent) {
        headers += 'parent';
        var _iteratorNormalCompletion3 = true;
        var _didIteratorError3 = false;
        var _iteratorError3 = undefined;

        try {
          for (var _iterator3 = _getIterator(obj.parent), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
            var p = _step3.value;

            headers += ' ' + p;
          }
        } catch (err) {
          _didIteratorError3 = true;
          _iteratorError3 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion3 && _iterator3.return) {
              _iterator3.return();
            }
          } finally {
            if (_didIteratorError3) {
              throw _iteratorError3;
            }
          }
        }

        headers += '\n';
      }
      var author = obj.author;
      headers += 'author ' + author.name + ' <' + author.email + '> ' + author.timestamp + ' ' + formatTimezoneOffset(author.timezoneOffset) + '\n';
      var committer = obj.committer || obj.author;
      headers += 'committer ' + committer.name + ' <' + committer.email + '> ' + committer.timestamp + ' ' + formatTimezoneOffset(committer.timezoneOffset) + '\n';
      if (obj.gpgsig) {
        headers += 'gpgsig' + indent(obj.gpgsig);
      }
      return headers;
    }
  }, {
    key: 'render',
    value: function render(obj) {
      return GitCommit.renderHeaders(obj) + '\n' + normalize(obj.message);
    }
  }]);

  return GitCommit;
}();

var GitConfig = function () {
  function GitConfig(text) {
    _classCallCheck(this, GitConfig);

    this.ini = ini.decode(text);
  }

  _createClass(GitConfig, [{
    key: 'get',
    value: function () {
      var _ref = _asyncToGenerator(_regeneratorRuntime.mark(function _callee(path$$1) {
        return _regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                return _context.abrupt('return', _get(this.ini, path$$1));

              case 1:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function get(_x) {
        return _ref.apply(this, arguments);
      }

      return get;
    }()
  }, {
    key: 'set',
    value: function () {
      var _ref2 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee2(path$$1, value) {
        return _regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                return _context2.abrupt('return', _set(this.ini, path$$1, value));

              case 1:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function set(_x2, _x3) {
        return _ref2.apply(this, arguments);
      }

      return set;
    }()
  }, {
    key: 'toString',
    value: function toString() {
      return ini.encode(this.ini, { whitespace: true });
    }
  }], [{
    key: 'from',
    value: function from(text) {
      return new GitConfig(text);
    }
  }]);

  return GitConfig;
}();

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
var GitPktLine = function () {
  function GitPktLine() {
    _classCallCheck(this, GitPktLine);
  }

  _createClass(GitPktLine, null, [{
    key: 'flush',
    value: function flush() {
      return buffer.Buffer.from('0000', 'utf8');
    }
  }, {
    key: 'encode',
    value: function encode(line /*: string|Buffer */) /*: Buffer */{
      if (typeof line === 'string') {
        line = buffer.Buffer.from(line);
      }
      var length = line.length + 4;
      var hexlength = pad(4, length.toString(16), '0');
      return buffer.Buffer.concat([buffer.Buffer.from(hexlength, 'utf8'), line]);
    }
  }, {
    key: 'reader',
    value: function reader(buffer$$1 /*: Buffer */) {
      var buffercursor = new BufferCursor(buffer$$1);
      return function read() {
        if (buffercursor.eof()) return true;
        var length = parseInt(buffercursor.slice(4).toString('utf8'), 16);
        if (length === 0) return null;
        return buffercursor.slice(length - 4).buffer;
      };
    }
  }, {
    key: 'streamReader',
    value: function streamReader(stream$$1 /*: ReadableStream */) {
      return function () {
        var _ref = _asyncToGenerator(_regeneratorRuntime.mark(function _callee() {
          var hexlength, length, bytes;
          return _regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
              switch (_context.prev = _context.next) {
                case 0:
                  _context.next = 2;
                  return gartal.readBytes(stream$$1, 4);

                case 2:
                  hexlength = _context.sent;
                  length = parseInt(hexlength.toString('utf8'), 16);

                  if (!(length === 0)) {
                    _context.next = 6;
                    break;
                  }

                  return _context.abrupt('return', null);

                case 6:
                  _context.next = 8;
                  return gartal.readBytes(stream$$1, length - 4);

                case 8:
                  bytes = _context.sent;
                  return _context.abrupt('return', bytes);

                case 10:
                case 'end':
                  return _context.stop();
              }
            }
          }, _callee, this);
        }));

        function read() {
          return _ref.apply(this, arguments);
        }

        return read;
      }();
    }
  }]);

  return GitPktLine;
}();

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
  var reader = new BufferCursor(buffer$$1);
  var _entries /*: Map<string, CacheEntry> */ = new _Map();
  var magic = reader.toString('utf8', 4);
  if (magic !== 'DIRC') {
    throw new Error('Inavlid dircache magic file number: ' + magic);
  }
  var version = reader.readUInt32BE();
  if (version !== 2) throw new Error('Unsupported dircache version: ' + version);
  var numEntries = reader.readUInt32BE();
  var i = 0;
  while (!reader.eof() && i < numEntries) {
    var entry = {};
    var ctimeSeconds = reader.readUInt32BE();
    var ctimeNanoseconds = reader.readUInt32BE();
    entry.ctime = new Date(ctimeSeconds * 1000 + ctimeNanoseconds / 1000000);
    entry.ctimeNanoseconds = ctimeNanoseconds;
    var mtimeSeconds = reader.readUInt32BE();
    var mtimeNanoseconds = reader.readUInt32BE();
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
    var pathlength = buffer$$1.indexOf(0, reader.tell() + 1) - reader.tell();
    if (pathlength < 1) throw new Error('Got a path length of: ' + pathlength);
    entry.path = reader.toString('utf8', pathlength);
    // The next bit is awkward. We expect 1 to 8 null characters
    var tmp = reader.readUInt8();
    if (tmp !== 0) {
      throw new Error('Expected 1-8 null characters but got \'' + tmp + '\'');
    }
    var numnull = 1;
    while (!reader.eof() && reader.readUInt8() === 0 && numnull < 9) {
      numnull++;
    }reader.seek(reader.tell() - 1);
    // end of awkward part
    _entries.set(entry.path, entry);
    i++;
  }

  return _entries;
}

var GitIndex = function () {
  /*::
   _entries: Map<string, CacheEntry>
   _dirty: boolean // Used to determine if index needs to be saved to filesystem
   */
  function GitIndex(index /*: any */) {
    _classCallCheck(this, GitIndex);

    this._dirty = false;
    if (buffer.Buffer.isBuffer(index)) {
      this._entries = parseBuffer(index);
    } else if (index === null) {
      this._entries = new _Map();
    } else {
      throw new Error('invalid type passed to GitIndex constructor');
    }
  }

  _createClass(GitIndex, [{
    key: _Symbol$iterator,
    value: _regeneratorRuntime.mark(function value() {
      var _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, entry;

      return _regeneratorRuntime.wrap(function value$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _iteratorNormalCompletion = true;
              _didIteratorError = false;
              _iteratorError = undefined;
              _context.prev = 3;
              _iterator = _getIterator(this.entries);

            case 5:
              if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
                _context.next = 12;
                break;
              }

              entry = _step.value;
              _context.next = 9;
              return entry;

            case 9:
              _iteratorNormalCompletion = true;
              _context.next = 5;
              break;

            case 12:
              _context.next = 18;
              break;

            case 14:
              _context.prev = 14;
              _context.t0 = _context['catch'](3);
              _didIteratorError = true;
              _iteratorError = _context.t0;

            case 18:
              _context.prev = 18;
              _context.prev = 19;

              if (!_iteratorNormalCompletion && _iterator.return) {
                _iterator.return();
              }

            case 21:
              _context.prev = 21;

              if (!_didIteratorError) {
                _context.next = 24;
                break;
              }

              throw _iteratorError;

            case 24:
              return _context.finish(21);

            case 25:
              return _context.finish(18);

            case 26:
            case 'end':
              return _context.stop();
          }
        }
      }, value, this, [[3, 14, 18, 26], [19,, 21, 25]]);
    })
  }, {
    key: 'insert',
    value: function insert(_ref) {
      var filepath = _ref.filepath,
          stats = _ref.stats,
          oid = _ref.oid;

      var entry = {
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

  }, {
    key: 'delete',
    value: function _delete(_ref2 /*: {filepath: string} */) {
      var filepath = _ref2.filepath;

      if (this._entries.has(filepath)) {
        this._entries.delete(filepath);
      } else {
        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
          for (var _iterator2 = _getIterator(this._entries.keys()), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var key$$1 = _step2.value;

            if (key$$1.startsWith(filepath + '/')) {
              this._entries.delete(key$$1);
            }
          }
        } catch (err) {
          _didIteratorError2 = true;
          _iteratorError2 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion2 && _iterator2.return) {
              _iterator2.return();
            }
          } finally {
            if (_didIteratorError2) {
              throw _iteratorError2;
            }
          }
        }
      }
      this._dirty = true;
    }
  }, {
    key: 'render',
    value: function render() {
      return this.entries.map(function (entry) {
        return entry.mode.toString(8) + ' ' + entry.oid + '    ' + entry.path;
      }).join('\n');
    }
  }, {
    key: 'toObject',
    value: function toObject() {
      var header = buffer.Buffer.alloc(12);
      var writer = new BufferCursor(header);
      writer.write('DIRC', 4, 'utf8');
      writer.writeUInt32BE(2);
      writer.writeUInt32BE(this.entries.length);
      var body = buffer.Buffer.concat(this.entries.map(function (entry) {
        // the fixed length + the filename + at least one null char => align by 8
        var length = Math.ceil((62 + entry.path.length + 1) / 8) * 8;
        var written = buffer.Buffer.alloc(length);
        var writer = new BufferCursor(written);
        var ctimeMilliseconds = entry.ctime.valueOf();
        var ctimeSeconds = Math.floor(ctimeMilliseconds / 1000);
        var ctimeNanoseconds = entry.ctimeNanoseconds || ctimeMilliseconds * 1000000 - ctimeSeconds * 1000000 * 1000;
        var mtimeMilliseconds = entry.mtime.valueOf();
        var mtimeSeconds = Math.floor(mtimeMilliseconds / 1000);
        var mtimeNanoseconds = entry.mtimeNanoseconds || mtimeMilliseconds * 1000000 - mtimeSeconds * 1000000 * 1000;
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
      return buffer.Buffer.concat([header, body]);
    }
  }, {
    key: 'entries',
    get: function get() /*: Array<CacheEntry> */{
      return sortby([].concat(_toConsumableArray(this._entries.values())), 'path');
    }
  }], [{
    key: 'from',
    value: function from(buffer$$1) {
      return new GitIndex(buffer$$1);
    }
  }]);

  return GitIndex;
}();

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
  var _entries = [];
  var cursor = 0;
  while (cursor < buffer$$1.length) {
    var space = buffer$$1.indexOf(32, cursor);
    if (space === -1) {
      throw new Error('GitTree: Error parsing buffer at byte location ' + cursor + ': Could not find the next space character.');
    }
    var nullchar = buffer$$1.indexOf(0, cursor);
    if (nullchar === -1) {
      throw new Error('GitTree: Error parsing buffer at byte location ' + cursor + ': Could not find the next null character.');
    }
    var mode = buffer$$1.slice(cursor, space).toString('utf8');
    if (mode === '40000') mode = '040000'; // makes it line up neater in printed output
    var type = mode === '040000' ? 'tree' : 'blob';
    var path$$1 = buffer$$1.slice(space + 1, nullchar).toString('utf8');
    var oid = buffer$$1.slice(nullchar + 1, nullchar + 21).toString('hex');
    cursor = nullchar + 21;
    _entries.push({ mode: mode, path: path$$1, oid: oid, type: type });
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

var GitTree = function () {
  /*::
  _entries: Array<TreeEntry>
  */
  function GitTree(entries /*: any */) {
    _classCallCheck(this, GitTree);

    if (buffer.Buffer.isBuffer(entries)) {
      this._entries = parseBuffer$1(entries);
    } else if (Array.isArray(entries)) {
      this._entries = entries.map(nudgeIntoShape);
    } else {
      throw new Error('invalid type passed to GitTree constructor');
    }
  }

  _createClass(GitTree, [{
    key: 'render',
    value: function render() {
      return this._entries.map(function (entry) {
        return entry.mode + ' ' + entry.type + ' ' + entry.oid + '    ' + entry.path;
      }).join('\n');
    }
  }, {
    key: 'toObject',
    value: function toObject() {
      return buffer.Buffer.concat(this._entries.map(function (entry) {
        var mode = buffer.Buffer.from(entry.mode.replace(/^0/, ''));
        var space = buffer.Buffer.from(' ');
        var path$$1 = buffer.Buffer.from(entry.path, { encoding: 'utf8' });
        var nullchar = buffer.Buffer.from([0]);
        var oid = buffer.Buffer.from(entry.oid.match(/../g).map(function (n) {
          return parseInt(n, 16);
        }));
        return buffer.Buffer.concat([mode, space, path$$1, nullchar, oid]);
      }));
    }
  }, {
    key: 'entries',
    value: function entries() {
      return this._entries;
    }
  }, {
    key: _Symbol$iterator,
    value: _regeneratorRuntime.mark(function value() {
      var _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, entry;

      return _regeneratorRuntime.wrap(function value$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _iteratorNormalCompletion = true;
              _didIteratorError = false;
              _iteratorError = undefined;
              _context.prev = 3;
              _iterator = _getIterator(this._entries);

            case 5:
              if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
                _context.next = 12;
                break;
              }

              entry = _step.value;
              _context.next = 9;
              return entry;

            case 9:
              _iteratorNormalCompletion = true;
              _context.next = 5;
              break;

            case 12:
              _context.next = 18;
              break;

            case 14:
              _context.prev = 14;
              _context.t0 = _context['catch'](3);
              _didIteratorError = true;
              _iteratorError = _context.t0;

            case 18:
              _context.prev = 18;
              _context.prev = 19;

              if (!_iteratorNormalCompletion && _iterator.return) {
                _iterator.return();
              }

            case 21:
              _context.prev = 21;

              if (!_didIteratorError) {
                _context.next = 24;
                break;
              }

              throw _iteratorError;

            case 24:
              return _context.finish(21);

            case 25:
              return _context.finish(18);

            case 26:
            case 'end':
              return _context.stop();
          }
        }
      }, value, this, [[3, 14, 18, 26], [19,, 21, 25]]);
    })
  }], [{
    key: 'from',
    value: function from(tree) {
      return new GitTree(tree);
    }
  }]);

  return GitTree;
}();

var fs = function () {
  return global.fs || systemfs;
};

var rm = function () {
  var _ref = _asyncToGenerator(_regeneratorRuntime.mark(function _callee(filepath) {
    return _regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.prev = 0;
            _context.next = 3;
            return pify(fs().unlink)(filepath);

          case 3:
            _context.next = 9;
            break;

          case 5:
            _context.prev = 5;
            _context.t0 = _context['catch'](0);

            if (!(_context.t0.code !== 'ENOENT')) {
              _context.next = 9;
              break;
            }

            throw _context.t0;

          case 9:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this, [[0, 5]]);
  }));

  return function rm(_x) {
    return _ref.apply(this, arguments);
  };
}();

// An async exists variant
var exists = function () {
  var _ref = _asyncToGenerator(_regeneratorRuntime.mark(function _callee(file, options) {
    return _regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            return _context.abrupt('return', new _Promise(function (resolve, reject) {
              fs().stat(file, function (err, stats) {
                if (err) return err.code === 'ENOENT' ? resolve(false) : reject(err);
                resolve(true);
              });
            }));

          case 1:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function exists(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

// @flow
/*::
type Node = {
  type: string,
  fullpath: string,
  basename: string,
  metadata: Object, // mode, oid
  parent?: Node,
  children: Array<Node>
}
*/

function flatFileListToDirectoryStructure(files /*: Array<{path: string}> */
) /*: Node|void */{
  var inodes /*: Map<string, Node> */ = new _Map();
  var mkdir = function mkdir(name) /*: Node|void */{
    if (!inodes.has(name)) {
      var dir /*: Node */ = {
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

  var mkfile = function mkfile(name, metadata) /*: Node|void */{
    if (!inodes.has(name)) {
      var file /*: Node */ = {
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

  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = _getIterator(files), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var file = _step.value;

      mkfile(file.path, file);
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  return inodes.get('.');
}

var sleep = function () {
  var _ref = _asyncToGenerator(_regeneratorRuntime.mark(function _callee(ms) {
    return _regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            return _context.abrupt("return", new _Promise(function (resolve, reject) {
              return setTimeout(resolve, ms);
            }));

          case 1:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function sleep(_x) {
    return _ref.apply(this, arguments);
  };
}();

// @flow
// This is modeled after the lockfile strategy used by the git source code.
var delayedReleases = new _Map();

var lock = function () {
  var _ref = _asyncToGenerator(_regeneratorRuntime.mark(function _callee(filename /*: string */
  ) {
    var triesLeft /*: number */ = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 3;
    return _regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            if (!delayedReleases.has(filename)) {
              _context.next = 4;
              break;
            }

            clearTimeout(delayedReleases.get(filename));
            delayedReleases.delete(filename);
            return _context.abrupt('return');

          case 4:
            if (!(triesLeft === 0)) {
              _context.next = 6;
              break;
            }

            throw new Error('Unable to acquire lockfile \'' + filename + '\'. Exhausted tries.');

          case 6:
            _context.prev = 6;
            _context.next = 9;
            return pify(fs().mkdir)(filename + '.lock');

          case 9:
            _context.next = 18;
            break;

          case 11:
            _context.prev = 11;
            _context.t0 = _context['catch'](6);

            if (!(_context.t0.code === 'EEXIST')) {
              _context.next = 18;
              break;
            }

            _context.next = 16;
            return sleep(100);

          case 16:
            _context.next = 18;
            return lock(filename, triesLeft - 1);

          case 18:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this, [[6, 11]]);
  }));

  return function lock(_x2) {
    return _ref.apply(this, arguments);
  };
}();

var unlock = function () {
  var _ref2 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee3(filename /*: string */
  ) {
    var _this = this;

    return _regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            if (!delayedReleases.has(filename)) {
              _context3.next = 2;
              break;
            }

            throw new Error('Cannot double-release lockfile');

          case 2:
            // Basically, we lie and say it was deleted ASAP.
            // But really we wait a bit to see if you want to acquire it again.
            delayedReleases.set(filename, setTimeout(_asyncToGenerator(_regeneratorRuntime.mark(function _callee2() {
              return _regeneratorRuntime.wrap(function _callee2$(_context2) {
                while (1) {
                  switch (_context2.prev = _context2.next) {
                    case 0:
                      delayedReleases.delete(filename);
                      _context2.next = 3;
                      return pify(fs().rmdir)(filename + '.lock');

                    case 3:
                    case 'end':
                      return _context2.stop();
                  }
                }
              }, _callee2, _this);
            }))));

          case 3:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, this);
  }));

  return function unlock(_x4) {
    return _ref2.apply(this, arguments);
  };
}();

// @flow
var mkdir = function () {
  var _ref = _asyncToGenerator(_regeneratorRuntime.mark(function _callee(dirpath /*: string */) {
    var parent;
    return _regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.prev = 0;
            _context.next = 3;
            return pify(fs().mkdir)(dirpath);

          case 3:
            return _context.abrupt('return');

          case 6:
            _context.prev = 6;
            _context.t0 = _context['catch'](0);

            if (!(_context.t0 === null)) {
              _context.next = 10;
              break;
            }

            return _context.abrupt('return');

          case 10:
            if (!(_context.t0.code === 'EEXIST')) {
              _context.next = 12;
              break;
            }

            return _context.abrupt('return');

          case 12:
            if (!(_context.t0.code === 'ENOENT')) {
              _context.next = 20;
              break;
            }

            parent = path.dirname(dirpath);
            // Check to see if we've gone too far

            if (!(parent === '.' || parent === '/' || parent === dirpath)) {
              _context.next = 16;
              break;
            }

            throw _context.t0;

          case 16:
            _context.next = 18;
            return mkdir(parent);

          case 18:
            _context.next = 20;
            return mkdir(dirpath);

          case 20:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this, [[0, 6]]);
  }));

  return function mkdir(_x) {
    return _ref.apply(this, arguments);
  };
}();

var mkdirs = function () {
  var _ref2 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee2(dirlist /*: string[] */) {
    return _regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            return _context2.abrupt('return', _Promise.all(dirlist.map(mkdir)));

          case 1:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));

  return function mkdirs(_x2) {
    return _ref2.apply(this, arguments);
  };
}();

// An async readFile variant that returns null instead of throwing errors
var read = function () {
  var _ref = _asyncToGenerator(_regeneratorRuntime.mark(function _callee(file, options) {
    return _regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            return _context.abrupt('return', new _Promise(function (resolve, reject) {
              fs().readFile(file, options, function (err, file) {
                return err ? resolve(null) : resolve(file);
              });
            }));

          case 1:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function read(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

var resolveRef = function () {
  var _ref2 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee(_ref) {
    var gitdir = _ref.gitdir,
        ref = _ref.ref,
        depth = _ref.depth;
    var sha;
    return _regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            if (!(depth !== undefined)) {
              _context.next = 4;
              break;
            }

            depth--;

            if (!(depth === -1)) {
              _context.next = 4;
              break;
            }

            return _context.abrupt('return', ref);

          case 4:
            sha = void 0;
            // Is it a ref pointer?

            if (!ref.startsWith('ref: ')) {
              _context.next = 8;
              break;
            }

            ref = ref.slice('ref: '.length);
            return _context.abrupt('return', resolveRef({ gitdir: gitdir, ref: ref, depth: depth }));

          case 8:
            if (!(ref.length === 40)) {
              _context.next = 13;
              break;
            }

            _context.next = 11;
            return exists(gitdir + '/objects/' + ref.slice(0, 2) + '/' + ref.slice(2));

          case 11:
            if (!_context.sent) {
              _context.next = 13;
              break;
            }

            return _context.abrupt('return', ref);

          case 13:
            if (!(ref === 'HEAD' || ref === 'MERGE_HEAD')) {
              _context.next = 19;
              break;
            }

            _context.next = 16;
            return read(gitdir + '/' + ref, { encoding: 'utf8' });

          case 16:
            sha = _context.sent;

            if (!sha) {
              _context.next = 19;
              break;
            }

            return _context.abrupt('return', resolveRef({ gitdir: gitdir, ref: sha.trim(), depth: depth }));

          case 19:
            if (!ref.startsWith('refs/')) {
              _context.next = 25;
              break;
            }

            _context.next = 22;
            return read(gitdir + '/' + ref, { encoding: 'utf8' });

          case 22:
            sha = _context.sent;

            if (!sha) {
              _context.next = 25;
              break;
            }

            return _context.abrupt('return', resolveRef({ gitdir: gitdir, ref: sha.trim(), depth: depth }));

          case 25:
            _context.next = 27;
            return read(gitdir + '/refs/heads/' + ref, { encoding: 'utf8' });

          case 27:
            sha = _context.sent;

            if (!sha) {
              _context.next = 30;
              break;
            }

            return _context.abrupt('return', resolveRef({ gitdir: gitdir, ref: sha.trim(), depth: depth }));

          case 30:
            _context.next = 32;
            return read(gitdir + '/refs/tags/' + ref, { encoding: 'utf8' });

          case 32:
            sha = _context.sent;

            if (!sha) {
              _context.next = 35;
              break;
            }

            return _context.abrupt('return', resolveRef({ gitdir: gitdir, ref: sha.trim(), depth: depth }));

          case 35:
            _context.next = 37;
            return read(gitdir + '/refs/remotes/' + ref, { encoding: 'utf8' });

          case 37:
            sha = _context.sent;

            if (!sha) {
              _context.next = 40;
              break;
            }

            return _context.abrupt('return', resolveRef({ gitdir: gitdir, ref: sha.trim(), depth: depth }));

          case 40:
            throw new Error('Could not resolve reference ' + ref);

          case 41:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function resolveRef(_x) {
    return _ref2.apply(this, arguments);
  };
}();

// @flow
// An async writeFile variant that automatically creates missing directories,
// and returns null instead of throwing errors.
var write = function () {
  var _ref = _asyncToGenerator(_regeneratorRuntime.mark(function _callee(filepath /*: string */
  , contents /*: string|Buffer */
  ) {
    var options /*: Object */ = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    return _regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.prev = 0;
            _context.next = 3;
            return pify(fs().writeFile)(filepath, contents, options);

          case 3:
            return _context.abrupt('return');

          case 6:
            _context.prev = 6;
            _context.t0 = _context['catch'](0);
            _context.next = 10;
            return mkdir(path.dirname(filepath));

          case 10:
            _context.next = 12;
            return pify(fs().writeFile)(filepath, contents, options);

          case 12:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this, [[0, 6]]);
  }));

  return function write(_x2, _x3) {
    return _ref.apply(this, arguments);
  };
}();

var name = "isomorphic-git";
var version = "0.0.5";

// @flow
var GitConfigManager = function () {
  function GitConfigManager() {
    _classCallCheck(this, GitConfigManager);
  }

  _createClass(GitConfigManager, null, [{
    key: 'get',
    value: function () {
      var _ref2 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee(_ref) {
        var gitdir = _ref.gitdir;
        var text;
        return _regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return read(gitdir + '/config', { encoding: 'utf8' });

              case 2:
                text = _context.sent;
                return _context.abrupt('return', GitConfig.from(text));

              case 4:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function get(_x) {
        return _ref2.apply(this, arguments);
      }

      return get;
    }()
  }, {
    key: 'save',
    value: function () {
      var _ref4 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee2(_ref3) {
        var gitdir = _ref3.gitdir,
            config = _ref3.config;
        return _regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.next = 2;
                return write(gitdir + '/config', config.toString(), {
                  encoding: 'utf8'
                });

              case 2:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function save(_x2) {
        return _ref4.apply(this, arguments);
      }

      return save;
    }()
  }]);

  return GitConfigManager;
}();

// @flow
// import LockManager from 'travix-lock-manager'
// import Lock from './models/utils/lockfile'

// TODO: replace with an LRU cache?
var map /*: Map<string, GitIndex> */ = new _Map();
// const lm = new LockManager()
var lock$1 = new AsyncLock();

var GitIndexManager = function () {
  function GitIndexManager() {
    _classCallCheck(this, GitIndexManager);
  }

  _createClass(GitIndexManager, null, [{
    key: 'acquire',
    value: function () {
      var _ref = _asyncToGenerator(_regeneratorRuntime.mark(function _callee2(filepath, closure) {
        return _regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.next = 2;
                return lock$1.acquire(filepath, _asyncToGenerator(_regeneratorRuntime.mark(function _callee() {
                  var index, rawIndexFile, buffer$$1;
                  return _regeneratorRuntime.wrap(function _callee$(_context) {
                    while (1) {
                      switch (_context.prev = _context.next) {
                        case 0:
                          index = map.get(filepath);

                          if (!(index === undefined)) {
                            _context.next = 7;
                            break;
                          }

                          _context.next = 4;
                          return read(filepath);

                        case 4:
                          rawIndexFile = _context.sent;

                          index = GitIndex.from(rawIndexFile);
                          // cache the GitIndex object so we don't need to re-read it
                          // every time.
                          // TODO: save the stat data for the index so we know whether
                          // the cached file is stale (modified by an outside process).
                          map.set(filepath, index);
                          // await fileLock.cancel()

                        case 7:
                          _context.next = 9;
                          return closure(index);

                        case 9:
                          if (!index._dirty) {
                            _context.next = 14;
                            break;
                          }

                          // Acquire a file lock while we're writing the index file
                          // let fileLock = await Lock(filepath)
                          buffer$$1 = index.toObject();
                          _context.next = 13;
                          return write(filepath, buffer$$1);

                        case 13:
                          index._dirty = false;

                        case 14:
                          // For now, discard our cached object so that external index
                          // manipulation is picked up. TODO: use lstat and compare
                          // file times to determine if our cached object should be
                          // discarded.
                          map.delete(filepath);

                        case 15:
                        case 'end':
                          return _context.stop();
                      }
                    }
                  }, _callee, this);
                })));

              case 2:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function acquire(_x, _x2) {
        return _ref.apply(this, arguments);
      }

      return acquire;
    }()
  }]);

  return GitIndexManager;
}();

// @flow
function wrapObject(_ref /*: {type: string, object: Buffer} */) {
  var type = _ref.type,
      object = _ref.object;

  var buffer$$1 = buffer.Buffer.concat([buffer.Buffer.from(type + ' '), buffer.Buffer.from(object.byteLength.toString()), buffer.Buffer.from([0]), buffer.Buffer.from(object)]);
  var oid = shasum(buffer$$1);
  return {
    oid: oid,
    file: buffer.Buffer.from(pako.deflate(buffer$$1))
  };
}

function unwrapObject(_ref2 /*: {oid: string, file: Buffer} */) {
  var oid = _ref2.oid,
      file = _ref2.file;

  var inflated = buffer.Buffer.from(pako.inflate(file));
  if (oid) {
    var sha = shasum(inflated);
    if (sha !== oid) {
      throw new Error('SHA check failed! Expected ' + oid + ', computed ' + sha);
    }
  }
  var s = inflated.indexOf(32); // first space
  var i = inflated.indexOf(0); // first null value
  var type = inflated.slice(0, s).toString('utf8'); // get type of object
  var length = inflated.slice(s + 1, i).toString('utf8'); // get type of object
  var actualLength = inflated.length - (i + 1);
  // verify length
  if (parseInt(length) !== actualLength) {
    throw new Error('Length mismatch: expected ' + length + ' bytes but got ' + actualLength + ' instead.');
  }
  return {
    type: type,
    object: buffer.Buffer.from(inflated.slice(i + 1))
  };
}

var GitObjectManager = function () {
  function GitObjectManager() {
    _classCallCheck(this, GitObjectManager);
  }

  _createClass(GitObjectManager, null, [{
    key: 'read',
    value: function () {
      var _ref4 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee(_ref3 /*: {gitdir: string, oid: string} */) {
        var gitdir = _ref3.gitdir,
            oid = _ref3.oid;

        var file, _unwrapObject, type, object;

        return _regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return read(gitdir + '/objects/' + oid.slice(0, 2) + '/' + oid.slice(2));

              case 2:
                file = _context.sent;

                if (file) {
                  _context.next = 5;
                  break;
                }

                throw new Error('Git object with oid ' + oid + ' not found');

              case 5:
                _unwrapObject = unwrapObject({ oid: oid, file: file }), type = _unwrapObject.type, object = _unwrapObject.object;
                return _context.abrupt('return', { type: type, object: object });

              case 7:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function read$$1(_x) {
        return _ref4.apply(this, arguments);
      }

      return read$$1;
    }()
  }, {
    key: 'write',
    value: function () {
      var _ref6 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee2(_ref5) {
        var gitdir = _ref5.gitdir,
            type = _ref5.type,
            object = _ref5.object;

        var _wrapObject, file, oid, filepath;

        return _regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _wrapObject = wrapObject({ type: type, object: object }), file = _wrapObject.file, oid = _wrapObject.oid;
                filepath = gitdir + '/objects/' + oid.slice(0, 2) + '/' + oid.slice(2);
                // Don't overwrite existing git objects - this helps avoid EPERM errors.
                // Although I don't know how we'd fix corrupted objects then. Perhaps delete them
                // on read?

                _context2.next = 4;
                return exists(filepath);

              case 4:
                if (_context2.sent) {
                  _context2.next = 7;
                  break;
                }

                _context2.next = 7;
                return write(filepath, file);

              case 7:
                return _context2.abrupt('return', oid);

              case 8:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function write$$1(_x2) {
        return _ref6.apply(this, arguments);
      }

      return write$$1;
    }() /*: {gitdir: string, type: string, object: Buffer} */

  }]);

  return GitObjectManager;
}();

// @flow
// This is a convenience wrapper for reading and writing files in the 'refs' directory.
var GitRefsManager = function () {
  function GitRefsManager() {
    _classCallCheck(this, GitRefsManager);
  }

  _createClass(GitRefsManager, null, [{
    key: 'updateRemoteRefs',
    value: function () {
      var _ref2 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee(_ref) {
        var gitdir = _ref.gitdir,
            remote = _ref.remote,
            refs = _ref.refs;

        var _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, _ref3, _ref4, key$$1, value, normalizeValue, _iteratorNormalCompletion2, _didIteratorError2, _iteratorError2, _iterator2, _step2, _ref5, _ref6, _key, _value;

        return _regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                // Validate input
                _iteratorNormalCompletion = true;
                _didIteratorError = false;
                _iteratorError = undefined;
                _context.prev = 3;
                _iterator = _getIterator(refs);

              case 5:
                if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
                  _context.next = 15;
                  break;
                }

                _ref3 = _step.value;
                _ref4 = _slicedToArray(_ref3, 2);
                
                value = _ref4[1];

                if (value.match(/[0-9a-f]{40}/)) {
                  _context.next = 12;
                  break;
                }

                throw new Error('Unexpected ref contents: \'' + value + '\'');

              case 12:
                _iteratorNormalCompletion = true;
                _context.next = 5;
                break;

              case 15:
                _context.next = 21;
                break;

              case 17:
                _context.prev = 17;
                _context.t0 = _context['catch'](3);
                _didIteratorError = true;
                _iteratorError = _context.t0;

              case 21:
                _context.prev = 21;
                _context.prev = 22;

                if (!_iteratorNormalCompletion && _iterator.return) {
                  _iterator.return();
                }

              case 24:
                _context.prev = 24;

                if (!_didIteratorError) {
                  _context.next = 27;
                  break;
                }

                throw _iteratorError;

              case 27:
                return _context.finish(24);

              case 28:
                return _context.finish(21);

              case 29:
                // Update files
                normalizeValue = function normalizeValue(value) {
                  return value.trim() + '\n';
                };

                _iteratorNormalCompletion2 = true;
                _didIteratorError2 = false;
                _iteratorError2 = undefined;
                _context.prev = 33;
                _iterator2 = _getIterator(refs);

              case 35:
                if (_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done) {
                  _context.next = 45;
                  break;
                }

                _ref5 = _step2.value;
                _ref6 = _slicedToArray(_ref5, 2);
                _key = _ref6[0];
                _value = _ref6[1];
                _context.next = 42;
                return write(path.join(gitdir, 'refs', 'remotes', remote, _key), normalizeValue(_value), 'utf8');

              case 42:
                _iteratorNormalCompletion2 = true;
                _context.next = 35;
                break;

              case 45:
                _context.next = 51;
                break;

              case 47:
                _context.prev = 47;
                _context.t1 = _context['catch'](33);
                _didIteratorError2 = true;
                _iteratorError2 = _context.t1;

              case 51:
                _context.prev = 51;
                _context.prev = 52;

                if (!_iteratorNormalCompletion2 && _iterator2.return) {
                  _iterator2.return();
                }

              case 54:
                _context.prev = 54;

                if (!_didIteratorError2) {
                  _context.next = 57;
                  break;
                }

                throw _iteratorError2;

              case 57:
                return _context.finish(54);

              case 58:
                return _context.finish(51);

              case 59:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this, [[3, 17, 21, 29], [22,, 24, 28], [33, 47, 51, 59], [52,, 54, 58]]);
      }));

      function updateRemoteRefs(_x) {
        return _ref2.apply(this, arguments);
      }

      return updateRemoteRefs;
    }() /*: { gitdir: string, remote: string, refs: Map<string, string> } */

  }]);

  return GitRefsManager;
}();

// @flow
function basicAuth(auth) {
  return 'Basic ' + buffer.Buffer.from(auth.username + ':' + auth.password).toString('base64');
}

var GitRemoteHTTP = function () {
  /*::
  GIT_URL : string
  refs : Map<string, string>
  capabilities : Set<string>
  auth : { username : string, password : string }
  */
  function GitRemoteHTTP(url /*: string */) {
    _classCallCheck(this, GitRemoteHTTP);

    // Auto-append the (necessary) .git if it's missing.
    if (!url.endsWith('.git')) url = url += '.git';
    this.GIT_URL = url;
  }

  _createClass(GitRemoteHTTP, [{
    key: 'preparePull',
    value: function () {
      var _ref = _asyncToGenerator(_regeneratorRuntime.mark(function _callee() {
        return _regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return this.discover('git-upload-pack');

              case 2:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function preparePull() {
        return _ref.apply(this, arguments);
      }

      return preparePull;
    }()
  }, {
    key: 'preparePush',
    value: function () {
      var _ref2 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee2() {
        return _regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.next = 2;
                return this.discover('git-receive-pack');

              case 2:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function preparePush() {
        return _ref2.apply(this, arguments);
      }

      return preparePush;
    }()
  }, {
    key: 'discover',
    value: function () {
      var _ref3 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee3(service /*: string */) {
        var _this = this;

        var headers, res, data, read, lineOne, lineTwo, _lineTwo$toString$tri, _lineTwo$toString$tri2, firstRef, capabilities, _firstRef$split, _firstRef$split2, ref, name, line, _line$toString$trim$s, _line$toString$trim$s2, _ref4, _name;

        return _regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                this.capabilities = new _Set();
                this.refs = new _Map();
                headers = {};
                // headers['Accept'] = `application/x-${service}-advertisement`

                if (this.auth) {
                  headers['Authorization'] = basicAuth(this.auth);
                }
                _context3.next = 6;
                return pify(simpleGet)({
                  method: 'GET',
                  url: this.GIT_URL + '/info/refs?service=' + service,
                  headers: headers
                });

              case 6:
                res = _context3.sent;

                if (!(res.statusCode !== 200)) {
                  _context3.next = 9;
                  break;
                }

                throw new Error('Bad status code from server: ' + res.statusCode);

              case 9:
                _context3.next = 11;
                return pify(concat)(res);

              case 11:
                data = _context3.sent;

                // There is probably a better way to do this, but for now
                // let's just throw the result parser inline here.
                read = GitPktLine.reader(data);
                lineOne = read();
                // skip past any flushes

                while (lineOne === null) {
                  lineOne = read();
                }
                if (!(lineOne === true)) {
                  _context3.next = 17;
                  break;
                }

                throw new Error('Bad response from git server.');

              case 17:
                if (!(lineOne.toString('utf8') !== '# service=' + service + '\n')) {
                  _context3.next = 19;
                  break;
                }

                throw new Error('Expected \'# service=' + service + '\\n\' but got \'' + lineOne.toString('utf8') + '\'');

              case 19:
                lineTwo = read();
                // skip past any flushes

                while (lineTwo === null) {
                  lineTwo = read();
                } // In the edge case of a brand new repo, zero refs (and zero capabilities)
                // are returned.

                if (!(lineTwo === true)) {
                  _context3.next = 23;
                  break;
                }

                return _context3.abrupt('return');

              case 23:
                _lineTwo$toString$tri = lineTwo.toString('utf8').trim().split('\0'), _lineTwo$toString$tri2 = _slicedToArray(_lineTwo$toString$tri, 2), firstRef = _lineTwo$toString$tri2[0], capabilities = _lineTwo$toString$tri2[1];

                capabilities.split(' ').map(function (x) {
                  return _this.capabilities.add(x);
                });
                _firstRef$split = firstRef.split(' '), _firstRef$split2 = _slicedToArray(_firstRef$split, 2), ref = _firstRef$split2[0], name = _firstRef$split2[1];

                this.refs.set(name, ref);

              case 27:
                

                line = read();

                if (!(line === true)) {
                  _context3.next = 31;
                  break;
                }

                return _context3.abrupt('break', 34);

              case 31:
                if (line !== null) {
                  _line$toString$trim$s = line.toString('utf8').trim().split(' '), _line$toString$trim$s2 = _slicedToArray(_line$toString$trim$s, 2), _ref4 = _line$toString$trim$s2[0], _name = _line$toString$trim$s2[1];

                  this.refs.set(_name, _ref4);
                }
                _context3.next = 27;
                break;

              case 34:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function discover(_x) {
        return _ref3.apply(this, arguments);
      }

      return discover;
    }()
  }, {
    key: 'push',
    value: function () {
      var _ref5 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee4(stream$$1 /*: ReadableStream */) {
        var service, res;
        return _regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                service = 'git-receive-pack';
                _context4.next = 3;
                return this.stream({ stream: stream$$1, service: service });

              case 3:
                res = _context4.sent;
                return _context4.abrupt('return', res);

              case 5:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function push(_x2) {
        return _ref5.apply(this, arguments);
      }

      return push;
    }()
  }, {
    key: 'pull',
    value: function () {
      var _ref6 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee5(stream$$1 /*: ReadableStream */) {
        var service, res;
        return _regeneratorRuntime.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                service = 'git-upload-pack';
                _context5.next = 3;
                return this.stream({ stream: stream$$1, service: service });

              case 3:
                res = _context5.sent;
                return _context5.abrupt('return', res);

              case 5:
              case 'end':
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));

      function pull(_x3) {
        return _ref6.apply(this, arguments);
      }

      return pull;
    }()
  }, {
    key: 'stream',
    value: function () {
      var _ref8 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee7(_ref7) {
        var _stream = _ref7.stream,
            service = _ref7.service;
        var headers, res, read, packetlines, packfile, progress, nextBit;
        return _regeneratorRuntime.wrap(function _callee7$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                headers = {};

                headers['content-type'] = 'application/x-' + service + '-request';
                headers['accept'] = 'application/x-' + service + '-result';
                headers['user-agent'] = 'git/' + name + '@' + version;
                if (this.auth) {
                  headers['authorization'] = basicAuth(this.auth);
                }
                _context7.next = 7;
                return pify(simpleGet)({
                  method: 'POST',
                  url: this.GIT_URL + '/' + service,
                  body: _stream,
                  headers: headers
                });

              case 7:
                res = _context7.sent;

                if (!(service === 'git-receive-pack')) {
                  _context7.next = 10;
                  break;
                }

                return _context7.abrupt('return', res);

              case 10:
                // Parse the response!
                read = GitPktLine.streamReader(res);
                // And now for the ridiculous side-band-64k protocol

                packetlines = new stream.PassThrough();
                packfile = new stream.PassThrough();
                progress = new stream.PassThrough();
                // TODO: Use a proper through stream?

                nextBit = function () {
                  var _ref9 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee6() {
                    var line, error;
                    return _regeneratorRuntime.wrap(function _callee6$(_context6) {
                      while (1) {
                        switch (_context6.prev = _context6.next) {
                          case 0:
                            _context6.next = 2;
                            return read();

                          case 2:
                            line = _context6.sent;

                            if (!(line === null)) {
                              _context6.next = 8;
                              break;
                            }

                            packfile.end();
                            progress.end();
                            packetlines.end();
                            return _context6.abrupt('return');

                          case 8:
                            _context6.t0 = line[0];
                            _context6.next = _context6.t0 === 1 ? 11 : _context6.t0 === 2 ? 13 : _context6.t0 === 3 ? 15 : 19;
                            break;

                          case 11:
                            // pack data
                            packfile.write(line.slice(1));
                            return _context6.abrupt('break', 20);

                          case 13:
                            // progress message
                            progress.write(line.slice(1));
                            return _context6.abrupt('break', 20);

                          case 15:
                            // fatal error message just before stream aborts
                            error = line.slice(1);

                            progress.write(error);
                            packfile.destroy(new Error(error.toString('utf8')));
                            return _context6.abrupt('return');

                          case 19:
                            // Not part of the side-band-64k protocol
                            packetlines.write(line.slice(1));

                          case 20:
                            // Careful not to blow up the stack.
                            // I think Promises in a tail-call position should be OK.
                            nextBit();

                          case 21:
                          case 'end':
                            return _context6.stop();
                        }
                      }
                    }, _callee6, this);
                  }));

                  return function nextBit() {
                    return _ref9.apply(this, arguments);
                  };
                }();

                nextBit();
                return _context7.abrupt('return', {
                  packetlines: packetlines,
                  packfile: packfile,
                  progress: progress
                });

              case 17:
              case 'end':
                return _context7.stop();
            }
          }
        }, _callee7, this);
      }));

      function stream$$1(_x4) {
        return _ref8.apply(this, arguments);
      }

      return stream$$1;
    }() /*: {
        stream: ReadableStream,
        service: string}
        */

  }]);

  return GitRemoteHTTP;
}();

var add = function () {
  var _ref2 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee2(_ref) {
    var gitdir = _ref.gitdir,
        workdir = _ref.workdir,
        filepath = _ref.filepath;
    var type, object, oid;
    return _regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            type = 'blob';
            _context2.next = 3;
            return read(path.join(workdir, filepath));

          case 3:
            object = _context2.sent;

            if (!(object === null)) {
              _context2.next = 6;
              break;
            }

            throw new Error('Could not read file \'' + filepath + '\'');

          case 6:
            _context2.next = 8;
            return GitObjectManager.write({ gitdir: gitdir, type: type, object: object });

          case 8:
            oid = _context2.sent;
            _context2.next = 11;
            return GitIndexManager.acquire(gitdir + '/index', function () {
              var _ref3 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee(index) {
                var stats;
                return _regeneratorRuntime.wrap(function _callee$(_context) {
                  while (1) {
                    switch (_context.prev = _context.next) {
                      case 0:
                        _context.next = 2;
                        return pify(fs().lstat)(path.join(workdir, filepath));

                      case 2:
                        stats = _context.sent;

                        index.insert({ filepath: filepath, stats: stats, oid: oid });

                      case 4:
                      case 'end':
                        return _context.stop();
                    }
                  }
                }, _callee, this);
              }));

              return function (_x2) {
                return _ref3.apply(this, arguments);
              };
            }());

          case 11:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));

  return function add(_x) {
    return _ref2.apply(this, arguments);
  };
}();

var writeTreeToDisk = function () {
  var _ref2 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee(_ref) {
    var gitdir = _ref.gitdir,
        dirpath = _ref.dirpath,
        tree = _ref.tree;

    var _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, entry, _ref3, type, object, entrypath, _tree;

    return _regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _iteratorNormalCompletion = true;
            _didIteratorError = false;
            _iteratorError = undefined;
            _context.prev = 3;
            _iterator = _getIterator(tree);

          case 5:
            if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
              _context.next = 27;
              break;
            }

            entry = _step.value;
            _context.next = 9;
            return GitObjectManager.read({
              gitdir: gitdir,
              oid: entry.oid
            });

          case 9:
            _ref3 = _context.sent;
            type = _ref3.type;
            object = _ref3.object;
            entrypath = dirpath + '/' + entry.path;
            _context.t0 = type;
            _context.next = _context.t0 === 'blob' ? 16 : _context.t0 === 'tree' ? 19 : 23;
            break;

          case 16:
            _context.next = 18;
            return write(entrypath, object);

          case 18:
            return _context.abrupt('break', 24);

          case 19:
            _tree = GitTree.from(object);
            _context.next = 22;
            return writeTreeToDisk({ gitdir: gitdir, dirpath: entrypath, tree: _tree });

          case 22:
            return _context.abrupt('break', 24);

          case 23:
            throw new Error('Unexpected object type ' + type + ' found in tree for \'' + dirpath + '\'');

          case 24:
            _iteratorNormalCompletion = true;
            _context.next = 5;
            break;

          case 27:
            _context.next = 33;
            break;

          case 29:
            _context.prev = 29;
            _context.t1 = _context['catch'](3);
            _didIteratorError = true;
            _iteratorError = _context.t1;

          case 33:
            _context.prev = 33;
            _context.prev = 34;

            if (!_iteratorNormalCompletion && _iterator.return) {
              _iterator.return();
            }

          case 36:
            _context.prev = 36;

            if (!_didIteratorError) {
              _context.next = 39;
              break;
            }

            throw _iteratorError;

          case 39:
            return _context.finish(36);

          case 40:
            return _context.finish(33);

          case 41:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this, [[3, 29, 33, 41], [34,, 36, 40]]);
  }));

  return function writeTreeToDisk(_x) {
    return _ref2.apply(this, arguments);
  };
}();

var checkout = function () {
  var _ref5 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee2(_ref4) {
    var workdir = _ref4.workdir,
        gitdir = _ref4.gitdir,
        remote = _ref4.remote,
        ref = _ref4.ref;

    var oid, commit, comm, sha, _ref6, type, object, tree;

    return _regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            // Get tree oid
            oid = void 0;
            _context2.prev = 1;
            _context2.next = 4;
            return resolveRef({ gitdir: gitdir, ref: ref });

          case 4:
            oid = _context2.sent;
            _context2.next = 14;
            break;

          case 7:
            _context2.prev = 7;
            _context2.t0 = _context2['catch'](1);
            _context2.next = 11;
            return resolveRef({ gitdir: gitdir, ref: remote + '/' + ref });

          case 11:
            oid = _context2.sent;
            _context2.next = 14;
            return write(gitdir + '/refs/heads/' + ref, oid + '\n');

          case 14:
            _context2.next = 16;
            return GitObjectManager.read({ gitdir: gitdir, oid: oid });

          case 16:
            commit = _context2.sent;

            if (!(commit.type !== 'commit')) {
              _context2.next = 19;
              break;
            }

            throw new Error('Unexpected type: ' + commit.type);

          case 19:
            comm = GitCommit.from(commit.object.toString('utf8'));
            sha = comm.headers().tree;
            // Get top-level tree

            _context2.next = 23;
            return GitObjectManager.read({ gitdir: gitdir, oid: sha });

          case 23:
            _ref6 = _context2.sent;
            type = _ref6.type;
            object = _ref6.object;

            if (!(type !== 'tree')) {
              _context2.next = 28;
              break;
            }

            throw new Error('Unexpected type: ' + type);

          case 28:
            tree = GitTree.from(object);
            // Write files. TODO: Write them atomically

            _context2.next = 31;
            return writeTreeToDisk({ gitdir: gitdir, dirpath: workdir, tree: tree });

          case 31:
            // Update HEAD TODO: Handle non-branch cases
            write(gitdir + '/HEAD', 'ref: refs/heads/' + ref);

          case 32:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, this, [[1, 7]]);
  }));

  return function checkout(_x2) {
    return _ref5.apply(this, arguments);
  };
}();

var constructTree = function () {
  var _ref2 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee(_ref) {
    var gitdir = _ref.gitdir,
        inode = _ref.inode;

    var children, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, _inode, entries, tree, oid;

    return _regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            // use depth first traversal
            children = inode.children;
            _iteratorNormalCompletion = true;
            _didIteratorError = false;
            _iteratorError = undefined;
            _context.prev = 4;
            _iterator = _getIterator(children);

          case 6:
            if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
              _context.next = 16;
              break;
            }

            _inode = _step.value;

            if (!(_inode.type === 'tree')) {
              _context.next = 13;
              break;
            }

            _inode.metadata.mode = '040000';
            _context.next = 12;
            return constructTree({ gitdir: gitdir, inode: _inode });

          case 12:
            _inode.metadata.oid = _context.sent;

          case 13:
            _iteratorNormalCompletion = true;
            _context.next = 6;
            break;

          case 16:
            _context.next = 22;
            break;

          case 18:
            _context.prev = 18;
            _context.t0 = _context['catch'](4);
            _didIteratorError = true;
            _iteratorError = _context.t0;

          case 22:
            _context.prev = 22;
            _context.prev = 23;

            if (!_iteratorNormalCompletion && _iterator.return) {
              _iterator.return();
            }

          case 25:
            _context.prev = 25;

            if (!_didIteratorError) {
              _context.next = 28;
              break;
            }

            throw _iteratorError;

          case 28:
            return _context.finish(25);

          case 29:
            return _context.finish(22);

          case 30:
            entries = children.map(function (inode) {
              return {
                mode: inode.metadata.mode,
                path: inode.basename,
                oid: inode.metadata.oid,
                type: inode.type
              };
            });
            tree = GitTree.from(entries);
            _context.next = 34;
            return GitObjectManager.write({
              gitdir: gitdir,
              type: 'tree',
              object: tree.toObject()
            });

          case 34:
            oid = _context.sent;
            return _context.abrupt('return', oid);

          case 36:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this, [[4, 18, 22, 30], [23,, 25, 29]]);
  }));

  return function constructTree(_x) {
    return _ref2.apply(this, arguments);
  };
}();

var commit = function () {
  var _ref4 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee3(_ref3) {
    var gitdir = _ref3.gitdir,
        author = _ref3.author,
        committer = _ref3.committer,
        message$$1 = _ref3.message,
        privateKeys = _ref3.privateKeys;
    var authorDateTime, committerDateTime, oid;
    return _regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            // Fill in missing arguments with default values
            committer = committer || author;
            authorDateTime = author.date || new Date();
            committerDateTime = committer.date || authorDateTime;
            oid = void 0;
            _context3.next = 6;
            return GitIndexManager.acquire(gitdir + '/index', function () {
              var _ref5 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee2(index) {
                var inode, treeRef, parents, parent, comm, branch;
                return _regeneratorRuntime.wrap(function _callee2$(_context2) {
                  while (1) {
                    switch (_context2.prev = _context2.next) {
                      case 0:
                        inode = flatFileListToDirectoryStructure(index.entries);
                        _context2.next = 3;
                        return constructTree({ gitdir: gitdir, inode: inode });

                      case 3:
                        treeRef = _context2.sent;
                        parents = void 0;
                        _context2.prev = 5;
                        _context2.next = 8;
                        return resolveRef({ gitdir: gitdir, ref: 'HEAD' });

                      case 8:
                        parent = _context2.sent;

                        parents = [parent];
                        _context2.next = 15;
                        break;

                      case 12:
                        _context2.prev = 12;
                        _context2.t0 = _context2['catch'](5);

                        // Probably an initial commit
                        parents = [];

                      case 15:
                        comm = GitCommit.from({
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

                        if (!privateKeys) {
                          _context2.next = 20;
                          break;
                        }

                        _context2.next = 19;
                        return comm.sign(privateKeys);

                      case 19:
                        comm = _context2.sent;

                      case 20:
                        _context2.next = 22;
                        return GitObjectManager.write({
                          gitdir: gitdir,
                          type: 'commit',
                          object: comm.toObject()
                        });

                      case 22:
                        oid = _context2.sent;
                        _context2.next = 25;
                        return resolveRef({ gitdir: gitdir, ref: 'HEAD', depth: 2 });

                      case 25:
                        branch = _context2.sent;
                        _context2.next = 28;
                        return write(path.join(gitdir, branch), oid + '\n');

                      case 28:
                      case 'end':
                        return _context2.stop();
                    }
                  }
                }, _callee2, this, [[5, 12]]);
              }));

              return function (_x3) {
                return _ref5.apply(this, arguments);
              };
            }());

          case 6:
            return _context3.abrupt('return', oid);

          case 7:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, this);
  }));

  return function commit(_x2) {
    return _ref4.apply(this, arguments);
  };
}();

var getConfig = function () {
  var _ref2 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee(_ref) {
    var gitdir = _ref.gitdir,
        path$$1 = _ref.path;
    var config, value;
    return _regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return GitConfigManager.get({ gitdir: gitdir });

          case 2:
            config = _context.sent;
            _context.next = 5;
            return config.get(path$$1);

          case 5:
            value = _context.sent;
            return _context.abrupt('return', value);

          case 7:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function getConfig(_x) {
    return _ref2.apply(this, arguments);
  };
}();

// @flow
/*::
import type {Writable} from 'stream'
*/

var types = {
  1: 'commit',
  2: 'tree',
  3: 'blob',
  4: 'tag',
  6: 'ofs-delta',
  7: 'ref-delta'
};

function parseVarInt(buffer$$1 /*: Buffer */) {
  var n = 0;
  for (var i = 0; i < buffer$$1.byteLength; i++) {
    n = (buffer$$1[i] & 127) + (n << 7);
    if ((buffer$$1[i] & 128) === 0) {
      if (i !== buffer$$1.byteLength - 1) throw new Error('Invalid varint buffer');
      return n;
    }
  }
  throw new Error('Invalid varint buffer');
}

// TODO: Move this to 'plumbing'
var unpack = function () {
  var _ref2 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee2(_ref /*: {gitdir: string, inputStream: ReadableStream} */
  ) {
    var gitdir = _ref.gitdir,
        inputStream = _ref.inputStream;
    return _regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            return _context2.abrupt('return', new _Promise(function (resolve, reject) {
              var _this = this;

              // Read header
              peek(inputStream, 12, function (err, data, inputStream) {
                if (err) return reject(err);
                var iden = data.slice(0, 4).toString('utf8');
                if (iden !== 'PACK') {
                  throw new Error('Packfile started with \'' + iden + '\'. Expected \'PACK\'');
                }
                var ver = data.slice(4, 8).toString('hex');
                if (ver !== '00000002') {
                  throw new Error('Unknown packfile version \'' + ver + '\'. Expected 00000002.');
                }
                // Read a 4 byte (32-bit) int
                var numObjects = data.readInt32BE(8);
                console.log('unpacking ' + numObjects + ' objects');
                if (numObjects === 0) return;
                // And on our merry way
                var offsetMap = new _Map();
                inputStream.pipe(listpack()).pipe(thru(function () {
                  var _ref4 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee(_ref3, next) {
                    var data = _ref3.data,
                        type = _ref3.type,
                        reference = _ref3.reference,
                        offset = _ref3.offset,
                        num = _ref3.num;

                    var oid, _ref5, object, _type, result, newoid, absoluteOffset, referenceOid, _ref6, _type2, _object, _result, _oid, _oid2;

                    return _regeneratorRuntime.wrap(function _callee$(_context) {
                      while (1) {
                        switch (_context.prev = _context.next) {
                          case 0:
                            type = types[type];

                            if (!(type === 'ref-delta')) {
                              _context.next = 21;
                              break;
                            }

                            oid = reference.toString('hex');
                            _context.prev = 3;
                            _context.next = 6;
                            return GitObjectManager.read({
                              gitdir: gitdir,
                              oid: oid
                            });

                          case 6:
                            _ref5 = _context.sent;
                            object = _ref5.object;
                            _type = _ref5.type;
                            result = applyDelta(data, object);
                            _context.next = 12;
                            return GitObjectManager.write({
                              gitdir: gitdir,
                              type: _type,
                              object: result
                            });

                          case 12:
                            

                            // console.log(`${type} ${newoid} ref-delta ${oid}`)
                            offsetMap.set(offset, oid);
                            _context.next = 19;
                            break;

                          case 16:
                            _context.prev = 16;
                            _context.t0 = _context['catch'](3);
                            throw new Error('Could not find object ' + oid + ' that is referenced by a ref-delta object in packfile at byte offset ' + offset + '.');

                          case 19:
                            _context.next = 40;
                            break;

                          case 21:
                            if (!(type === 'ofs-delta')) {
                              _context.next = 36;
                              break;
                            }

                            // Note: this might be not working because offsets might not be
                            // guaranteed to be on object boundaries? In which case we'd need
                            // to write the packfile to disk first, I think.
                            // For now I've "solved" it by simply not advertising ofs-delta as a capability
                            // during the HTTP request, so Github will only send ref-deltas not ofs-deltas.
                            absoluteOffset = offset - parseVarInt(reference);
                            referenceOid = offsetMap.get(absoluteOffset);
                            // console.log(`${offset} ofs-delta ${absoluteOffset} ${referenceOid}`)

                            _context.next = 26;
                            return GitObjectManager.read({
                              gitdir: gitdir,
                              oid: referenceOid
                            });

                          case 26:
                            _ref6 = _context.sent;
                            _type2 = _ref6.type;
                            _object = _ref6.object;
                            _result = applyDelta(data, _object);
                            _context.next = 32;
                            return GitObjectManager.write({
                              gitdir: gitdir,
                              type: _type2,
                              object: _result
                            });

                          case 32:
                            _oid = _context.sent;

                            // console.log(`${offset} ${type} ${oid} ofs-delta ${referenceOid}`)
                            offsetMap.set(offset, _oid);
                            _context.next = 40;
                            break;

                          case 36:
                            _context.next = 38;
                            return GitObjectManager.write({
                              gitdir: gitdir,
                              type: type,
                              object: data
                            });

                          case 38:
                            _oid2 = _context.sent;

                            // console.log(`${offset} ${type} ${oid}`)
                            offsetMap.set(offset, _oid2);

                          case 40:
                            if (!(num === 0)) {
                              _context.next = 42;
                              break;
                            }

                            return _context.abrupt('return', resolve());

                          case 42:
                            next(null);

                          case 43:
                          case 'end':
                            return _context.stop();
                        }
                      }
                    }, _callee, _this, [[3, 16]]);
                  }));

                  return function (_x2, _x3) {
                    return _ref4.apply(this, arguments);
                  };
                }())).on('error', reject).on('finish', resolve);
              });
            }));

          case 1:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));

  return function unpack(_x) {
    return _ref2.apply(this, arguments);
  };
}();

// @flow
var fetchPackfile = function () {
  var _ref2 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee(_ref) {
    var gitdir = _ref.gitdir,
        _ref$ref = _ref.ref,
        ref = _ref$ref === undefined ? 'HEAD' : _ref$ref,
        remote = _ref.remote,
        auth = _ref.auth;
    var url, remoteHTTP, want, capabilities, packstream, have, response;
    return _regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return getConfig({
              gitdir: gitdir,
              path: 'remote "' + remote + '".url'
            });

          case 2:
            url = _context.sent;
            remoteHTTP = new GitRemoteHTTP(url);

            remoteHTTP.auth = auth;
            _context.next = 7;
            return remoteHTTP.preparePull();

          case 7:
            _context.next = 9;
            return GitRefsManager.updateRemoteRefs({
              gitdir: gitdir,
              remote: remote,
              refs: remoteHTTP.refs
            });

          case 9:
            want = remoteHTTP.refs.get(ref);

            console.log('want =', want);
            // Note: I removed "ofs-delta" from the capabilities list and now
            // Github uses all ref-deltas when I fetch packfiles instead of all ofs-deltas. Nice!
            capabilities = 'multi_ack_detailed no-done side-band-64k thin-pack agent=git/' + name + '@' + version;
            packstream = new stream__default.PassThrough();

            packstream.write(GitPktLine.encode('want ' + want + ' ' + capabilities + '\n'));
            packstream.write(GitPktLine.flush());
            have = null;
            _context.prev = 16;
            _context.next = 19;
            return resolveRef({ gitdir: gitdir, ref: ref });

          case 19:
            have = _context.sent;

            console.log('have =', have);
            _context.next = 26;
            break;

          case 23:
            _context.prev = 23;
            _context.t0 = _context['catch'](16);

            console.log("Looks like we don't have that ref yet.");

          case 26:
            if (have) {
              packstream.write(GitPktLine.encode('have ' + have + '\n'));
              packstream.write(GitPktLine.flush());
            }
            packstream.end(GitPktLine.encode('done\n'));
            _context.next = 30;
            return remoteHTTP.pull(packstream);

          case 30:
            response = _context.sent;
            return _context.abrupt('return', response);

          case 32:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this, [[16, 23]]);
  }));

  return function fetchPackfile(_x) {
    return _ref2.apply(this, arguments);
  };
}();

var fetch = function () {
  var _ref4 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee2(_ref3) {
    var gitdir = _ref3.gitdir,
        _ref3$ref = _ref3.ref,
        ref = _ref3$ref === undefined ? 'HEAD' : _ref3$ref,
        remote = _ref3.remote,
        auth = _ref3.auth;
    var response;
    return _regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.next = 2;
            return fetchPackfile({ gitdir: gitdir, ref: ref, remote: remote, auth: auth });

          case 2:
            response = _context2.sent;

            // response.packetlines.pipe(process.stdout)
            response.progress.pipe(process.stdout);
            _context2.next = 6;
            return unpack({ gitdir: gitdir, inputStream: response.packfile });

          case 6:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));

  return function fetch(_x2) {
    return _ref4.apply(this, arguments);
  };
}();

var request = function () {
  var _ref2 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee(_ref) {
    var url = _ref.url,
        token = _ref.token,
        headers = _ref.headers;
    var res, data;
    return _regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return pify(simpleGet)({
              url: url,
              headers: _extends({
                Accept: 'application/vnd.github.v3+json',
                Authorization: 'token ' + token
              }, headers)
            });

          case 2:
            res = _context.sent;
            _context.next = 5;
            return pify(concat)(res);

          case 5:
            data = _context.sent;
            return _context.abrupt('return', JSON.parse(data.toString('utf8')));

          case 7:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function request(_x) {
    return _ref2.apply(this, arguments);
  };
}();

var fetchRemoteBranches = function () {
  var _ref4 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee2(_ref3) {
    var gitdir = _ref3.gitdir,
        remote = _ref3.remote,
        user = _ref3.user,
        repo = _ref3.repo,
        token = _ref3.token;
    return _regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            return _context2.abrupt('return', request({
              token: token,
              url: 'https://api.github.com/repos/' + user + '/' + repo + '/branches'
            }).then(function (json) {
              return _Promise.all(json.map(function (branch) {
                return write(gitdir + '/refs/remotes/' + remote + '/' + branch.name, branch.commit.sha + '\n', { encoding: 'utf8' });
              }));
            }));

          case 1:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));

  return function fetchRemoteBranches(_x2) {
    return _ref4.apply(this, arguments);
  };
}();

var fetchTags = function () {
  var _ref6 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee3(_ref5) {
    var gitdir = _ref5.gitdir,
        user = _ref5.user,
        repo = _ref5.repo,
        token = _ref5.token;
    return _regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            return _context3.abrupt('return', request({
              token: token,
              url: 'https://api.github.com/repos/' + user + '/' + repo + '/tags'
            }).then(function (json) {
              return _Promise.all(json.map(function (tag) {
                return (
                  // Curiously, tags are not separated between remotes like branches
                  write(gitdir + '/refs/tags/' + tag.name, tag.commit.sha + '\n', {
                    encoding: 'utf8'
                  })
                );
              }));
            }));

          case 1:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, this);
  }));

  return function fetchTags(_x3) {
    return _ref6.apply(this, arguments);
  };
}();

var fetchCommits = function () {
  var _ref8 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee4(_ref7) {
    var gitdir = _ref7.gitdir,
        url = _ref7.url,
        user = _ref7.user,
        repo = _ref7.repo,
        ref = _ref7.ref,
        since = _ref7.since,
        token = _ref7.token;

    var date, res, data, json, link, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, commit, comm, oid;

    return _regeneratorRuntime.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            if (!url) {
              url = 'https://api.github.com/repos/' + user + '/' + repo + '/commits?';
              if (ref) url += '&sha=' + ref;
              if (since) {
                date = new Date(since * 1000).toISOString();

                url += '&since=' + date;
              }
            }
            _context4.next = 3;
            return pify(simpleGet)({
              url: url,
              headers: {
                Accept: 'application/vnd.github.cryptographer-preview',
                Authorization: 'token ' + token
              }
            });

          case 3:
            res = _context4.sent;
            _context4.next = 6;
            return pify(concat)(res);

          case 6:
            data = _context4.sent;
            json = JSON.parse(data.toString('utf8'));
            link = parseLinkHeader(res.headers['link']);
            _iteratorNormalCompletion = true;
            _didIteratorError = false;
            _iteratorError = undefined;
            _context4.prev = 12;
            _iterator = _getIterator(json);

          case 14:
            if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
              _context4.next = 29;
              break;
            }

            commit = _step.value;

            if (commit.commit.verification.payload) {
              _context4.next = 19;
              break;
            }

            console.log('Commit ' + commit.sha + ' skipped. Due to a technical limitations and my laziness, only signed commits can be cloned from Github over the API');
            return _context4.abrupt('continue', 26);

          case 19:
            comm = GitCommit.fromPayloadSignature({
              payload: commit.commit.verification.payload,
              signature: commit.commit.verification.signature
            });

            console.log('Created commit', comm);
            _context4.next = 23;
            return GitObjectManager.write({
              gitdir: gitdir,
              type: 'commit',
              object: comm.toObject()
            });

          case 23:
            oid = _context4.sent;

            if (commit.sha !== oid) {
              console.log("AHOY! MATEY! THAR BE TROUBLE WITH 'EM HASHES!");
            }
            console.log('Stored commit ' + commit.sha);

          case 26:
            _iteratorNormalCompletion = true;
            _context4.next = 14;
            break;

          case 29:
            _context4.next = 35;
            break;

          case 31:
            _context4.prev = 31;
            _context4.t0 = _context4['catch'](12);
            _didIteratorError = true;
            _iteratorError = _context4.t0;

          case 35:
            _context4.prev = 35;
            _context4.prev = 36;

            if (!_iteratorNormalCompletion && _iterator.return) {
              _iterator.return();
            }

          case 38:
            _context4.prev = 38;

            if (!_didIteratorError) {
              _context4.next = 41;
              break;
            }

            throw _iteratorError;

          case 41:
            return _context4.finish(38);

          case 42:
            return _context4.finish(35);

          case 43:
            if (!(link && link.next)) {
              _context4.next = 45;
              break;
            }

            return _context4.abrupt('return', fetchCommits({
              gitdir: gitdir,
              user: user,
              repo: repo,
              ref: ref,
              since: since,
              token: token,
              url: link.next.url
            }));

          case 45:
          case 'end':
            return _context4.stop();
        }
      }
    }, _callee4, this, [[12, 31, 35, 43], [36,, 38, 42]]);
  }));

  return function fetchCommits(_x4) {
    return _ref8.apply(this, arguments);
  };
}();

var fetchTree = function () {
  var _ref10 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee6(_ref9) {
    var _this = this;

    var gitdir = _ref9.gitdir,
        url = _ref9.url,
        user = _ref9.user,
        repo = _ref9.repo,
        sha = _ref9.sha,
        since = _ref9.since,
        token = _ref9.token;
    var json, tree, oid;
    return _regeneratorRuntime.wrap(function _callee6$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            _context6.next = 2;
            return request({
              token: token,
              url: 'https://api.github.com/repos/' + user + '/' + repo + '/git/trees/' + sha
            });

          case 2:
            json = _context6.sent;
            tree = new GitTree(json.tree);
            _context6.next = 6;
            return GitObjectManager.write({
              gitdir: gitdir,
              type: 'tree',
              object: tree.toObject()
            });

          case 6:
            oid = _context6.sent;

            if (sha !== oid) {
              console.log("AHOY! MATEY! THAR BE TROUBLE WITH 'EM HASHES!");
            }
            console.log(tree.render());
            return _context6.abrupt('return', _Promise.all(json.tree.map(function () {
              var _ref11 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee5(entry) {
                return _regeneratorRuntime.wrap(function _callee5$(_context5) {
                  while (1) {
                    switch (_context5.prev = _context5.next) {
                      case 0:
                        if (!(entry.type === 'blob')) {
                          _context5.next = 5;
                          break;
                        }

                        _context5.next = 3;
                        return fetchBlob({
                          gitdir: gitdir,
                          url: url,
                          user: user,
                          repo: repo,
                          sha: entry.sha,
                          since: since,
                          token: token
                        });

                      case 3:
                        _context5.next = 8;
                        break;

                      case 5:
                        if (!(entry.type === 'tree')) {
                          _context5.next = 8;
                          break;
                        }

                        _context5.next = 8;
                        return fetchTree({
                          gitdir: gitdir,
                          url: url,
                          user: user,
                          repo: repo,
                          sha: entry.sha,
                          since: since,
                          token: token
                        });

                      case 8:
                      case 'end':
                        return _context5.stop();
                    }
                  }
                }, _callee5, _this);
              }));

              return function (_x6) {
                return _ref11.apply(this, arguments);
              };
            }())));

          case 10:
          case 'end':
            return _context6.stop();
        }
      }
    }, _callee6, this);
  }));

  return function fetchTree(_x5) {
    return _ref10.apply(this, arguments);
  };
}();

var fetchBlob = function () {
  var _ref13 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee7(_ref12) {
    var gitdir = _ref12.gitdir,
        url = _ref12.url,
        user = _ref12.user,
        repo = _ref12.repo,
        sha = _ref12.sha,
        since = _ref12.since,
        token = _ref12.token;
    var res, data, oid;
    return _regeneratorRuntime.wrap(function _callee7$(_context7) {
      while (1) {
        switch (_context7.prev = _context7.next) {
          case 0:
            _context7.next = 2;
            return pify(simpleGet)({
              url: 'https://api.github.com/repos/' + user + '/' + repo + '/git/blobs/' + sha,
              headers: {
                Accept: 'application/vnd.github.raw',
                Authorization: 'token ' + token
              }
            });

          case 2:
            res = _context7.sent;
            _context7.next = 5;
            return pify(concat)(res);

          case 5:
            data = _context7.sent;
            _context7.next = 8;
            return GitObjectManager.write({
              gitdir: gitdir,
              type: 'blob',
              object: data
            });

          case 8:
            oid = _context7.sent;

            if (sha !== oid) {
              console.log("AHOY! MATEY! THAR BE TROUBLE WITH 'EM HASHES!");
            }

          case 10:
          case 'end':
            return _context7.stop();
        }
      }
    }, _callee7, this);
  }));

  return function fetchBlob(_x7) {
    return _ref13.apply(this, arguments);
  };
}();

// We're implementing a non-standard clone based on the Github API first, because of CORS.
// And because we already have the code.
var GithubFetch = function () {
  var _ref15 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee8(_ref14) {
    var gitdir = _ref14.gitdir,
        token = _ref14.token,
        user = _ref14.user,
        repo = _ref14.repo,
        ref = _ref14.ref,
        remote = _ref14.remote;

    var json, getBranches, getTags, getCommits, oid, _ref16, type, object, comm, sha;

    return _regeneratorRuntime.wrap(function _callee8$(_context8) {
      while (1) {
        switch (_context8.prev = _context8.next) {
          case 0:
            json = void 0;

            if (ref) {
              _context8.next = 7;
              break;
            }

            console.log('Determining the default branch');
            _context8.next = 5;
            return request({
              token: token,
              url: 'https://api.github.com/repos/' + user + '/' + repo
            });

          case 5:
            json = _context8.sent;

            ref = json.default_branch;

          case 7:

            console.log('Receiving branches list');
            getBranches = fetchRemoteBranches({ gitdir: gitdir, remote: remote, user: user, repo: repo, token: token });


            console.log('Receiving tags list');
            getTags = fetchTags({ gitdir: gitdir, user: user, repo: repo, token: token });


            console.log('Receiving commits');
            getCommits = fetchCommits({ gitdir: gitdir, user: user, repo: repo, token: token, ref: ref });
            _context8.next = 15;
            return _Promise.all([getBranches, getTags, getCommits]);

          case 15:
            _context8.next = 17;
            return resolveRef({ gitdir: gitdir, ref: remote + '/' + ref });

          case 17:
            oid = _context8.sent;
            _context8.next = 20;
            return GitObjectManager.read({ gitdir: gitdir, oid: oid });

          case 20:
            _ref16 = _context8.sent;
            type = _ref16.type;
            object = _ref16.object;

            if (!(type !== 'commit')) {
              _context8.next = 25;
              break;
            }

            throw new Error('Unexpected type: ' + type);

          case 25:
            comm = GitCommit.from(object.toString('utf8'));
            sha = comm.headers().tree;

            console.log('tree: ', sha);

            _context8.next = 30;
            return fetchTree({ gitdir: gitdir, user: user, repo: repo, token: token, sha: sha });

          case 30:
          case 'end':
            return _context8.stop();
        }
      }
    }, _callee8, this);
  }));

  return function GithubFetch(_x8) {
    return _ref15.apply(this, arguments);
  };
}();

// @flow
var init = function () {
  var _ref = _asyncToGenerator(_regeneratorRuntime.mark(function _callee(gitdir /*: string */) {
    var folders;
    return _regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            folders = ['hooks', 'info', 'objects/info', 'objects/pack', 'refs/heads', 'refs/tags'];

            folders = folders.map(function (dir) {
              return gitdir + '/' + dir;
            });
            _context.next = 4;
            return mkdirs(folders);

          case 4:
            _context.next = 6;
            return write(gitdir + '/config', '[core]\n' + '\trepositoryformatversion = 0\n' + '\tfilemode = false\n' + '\tbare = false\n' + '\tlogallrefupdates = true\n' + '\tsymlinks = false\n' + '\tignorecase = true\n');

          case 6:
            _context.next = 8;
            return write(gitdir + '/HEAD', 'ref: refs/heads/master\n');

          case 8:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function init(_x) {
    return _ref.apply(this, arguments);
  };
}();

var list = function () {
  var _ref2 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee2(_ref) {
    var gitdir = _ref.gitdir;
    var filenames;
    return _regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            filenames = void 0;
            _context2.next = 3;
            return GitIndexManager.acquire(gitdir + '/index', function () {
              var _ref3 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee(index) {
                return _regeneratorRuntime.wrap(function _callee$(_context) {
                  while (1) {
                    switch (_context.prev = _context.next) {
                      case 0:
                        filenames = index.entries.map(function (x) {
                          return x.path;
                        });

                      case 1:
                      case 'end':
                        return _context.stop();
                    }
                  }
                }, _callee, this);
              }));

              return function (_x2) {
                return _ref3.apply(this, arguments);
              };
            }());

          case 3:
            return _context2.abrupt('return', filenames);

          case 4:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));

  return function list(_x) {
    return _ref2.apply(this, arguments);
  };
}();

// @flow
// TODO: Move this to 'plumbing'
var listCommits = function () {
  var _ref2 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee2(_ref /*: {
                                                                                gitdir: string,
                                                                                start: Array<string>,
                                                                                finish: Array<string>
                                                                                } */
  ) {
    /*: Set<string> */

    // Because git commits are named by their hash, there is no
    // way to construct a cycle. Therefore we won't worry about
    // setting a default recursion limit.
    var walk = function () {
      var _ref4 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee(oid) {
        var _ref5, type, object, commit, parents, _iteratorNormalCompletion3, _didIteratorError3, _iteratorError3, _iterator3, _step3;

        return _regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                visited.add(oid);
                _context.next = 3;
                return GitObjectManager.read({ gitdir: gitdir, oid: oid });

              case 3:
                _ref5 = _context.sent;
                type = _ref5.type;
                object = _ref5.object;

                if (!(type !== 'commit')) {
                  _context.next = 8;
                  break;
                }

                throw new Error('Expected type commit but type is ' + type);

              case 8:
                commit = GitCommit.from(object);
                parents = commit.headers().parent;
                _iteratorNormalCompletion3 = true;
                _didIteratorError3 = false;
                _iteratorError3 = undefined;
                _context.prev = 13;
                _iterator3 = _getIterator(parents);

              case 15:
                if (_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done) {
                  _context.next = 23;
                  break;
                }

                oid = _step3.value;

                if (!(!finishingSet.has(oid) && !visited.has(oid))) {
                  _context.next = 20;
                  break;
                }

                _context.next = 20;
                return walk(oid);

              case 20:
                _iteratorNormalCompletion3 = true;
                _context.next = 15;
                break;

              case 23:
                _context.next = 29;
                break;

              case 25:
                _context.prev = 25;
                _context.t0 = _context['catch'](13);
                _didIteratorError3 = true;
                _iteratorError3 = _context.t0;

              case 29:
                _context.prev = 29;
                _context.prev = 30;

                if (!_iteratorNormalCompletion3 && _iterator3.return) {
                  _iterator3.return();
                }

              case 32:
                _context.prev = 32;

                if (!_didIteratorError3) {
                  _context.next = 35;
                  break;
                }

                throw _iteratorError3;

              case 35:
                return _context.finish(32);

              case 36:
                return _context.finish(29);

              case 37:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this, [[13, 25, 29, 37], [30,, 32, 36]]);
      }));

      return function walk(_x2) {
        return _ref4.apply(this, arguments);
      };
    }();

    // Let's go walking!


    var gitdir = _ref.gitdir,
        start = _ref.start,
        finish = _ref.finish;

    var startingSet, finishingSet, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, ref, _iteratorNormalCompletion2, _didIteratorError2, _iteratorError2, _iterator2, _step2, _ref3, _oid, visited, _iteratorNormalCompletion4, _didIteratorError4, _iteratorError4, _iterator4, _step4, oid;

    return _regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            startingSet = new _Set();
            finishingSet = new _Set();
            _iteratorNormalCompletion = true;
            _didIteratorError = false;
            _iteratorError = undefined;
            _context2.prev = 5;
            _iterator = _getIterator(start);

          case 7:
            if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
              _context2.next = 17;
              break;
            }

            ref = _step.value;
            _context2.t0 = startingSet;
            _context2.next = 12;
            return resolveRef({ gitdir: gitdir, ref: ref });

          case 12:
            _context2.t1 = _context2.sent;

            _context2.t0.add.call(_context2.t0, _context2.t1);

          case 14:
            _iteratorNormalCompletion = true;
            _context2.next = 7;
            break;

          case 17:
            _context2.next = 23;
            break;

          case 19:
            _context2.prev = 19;
            _context2.t2 = _context2['catch'](5);
            _didIteratorError = true;
            _iteratorError = _context2.t2;

          case 23:
            _context2.prev = 23;
            _context2.prev = 24;

            if (!_iteratorNormalCompletion && _iterator.return) {
              _iterator.return();
            }

          case 26:
            _context2.prev = 26;

            if (!_didIteratorError) {
              _context2.next = 29;
              break;
            }

            throw _iteratorError;

          case 29:
            return _context2.finish(26);

          case 30:
            return _context2.finish(23);

          case 31:
            _iteratorNormalCompletion2 = true;
            _didIteratorError2 = false;
            _iteratorError2 = undefined;
            _context2.prev = 34;
            _iterator2 = _getIterator(finish);

          case 36:
            if (_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done) {
              _context2.next = 50;
              break;
            }

            _ref3 = _step2.value;
            _context2.prev = 38;
            _context2.next = 41;
            return resolveRef({ gitdir: gitdir, ref: _ref3 });

          case 41:
            _oid = _context2.sent;

            finishingSet.add(_oid);
            _context2.next = 47;
            break;

          case 45:
            _context2.prev = 45;
            _context2.t3 = _context2['catch'](38);

          case 47:
            _iteratorNormalCompletion2 = true;
            _context2.next = 36;
            break;

          case 50:
            _context2.next = 56;
            break;

          case 52:
            _context2.prev = 52;
            _context2.t4 = _context2['catch'](34);
            _didIteratorError2 = true;
            _iteratorError2 = _context2.t4;

          case 56:
            _context2.prev = 56;
            _context2.prev = 57;

            if (!_iteratorNormalCompletion2 && _iterator2.return) {
              _iterator2.return();
            }

          case 59:
            _context2.prev = 59;

            if (!_didIteratorError2) {
              _context2.next = 62;
              break;
            }

            throw _iteratorError2;

          case 62:
            return _context2.finish(59);

          case 63:
            return _context2.finish(56);

          case 64:
            visited = new _Set();
            _iteratorNormalCompletion4 = true;
            _didIteratorError4 = false;
            _iteratorError4 = undefined;
            _context2.prev = 68;
            _iterator4 = _getIterator(startingSet);

          case 70:
            if (_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done) {
              _context2.next = 77;
              break;
            }

            oid = _step4.value;
            _context2.next = 74;
            return walk(oid);

          case 74:
            _iteratorNormalCompletion4 = true;
            _context2.next = 70;
            break;

          case 77:
            _context2.next = 83;
            break;

          case 79:
            _context2.prev = 79;
            _context2.t5 = _context2['catch'](68);
            _didIteratorError4 = true;
            _iteratorError4 = _context2.t5;

          case 83:
            _context2.prev = 83;
            _context2.prev = 84;

            if (!_iteratorNormalCompletion4 && _iterator4.return) {
              _iterator4.return();
            }

          case 86:
            _context2.prev = 86;

            if (!_didIteratorError4) {
              _context2.next = 89;
              break;
            }

            throw _iteratorError4;

          case 89:
            return _context2.finish(86);

          case 90:
            return _context2.finish(83);

          case 91:
            return _context2.abrupt('return', visited);

          case 92:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, this, [[5, 19, 23, 31], [24,, 26, 30], [34, 52, 56, 64], [38, 45], [57,, 59, 63], [68, 79, 83, 91], [84,, 86, 90]]);
  }));

  return function listCommits(_x) {
    return _ref2.apply(this, arguments);
  };
}();

// @flow
// TODO: Move this to 'plumbing'
var listObjects = function () {
  var _ref2 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee2(_ref /*: {
                                                                                gitdir: string,
                                                                                oids: Array<string>
                                                                                } */
  ) {

    // We don't do the purest simplest recursion, because we can
    // avoid reading Blob objects entirely since the Tree objects
    // tell us which oids are Blobs and which are Trees.
    var walk = function () {
      var _ref3 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee(oid) {
        var _ref4, type, object, commit, tree, _tree, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, entry;

        return _regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                visited.add(oid);
                _context.next = 3;
                return GitObjectManager.read({ gitdir: gitdir, oid: oid });

              case 3:
                _ref4 = _context.sent;
                type = _ref4.type;
                object = _ref4.object;

                if (!(type === 'commit')) {
                  _context.next = 13;
                  break;
                }

                commit = GitCommit.from(object);
                tree = commit.headers().tree;
                _context.next = 11;
                return walk(tree);

              case 11:
                _context.next = 43;
                break;

              case 13:
                if (!(type === 'tree')) {
                  _context.next = 43;
                  break;
                }

                _tree = GitTree.from(object);
                _iteratorNormalCompletion = true;
                _didIteratorError = false;
                _iteratorError = undefined;
                _context.prev = 18;
                _iterator = _getIterator( /*: TreeEntry */_tree);

              case 20:
                if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
                  _context.next = 29;
                  break;
                }

                entry = _step.value;

                visited.add(entry.oid);
                // only recurse for trees

                if (!(entry.type === 'tree')) {
                  _context.next = 26;
                  break;
                }

                _context.next = 26;
                return walk(entry.oid);

              case 26:
                _iteratorNormalCompletion = true;
                _context.next = 20;
                break;

              case 29:
                _context.next = 35;
                break;

              case 31:
                _context.prev = 31;
                _context.t0 = _context['catch'](18);
                _didIteratorError = true;
                _iteratorError = _context.t0;

              case 35:
                _context.prev = 35;
                _context.prev = 36;

                if (!_iteratorNormalCompletion && _iterator.return) {
                  _iterator.return();
                }

              case 38:
                _context.prev = 38;

                if (!_didIteratorError) {
                  _context.next = 41;
                  break;
                }

                throw _iteratorError;

              case 41:
                return _context.finish(38);

              case 42:
                return _context.finish(35);

              case 43:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this, [[18, 31, 35, 43], [36,, 38, 42]]);
      }));

      return function walk(_x2) {
        return _ref3.apply(this, arguments);
      };
    }();

    // Let's go walking!


    var gitdir = _ref.gitdir,
        oids = _ref.oids;

    var visited, _iteratorNormalCompletion2, _didIteratorError2, _iteratorError2, _iterator2, _step2, oid;

    return _regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            visited /*: Set<string> */ = new _Set();
            _iteratorNormalCompletion2 = true;
            _didIteratorError2 = false;
            _iteratorError2 = undefined;
            _context2.prev = 4;
            _iterator2 = _getIterator(oids);

          case 6:
            if (_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done) {
              _context2.next = 13;
              break;
            }

            oid = _step2.value;
            _context2.next = 10;
            return walk(oid);

          case 10:
            _iteratorNormalCompletion2 = true;
            _context2.next = 6;
            break;

          case 13:
            _context2.next = 19;
            break;

          case 15:
            _context2.prev = 15;
            _context2.t0 = _context2['catch'](4);
            _didIteratorError2 = true;
            _iteratorError2 = _context2.t0;

          case 19:
            _context2.prev = 19;
            _context2.prev = 20;

            if (!_iteratorNormalCompletion2 && _iterator2.return) {
              _iterator2.return();
            }

          case 22:
            _context2.prev = 22;

            if (!_didIteratorError2) {
              _context2.next = 25;
              break;
            }

            throw _iteratorError2;

          case 25:
            return _context2.finish(22);

          case 26:
            return _context2.finish(19);

          case 27:
            return _context2.abrupt('return', visited);

          case 28:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, this, [[4, 15, 19, 27], [20,, 22, 26]]);
  }));

  return function listObjects(_x) {
    return _ref2.apply(this, arguments);
  };
}();

// @flow
/*::
import type {Writable} from 'stream'
*/

var types$1 = {
  commit: 16,
  tree: 32,
  blob: 48,
  tag: 64
  // TODO: Move this to 'plumbing'
};var pack = function () {
  var _ref2 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee(_ref /*: {oids: Array<string>, gitdir: string, outputStream: Writable} */
  ) {
    var oids = _ref.oids,
        gitdir = _ref.gitdir,
        outputStream = _ref.outputStream;

    var hash, stream$$1, write, writeObject, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, oid, _ref4, type, object, digest;

    return _regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            writeObject = function writeObject(_ref3) {
              var stype = _ref3.stype,
                  object = _ref3.object;

              var lastFour = void 0,
                  multibyte = void 0,
                  length = void 0;
              // Object type is encoded in bits 654
              var type = types$1[stype];
              if (type === undefined) throw new Error('Unrecognized type: ' + stype);
              // The length encoding get complicated.
              length = object.length;
              // Whether the next byte is part of the variable-length encoded number
              // is encoded in bit 7
              multibyte = length > 15 ? 128 : 0;
              // Last four bits of length is encoded in bits 3210
              lastFour = length & 15;
              // Discard those bits
              length = length >>> 4;
              // The first byte is then (1-bit multibyte?), (3-bit type), (4-bit least sig 4-bits of length)
              var byte = (multibyte | type | lastFour).toString(16);
              write(byte, 'hex');
              // Now we keep chopping away at length 7-bits at a time until its zero,
              // writing out the bytes in what amounts to little-endian order.
              while (multibyte) {
                multibyte = length > 127 ? 128 : 0;
                byte = multibyte | length & 127;
                write(pad(2, byte.toString(16), '0'), 'hex');
                length = length >>> 7;
              }
              // Lastly, we can compress and write the object.
              write(buffer.Buffer.from(pako.deflate(object)));
            };

            write = function write(chunk, enc) {
              stream$$1.write(chunk, enc);
              hash.update(chunk, enc);
            };

            hash = crypto.createHash('sha1');
            stream$$1 = outputStream;


            write('PACK');
            write('00000002', 'hex');
            // Write a 4 byte (32-bit) int
            write(pad(8, oids.length.toString(16), '0'), 'hex');
            _iteratorNormalCompletion = true;
            _didIteratorError = false;
            _iteratorError = undefined;
            _context.prev = 10;
            _iterator = _getIterator(oids);

          case 12:
            if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
              _context.next = 23;
              break;
            }

            oid = _step.value;
            _context.next = 16;
            return GitObjectManager.read({ gitdir: gitdir, oid: oid });

          case 16:
            _ref4 = _context.sent;
            type = _ref4.type;
            object = _ref4.object;

            writeObject({ write: write, object: object, stype: type });

          case 20:
            _iteratorNormalCompletion = true;
            _context.next = 12;
            break;

          case 23:
            _context.next = 29;
            break;

          case 25:
            _context.prev = 25;
            _context.t0 = _context['catch'](10);
            _didIteratorError = true;
            _iteratorError = _context.t0;

          case 29:
            _context.prev = 29;
            _context.prev = 30;

            if (!_iteratorNormalCompletion && _iterator.return) {
              _iterator.return();
            }

          case 32:
            _context.prev = 32;

            if (!_didIteratorError) {
              _context.next = 35;
              break;
            }

            throw _iteratorError;

          case 35:
            return _context.finish(32);

          case 36:
            return _context.finish(29);

          case 37:
            // Write SHA1 checksum
            digest = hash.digest();

            stream$$1.end(digest);
            return _context.abrupt('return', stream$$1);

          case 40:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this, [[10, 25, 29, 37], [30,, 32, 36]]);
  }));

  return function pack(_x) {
    return _ref2.apply(this, arguments);
  };
}();

// @flow
var push = function () {
  var _ref2 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee(_ref) {
    var gitdir = _ref.gitdir,
        _ref$ref = _ref.ref,
        ref = _ref$ref === undefined ? 'HEAD' : _ref$ref,
        url = _ref.url,
        auth = _ref.auth;
    var oid, remote, commits, objects, packstream, oldoid, response;
    return _regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return resolveRef({ gitdir: gitdir, ref: ref });

          case 2:
            oid = _context.sent;
            remote = new GitRemoteHTTP(url);

            remote.auth = auth;
            _context.next = 7;
            return remote.preparePush();

          case 7:
            _context.next = 9;
            return listCommits({
              gitdir: gitdir,
              start: [oid],
              finish: remote.refs.values()
            });

          case 9:
            commits = _context.sent;
            _context.next = 12;
            return listObjects({ gitdir: gitdir, oids: commits });

          case 12:
            objects = _context.sent;
            packstream = new stream__default.PassThrough();
            oldoid = remote.refs.get(ref) || '0000000000000000000000000000000000000000';

            packstream.write(GitPktLine.encode(oldoid + ' ' + oid + ' ' + ref + '\0 report-status\n'));
            packstream.write(GitPktLine.flush());
            pack({
              gitdir: gitdir,
              oids: [].concat(_toConsumableArray(objects)),
              outputStream: packstream
            });
            _context.next = 20;
            return remote.push(packstream);

          case 20:
            response = _context.sent;
            return _context.abrupt('return', response);

          case 22:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function push(_x) {
    return _ref2.apply(this, arguments);
  };
}();

var remove = function () {
  var _ref2 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee2(_ref) {
    var gitdir = _ref.gitdir,
        filepath = _ref.filepath;
    return _regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.next = 2;
            return GitIndexManager.acquire(gitdir + '/index', function () {
              var _ref3 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee(index) {
                return _regeneratorRuntime.wrap(function _callee$(_context) {
                  while (1) {
                    switch (_context.prev = _context.next) {
                      case 0:
                        index.delete({ filepath: filepath });

                      case 1:
                      case 'end':
                        return _context.stop();
                    }
                  }
                }, _callee, this);
              }));

              return function (_x2) {
                return _ref3.apply(this, arguments);
              };
            }());

          case 2:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));

  return function remove(_x) {
    return _ref2.apply(this, arguments);
  };
}();

var setConfig = function () {
  var _ref2 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee(_ref) {
    var gitdir = _ref.gitdir,
        path$$1 = _ref.path,
        value = _ref.value;
    var config;
    return _regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return GitConfigManager.get({ gitdir: gitdir });

          case 2:
            config = _context.sent;
            _context.next = 5;
            return config.set(path$$1, value);

          case 5:
            _context.next = 7;
            return GitConfigManager.save({ gitdir: gitdir, config: config });

          case 7:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function setConfig(_x) {
    return _ref2.apply(this, arguments);
  };
}();

var HttpKeyServer = new openpgp.HKP();

var verify = function () {
  var _ref2 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee(_ref) {
    var gitdir = _ref.gitdir,
        ref = _ref.ref,
        publicKeys = _ref.publicKeys;

    var oid, _ref3, type, object, commit, author, keys, keyArray, validity;

    return _regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return resolveRef({ gitdir: gitdir, ref: ref });

          case 2:
            oid = _context.sent;
            _context.next = 5;
            return GitObjectManager.read({ gitdir: gitdir, oid: oid });

          case 5:
            _ref3 = _context.sent;
            type = _ref3.type;
            object = _ref3.object;

            if (!(type !== 'commit')) {
              _context.next = 10;
              break;
            }

            throw new Error('git.verify() was expecting a ref type \'commit\' but got type \'' + type + '\'');

          case 10:
            commit = GitCommit.from(object);
            author = commit.headers().author;
            _context.next = 14;
            return commit.listSigningKeys();

          case 14:
            keys = _context.sent;

            if (publicKeys) {
              _context.next = 20;
              break;
            }

            _context.next = 18;
            return _Promise.all(keys.map(function (id) {
              return HttpKeyServer.lookup({ keyId: id });
            }));

          case 18:
            keyArray = _context.sent;

            publicKeys = keyArray.join('\n');

          case 20:
            _context.next = 22;
            return commit.verify(publicKeys);

          case 22:
            validity = _context.sent;

            if (validity) {
              _context.next = 25;
              break;
            }

            return _context.abrupt('return', false);

          case 25:
            return _context.abrupt('return', { author: author, keys: keys });

          case 26:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function verify(_x) {
    return _ref2.apply(this, arguments);
  };
}();

function git(dir) {
  return new Git(dir);
}

// The class is merely a fluent command/query builder

var Git = function () {
  function Git(dir) {
    _classCallCheck(this, Git);

    if (dir) {
      this.workdir = dir;
      this.gitdir = dir + '/.git';
    }
    this.operateRemote = 'origin';
  }

  _createClass(Git, [{
    key: 'workdir',
    value: function workdir(dir) {
      this.workdir = dir;
      return this;
    }
  }, {
    key: 'gitdir',
    value: function gitdir(dir) {
      this.gitdir = dir;
      return this;
    }
  }, {
    key: 'githubToken',
    value: function githubToken(token) {
      this.operateToken = token;
      return this;
    }
  }, {
    key: 'remote',
    value: function remote(name) {
      this.operateRemote = name;
      return this;
    }
  }, {
    key: 'author',
    value: function author(name) {
      this.operateAuthorName = name;
      return this;
    }
  }, {
    key: 'email',
    value: function email(_email) {
      this.operateAuthorEmail = _email;
      return this;
    }
  }, {
    key: 'datetime',
    value: function datetime(date) {
      this.operateAuthorDateTime = date;
      return this;
    }
  }, {
    key: 'timestamp',
    value: function timestamp(seconds) {
      // seconds since unix epoch
      this.operateAuthorTimestamp = seconds;
      return this;
    }
  }, {
    key: 'signingKey',
    value: function signingKey(asciiarmor) {
      this.privateKeys = asciiarmor;
      return this;
    }
  }, {
    key: 'verificationKey',
    value: function verificationKey(asciiarmor) {
      this.publicKeys = asciiarmor;
      return this;
    }
  }, {
    key: 'outputStream',
    value: function outputStream(stream$$1) {
      this.outputStream = stream$$1;
      return this;
    }
  }, {
    key: 'inputStream',
    value: function inputStream(stream$$1) {
      this.inputStream = stream$$1;
      return this;
    }
  }, {
    key: 'init',
    value: function () {
      var _ref = _asyncToGenerator(_regeneratorRuntime.mark(function _callee() {
        return _regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return init(this.gitdir);

              case 2:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function init$$1() {
        return _ref.apply(this, arguments);
      }

      return init$$1;
    }()
  }, {
    key: 'fetch',
    value: function () {
      var _ref2 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee2(ref) {
        var params;
        return _regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                // TODO replace "auth" with just basicAuthUser and basicAuthPassword
                params = {};

                params.remote = this.operateRemote;
                if (this.operateToken) {
                  params.auth = {
                    username: this.operateToken,
                    password: this.operateToken
                  };
                }
                params.gitdir = this.gitdir;
                params.ref = ref;
                _context2.next = 7;
                return fetch(params);

              case 7:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function fetch$$1(_x) {
        return _ref2.apply(this, arguments);
      }

      return fetch$$1;
    }()
  }, {
    key: 'checkout',
    value: function () {
      var _ref3 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee3(ref) {
        return _regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                _context3.next = 2;
                return checkout({
                  workdir: this.workdir,
                  gitdir: this.gitdir,
                  ref: ref,
                  remote: this.operateRemote
                });

              case 2:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function checkout$$1(_x2) {
        return _ref3.apply(this, arguments);
      }

      return checkout$$1;
    }()
  }, {
    key: 'clone',
    value: function () {
      var _ref4 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee4(url) {
        return _regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                _context4.next = 2;
                return init(this.gitdir);

              case 2:
                _context4.next = 4;
                return GithubFetch({
                  gitdir: this.gitdir,
                  // TODO: make this not Github-specific
                  user: ghurl(url).user,
                  repo: ghurl(url).repo,
                  ref: ghurl(url).branch,
                  remote: this.operateRemote,
                  token: this.operateToken
                });

              case 4:
                _context4.next = 6;
                return checkout({
                  workdir: this.workdir,
                  gitdir: this.gitdir,
                  // TODO: make this not Github-specific
                  ref: ghurl(url).branch,
                  remote: this.operateRemote
                });

              case 6:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function clone(_x3) {
        return _ref4.apply(this, arguments);
      }

      return clone;
    }()
  }, {
    key: 'list',
    value: function () {
      var _ref5 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee5() {
        return _regeneratorRuntime.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                return _context5.abrupt('return', list({
                  gitdir: this.gitdir
                }));

              case 1:
              case 'end':
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));

      function list$$1() {
        return _ref5.apply(this, arguments);
      }

      return list$$1;
    }()
  }, {
    key: 'add',
    value: function () {
      var _ref6 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee6(filepath) {
        return _regeneratorRuntime.wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                return _context6.abrupt('return', add({
                  gitdir: this.gitdir,
                  workdir: this.workdir,
                  filepath: filepath
                }));

              case 1:
              case 'end':
                return _context6.stop();
            }
          }
        }, _callee6, this);
      }));

      function add$$1(_x4) {
        return _ref6.apply(this, arguments);
      }

      return add$$1;
    }()
  }, {
    key: 'remove',
    value: function () {
      var _ref7 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee7(filepath) {
        return _regeneratorRuntime.wrap(function _callee7$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                return _context7.abrupt('return', remove({
                  gitdir: this.gitdir,
                  filepath: filepath
                }));

              case 1:
              case 'end':
                return _context7.stop();
            }
          }
        }, _callee7, this);
      }));

      function remove$$1(_x5) {
        return _ref7.apply(this, arguments);
      }

      return remove$$1;
    }()
  }, {
    key: 'commit',
    value: function () {
      var _ref8 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee8(message$$1) {
        return _regeneratorRuntime.wrap(function _callee8$(_context8) {
          while (1) {
            switch (_context8.prev = _context8.next) {
              case 0:
                _context8.t0 = commit;
                _context8.t1 = this.gitdir;
                _context8.t2 = this.operateAuthorName;

                if (_context8.t2) {
                  _context8.next = 7;
                  break;
                }

                _context8.next = 6;
                return this.getConfig('user.name');

              case 6:
                _context8.t2 = _context8.sent;

              case 7:
                _context8.t3 = _context8.t2;
                _context8.t4 = this.operateAuthorEmail;

                if (_context8.t4) {
                  _context8.next = 13;
                  break;
                }

                _context8.next = 12;
                return this.getConfig('user.email');

              case 12:
                _context8.t4 = _context8.sent;

              case 13:
                _context8.t5 = _context8.t4;
                _context8.t6 = this.operateAuthorTimestamp;
                _context8.t7 = this.operateAuthorDateTime;
                _context8.t8 = {
                  name: _context8.t3,
                  email: _context8.t5,
                  timestamp: _context8.t6,
                  date: _context8.t7
                };
                _context8.t9 = this.operateAuthorName;

                if (_context8.t9) {
                  _context8.next = 22;
                  break;
                }

                _context8.next = 21;
                return this.getConfig('user.name');

              case 21:
                _context8.t9 = _context8.sent;

              case 22:
                _context8.t10 = _context8.t9;
                _context8.t11 = this.operateAuthorEmail;

                if (_context8.t11) {
                  _context8.next = 28;
                  break;
                }

                _context8.next = 27;
                return this.getConfig('user.email');

              case 27:
                _context8.t11 = _context8.sent;

              case 28:
                _context8.t12 = _context8.t11;
                _context8.t13 = this.operateAuthorTimestamp;
                _context8.t14 = this.operateAuthorDateTime;
                _context8.t15 = {
                  name: _context8.t10,
                  email: _context8.t12,
                  timestamp: _context8.t13,
                  date: _context8.t14
                };
                _context8.t16 = message$$1;
                _context8.t17 = this.privateKeys;
                _context8.t18 = {
                  gitdir: _context8.t1,
                  author: _context8.t8,
                  committer: _context8.t15,
                  message: _context8.t16,
                  privateKeys: _context8.t17
                };
                return _context8.abrupt('return', (0, _context8.t0)(_context8.t18));

              case 36:
              case 'end':
                return _context8.stop();
            }
          }
        }, _callee8, this);
      }));

      function commit$$1(_x6) {
        return _ref8.apply(this, arguments);
      }

      return commit$$1;
    }()
  }, {
    key: 'verify',
    value: function () {
      var _ref9 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee9(ref) {
        return _regeneratorRuntime.wrap(function _callee9$(_context9) {
          while (1) {
            switch (_context9.prev = _context9.next) {
              case 0:
                return _context9.abrupt('return', verify({
                  gitdir: this.gitdir,
                  publicKeys: this.publicKeys,
                  ref: ref
                }));

              case 1:
              case 'end':
                return _context9.stop();
            }
          }
        }, _callee9, this);
      }));

      function verify$$1(_x7) {
        return _ref9.apply(this, arguments);
      }

      return verify$$1;
    }()
  }, {
    key: 'pack',
    value: function () {
      var _ref10 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee10(oids) {
        return _regeneratorRuntime.wrap(function _callee10$(_context10) {
          while (1) {
            switch (_context10.prev = _context10.next) {
              case 0:
                return _context10.abrupt('return', pack({
                  gitdir: this.gitdir,
                  outputStream: this.outputStream,
                  oids: oids
                }));

              case 1:
              case 'end':
                return _context10.stop();
            }
          }
        }, _callee10, this);
      }));

      function pack$$1(_x8) {
        return _ref10.apply(this, arguments);
      }

      return pack$$1;
    }()
  }, {
    key: 'unpack',
    value: function () {
      var _ref11 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee11(oids) {
        return _regeneratorRuntime.wrap(function _callee11$(_context11) {
          while (1) {
            switch (_context11.prev = _context11.next) {
              case 0:
                return _context11.abrupt('return', unpack({
                  gitdir: this.gitdir,
                  inputStream: this.inputStream
                }));

              case 1:
              case 'end':
                return _context11.stop();
            }
          }
        }, _callee11, this);
      }));

      function unpack$$1(_x9) {
        return _ref11.apply(this, arguments);
      }

      return unpack$$1;
    }()
  }, {
    key: 'push',
    value: function () {
      var _ref12 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee12(ref) {
        var url;
        return _regeneratorRuntime.wrap(function _callee12$(_context12) {
          while (1) {
            switch (_context12.prev = _context12.next) {
              case 0:
                _context12.next = 2;
                return getConfig({
                  gitdir: this.gitdir,
                  path: 'remote "' + this.operateRemote + '".url'
                });

              case 2:
                url = _context12.sent;

                console.log('url =', url);
                return _context12.abrupt('return', push({
                  gitdir: this.gitdir,
                  ref: ref,
                  url: url,
                  auth: {
                    username: this.operateToken,
                    password: this.operateToken
                  }
                }));

              case 5:
              case 'end':
                return _context12.stop();
            }
          }
        }, _callee12, this);
      }));

      function push$$1(_x10) {
        return _ref12.apply(this, arguments);
      }

      return push$$1;
    }()
  }, {
    key: 'pull',
    value: function () {
      var _ref13 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee13(ref) {
        var params;
        return _regeneratorRuntime.wrap(function _callee13$(_context13) {
          while (1) {
            switch (_context13.prev = _context13.next) {
              case 0:
                params = {};

                params.remote = this.operateRemote;
                if (this.operateToken) {
                  params.auth = {
                    username: this.operateToken,
                    password: this.operateToken
                  };
                }
                params.gitdir = this.gitdir;
                params.ref = ref;
                return _context13.abrupt('return', fetch(params));

              case 6:
              case 'end':
                return _context13.stop();
            }
          }
        }, _callee13, this);
      }));

      function pull(_x11) {
        return _ref13.apply(this, arguments);
      }

      return pull;
    }()
  }, {
    key: 'getConfig',
    value: function () {
      var _ref14 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee14(path$$1) {
        return _regeneratorRuntime.wrap(function _callee14$(_context14) {
          while (1) {
            switch (_context14.prev = _context14.next) {
              case 0:
                return _context14.abrupt('return', getConfig({
                  gitdir: this.gitdir,
                  path: path$$1
                }));

              case 1:
              case 'end':
                return _context14.stop();
            }
          }
        }, _callee14, this);
      }));

      function getConfig$$1(_x12) {
        return _ref14.apply(this, arguments);
      }

      return getConfig$$1;
    }()
  }, {
    key: 'setConfig',
    value: function () {
      var _ref15 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee15(path$$1, value) {
        return _regeneratorRuntime.wrap(function _callee15$(_context15) {
          while (1) {
            switch (_context15.prev = _context15.next) {
              case 0:
                return _context15.abrupt('return', setConfig({
                  gitdir: this.gitdir,
                  path: path$$1,
                  value: value
                }));

              case 1:
              case 'end':
                return _context15.stop();
            }
          }
        }, _callee15, this);
      }));

      function setConfig$$1(_x13, _x14) {
        return _ref15.apply(this, arguments);
      }

      return setConfig$$1;
    }()
  }]);

  return Git;
}();

module.exports = git;
