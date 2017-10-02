'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var _regeneratorRuntime = _interopDefault(require('babel-runtime/regenerator'));
var _asyncToGenerator = _interopDefault(require('babel-runtime/helpers/asyncToGenerator'));
var _getIterator = _interopDefault(require('babel-runtime/core-js/get-iterator'));
var _typeof = _interopDefault(require('babel-runtime/helpers/typeof'));
var _classCallCheck = _interopDefault(require('babel-runtime/helpers/classCallCheck'));
var _createClass = _interopDefault(require('babel-runtime/helpers/createClass'));
var _slicedToArray = _interopDefault(require('babel-runtime/helpers/slicedToArray'));
var _Math$sign = _interopDefault(require('babel-runtime/core-js/math/sign'));
var buffer = require('buffer');
var openpgp = require('openpgp/dist/openpgp.min.js');
var _Object$keys = _interopDefault(require('babel-runtime/core-js/object/keys'));
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

var complexKeys = ['remote', 'branch'];

var isComplexKey = function isComplexKey(key$$1) {
  return complexKeys.reduce(function (x, y) {
    return x || key$$1.startsWith(y);
  }, false);
};

var splitComplexKey = function splitComplexKey(key$$1) {
  return key$$1.split('"').map(function (x) {
    return x.trim();
  }).filter(function (x) {
    return x !== '';
  });
};

// Note: there are a LOT of edge cases that aren't covered (e.g. keys in sections that also
// have subsections, [include] directives, etc.
var GitConfig = function () {
  function GitConfig(text) {
    _classCallCheck(this, GitConfig);

    this.ini = ini.decode(text);
    // Some mangling to make it easier to work with (honestly)
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = _getIterator(_Object$keys(this.ini)), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var key$$1 = _step.value;

        if (isComplexKey(key$$1)) {
          var parts = splitComplexKey(key$$1);
          if (parts.length === 2) {
            // just to be cautious
            _set(this.ini, [parts[0], parts[1]], this.ini[key$$1]);
            delete this.ini[key$$1];
          }
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
  }

  _createClass(GitConfig, [{
    key: 'get',
    value: function () {
      var _ref = _asyncToGenerator(_regeneratorRuntime.mark(function _callee(path) {
        return _regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                return _context.abrupt('return', _get(this.ini, path));

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
      var _ref2 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee2(path, value) {
        return _regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                return _context2.abrupt('return', _set(this.ini, path, value));

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
      // de-mangle complex keys
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = _getIterator(_Object$keys(this.ini)), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var key$$1 = _step2.value;

          if (isComplexKey(key$$1)) {
            var _iteratorNormalCompletion3 = true;
            var _didIteratorError3 = false;
            var _iteratorError3 = undefined;

            try {
              for (var _iterator3 = _getIterator(_Object$keys(this.ini[key$$1])), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                var childkey = _step3.value;

                var complexkey = key$$1 + ' "' + childkey + '"';
                this.ini[complexkey] = this.ini[key$$1][childkey];
                delete this.ini[key$$1][childkey];
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

            delete this.ini[key$$1];
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

      var text = ini.encode(this.ini, { whitespace: true });
      return text;
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
    value: function streamReader(stream /*: ReadableStream */) {
      return function () {
        var _ref = _asyncToGenerator(_regeneratorRuntime.mark(function _callee() {
          var hexlength, length, bytes;
          return _regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
              switch (_context.prev = _context.next) {
                case 0:
                  hexlength = void 0, length = void 0, bytes = void 0;
                  _context.prev = 1;
                  _context.next = 4;
                  return gartal.readBytes(stream, 4);

                case 4:
                  hexlength = _context.sent;
                  _context.next = 10;
                  break;

                case 7:
                  _context.prev = 7;
                  _context.t0 = _context['catch'](1);
                  return _context.abrupt('return', null);

                case 10:
                  length = parseInt(hexlength.toString('utf8'), 16);
                  // skip over flush packets

                  if (!(length === 0)) {
                    _context.next = 13;
                    break;
                  }

                  return _context.abrupt('return', read());

                case 13:
                  _context.next = 15;
                  return gartal.readBytes(stream, length - 4);

                case 15:
                  bytes = _context.sent;
                  return _context.abrupt('return', bytes);

                case 17:
                case 'end':
                  return _context.stop();
              }
            }
          }, _callee, this, [[1, 7]]);
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
    value: function insert(_ref) /*: {filepath: string, stats: Stats, oid: string } */{
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
    }
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
    key: 'clear',
    value: function clear() {
      this._entries.clear();
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
    var path = buffer$$1.slice(space + 1, nullchar).toString('utf8');
    var oid = buffer$$1.slice(nullchar + 1, nullchar + 21).toString('hex');
    cursor = nullchar + 21;
    _entries.push({ mode: mode, path: path, oid: oid, type: type });
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
        var path = buffer.Buffer.from(entry.path, { encoding: 'utf8' });
        var nullchar = buffer.Buffer.from([0]);
        var oid = buffer.Buffer.from(entry.oid.match(/../g).map(function (n) {
          return parseInt(n, 16);
        }));
        return buffer.Buffer.concat([mode, space, path, nullchar, oid]);
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

exports.GitCommit = GitCommit;
exports.GitConfig = GitConfig;
exports.GitPktLine = GitPktLine;
exports.GitIndex = GitIndex;
exports.GitTree = GitTree;
