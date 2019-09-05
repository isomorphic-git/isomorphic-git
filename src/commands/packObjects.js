// @ts-check
import { FileSystem } from '../models/FileSystem.js'
import { collect } from '../utils/collect.js'
import { join } from '../utils/join.js'
import { cores } from '../utils/plugins.js'

import { pack } from './pack'

/**
 *
 * @typedef {Object} PackObjectsResponse The packObjects command returns an object with two properties:
 * @property {string} filename - The suggested filename for the packfile if you want to save it to disk somewhere. It includes the packfile SHA.
 * @property {Buffer} [packfile] - The packfile contents. Not present if `write` parameter was true, in which case the packfile was written straight to disk.
 */

/**
 * Create a packfile from an array of SHA-1 object ids
 *
 * @param {object} args
 * @param {string} [args.core = 'default'] - The plugin core identifier to use for plugin injection
 * @param {FileSystem} [args.fs] - [deprecated] The filesystem containing the git repo. Overrides the fs provided by the [plugin system](./plugin_fs.md).
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir, '.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string[]} args.oids - An array of SHA-1 object ids to be included in the packfile
 * @param {boolean} [args.write = false] - Whether to save the packfile to disk or not
 *
 * @returns {Promise<PackObjectsResponse>} Resolves successfully when the packfile is ready with the filename and buffer
 * @see PackObjectsResponse
 *
 * @example
 * // Create a packfile containing only an empty tree
 * let { packfile } = await git.packObjects({
 *   dir: '$input((/))',
 *   oids: [$input(('4b825dc642cb6eb9a060e54bf8d69288fbee4904'))]
 * })
 * console.log(packfile)
 *
 */
export async function packObjects ({
  core = 'default',
  dir,
  gitdir = join(dir, '.git'),
  fs: _fs = cores.get(core).get('fs'),
  oids,
  write = false
}) {
  try {
    const fs = new FileSystem(_fs)
    const buffers = await pack({ core, gitdir, fs, oids })
    const packfile = await collect(buffers)
    const packfileSha = packfile.slice(-20).toString('hex')
    const filename = `pack-${packfileSha}.pack`
    if (write) {
      await fs.write(join(gitdir, `objects/pack/${filename}`), packfile)
      return { filename }
    }
    return {
      filename,
      packfile
    }
  } catch (err) {
    err.caller = 'git.packObjects'
    throw err
  }
}
