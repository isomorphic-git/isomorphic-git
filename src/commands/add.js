import path from 'path'
import pify from 'pify'
import { GitIndexManager, GitObjectManager } from '../managers'
import { fs as defaultfs, setfs, read } from '../utils'

export async function add ({ gitdir, workdir, fs = defaultfs() }, { filepath }) {
  setfs(fs)
  const type = 'blob'
  const object = await read(path.join(workdir, filepath))
  if (object === null) throw new Error(`Could not read file '${filepath}'`)
  const oid = await GitObjectManager.write({ gitdir, type, object })
  await GitIndexManager.acquire(`${gitdir}/index`, async function (index) {
    let stats = await pify(fs.lstat)(path.join(workdir, filepath))
    index.insert({ filepath, stats, oid })
  })
  // TODO: return oid?
}

// export function mixinAdd (BaseClass) {
//   return class extends BaseClass {
//     constructor (...args) {
//       super(...args)
//     }
//     async add ({filepath}) {
//       return add({
//         gitdir: this.gitdir,
//         workdir: this.workdir,
//         filepath,
//         fs: this.fs
//       })
//     }
//   }
// }

// function makeMethod (fn) {
//   return async function (args) {
//     return fn({
//       gitdir: this.gitdir,
//       workdir: this.workdir,
//       fs: this.fs,
//       ...args
//     })
//   }
// }

// export const methodAdd = makeMethod(add)

// function makeSelfArg (fn) {
//   return async function (self, args) {
//     return fn({
//       gitdir: self.gitdir,
//       workdir: self.workdir,
//       fs: self.fs,
//       ...args
//     })
//   }
// }
