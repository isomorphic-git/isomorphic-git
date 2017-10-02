import systemfs from 'fs';
import pify from 'pify';
import path from 'path';

var fs = function () {
  return global.fs || systemfs;
};

async function rm(filepath) {
  try {
    await pify(fs().unlink)(filepath);
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
}

// An async exists variant
async function exists(file, options) {
  return new Promise(function (resolve, reject) {
    fs().stat(file, (err, stats) => {
      if (err) return err.code === 'ENOENT' ? resolve(false) : reject(err);
      resolve(true);
    });
  });
}

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

async function sleep(ms) {
  return new Promise((resolve, reject) => setTimeout(resolve, ms));
}

// @flow
// This is modeled after the lockfile strategy used by the git source code.
const delayedReleases = new Map();

async function lock(filename /*: string */
, triesLeft /*: number */ = 3) {
  // check to see if we still have it
  if (delayedReleases.has(filename)) {
    clearTimeout(delayedReleases.get(filename));
    delayedReleases.delete(filename);
    return;
  }
  if (triesLeft === 0) {
    throw new Error(`Unable to acquire lockfile '${filename}'. Exhausted tries.`);
  }
  try {
    await pify(fs().mkdir)(`${filename}.lock`);
  } catch (err) {
    if (err.code === 'EEXIST') {
      await sleep(100);
      await lock(filename, triesLeft - 1);
    }
  }
}

async function unlock(filename /*: string */
, delayRelease /*: number */ = 50) {
  if (delayedReleases.has(filename)) {
    throw new Error('Cannot double-release lockfile');
  }
  // Basically, we lie and say it was deleted ASAP.
  // But really we wait a bit to see if you want to acquire it again.
  delayedReleases.set(filename, setTimeout(async () => {
    delayedReleases.delete(filename);
    await pify(fs().rmdir)(`${filename}.lock`);
  }));
}

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

// An async readFile variant that returns null instead of throwing errors
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
// An async writeFile variant that automatically creates missing directories,
// and returns null instead of throwing errors.
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

export { rm, exists, flatFileListToDirectoryStructure, fs, lock, unlock, mkdirs, read, resolveRef, sleep, write, _package$1 as pkg };
