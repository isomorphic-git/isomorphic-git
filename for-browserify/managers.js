'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var _regeneratorRuntime = _interopDefault(require('babel-runtime/regenerator'));
var _asyncToGenerator = _interopDefault(require('babel-runtime/helpers/asyncToGenerator'));
var _classCallCheck = _interopDefault(require('babel-runtime/helpers/classCallCheck'));
var _createClass = _interopDefault(require('babel-runtime/helpers/createClass'));
var models_js = require('./models.js');
var utils_js = require('./utils.js');
var _getIterator = _interopDefault(require('babel-runtime/core-js/get-iterator'));
var _Set = _interopDefault(require('babel-runtime/core-js/set'));
var path = _interopDefault(require('path'));
var _Map = _interopDefault(require('babel-runtime/core-js/map'));
var AsyncLock = _interopDefault(require('async-lock'));
var buffer = require('buffer');
var pako = _interopDefault(require('pako'));
var shasum = _interopDefault(require('shasum'));
var _slicedToArray = _interopDefault(require('babel-runtime/helpers/slicedToArray'));
var simpleGet = _interopDefault(require('simple-get'));
var concat = _interopDefault(require('simple-concat'));
var pify = _interopDefault(require('pify'));
var stream = require('stream');

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
                return utils_js.read(gitdir + '/config', { encoding: 'utf8' });

              case 2:
                text = _context.sent;
                return _context.abrupt('return', models_js.GitConfig.from(text));

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
                return utils_js.write(gitdir + '/config', config.toString(), {
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
// TODO: Add file locks.
var GitShallowManager = function () {
  function GitShallowManager() {
    _classCallCheck(this, GitShallowManager);
  }

  _createClass(GitShallowManager, null, [{
    key: 'read',
    value: function () {
      var _ref2 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee(_ref) {
        var gitdir = _ref.gitdir;
        var oids, text;
        return _regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                oids = new _Set();
                _context.next = 3;
                return utils_js.read(path.join(gitdir, 'shallow'), { encoding: 'utf8' });

              case 3:
                text = _context.sent;

                if (!(text === null)) {
                  _context.next = 6;
                  break;
                }

                return _context.abrupt('return', oids);

              case 6:
                text.trim().split('\n').map(function (oid) {
                  return oids.add(oid);
                });
                return _context.abrupt('return', oids);

              case 8:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function read$$1(_x) {
        return _ref2.apply(this, arguments);
      }

      return read$$1;
    }()
  }, {
    key: 'write',
    value: function () {
      var _ref4 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee2(_ref3) {
        var gitdir = _ref3.gitdir,
            oids = _ref3.oids;

        var text, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, oid;

        return _regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                text = '';
                _iteratorNormalCompletion = true;
                _didIteratorError = false;
                _iteratorError = undefined;
                _context2.prev = 4;

                for (_iterator = _getIterator(oids); !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                  oid = _step.value;

                  text += oid + '\n';
                }
                _context2.next = 12;
                break;

              case 8:
                _context2.prev = 8;
                _context2.t0 = _context2['catch'](4);
                _didIteratorError = true;
                _iteratorError = _context2.t0;

              case 12:
                _context2.prev = 12;
                _context2.prev = 13;

                if (!_iteratorNormalCompletion && _iterator.return) {
                  _iterator.return();
                }

              case 15:
                _context2.prev = 15;

                if (!_didIteratorError) {
                  _context2.next = 18;
                  break;
                }

                throw _iteratorError;

              case 18:
                return _context2.finish(15);

              case 19:
                return _context2.finish(12);

              case 20:
                _context2.next = 22;
                return utils_js.write(path.join(gitdir, 'shallow'), text, {
                  encoding: 'utf8'
                });

              case 22:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this, [[4, 8, 12, 20], [13,, 15, 19]]);
      }));

      function write$$1(_x2) {
        return _ref4.apply(this, arguments);
      }

      return write$$1;
    }()
  }]);

  return GitShallowManager;
}();

// @flow
// import LockManager from 'travix-lock-manager'
// import Lock from '../utils'

