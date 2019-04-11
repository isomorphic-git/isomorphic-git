// @ts-check
import { GitRefManager } from '../managers/GitRefManager.js'
import { FileSystem } from '../models/FileSystem.js'
import { join } from '../utils/join.js'
import { cores } from '../utils/plugins.js'

/**
 * List branches
 *
 * By default it lists local branches. If a 'remote' is specified, it lists the remote's branches. When listing remote branches, the HEAD branch is not filtered out, so it may be included in the list of results.
 *
 * Note that specifying a remote does not actually contact the server and update the list of branches.
 * If you want an up-to-date list, first do a `fetch` to that remote.
 * (Which branch you fetch doesn't matter - the list of branches available on the remote is updated during the fetch handshake.)
 *
 * @param {object} args
 * @param {string} [args.core = 'default'] - The plugin core identifier to use for plugin injection
 * @param {FileSystem} [args.fs] - [deprecated] The filesystem containing the git repo. Overrides the fs provided by the [plugin system](./plugin_fs.md).
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} [args.remote] - Instead of the branches in `refs/heads`, list the branches in `refs/remotes/${remote}`.
 *
 * @returns {Promise<Array<string>>} Resolves successfully with an array of branch names
 *
 * @example
 * let branches = await git.listBranches({ dir: '$input((/))' })
 * console.log(branches)
 * let remoteBranches = await git.listBranches({ dir: '$input((/))', remote: '$input((origin))' })
 * console.log(remoteBranches)
 *
 */
export async function listBranches ({
  core = 'default',
  dir,
  gitdir = join(dir, '.git'),
  fs: _fs = cores.get(core).get('fs'),
  remote = undefined
}) {
  try {
    const fs = new FileSystem(_fs)
    return GitRefManager.listBranches({ fs, gitdir, remote })
  } catch (err) {
    err.caller = 'git.listBranches'
    throw err
  }
}
