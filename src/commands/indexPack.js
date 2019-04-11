// @ts-check
import { FileSystem } from '../models/FileSystem.js'
import { GitPackIndex } from '../models/GitPackIndex.js'
import { readObject } from '../storage/readObject.js'
import { join } from '../utils/join.js'
import { cores } from '../utils/plugins.js'

/**
 * Create the .idx file for a given .pack file
 *
 * To monitor progress events, see the documentation for the [`'emitter'` plugin](./plugin_emitter.md).
 *
 * @param {object} args
 * @param {string} [args.core = 'default'] - The plugin core identifier to use for plugin injection
 * @param {FileSystem} [args.fs] - [deprecated] The filesystem containing the git repo. Overrides the fs provided by the [plugin system](./plugin_fs.md).
 * @param {string} args.dir - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} args.filepath - The path to the .pack file to index
 * @param {import('events').EventEmitter} [args.emitter] - [deprecated] Overrides the emitter set via the ['emitter' plugin](./plugin_emitter.md).
 * @param {string} [args.emitterPrefix = ''] - Scope emitted events by prepending `emitterPrefix` to the event name.
 *
 * @returns {Promise<void>} Resolves when filesystem operations are complete
 *
 * @example
 * await git.indexPack({ dir: '$input((/))', filepath: '$input((pack-9cbd243a1caa4cb4bef976062434a958d82721a9.pack))' })
 * console.log('done')
 *
 */
export async function indexPack ({
  core = 'default',
  dir,
  gitdir = join(dir, '.git'),
  fs: _fs = cores.get(core).get('fs'),
  emitter = cores.get(core).get('emitter'),
  emitterPrefix = '',
  filepath
}) {
  try {
    const fs = new FileSystem(_fs)
    filepath = join(dir, filepath)
    const pack = await fs.read(filepath)
    const getExternalRefDelta = oid => readObject({ fs, gitdir, oid })
    const idx = await GitPackIndex.fromPack({
      pack,
      getExternalRefDelta,
      emitter,
      emitterPrefix
    })
    await fs.write(filepath.replace(/\.pack$/, '.idx'), idx.toBuffer())
  } catch (err) {
    err.caller = 'git.indexPack'
    throw err
  }
}
