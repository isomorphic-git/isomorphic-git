// @ts-check
import { GitRefManager } from '../managers/GitRefManager.js'
import { FileSystem } from '../models/FileSystem.js'
import { join } from '../utils/join.js'
import { cores } from '../utils/plugins.js'

/**
 * Expand an abbreviated ref to its full name
 *
 * @param {Object} args
 * @param {string} [args.core = 'default'] - The plugin core identifier to use for plugin injection
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} args.ref - The ref to expand (like "v1.0.0")
 *
 * @returns {Promise<string>} Resolves successfully with a full ref name ("refs/tags/v1.0.0")
 *
 * @example
 * let fullRef = await git.expandRef({ dir: '$input((/))', ref: '$input((master))'})
 * console.log(fullRef)
 *
 */
export async function expandRef ({
  core = 'default',
  dir,
  gitdir = join(dir, '.git'),
  ref
}) {
  try {
    const fs = new FileSystem(cores.get(core).get('fs'))
    const fullref = await GitRefManager.expand({
      fs,
      gitdir,
      ref
    })
    return fullref
  } catch (err) {
    err.caller = 'git.expandRef'
    throw err
  }
}
