/**
 * discoverGitdir
 *
 * When processing git commands on a submodule or worktree, determine
 * the actual git directory based on the contents of the .git file.
 *
 * Otherwise (if sent a directory) return that directory as-is.
 *
 * A decision has to be made "in what layer will submodules be interpreted,
 * and then after that, where can the code can just stay exactly the same as before."
 * This implementation processes submodules in the front-end location of src/api/.
 * The backend of src/commands/ isn't modified. This keeps a clear division
 * of responsibilities and should be maintained.
 *
 * A consequence is that __tests__ must occasionally be informed
 * about submodules also, since those call src/commands/ directly.
 *
 * Every command of src/api/ that works on a repository passes through here,
 * so this is also where a repository isomorphic-git cannot operate on is
 * refused, before anything is read from it or written to it (see
 * `assertObjectFormat`). The config commands pass `checkObjectFormat: false`,
 * since reading or writing the config is safe in any repository, and is how
 * an application can learn which object format a repository uses. In a
 * linked worktree, the config checked is that of the repository, which the
 * `commondir` file of the worktree's gitdir names.
 *
 */

// import * as path from 'path'

import { assertObjectFormat } from './assertObjectFormat.js'
import { assertParameter } from './assertParameter.js'
import { dirname } from './dirname.js'
import { join } from './join.js'

// Check if a path is absolute (Unix / or Windows drive letter like C:\ or C:/)
function isAbsolute(filepath) {
  return filepath.startsWith('/') || /^[a-zA-Z]:[\\/]/.test(filepath)
}

export async function discoverGitdir({
  fsp,
  dotgit,
  checkObjectFormat = true,
}) {
  assertParameter('fsp', fsp)
  assertParameter('dotgit', dotgit)

  const gitdir = await findGitdir({ fsp, dotgit })
  if (checkObjectFormat) {
    await assertObjectFormat({
      fs: fsp,
      gitdir: await findCommonGitdir({ fsp, gitdir }),
    })
  }
  return gitdir
}

// The gitdir of a linked worktree holds only what is its own, such as HEAD and
// the index. Its `commondir` file names the gitdir of the repository, which
// holds the config.
async function findCommonGitdir({ fsp, gitdir }) {
  const commondir = await fsp.read(join(gitdir, 'commondir'), {
    encoding: 'utf8',
  })
  if (commondir === null) return gitdir
  const path = commondir.trimEnd()
  return isAbsolute(path) ? path : join(gitdir, path)
}

async function findGitdir({ fsp, dotgit }) {
  const dotgitStat = await fsp
    ._stat(dotgit)
    .catch(() => ({ isFile: () => false, isDirectory: () => false }))
  if (dotgitStat.isDirectory()) {
    return dotgit
  } else if (dotgitStat.isFile()) {
    return fsp
      ._readFile(dotgit, 'utf8')
      .then(contents => contents.trimRight().substr(8))
      .then(submoduleGitdir => {
        // Worktrees use absolute gitdir paths; submodules use relative ones.
        if (isAbsolute(submoduleGitdir)) {
          return submoduleGitdir
        }
        const gitdir = join(dirname(dotgit), submoduleGitdir)
        return gitdir
      })
  } else {
    // Neither a file nor a directory. This correlates to a "git init" scenario where it's empty.
    // This is the expected result for normal repos, and indeterminate for submodules, but
    // would be unusual with submodules.
    return dotgit
  }
}
