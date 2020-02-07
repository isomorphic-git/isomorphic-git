---
title: fs
sidebar_label: fs
---

You need to pass a file system into `isomorphic-git` functions that do anything that involves files (which is most things in git).

In Node, you can pass the builtin `fs` module.
In the browser it's more involved because there's no standard 'fs' module.
But you can use any module that implements enough of the `fs` API.

### Implementing your own `fs`

There are actually TWO possible interfaces for an `fs` object: the classic "callback" API and the newer "promise" API. If your `fs` object provides an enumerable `promises` property, `isomorphic-git` will use the "promise" API _exclusively_.

#### Using the "callback" API

A "callback" `fs` object must implement the following subset of node's `fs` module:

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
  - [fs.chmod(path, mode, callback)](https://nodejs.org/api/fs.html#fs_fs_chmod_path_mode_callback)

Internally, `isomorphic-git` wraps the provided "callback" API functions using [`pify`](https://www.npmjs.com/package/pify).

As of node v12 the `fs.promises` API has been stabilized. (`lightning-fs` also provides a `fs.promises` API!) Nowadays, wrapping the callback functions
with `pify` is redundant and potentially less performant than using the native promisified versions. Plus, if you're writing your own `fs` implementation,
the `fs.promises` API lets you write straightforward implementations using `async / await` without the messy optional argument handling the callback API needs.
Therefore a second API is now supported...

#### Using the "promise" API (preferred)

A "promise" `fs` object must implement the same set functions as a "callback" implementation, but it implements the promisified versions, and they should all be on a property called `promises`:

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
  - [fs.promises.chmod(path, mode)](https://nodejs.org/api/fs.html#fs_fspromises_chmod_path_mode)
