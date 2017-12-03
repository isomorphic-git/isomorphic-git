// Type definitions for isomorphic-git 1.0.0
// Project: isomorphic-git
// Definitions by: William Hilton <wmhilton.com>

/*~ This is the module template file. You should rename it to index.d.ts
 *~ and place it in a folder with the same name as the module.
 *~ For example, if you were writing a file for "super-greeter", this
 *~ file should be 'super-greeter/index.d.ts'
 */

/*~ If this module is a UMD module that exposes a global variable 'myLib' when
 *~ loaded outside a module loader environment, declare that global here.
 *~ Otherwise, delete this declaration.
 */
export as namespace git;

/*~ You can declare types that are available via importing the module */
export interface GitRepo {
  fs: any;
  gitdir?: string;
  workdir?: string;
}
type GitRepoShorthand = {
  fs: any;
  dir?: string;
  workdir?: string;
  gitdir?: string
}
export class Git {
  fs: any;
  gitdir?: string;
  workdir?: string;
  constructor(args: GitRepoShorthand)
}

/*~ If this module has methods, declare them as functions like so.
 */
export function init (repo: GitRepo): Promise<void>;
export function add (repo: GitRepo, {filepath}: {filepath: string}): Promise<void>;
export function checkout(repo: GitRepo, {remote, ref}: {remote?: string, ref?: string}): Promise<void>;
export function list(repo: GitRepo): [string];
