'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var _regeneratorRuntime = _interopDefault(require('babel-runtime/regenerator'));
var _asyncToGenerator = _interopDefault(require('babel-runtime/helpers/asyncToGenerator'));
var path = _interopDefault(require('path'));
var pify = _interopDefault(require('pify'));
var managers_js = require('./managers.js');
var utils_js = require('./utils.js');
var _getIterator = _interopDefault(require('babel-runtime/core-js/get-iterator'));
var models_js = require('./models.js');
var stream = _interopDefault(require('stream'));
var thru = _interopDefault(require('thru'));
var _Map = _interopDefault(require('babel-runtime/core-js/map'));
var _Promise = _interopDefault(require('babel-runtime/core-js/promise'));
var buffer = require('buffer');
var listpack = _interopDefault(require('git-list-pack'));
var peek = _interopDefault(require('buffer-peek-stream'));
var applyDelta = _interopDefault(require('git-apply-delta'));
var _extends = _interopDefault(require('babel-runtime/helpers/extends'));
var simpleGet = _interopDefault(require('simple-get'));
var concat = _interopDefault(require('simple-concat'));
var parseLinkHeader = _interopDefault(require('parse-link-header'));
var _Set = _interopDefault(require('babel-runtime/core-js/set'));
var pad = _interopDefault(require('pad'));
var pako = _interopDefault(require('pako'));
var crypto = _interopDefault(require('crypto'));
var _toConsumableArray = _interopDefault(require('babel-runtime/helpers/toConsumableArray'));
var openpgp_min_js = require('openpgp/dist/openpgp.min.js');

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
            return utils_js.read(path.join(workdir, filepath));

          case 3:
            object = _context2.sent;

            if (!(object === null)) {
              _context2.next = 6;
              break;
            }

            throw new Error('Could not read file \'' + filepath + '\'');

          case 6:
            _context2.next = 8;
            return managers_js.GitObjectManager.write({ gitdir: gitdir, type: type, object: object });

          case 8:
            oid = _context2.sent;
            _context2.next = 11;
            return managers_js.GitIndexManager.acquire(gitdir + '/index', function () {
              var _ref3 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee(index) {
                var stats;
                return _regeneratorRuntime.wrap(function _callee$(_context) {
                  while (1) {
                    switch (_context.prev = _context.next) {
                      case 0:
                        _context.next = 2;
                        return pify(utils_js.fs().lstat)(path.join(workdir, filepath));

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
        index = _ref.index,
        dirpath = _ref.dirpath,
        tree = _ref.tree;

    var _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, entry, _ref3, type, object, entrypath, stats, _tree;

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
              _context.next = 31;
              break;
            }

            entry = _step.value;
            _context.next = 9;
            return managers_js.GitObjectManager.read({
              gitdir: gitdir,
              oid: entry.oid
            });

          case 9:
            _ref3 = _context.sent;
            type = _ref3.type;
            object = _ref3.object;
            entrypath = dirpath + '/' + entry.path;
            _context.t0 = type;
            _context.next = _context.t0 === 'blob' ? 16 : _context.t0 === 'tree' ? 23 : 27;
            break;

          case 16:
            _context.next = 18;
            return utils_js.write(entrypath, object);

          case 18:
            _context.next = 20;
            return pify(utils_js.fs().lstat)(entrypath);

          case 20:
            stats = _context.sent;

            index.insert({ filepath: entrypath, stats: stats, oid: entry.oid });
            return _context.abrupt('break', 28);

          case 23:
            _tree = models_js.GitTree.from(object);
            _context.next = 26;
            return writeTreeToDisk({ gitdir: gitdir, index: index, dirpath: entrypath, tree: _tree });

          case 26:
            return _context.abrupt('break', 28);

          case 27:
            throw new Error('Unexpected object type ' + type + ' found in tree for \'' + dirpath + '\'');

          case 28:
            _iteratorNormalCompletion = true;
            _context.next = 5;
            break;

          case 31:
            _context.next = 37;
            break;

          case 33:
            _context.prev = 33;
            _context.t1 = _context['catch'](3);
            _didIteratorError = true;
            _iteratorError = _context.t1;

          case 37:
            _context.prev = 37;
            _context.prev = 38;

            if (!_iteratorNormalCompletion && _iterator.return) {
              _iterator.return();
            }

          case 40:
            _context.prev = 40;

            if (!_didIteratorError) {
              _context.next = 43;
              break;
            }

            throw _iteratorError;

          case 43:
            return _context.finish(40);

          case 44:
            return _context.finish(37);

          case 45:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this, [[3, 33, 37, 45], [38,, 40, 44]]);
  }));

  return function writeTreeToDisk(_x) {
    return _ref2.apply(this, arguments);
  };
}();

var checkout = function () {
  var _ref5 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee3(_ref4) {
    var workdir = _ref4.workdir,
        gitdir = _ref4.gitdir,
        remote = _ref4.remote,
        ref = _ref4.ref;

    var oid, commit, comm, sha, _ref6, type, object, tree;

    return _regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            // Get tree oid
            oid = void 0;
            _context3.prev = 1;
            _context3.next = 4;
            return utils_js.resolveRef({ gitdir: gitdir, ref: ref });

          case 4:
            oid = _context3.sent;
            _context3.next = 14;
            break;

          case 7:
            _context3.prev = 7;
            _context3.t0 = _context3['catch'](1);
            _context3.next = 11;
            return utils_js.resolveRef({ gitdir: gitdir, ref: remote + '/' + ref });

          case 11:
            oid = _context3.sent;
            _context3.next = 14;
            return utils_js.write(gitdir + '/refs/heads/' + ref, oid + '\n');

          case 14:
            _context3.next = 16;
            return managers_js.GitObjectManager.read({ gitdir: gitdir, oid: oid });

          case 16:
            commit = _context3.sent;

            if (!(commit.type !== 'commit')) {
              _context3.next = 19;
              break;
            }

            throw new Error('Unexpected type: ' + commit.type);

          case 19:
            comm = models_js.GitCommit.from(commit.object.toString('utf8'));
            sha = comm.headers().tree;
            // Get top-level tree

            _context3.next = 23;
            return managers_js.GitObjectManager.read({ gitdir: gitdir, oid: sha });

          case 23:
            _ref6 = _context3.sent;
            type = _ref6.type;
            object = _ref6.object;

            if (!(type !== 'tree')) {
              _context3.next = 28;
              break;
            }

            throw new Error('Unexpected type: ' + type);

          case 28:
            tree = models_js.GitTree.from(object);
            // Acquire a lock on the index

            _context3.next = 31;
            return managers_js.GitIndexManager.acquire(gitdir + '/index', function () {
              var _ref7 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee2(index) {
                return _regeneratorRuntime.wrap(function _callee2$(_context2) {
                  while (1) {
                    switch (_context2.prev = _context2.next) {
                      case 0:
                        index.clear();
                        // Write files. TODO: Write them atomically
                        _context2.next = 3;
                        return writeTreeToDisk({ gitdir: gitdir, index: index, dirpath: workdir, tree: tree });

                      case 3:
                        // Update HEAD TODO: Handle non-branch cases
                        utils_js.write(gitdir + '/HEAD', 'ref: refs/heads/' + ref);

                      case 4:
                      case 'end':
                        return _context2.stop();
                    }
                  }
                }, _callee2, this);
              }));

              return function (_x3) {
                return _ref7.apply(this, arguments);
              };
            }());

          case 31:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, this, [[1, 7]]);
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
            tree = models_js.GitTree.from(entries);
            _context.next = 34;
            return managers_js.GitObjectManager.write({
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
        message = _ref3.message,
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
            return managers_js.GitIndexManager.acquire(gitdir + '/index', function () {
              var _ref5 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee2(index) {
                var inode, treeRef, parents, parent, comm, branch;
                return _regeneratorRuntime.wrap(function _callee2$(_context2) {
                  while (1) {
                    switch (_context2.prev = _context2.next) {
                      case 0:
                        inode = utils_js.flatFileListToDirectoryStructure(index.entries);
                        _context2.next = 3;
                        return constructTree({ gitdir: gitdir, inode: inode });

                      case 3:
                        treeRef = _context2.sent;
                        parents = void 0;
                        _context2.prev = 5;
                        _context2.next = 8;
                        return utils_js.resolveRef({ gitdir: gitdir, ref: 'HEAD' });

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
                        comm = models_js.GitCommit.from({
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
                          message: message
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
                        return managers_js.GitObjectManager.write({
                          gitdir: gitdir,
                          type: 'commit',
                          object: comm.toObject()
                        });

                      case 22:
                        oid = _context2.sent;
                        _context2.next = 25;
                        return utils_js.resolveRef({ gitdir: gitdir, ref: 'HEAD', depth: 2 });

                      case 25:
                        branch = _context2.sent;
                        _context2.next = 28;
                        return utils_js.write(path.join(gitdir, branch), oid + '\n');

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
            return managers_js.GitConfigManager.get({ gitdir: gitdir });

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

                            oid = buffer.Buffer.from(reference).toString('hex');
                            _context.prev = 3;
                            _context.next = 6;
                            return managers_js.GitObjectManager.read({
                              gitdir: gitdir,
                              oid: oid
                            });

                          case 6:
                            _ref5 = _context.sent;
                            object = _ref5.object;
                            _type = _ref5.type;
                            result = applyDelta(data, object);
                            _context.next = 12;
                            return managers_js.GitObjectManager.write({
                              gitdir: gitdir,
                              type: _type,
                              object: result
                            });

                          case 12:
                            newoid = _context.sent;

                            // console.log(`${type} ${newoid} ref-delta ${oid}`)
                            offsetMap.set(offset, newoid);
                            _context.next = 19;
                            break;

                          case 16:
                            _context.prev = 16;
                            _context.t0 = _context['catch'](3);
                            throw new Error('Could not find object ' + reference + ' ' + oid + ' that is referenced by a ref-delta object in packfile at byte offset ' + offset + '.');

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
                            return managers_js.GitObjectManager.read({
                              gitdir: gitdir,
                              oid: referenceOid
                            });

                          case 26:
                            _ref6 = _context.sent;
                            _type2 = _ref6.type;
                            _object = _ref6.object;
                            _result = applyDelta(data, _object);
                            _context.next = 32;
                            return managers_js.GitObjectManager.write({
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
                            return managers_js.GitObjectManager.write({
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
  var _ref2 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee2(_ref) {
    var _this = this;

    var gitdir = _ref.gitdir,
        _ref$ref = _ref.ref,
        ref = _ref$ref === undefined ? 'HEAD' : _ref$ref,
        remote = _ref.remote,
        auth = _ref.auth,
        _ref$depth = _ref.depth,
        depth = _ref$depth === undefined ? 0 : _ref$depth;

    var url, remoteHTTP, want, capabilities, packstream, oids, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, oid, have, response;

    return _regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.next = 2;
            return getConfig({
              gitdir: gitdir,
              path: 'remote.' + remote + '.url'
            });

          case 2:
            url = _context2.sent;
            remoteHTTP = new managers_js.GitRemoteHTTP(url);

            remoteHTTP.auth = auth;
            _context2.next = 7;
            return remoteHTTP.preparePull();

          case 7:
            if (!(depth > 0 && !remoteHTTP.capabilities.has('shallow'))) {
              _context2.next = 9;
              break;
            }

            throw new Error('Remote does not support shallow fetching');

          case 9:
            _context2.next = 11;
            return managers_js.GitRefsManager.updateRemoteRefs({
              gitdir: gitdir,
              remote: remote,
              refs: remoteHTTP.refs
            });

          case 11:
            want = remoteHTTP.refs.get(ref);
            // Note: I removed "ofs-delta" from the capabilities list and now
            // Github uses all ref-deltas when I fetch packfiles instead of all ofs-deltas. Nice!

            capabilities = 'multi_ack_detailed no-done side-band-64k thin-pack agent=git/' + utils_js.pkg.name + '@' + utils_js.pkg.version;
            packstream = new stream.PassThrough();

            packstream.write(models_js.GitPktLine.encode('want ' + want + ' ' + capabilities + '\n'));
            _context2.next = 17;
            return managers_js.GitShallowManager.read({ gitdir: gitdir });

          case 17:
            oids = _context2.sent;

            if (!(oids.size > 0 && remoteHTTP.capabilities.has('shallow'))) {
              _context2.next = 38;
              break;
            }

            _iteratorNormalCompletion = true;
            _didIteratorError = false;
            _iteratorError = undefined;
            _context2.prev = 22;

            for (_iterator = _getIterator(oids); !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
              oid = _step.value;

              packstream.write(models_js.GitPktLine.encode('shallow ' + oid + '\n'));
            }
            _context2.next = 30;
            break;

          case 26:
            _context2.prev = 26;
            _context2.t0 = _context2['catch'](22);
            _didIteratorError = true;
            _iteratorError = _context2.t0;

          case 30:
            _context2.prev = 30;
            _context2.prev = 31;

            if (!_iteratorNormalCompletion && _iterator.return) {
              _iterator.return();
            }

          case 33:
            _context2.prev = 33;

            if (!_didIteratorError) {
              _context2.next = 36;
              break;
            }

            throw _iteratorError;

          case 36:
            return _context2.finish(33);

          case 37:
            return _context2.finish(30);

          case 38:
            if (depth !== 0) {
              packstream.write(models_js.GitPktLine.encode('deepen ' + parseInt(depth) + '\n'));
            }
            packstream.write(models_js.GitPktLine.flush());
            have = null;
            _context2.prev = 41;
            _context2.next = 44;
            return utils_js.resolveRef({ gitdir: gitdir, ref: ref });

          case 44:
            have = _context2.sent;
            _context2.next = 50;
            break;

          case 47:
            _context2.prev = 47;
            _context2.t1 = _context2['catch'](41);

            console.log("Looks like we don't have that ref yet.");

          case 50:
            if (have) {
              packstream.write(models_js.GitPktLine.encode('have ' + have + '\n'));
              packstream.write(models_js.GitPktLine.flush());
            }
            packstream.end(models_js.GitPktLine.encode('done\n'));
            _context2.next = 54;
            return remoteHTTP.pull(packstream);

          case 54:
            response = _context2.sent;

            response.packetlines.pipe(thru(function () {
              var _ref3 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee(data, next) {
                var line, _oid, _oid2;

                return _regeneratorRuntime.wrap(function _callee$(_context) {
                  while (1) {
                    switch (_context.prev = _context.next) {
                      case 0:
                        line = data.toString('utf8');

                        if (!line.startsWith('shallow')) {
                          _context.next = 10;
                          break;
                        }

                        _oid = line.slice(-41).trim();

                        if (!(_oid.length !== 40)) {
                          _context.next = 5;
                          break;
                        }

                        throw new Error('non-40 character \'shallow\' oid: ' + _oid);

                      case 5:
                        oids.add(_oid);
                        _context.next = 8;
                        return managers_js.GitShallowManager.write({ gitdir: gitdir, oids: oids });

                      case 8:
                        _context.next = 17;
                        break;

                      case 10:
                        if (!line.startsWith('unshallow')) {
                          _context.next = 17;
                          break;
                        }

                        _oid2 = line.slice(-41).trim();

                        if (!(_oid2.length !== 40)) {
                          _context.next = 14;
                          break;
                        }

                        throw new Error('non-40 character \'shallow\' oid: ' + _oid2);

                      case 14:
                        oids.delete(_oid2);
                        _context.next = 17;
                        return managers_js.GitShallowManager.write({ gitdir: gitdir, oids: oids });

                      case 17:
                        next(null, data);

                      case 18:
                      case 'end':
                        return _context.stop();
                    }
                  }
                }, _callee, _this);
              }));

              return function (_x2, _x3) {
                return _ref3.apply(this, arguments);
              };
            }()));
            return _context2.abrupt('return', response);

          case 57:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, this, [[22, 26, 30, 38], [31,, 33, 37], [41, 47]]);
  }));

  return function fetchPackfile(_x) {
    return _ref2.apply(this, arguments);
  };
}();

var fetch = function () {
  var _ref5 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee3(_ref4) {
    var gitdir = _ref4.gitdir,
        _ref4$ref = _ref4.ref,
        ref = _ref4$ref === undefined ? 'HEAD' : _ref4$ref,
        remote = _ref4.remote,
        auth = _ref4.auth,
        _ref4$depth = _ref4.depth,
        depth = _ref4$depth === undefined ? 0 : _ref4$depth;
    var response;
    return _regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _context3.next = 2;
            return fetchPackfile({ gitdir: gitdir, ref: ref, remote: remote, auth: auth, depth: depth });

          case 2:
            response = _context3.sent;

            response.progress.on('data', function (data) {
              return console.log(data.toString('utf8'));
            });
            _context3.next = 6;
            return unpack({ gitdir: gitdir, inputStream: response.packfile });

          case 6:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, this);
  }));

  return function fetch(_x4) {
    return _ref5.apply(this, arguments);
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
                return utils_js.write(gitdir + '/refs/remotes/' + remote + '/' + branch.name, branch.commit.sha + '\n', { encoding: 'utf8' });
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
                  utils_js.write(gitdir + '/refs/tags/' + tag.name, tag.commit.sha + '\n', {
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
            comm = models_js.GitCommit.fromPayloadSignature({
              payload: commit.commit.verification.payload,
              signature: commit.commit.verification.signature
            });

            console.log('Created commit', comm);
            _context4.next = 23;
            return managers_js.GitObjectManager.write({
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
            tree = new models_js.GitTree(json.tree);
            _context6.next = 6;
            return managers_js.GitObjectManager.write({
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
            return managers_js.GitObjectManager.write({
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
            return utils_js.resolveRef({ gitdir: gitdir, ref: remote + '/' + ref });

          case 17:
            oid = _context8.sent;
            _context8.next = 20;
            return managers_js.GitObjectManager.read({ gitdir: gitdir, oid: oid });

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
            comm = models_js.GitCommit.from(object.toString('utf8'));
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
            return utils_js.mkdirs(folders);

          case 4:
            _context.next = 6;
            return utils_js.write(gitdir + '/config', '[core]\n' + '\trepositoryformatversion = 0\n' + '\tfilemode = false\n' + '\tbare = false\n' + '\tlogallrefupdates = true\n' + '\tsymlinks = false\n' + '\tignorecase = true\n');

          case 6:
            _context.next = 8;
            return utils_js.write(gitdir + '/HEAD', 'ref: refs/heads/master\n');

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
            return managers_js.GitIndexManager.acquire(gitdir + '/index', function () {
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
                return managers_js.GitObjectManager.read({ gitdir: gitdir, oid: oid });

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
                commit = models_js.GitCommit.from(object);
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
            return utils_js.resolveRef({ gitdir: gitdir, ref: ref });

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
            return utils_js.resolveRef({ gitdir: gitdir, ref: _ref3 });

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
                return managers_js.GitObjectManager.read({ gitdir: gitdir, oid: oid });

              case 3:
                _ref4 = _context.sent;
                type = _ref4.type;
                object = _ref4.object;

                if (!(type === 'commit')) {
                  _context.next = 13;
                  break;
                }

                commit = models_js.GitCommit.from(object);
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

                _tree = models_js.GitTree.from(object);
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

    var hash, stream$$1, write$$1, writeObject, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, oid, _ref4, type, object, digest;

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
              write$$1(byte, 'hex');
              // Now we keep chopping away at length 7-bits at a time until its zero,
              // writing out the bytes in what amounts to little-endian order.
              while (multibyte) {
                multibyte = length > 127 ? 128 : 0;
                byte = multibyte | length & 127;
                write$$1(pad(2, byte.toString(16), '0'), 'hex');
                length = length >>> 7;
              }
              // Lastly, we can compress and write the object.
              write$$1(buffer.Buffer.from(pako.deflate(object)));
            };

            write$$1 = function write$$1(chunk, enc) {
              stream$$1.write(chunk, enc);
              hash.update(chunk, enc);
            };

            hash = crypto.createHash('sha1');
            stream$$1 = outputStream;


            write$$1('PACK');
            write$$1('00000002', 'hex');
            // Write a 4 byte (32-bit) int
            write$$1(pad(8, oids.length.toString(16), '0'), 'hex');
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
            return managers_js.GitObjectManager.read({ gitdir: gitdir, oid: oid });

          case 16:
            _ref4 = _context.sent;
            type = _ref4.type;
            object = _ref4.object;

            writeObject({ write: write$$1, object: object, stype: type });

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
            return utils_js.resolveRef({ gitdir: gitdir, ref: ref });

          case 2:
            oid = _context.sent;
            remote = new managers_js.GitRemoteHTTP(url);

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
            packstream = new stream.PassThrough();
            oldoid = remote.refs.get(ref) || '0000000000000000000000000000000000000000';

            packstream.write(models_js.GitPktLine.encode(oldoid + ' ' + oid + ' ' + ref + '\0 report-status\n'));
            packstream.write(models_js.GitPktLine.flush());
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
            return managers_js.GitIndexManager.acquire(gitdir + '/index', function () {
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
            return managers_js.GitConfigManager.get({ gitdir: gitdir });

          case 2:
            config = _context.sent;
            _context.next = 5;
            return config.set(path$$1, value);

          case 5:
            _context.next = 7;
            return managers_js.GitConfigManager.save({ gitdir: gitdir, config: config });

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

var HttpKeyServer = new openpgp_min_js.HKP();

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
            return utils_js.resolveRef({ gitdir: gitdir, ref: ref });

          case 2:
            oid = _context.sent;
            _context.next = 5;
            return managers_js.GitObjectManager.read({ gitdir: gitdir, oid: oid });

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
            commit = models_js.GitCommit.from(object);
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

exports.add = add;
exports.checkout = checkout;
exports.commit = commit;
exports.fetch = fetch;
exports.GithubFetch = GithubFetch;
exports.getConfig = getConfig;
exports.init = init;
exports.list = list;
exports.listCommits = listCommits;
exports.listObjects = listObjects;
exports.pack = pack;
exports.push = push;
exports.remove = remove;
exports.setConfig = setConfig;
exports.unpack = unpack;
exports.verify = verify;
