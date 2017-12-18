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

/*~ If this module has methods, declare them as functions like so.
 */
export function init ({fs, dir, gitdir}: {fs: any, dir: string, gitdir?: string}): Promise<void>;
export function add ({fs, dir, gitdir, filepath}: {fs: any, dir: string, gitdir?: string, filepath: string}): Promise<void>;
export function checkout({fs, dir, gitdir, filepath, remote, ref}: {fs: any, dir: string, gitdir?: string, filepath: string, remote?: string, ref?: string}): Promise<void>;
export function listFiles({fs, dir, gitdir}: {fs: any, dir: string, gitdir?: string}): Promise<[string]>;
