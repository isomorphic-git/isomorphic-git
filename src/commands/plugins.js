// @ts-check
import { credentialManager } from '../commands/plugin_credentialManager.js'
import { emitter } from '../commands/plugin_emitter.js'
import { fs } from '../commands/plugin_fs.js'
import { http } from '../commands/plugin_http.js'
import { cores } from '../utils/plugins.js'

/**
 *
 * @typedef {Object} GitPgpPlugin
 * @property {function} sign
 * @property {function} verify
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
  http,
  /**
   * @param {?GitPgpPlugin} plugin
   * @param {string} [core]
   */
  pgp (plugin, core = 'default') {
    cores.get(core).set('pgp', plugin)
  }
}
