// @ts-check
import { credentialManager } from '../commands/plugin_credentialManager.js'
import { emitter } from '../commands/plugin_emitter.js'
import { fs } from '../commands/plugin_fs.js'
import { cores } from '../utils/plugins.js'

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
  emitter,
  fs,
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
