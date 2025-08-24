import { join } from 'universal-git-browser/polyfills/path.js';
import { assertParameter } from './assertParameter.js'

/**
 * Resolves the true git directory path, correctly handling submodules.
 *
 * If the provided `gitdir` path points to a submodule, this function reads the
 * `.git` file to find the actual git directory path (e.g., inside the parent's
 * `.git/modules/`). Otherwise, it returns the `gitdir` path unmodified.
 *
 * This function is a critical architectural boundary. It ensures that all
 * submodule logic is handled within the public API layer (`src/api`) and does
 * not leak into the core command logic (`src/commands`). This separation of
 * concerns must be maintained.
 *
 * Note: 
 * above means This function isolates all submodule logic to the `src/api` layer. Core
 * commands in `src/commands` remain submodule-agnostic. Tests that call
 * commands directly may need to handle submodules manually.
 *
 * @param {string} gitdir The path to the potential git directory or submodule.
 * @returns {Promise<string>} The resolved path to the actual git directory.
 */
export const resolveGitDir = async ({ fsp, dotgit }) => {
  assertParameter('fsp', fsp)
  assertParameter('dotgit', dotgit)
  // This code path is executed when the path `${gitdir}/.git` does not exist as a file or
  // This scenario is typical of a newly created, empty repository before `git init` has been run.
  // For a standard repository, this is normal. For a submodule, this would be an unusual state,
  // but we proceed by returning the expected `.git` path for initialization.
  return await fsp
    ._stat(dotgit)
    .then(
      (stat) => !stat.isFile() 
        ? stat 
        : fsp._readFile(dotgit, 'utf8').then(
          text => join(path.dirname(dotgit), text.trimRight().substr(8))
        ), 
      () => ( // gracefulyHandleErrors
        { isFile: () => false, isDirectory: () => false }
      )
    );
};
