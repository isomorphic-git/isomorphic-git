---
title: 'fs' plugin
sidebar_label: fs
id: version-0.70.7-plugin_fs
original_id: plugin_fs
---

You need to initialize `isomorphic-git` with a file system before you can do pretty much anything.
Here is how:

```js
// Using require() in Node.js
const fs = require('fs')
const git = require('isomorphic-git')
git.plugins.set('fs', fs)

// using ES6 modules
import fs from 'fs'
import { plugins } from 'isomorphic-git'
plugins.set('fs', fs)
```

In the browser it's more involved because there's no standard 'fs' module.
Hop over to the [Browser QuickStart](./guide-browser.md) to see how that's done.

> Note: only one `fs` plugin can be registered at a time.

### Implementing your own `fs` plugin

There are actually TWO ways to implement an `fs` plugin: the classic "callback" API and the newer "promise" API. If your `fs` plugin object provides a `promises` property, `isomorphic-git` will use the "promise" API _exclusively_.

#### Using the "callback" API

A "callback" `fs` plugin must implement the following subset of node's `fs` module:
  - [fs.readFile(path[, options], callback)](https://nodejs.org/api/fs.html#fs_fs_readfile_path_options_callback)
  - [fs.writeFile(file, data[, options], callback)](https://nodejs.org/api/fs.html#fs_fs_writefile_file_data_options_callback)
  - [fs.unlink(path, callback)](https://nodejs.org/api/fs.html#fs_fs_unlink_path_callback)
  - [fs.readdir(path[, options], callback)](https://nodejs.org/api/fs.html#fs_fs_readdir_path_options_callback)
  - [fs.mkdir(path[, mode], callback)](https://nodejs.org/api/fs.html#fs_fs_mkdir_path_mode_callback)
  - [fs.rmdir(path, callback)](https://nodejs.org/api/fs.html#fs_fs_rmdir_path_callback)
  - [fs.stat(path[, options], callback)](https://nodejs.org/api/fs.html#fs_fs_stat_path_options_callback)
  - [fs.lstat(path[, options], callback)](https://nodejs.org/api/fs.html#fs_fs_lstat_path_options_callback)
  - [fs.readlink(path[, options], callback)](https://nodejs.org/api/fs.html#fs_fs_readlink_path_options_callback)
  - [fs.symlink(target, path[, type], callback)](https://nodejs.org/api/fs.html#fs_fs_symlink_target_path_type_callback)

Internally, `isomorphic-git` wraps the provided "callback" API functions using [`pify`](https://www.npmjs.com/package/pify).

As of node v12 the `fs.promises` API has been stabilized. (`lightning-fs` also provides a `fs.promises` API!) Nowadays, wrapping the callback functions
with `pify` is redundant and potentially less performant than using the native promisified versions. Plus, if you're writing your own `fs` plugin,
the `fs.promises` API lets you write straightforward implementations using `async / await` without the messy optional argument handling the callback API needs.
Therefore a second API is now supported...

#### Using the "promise" API (preferred)

A "promise" `fs` plugin must implement the same set functions as a "callback" plugin, but it implements the promisified versions, and they should all be on a property called `promises`:
  - [fs.promises.readFile(path[, options])](https://nodejs.org/api/fs.html#fs_fspromises_readfile_path_options)
  - [fs.promises.writeFile(file, data[, options])](https://nodejs.org/api/fs.html#fs_fspromises_writefile_file_data_options)
  - [fs.promises.unlink(path)](https://nodejs.org/api/fs.html#fs_fspromises_unlink_path)
  - [fs.promises.readdir(path[, options])](https://nodejs.org/api/fs.html#fs_fspromises_readdir_path_options)
  - [fs.promises.mkdir(path[, mode])](https://nodejs.org/api/fs.html#fs_fspromises_mkdir_path_options)
  - [fs.promises.rmdir(path)](https://nodejs.org/api/fs.html#fs_fspromises_rmdir_path)
  - [fs.promises.stat(path[, options])](https://nodejs.org/api/fs.html#fs_fspromises_stat_path_options)
  - [fs.promises.lstat(path[, options])](https://nodejs.org/api/fs.html#fs_fspromises_lstat_path_options)
  - [fs.promises.readlink(path[, options])](https://nodejs.org/api/fs.html#fs_fspromises_readlink_path_options)
  - [fs.promises.symlink(target, path[, type])](https://nodejs.org/api/fs.html#fs_fspromises_symlink_target_path_type)
