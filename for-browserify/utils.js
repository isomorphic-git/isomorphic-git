'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var _regeneratorRuntime = _interopDefault(require('babel-runtime/regenerator'));
var _asyncToGenerator = _interopDefault(require('babel-runtime/helpers/asyncToGenerator'));
var systemfs = _interopDefault(require('fs'));
var pify = _interopDefault(require('pify'));
var _Promise = _interopDefault(require('babel-runtime/core-js/promise'));
var _getIterator = _interopDefault(require('babel-runtime/core-js/get-iterator'));
var _Map = _interopDefault(require('babel-runtime/core-js/map'));
var path = _interopDefault(require('path'));

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
var version = "0.0.6";
var description = "Node library for interacting with git repositories, circa 2017";
var main = "dist/for-node/";
var browser = "dist/for-browserify/";
var module$1 = "dist/for-future/";
var bin = { "esgit": "./cli.js" };
var engines = { "node": ">=7.6.0" };
var scripts = { "format": "prettier-standard src/**/*.js test/**/*.js testling/**/*.js *.js", "lint": "standard src/**/*.js", "watch": "rollup -cw", "build": "npm-run-all -s build:rollup build:umd", "build:rollup": "rollup -c", "build:umd": "browserify --entry dist/for-browserify/index.js --standalone git | uglifyjs > dist/bundle.umd.min.js", "test": "npm-run-all -s build -p test:travis test:travis:karma", "test:travis": "npm-run-all -s test:travis:ava test:travis:nyc test:travis:codecov", "test:travis:ava": "ava", "test:travis:nyc": "nyc ava || echo 'nyc failed, no big deal'", "test:travis:codecov": "nyc report --reporter=lcov > coverage.lcov && codecov || echo 'codecov failed, no big deal'", "test:travis:karma": "karma start ci.karma.conf.js || echo 'saucelabs failed, no big deal'", "precommit": "npm run format" };
var repository = { "type": "git", "url": "git+https://github.com/wmhilton/esgit.git" };
var keywords = ["git"];
var author = "William Hilton <wmhilton@gmail.com>";
var license = "Unlicense";
var bugs = { "url": "https://github.com/wmhilton/esgit/issues" };
var homepage = "https://github.com/wmhilton/esgit#readme";
var files = ["dist", "cli.js"];
var dependencies = { "async-lock": "^1.0.0", "await-stream-ready": "^1.0.1", "babel-runtime": "^6.26.0", "buffer": "^5.0.7", "buffer-peek-stream": "^1.0.1", "buffercursor": "0.0.12", "gartal": "^1.1.2", "git-apply-delta": "0.0.7", "git-list-pack": "0.0.10", "github-url-to-object": "^4.0.2", "ini": "^1.3.4", "minimisted": "^2.0.0", "openpgp": "^2.5.10", "pad": "^1.1.0", "pako": "^1.0.5", "parse-link-header": "^1.0.1", "pify": "^3.0.0", "shasum": "^1.0.2", "simple-concat": "^1.0.0", "simple-get": "^2.7.0", "thru": "0.0.2" };
var devDependencies = { "ava": "^0.21.0", "babel-plugin-external-helpers": "^6.22.0", "babel-plugin-transform-es2015-modules-commonjs": "^6.24.1", "babel-plugin-transform-object-rest-spread": "^6.23.0", "babel-plugin-transform-runtime": "^6.23.0", "babel-preset-env": "^1.6.0", "babel-preset-flow": "^6.23.0", "ban-sensitive-files": "^1.9.0", "browserfs": "^1.4.3", "browserify": "^14.4.0", "browserify-shim": "^3.8.14", "codecov": "^2.3.0", "husky": "^0.14.3", "jsonfile": "^3.0.1", "karma": "^1.7.1", "karma-browserify": "^5.1.1", "karma-chrome-launcher": "^2.2.0", "karma-firefox-launcher": "^1.0.1", "karma-sauce-launcher": "^1.2.0", "karma-tap": "^3.1.1", "lodash": "^4.17.4", "ncp": "^2.0.0", "nock": "^9.0.17", "npm-run-all": "^4.1.1", "nyc": "^11.2.1", "parse-header-stream": "^1.1.1", "prettier-standard": "^6.0.0", "rollup": "^0.50.0", "rollup-plugin-babel": "^3.0.2", "rollup-plugin-json": "^2.3.0", "standard": "^10.0.3", "stream-equal": "^1.0.1", "tape": "^4.8.0", "temp": "^0.8.3", "uglify-es": "^3.1.2", "watchify": "^3.9.0" };
var ava = { "source": ["dist/for-node/*"] };
var browserify = { "transform": ["browserify-shim"] };
var testling = { "files": "testling/basic-test.js", "browsers": ["chrome/latest", "firefox/latest", "ie/latest"] };
var _package = {
	name: name,
	version: version,
	description: description,
	main: main,
	browser: browser,
	module: module$1,
	bin: bin,
	engines: engines,
	scripts: scripts,
	repository: repository,
	keywords: keywords,
	author: author,
	license: license,
	bugs: bugs,
	homepage: homepage,
	files: files,
	dependencies: dependencies,
	devDependencies: devDependencies,
	ava: ava,
	browserify: browserify,
	testling: testling,
	"browserify-shim": { "fs": "global:fs" }
};

var _package$1 = Object.freeze({
	name: name,
	version: version,
	description: description,
	main: main,
	browser: browser,
	module: module$1,
	bin: bin,
	engines: engines,
	scripts: scripts,
	repository: repository,
	keywords: keywords,
	author: author,
	license: license,
	bugs: bugs,
	homepage: homepage,
	files: files,
	dependencies: dependencies,
	devDependencies: devDependencies,
	ava: ava,
	browserify: browserify,
	testling: testling,
	default: _package
});

exports.rm = rm;
exports.exists = exists;
exports.flatFileListToDirectoryStructure = flatFileListToDirectoryStructure;
exports.fs = fs;
exports.lock = lock;
exports.unlock = unlock;
exports.mkdirs = mkdirs;
exports.read = read;
exports.resolveRef = resolveRef;
exports.sleep = sleep;
exports.write = write;
exports.pkg = _package$1;
