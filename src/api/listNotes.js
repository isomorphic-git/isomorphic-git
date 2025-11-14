// @ts-check
import '../typedefs.js'

import { _listNotes } from '../commands/listNotes.js'
import { FileSystem } from '../models/FileSystem.js'
import { assertParameter } from '../utils/assertParameter.js'
import { discoverGitdir } from '../utils/discoverGitdir.js'
import { join } from '../utils/join.js'

/**
 * List all the object notes
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system client
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} [args.ref] - The notes ref to look under
 * @param {object} [args.cache] - a [cache](cache.md) object
 *
 * @returns {Promise<Array<{target: string, note: string}>>} Resolves successfully with an array of entries containing SHA-1 object ids of the note and the object the note targets
 */

export async function listNotes({
  fs,
  dir,
  gitdir = join(dir, '.git'),
  ref = 'refs/notes/commits',
  cache = {},
}) {
  try {
    assertParameter('fs', fs)
    assertParameter('gitdir', gitdir)
    assertParameter('ref', ref)

    const fsp = new FileSystem(fs)
    const updatedGitdir = await discoverGitdir({ fsp, dotgit: gitdir })
    return await _listNotes({
      fs: fsp,
      cache,
      gitdir: updatedGitdir,
      ref,
    })
  } catch (err) {
    err.caller = 'git.listNotes'
    throw err
  }
}
