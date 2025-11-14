/**
 * discoverGitdir
 *
 * When processing git commands on a submodule determine
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
 *
 */

// import * as path from 'path'

import { assertParameter } from './assertParameter.js'
import { dirname } from './dirname.js'
import { join } from './join.js'

export async function discoverGitdir({ fsp, dotgit }) {
  assertParameter('fsp', fsp)
  assertParameter('dotgit', dotgit)

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
