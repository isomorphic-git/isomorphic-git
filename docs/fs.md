---
title: fs
sidebar_label: fs
---

You need to pass a file system into `isomorphic-git` functions that do anything that involves files (which is most things in git).

In Node, you can pass the builtin `fs` module.
In the browser it's more involved because there's no standard 'fs' module.
But you can use any module that implements enough of the `fs` API.


## Node's fs

If you're only using isomorphic-git in Node, you can just use the native `fs` module:

```js
const git = require('isomorphic-git');
const fs = require('fs');
const files = await git.listFiles({ fs, dir: __dirname });
console.log(files)
```

## LightningFS

If you are writing code for the browser, you will need something that emulates the `fs` API.
While BrowserFS (see next section) has more features, [LightningFS](https://github.com/isomorphic-git/lightning-fs) might very well fit your needs.
It was designed from scratch for `isomorphic-git` (by the same author) to eek out more performance
for fewer bytes. As an added bonus it's dead simple to configure.

```html
<script src="https://unpkg.com/@isomorphic-git/lightning-fs"></script>
<script src="https://unpkg.com/isomorphic-git"></script>
<script>
const fs = new LightningFS('my-app')
const files = git.listFiles({ fs, dir: '/' });
console.log(files);
</script>
```

You can configure LightningFS to load files from an HTTP server as well, which makes it easy to prepopulate a browser file system
with a directory on your server. See the LightningFS documentation for an example of how to do this.

## BrowserFS

At the time of writing, the most complete option is [BrowserFS](https://github.com/jvilk/BrowserFS).
It has a few more steps involved to set up than in Node, as seen below:

```html
<script src="https://unpkg.com/browserfs@beta"></script>
<script src="https://unpkg.com/isomorphic-git"></script>
<script>
BrowserFS.configure({ fs: "IndexedDB", options: {} }, function (err) {
  if (err) return console.log(err);
  const fs = BrowserFS.BFSRequire("fs");
  const files = git.listFiles({ fs dir: '/' });
  console.log(files);
});
</script>
```

Besides IndexedDB, BrowserFS supports many different backends with different performance characteristics (some backends support sync operations, some only async), as well as different features such as proxying a static file server as a read-only file system, mounting ZIP files as file systems, or overlaying a writeable in-memory filesystem on top of a read-only filesystem.
You don't need to know all these features, but familiarizing yourself with the different options may be necessary if you hit a storage limit or performance bottleneck in the IndexedDB backend I suggested above.

An [advanced example usage](https://github.com/isomorphic-git/isomorphic-git/blob/53f2e909030adb1c6ae855b14f3a2474ca93ce71/__tests__/__helpers__/FixtureFS.js#L12) is in the old unit tests for isomorphic-git.
It uses HTTPRequestFS to mount (read-only) the test fixtures directory which is stored on the server, then adds a read-write InMemoryFS layer using OverlayFS so that the tests can modify files locally.
In between tests it empties the InMemoryFS, restoring the file system to a pristine state.
The current unit tests use LightningFS instead, which was built with this HTTP-backed overlay behavior by default, because I find it so useful.


# Implementing your own `fs`

There are actually TWO possible interfaces for an `fs` object: the classic "callback" API and the newer "promise" API. If your `fs` object provides an enumerable `promises` property, `isomorphic-git` will use the "promise" API _exclusively_.

## Using the "callback" API

A "callback" `fs` object must implement the following subset of node's `fs` module:

  - [fs.readFile(path[, options], callback)](https://nodejs.org/api/fs.html#fs_fs_readfile_path_options_callback)
  - [fs.writeFile(file, data[, options], callback)](https://nodejs.org/api/fs.html#fs_fs_writefile_file_data_options_callback)
  - [fs.unlink(path, callback)](https://nodejs.org/api/fs.html#fs_fs_unlink_path_callback)
  - [fs.readdir(path[, options], callback)](https://nodejs.org/api/fs.html#fs_fs_readdir_path_options_callback)
  - [fs.mkdir(path[, mode], callback)](https://nodejs.org/api/fs.html#fs_fs_mkdir_path_mode_callback)
  - [fs.rmdir(path, callback)](https://nodejs.org/api/fs.html#fs_fs_rmdir_path_callback)
  - [fs.stat(path[, options], callback)](https://nodejs.org/api/fs.html#fs_fs_stat_path_options_callback)
  - [fs.lstat(path[, options], callback)](https://nodejs.org/api/fs.html#fs_fs_lstat_path_options_callback)
  - [fs.readlink(path[, options], callback)](https://nodejs.org/api/fs.html#fs_fs_readlink_path_options_callback) (optional [¹](#footnote-1))
  - [fs.symlink(target, path[, type], callback)](https://nodejs.org/api/fs.html#fs_fs_symlink_target_path_type_callback) (optional [¹](#footnote-1))
  - [fs.chmod(path, mode, callback)](https://nodejs.org/api/fs.html#fs_fs_chmod_path_mode_callback) (optional [²](#footnote-2))
  - [fs.rm(path[, options], callback)](https://nodejs.org/api/fs.html#fs_fs_rm_path_options_callback) (optional [³](#footnote-3))

Internally, `isomorphic-git` wraps the provided "callback" API functions using [`pify`](https://www.npmjs.com/package/pify).

As of node v12 the `fs.promises` API has been stabilized. (`lightning-fs` also provides a `fs.promises` API!) Nowadays, wrapping the callback functions
with `pify` is redundant and potentially less performant than using the native promisified versions. Plus, if you're writing your own `fs` implementation,
the `fs.promises` API lets you write straightforward implementations using `async / await` without the messy optional argument handling the callback API needs.
Therefore a second API is now supported...

## Using the "promise" API (preferred)

A "promise" `fs` object must implement the same set functions as a "callback" implementation, but it implements the promisified versions, and they should all be on a property called `promises`:

  - [fs.promises.readFile(path[, options])](https://nodejs.org/api/fs.html#fs_fspromises_readfile_path_options)
  - [fs.promises.writeFile(file, data[, options])](https://nodejs.org/api/fs.html#fs_fspromises_writefile_file_data_options)
  - [fs.promises.unlink(path)](https://nodejs.org/api/fs.html#fs_fspromises_unlink_path)
  - [fs.promises.readdir(path[, options])](https://nodejs.org/api/fs.html#fs_fspromises_readdir_path_options)
  - [fs.promises.mkdir(path[, mode])](https://nodejs.org/api/fs.html#fs_fspromises_mkdir_path_options)
  - [fs.promises.rmdir(path)](https://nodejs.org/api/fs.html#fs_fspromises_rmdir_path)
  - [fs.promises.stat(path[, options])](https://nodejs.org/api/fs.html#fs_fspromises_stat_path_options)
  - [fs.promises.lstat(path[, options])](https://nodejs.org/api/fs.html#fs_fspromises_lstat_path_options)
  - [fs.promises.readlink(path[, options])](https://nodejs.org/api/fs.html#fs_fspromises_readlink_path_options) (optional [¹](#footnote-1))
  - [fs.promises.symlink(target, path[, type])](https://nodejs.org/api/fs.html#fs_fspromises_symlink_target_path_type) (optional [¹](#footnote-1))
  - [fs.promises.chmod(path, mode)](https://nodejs.org/api/fs.html#fs_fspromises_chmod_path_mode) (optional [²](#footnote-2))
  - [fs.promises.rm(path[, options])](https://nodejs.org/api/fs.html#fs_fspromises_rm_path_options) (optional [³](#footnote-3))

---

<a id="footnote-1">¹</a> `readlink` and `symlink` are only needed to work with git repos that contain symlinks.

<a id="footnote-2">²</a> Right now, isomorphic-git rewrites the file if it needs to change its mode. In the future, if `chmod` is available it will use that.

<a id="footnote-3">³</a> Only called with `recursive: true` option. A fallback implementation is provided if not implemented.
