// @ts-check
import { credentialManager } from '../commands/plugin_credentialManager.js'
import { emitter } from '../commands/plugin_emitter.js'
import { fs } from '../commands/plugin_fs.js'
import { http } from '../commands/plugin_http.js'
import { pgp } from '../commands/plugin_pgp.js'
import { cores } from '../utils/plugins.js'

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
  pgp
}
