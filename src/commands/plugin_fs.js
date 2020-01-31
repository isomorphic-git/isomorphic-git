// @ts-check
import { cores } from '../utils/plugins.js'

/**
 *
 * @typedef {Object} GitFsPlugin
 * @property {function} readFile - https://nodejs.org/api/fs.html#fs_fs_readfile_path_options_callback
 * @property {function} writeFile - https://nodejs.org/api/fs.html#fs_fs_writefile_file_data_options_callback
 * @property {function} unlink - https://nodejs.org/api/fs.html#fs_fs_unlink_path_callback
 * @property {function} readdir - https://nodejs.org/api/fs.html#fs_fs_readdir_path_options_callback
 * @property {function} mkdir - https://nodejs.org/api/fs.html#fs_fs_mkdir_path_mode_callback
 * @property {function} rmdir - https://nodejs.org/api/fs.html#fs_fs_rmdir_path_callback
 * @property {function} stat - https://nodejs.org/api/fs.html#fs_fs_stat_path_options_callback
 * @property {function} lstat - https://nodejs.org/api/fs.html#fs_fs_lstat_path_options_callback
 * @property {function} [readlink] - https://nodejs.org/api/fs.html#fs_fs_readlink_path_options_callback
 * @property {function} [symlink] - https://nodejs.org/api/fs.html#fs_fs_symlink_target_path_type_callback
 * @property {function} [chmod] - https://nodejs.org/api/fs.html#fs_fs_chmod_path_mode_callback
 */

/**
 *
 * @typedef {Object} GitFsPromisesPlugin
 * @property {Object} promises
 * @property {function} promises.readFile - https://nodejs.org/api/fs.html#fs_fspromises_readfile_path_options
 * @property {function} promises.writeFile - https://nodejs.org/api/fs.html#fs_fspromises_writefile_file_data_options
 * @property {function} promises.unlink - https://nodejs.org/api/fs.html#fs_fspromises_unlink_path
 * @property {function} promises.readdir - https://nodejs.org/api/fs.html#fs_fspromises_readdir_path_options
 * @property {function} promises.mkdir - https://nodejs.org/api/fs.html#fs_fspromises_mkdir_path_options
 * @property {function} promises.rmdir - https://nodejs.org/api/fs.html#fs_fspromises_rmdir_path
 * @property {function} promises.stat - https://nodejs.org/api/fs.html#fs_fspromises_stat_path_options
 * @property {function} promises.lstat - https://nodejs.org/api/fs.html#fs_fspromises_lstat_path_options
 * @property {function} [promises.readlink] - https://nodejs.org/api/fs.html#fs_fspromises_readlink_path_options
 * @property {function} [promises.symlink] - https://nodejs.org/api/fs.html#fs_fspromises_symlink_target_path_type
 * @property {function} [promises.chmod] - https://nodejs.org/api/fs.html#fs_fspromises_chmod_path_mode
 */

/**
 * A plugin for interfacing with a file system.
 *
 * You need to initialize `isomorphic-git` with a file system before you can do pretty much anything.
 * Here is how:
 *
 * ```js
 * // Using require() in Node.js
 * const fs = require('fs')
 * const git = require('isomorphic-git')
 * git.plugins.fs(fs)
 *
 * // using ES6 modules
 * import fs from 'fs'
 * import { plugins } from 'isomorphic-git'
 * plugins.fs(fs)
 * ```
 *
 * In the browser it's more involved because there's no standard 'fs' module.
 * Hop over to the [Browser QuickStart](./guide-browser.md) to see how that's done.
 *
 * ### Implementing your own `fs` plugin
 *
 * There are actually TWO ways to implement an `fs` plugin: the classic "callback" API and the newer "promise" API.
 * If your `fs` plugin object provides an enumerable `promises` property, `isomorphic-git` will use the "promise" API _exclusively_.
 *
 * #### Using the "callback" API
 *
 * A "callback" `fs` plugin must implement the following subset of node's `fs` module:
 *
 * {@link GitFsPlugin typedef}
 *
 * Internally, `isomorphic-git` wraps the provided "callback" API functions using [`pify`](https://www.npmjs.com/package/pify).
 *
 * As of node v12 and node v10.17 the `fs.promises` API has been stabilized. (`lightning-fs` also provides a `fs.promises` API!) Nowadays, wrapping the callback functions
 * with `pify` is redundant and potentially less performant than using the native promisified versions. Plus, if you're writing your own `fs` plugin,
 * the `fs.promises` API lets you write straightforward implementations using `async / await` without the messy optional argument handling the callback API needs.
 * Therefore a second API is now supported...
 *
 * #### Using the "promise" API (preferred)
 *
 * A "promise" `fs` plugin must implement the same set functions as a "callback" plugin, but it implements the promisified versions, and they should all be on a property called `promises`:
 *
 * {@link GitFsPromisesPlugin typedef}
 *
 * @param {?GitFsPlugin | GitFsPromisesPlugin} plugin - The fs plugin
 * @param {string} [core = 'default'] - The plugin namespace to add the plugin to
 * @returns {void}
 *
 */
export function fs (plugin, core = 'default') {
  // TODO: Move new FileSystem(fs) logic here.
  cores.get(core).set('fs', plugin)
}