// TODO: replace with an LRU cache?
var map /*: Map<string, GitIndex> */ = new _Map();
// const lm = new LockManager()
var lock = new AsyncLock();

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
                return lock.acquire(filepath, _asyncToGenerator(_regeneratorRuntime.mark(function _callee() {
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
                          return utils_js.read(filepath);

                        case 4:
                          rawIndexFile = _context.sent;

                          index = models_js.GitIndex.from(rawIndexFile);
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
                          return utils_js.write(filepath, buffer$$1);

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
                return utils_js.read(gitdir + '/objects/' + oid.slice(0, 2) + '/' + oid.slice(2));

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
                return utils_js.exists(filepath);

              case 4:
                if (_context2.sent) {
                  _context2.next = 7;
                  break;
                }

                _context2.next = 7;
                return utils_js.write(filepath, file);

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

        var _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, _ref3, _ref4, key, value, normalizeValue, _iteratorNormalCompletion2, _didIteratorError2, _iteratorError2, _iterator2, _step2, _ref5, _ref6, _key, _value;

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
                  _context.next = 47;
                  break;
                }

                _ref5 = _step2.value;
                _ref6 = _slicedToArray(_ref5, 2);
                _key = _ref6[0];
                _value = _ref6[1];

                // For some reason we trim these
                _key = _key.replace(/^refs\/heads\//, '');
                _key = _key.replace(/^refs\/tags\//, '');
                _context.next = 44;
                return utils_js.write(path.join(gitdir, 'refs', 'remotes', remote, _key), normalizeValue(_value), 'utf8');

              case 44:
                _iteratorNormalCompletion2 = true;
                _context.next = 35;
                break;

              case 47:
                _context.next = 53;
                break;

              case 49:
                _context.prev = 49;
                _context.t1 = _context['catch'](33);
                _didIteratorError2 = true;
                _iteratorError2 = _context.t1;

              case 53:
                _context.prev = 53;
                _context.prev = 54;

                if (!_iteratorNormalCompletion2 && _iterator2.return) {
                  _iterator2.return();
                }

              case 56:
                _context.prev = 56;

                if (!_didIteratorError2) {
                  _context.next = 59;
                  break;
                }

                throw _iteratorError2;

              case 59:
                return _context.finish(56);

              case 60:
                return _context.finish(53);

              case 61:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this, [[3, 17, 21, 29], [22,, 24, 28], [33, 49, 53, 61], [54,, 56, 60]]);
      }));

      function updateRemoteRefs(_x) {
        return _ref2.apply(this, arguments);
      }

      return updateRemoteRefs;
    }() /*: {
        gitdir: string,
        remote: string,
        refs: Map<string, string>
        } */

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

        var headers, res, data, read$$1, lineOne, lineTwo, _lineTwo$toString$tri, _lineTwo$toString$tri2, firstRef, capabilities, _firstRef$split, _firstRef$split2, ref, name, line, _line$toString$trim$s, _line$toString$trim$s2, _ref4, _name;

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
                read$$1 = models_js.GitPktLine.reader(data);
                lineOne = read$$1();
                // skip past any flushes

                while (lineOne === null) {
                  lineOne = read$$1();
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
                lineTwo = read$$1();
                // skip past any flushes

                while (lineTwo === null) {
                  lineTwo = read$$1();
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
                

                line = read$$1();

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
        var headers, res, read$$1, packetlines, packfile, progress, nextBit;
        return _regeneratorRuntime.wrap(function _callee7$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                headers = {};

                headers['content-type'] = 'application/x-' + service + '-request';
                headers['accept'] = 'application/x-' + service + '-result';
                headers['user-agent'] = 'git/' + utils_js.pkg.name + '@' + utils_js.pkg.version;
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
                read$$1 = models_js.GitPktLine.streamReader(res);
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
                            return read$$1();

                          case 2:
                            line = _context6.sent;

                            if (!(line === null)) {
                              _context6.next = 8;
                              break;
                            }

                            packetlines.end();
                            progress.end();
                            packfile.end();
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
                            packetlines.write(line.slice(0));

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
        service: string
        } */

  }]);

  return GitRemoteHTTP;
}();

exports.GitConfigManager = GitConfigManager;
exports.GitShallowManager = GitShallowManager;
exports.GitIndexManager = GitIndexManager;
exports.GitObjectManager = GitObjectManager;
exports.GitRefsManager = GitRefsManager;
exports.GitRemoteHTTP = GitRemoteHTTP;
