// @ts-check
import { FileSystem } from '../models/FileSystem.js'
import { E, GitError } from '../models/GitError.js'
import { dirname } from '../utils/dirname.js'
import { join } from '../utils/join.js'
import { cores } from '../utils/plugins.js'

/**
 * Find the root git directory
 *
 * Starting at `filepath`, walks upward until it finds a directory that contains a subdirectory called '.git'.
 *
 * @param {Object} args
 * @param {string} [args.core = 'default'] - The plugin core identifier to use for plugin injection
 * @param {FileSystem} [args.fs] - [deprecated] The filesystem containing the git repo. Overrides the fs provided by the [plugin system](./plugin_fs.md).
 * @param {string} args.filepath - The file directory to start searching in.
 *
 * @returns {Promise<string>} Resolves successfully with a root git directory path
 * @throws {GitRootNotFoundError}
 *
 * @example
 * let gitroot = await git.findRoot({
 *   filepath: '$input((/path/to/some/gitrepo/path/to/some/file.txt))'
 * })
 * console.log(gitroot) // '/path/to/some/gitrepo'
 *
 */
export async function findRoot ({
  core = 'default',
  fs: _fs = cores.get(core).get('fs'),
  filepath
}) {
  try {
    const fs = new FileSystem(_fs)
    return _findRoot(fs, filepath)
  } catch (err) {
    err.caller = 'git.findRoot'
    throw err
  }
}

async function _findRoot (fs, filepath) {
  if (await fs.exists(join(filepath, '.git'))) {
    return filepath
  } else {
    const parent = dirname(filepath)
    if (parent === filepath) {
      throw new GitError(E.GitRootNotFoundError, { filepath })
    }
    return _findRoot(fs, parent)
  }
}
