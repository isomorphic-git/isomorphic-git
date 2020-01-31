// @ts-check
import { credentialManager } from '../commands/plugin_credentialManager.js'
import { cores } from '../utils/plugins.js'

/**
 *
 * @typedef {Object} GitCredentialManagerPlugin
 * @property {function} fill
 * @property {function} approved
 * @property {function} rejected
 */

/**
 *
 * @typedef {Object} GitEmitterPlugin
 * @property {function} emit
 */

/**
 *
 * @typedef {Object} GitFsPlugin
 * @property {function} readFile
 * @property {function} writeFile
 * @property {function} unlink
 * @property {function} readdir
 * @property {function} mkdir
 * @property {function} rmdir
 * @property {function} stat
 * @property {function} lstat
 */

/**
 *
 * @typedef {Object} GitFsPromisesPlugin
 * @property {Object} promises
 * @property {function} promises.readFile
 * @property {function} promises.writeFile
 * @property {function} promises.unlink
 * @property {function} promises.readdir
 * @property {function} promises.mkdir
 * @property {function} promises.rmdir
 * @property {function} promises.stat
 * @property {function} promises.lstat
 */

/**
 *
 * @typedef {Object} GitPgpPlugin
 * @property {function} sign
 * @property {function} verify
 */

/**
 *
 * @typedef {Object} GitHttpRequest
 * @property {string} url
 * @property {string} [method]
 * @property {Object} [headers]
 * @property {AsyncIterableIterator<Uint8Array>} [body]
 * @property {string} [core]
 * @property {GitEmitterPlugin} [emitter]
 * @property {string} [emitterPrefix]
 */

/**
 *
 * @typedef {Object} GitHttpResponse
 * @property {string} url
 * @property {string} [method]
 * @property {Object} [headers]
 * @property {AsyncIterableIterator<Uint8Array>} [body]
 * @property {number} statusCode
 * @property {string} statusMessage
 */

/**
 *
 * @typedef {function(GitHttpRequest): GitHttpResponse} GitHttpPlugin
 */

/**
 * Set a plugin to use.
 *
 */
export const plugins = {
  /**
   * @param {string} core
   */
  createCore (core) {
    cores.create(core)
  },
  /**
   * @param {string} core
   */
  deleteCore (core) {
    cores.delete(core)
  },
  credentialManager,
  /**
   * @param {?GitEmitterPlugin} plugin
   * @param {string} [core]
   */
  emitter (plugin, core = 'default') {
    cores.get(core).set('emitter', plugin)
  },
  /**
   * @param {?GitFsPlugin} plugin
   * @param {string} [core]
   */
  fs (plugin, core = 'default') {
    cores.get(core).set('fs', plugin)
  },
  /**
   * @param {?GitFsPromisesPlugin} plugin
   * @param {string} [core]
   */
  promisesFs (plugin, core = 'default') {
    cores.get(core).set('fs', plugin)
  },
  /**
   * @param {?GitHttpPlugin} plugin
   * @param {string} [core]
   */
  http (plugin, core = 'default') {
    cores.get(core).set('http', plugin)
  },
  /**
   * @param {?GitPgpPlugin} plugin
   * @param {string} [core]
   */
  pgp (plugin, core = 'default') {
    cores.get(core).set('pgp', plugin)
  }
}
