'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var _regeneratorRuntime = _interopDefault(require('babel-runtime/regenerator'));
var _asyncToGenerator = _interopDefault(require('babel-runtime/helpers/asyncToGenerator'));
var _classCallCheck = _interopDefault(require('babel-runtime/helpers/classCallCheck'));
var _createClass = _interopDefault(require('babel-runtime/helpers/createClass'));
var ghurl = _interopDefault(require('github-url-to-object'));
var commands_js = require('./commands.js');

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
    this.operateDepth = 0;
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
    key: 'depth',
    value: function depth(_depth) {
      this.operateDepth = parseInt(_depth);
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
    value: function outputStream(stream) {
      this.outputStream = stream;
      return this;
    }
  }, {
    key: 'inputStream',
    value: function inputStream(stream) {
      this.inputStream = stream;
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
                return commands_js.init(this.gitdir);

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
                params.depth = this.operateDepth;
                _context2.next = 8;
                return commands_js.fetch(params);

              case 8:
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
                return commands_js.checkout({
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
                return commands_js.init(this.gitdir);

              case 2:
                _context4.next = 4;
                return commands_js.GithubFetch({
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
                return commands_js.checkout({
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
                return _context5.abrupt('return', commands_js.list({
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
                return _context6.abrupt('return', commands_js.add({
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
                return _context7.abrupt('return', commands_js.remove({
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
      var _ref8 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee8(message) {
        return _regeneratorRuntime.wrap(function _callee8$(_context8) {
          while (1) {
            switch (_context8.prev = _context8.next) {
              case 0:
                _context8.t0 = commands_js.commit;
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
                _context8.t16 = message;
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
                return _context9.abrupt('return', commands_js.verify({
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
                return _context10.abrupt('return', commands_js.pack({
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
                return _context11.abrupt('return', commands_js.unpack({
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
                return commands_js.getConfig({
                  gitdir: this.gitdir,
                  path: 'remote.' + this.operateRemote + '.url'
                });

              case 2:
                url = _context12.sent;

                console.log('url =', url);
                return _context12.abrupt('return', commands_js.push({
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
                return _context13.abrupt('return', commands_js.fetch(params));

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
      var _ref14 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee14(path) {
        return _regeneratorRuntime.wrap(function _callee14$(_context14) {
          while (1) {
            switch (_context14.prev = _context14.next) {
              case 0:
                return _context14.abrupt('return', commands_js.getConfig({
                  gitdir: this.gitdir,
                  path: path
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
      var _ref15 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee15(path, value) {
        return _regeneratorRuntime.wrap(function _callee15$(_context15) {
          while (1) {
            switch (_context15.prev = _context15.next) {
              case 0:
                return _context15.abrupt('return', commands_js.setConfig({
                  gitdir: this.gitdir,
                  path: path,
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
