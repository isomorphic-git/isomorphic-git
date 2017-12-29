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
export async function add(args: {
  fs: any,
  dir: string,
  gitdir?: string,
  filepath: string
}): Promise<void>;

export async function checkout(args: {
  fs: any,
  dir: string,
  gitdir?: string,
  filepath: string,
  remote?: string,
  ref?: string
}): Promise<void>;

export async function clone(args: {
  fs: any,
  dir: string,
  gitdir?: string,
  url: string,
  ref?: string,
  remote?: string,
  authUsername?: string,
  authPassword?: string,
  depth?: number,
  since?: Date,
  exclude?: string[],
  relative?: boolean,
  onprogress?: ({
    loaded: number,
    total: number,
    lengthComputable: boolean
  }) => void
}): Promise<void>;

export async function commit(args: {
  fs: any,
  dir: string,
  gitdir?: string,
  message: string,
  author: {
    name?: string,
    email?: string,
    date?: Date,
    timestamp?: number,
  },
  committer: {
    name?: string,
    email?: string,
    date?: Date,
    timestamp?: number,
  }
}): Promise<string>

export async function config(args: {
  fs: any,
  dir: string,
  gitdir?: string,
  path: string,
  value?: string | undefined
}): Promise<any>

export async function fetch(args: {
  fs: any,
  dir: string,
  gitdir?: string,
  url?: string,
  ref?: string,
  remote?: string,
  authUsername?: string,
  authPassword?: string,
  depth?: number,
  since?: Date,
  exclude?: string[],
  relative?: boolean,
  onprogress?: ({
    loaded: number,
    total: number,
    lengthComputable: boolean
  }) => void
}): Promise<void>;

export async function findRoot(args: {
  fs: any,
  filepath: string
}): Promise<string>;

export async function indexPack(args: {
  fs: any,
  dir: string,
  gitdir?: string,
  filepath: string
}): Promise<void>

export async function init(args: {
  fs: any,
  dir: string,
  gitdir?: string
}): Promise<void>;

export async function listBranches(args: {
  fs: any,
  dir: string,
  gitdir?: string
}): Promise<Array<string>>;

export async function listFiles(args: {
  fs: any,
  dir: string,
  gitdir?: string
}): Promise<Array<string>>;

export async function log(args: {
  fs: any,
  dir: string,
  gitdir?: string
  ref?: string,
  depth?: number,
  since?: Date
}): Promise<Array<CommitDescription>>

export async function push(args: {
  fs: any,
  dir: string,
  gitdir?: string
  ref?: string,
  remote?: string,
  url?: string,
  authUsername?: string,
  authPassword?: string
}): Promise<PushResponse>

export async function remove(args: {
  fs: any,
  dir: string,
  gitdir?: string
  filepath: string
}): Promise<void>

export async function sign(args: {
  fs: any,
  dir: string,
  gitdir?: string
  privateKeys: string
}): Promise<string>

export async function status(args: {
  fs: any,
  dir: string,
  gitdir?: string
  filepath: string
}): Promise<string>

export async function verify(args: {
  fs: any,
  dir: string,
  gitdir?: string
  ref: string,
  publickKeys: string
}): Promise<false | Array<string>>

export function version(): string
