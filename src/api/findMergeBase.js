// @ts-check
import '../commands/typedefs.js'

import { findMergeBase as _findMergeBase } from '../commands/findMergeBase.js'
import { FileSystem } from '../models/FileSystem.js'
import { join } from '../utils/join.js'
import { assertParameter } from '../utils/assertParameter.js'

/**
 * Find the merge base for a set of commits
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system client
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string[]} args.oids - Which commits
 *
 */
export async function findMergeBase ({
  fs,
  dir,
  gitdir = join(dir, '.git'),
  oids
}) {
  try {
    assertParameter('fs', fs)
    assertParameter('gitdir', gitdir)
    assertParameter('oids', oids)

    return await _findMergeBase({
      fs: new FileSystem(fs),
      gitdir,
      oids
    })
  } catch (err) {
    err.caller = 'git.findMergeBase'
    throw err
  }
}
