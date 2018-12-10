import { GitIndexManager } from '../managers/GitIndexManager.js'
import { GitIgnoreManager } from '../managers/GitIgnoreManager.js';
import { FileSystem } from '../models/FileSystem.js'
import { E, GitError } from '../models/GitError.js'
import { writeObject } from '../storage/writeObject.js'
import { join } from '../utils/join.js'
import { cores } from '../utils/plugins.js'

/**
 * Add a file to the git index (aka staging area)
 *
 * @link https://isomorphic-git.github.io/docs/add.html
 */

const addDir = async ({fs, _fs, core, dir, gitdir, filepath}) => {
  const readpath = filepath === '.' ? dir : join(dir, filepath)
  const children = await fs.readdir(readpath)
  for (let c = 0; c < children.length; c++) {
    await add({
      core,
      dir,
      gitdir,
      fs: _fs,
      filepath: join(filepath, children[c])
    })
  }
}

export async function add ({
  core = 'default',
  dir,
  gitdir = join(dir, '.git'),
  fs: _fs = cores.get(core).get('fs'),
  filepath
}) {
  try {
    const fs = new FileSystem(_fs)
    if (filepath === '.') {
      return await addDir({fs, _fs, core, dir, gitdir, filepath})
    }
    const type = 'blob'
    let stats = await fs.lstat(join(dir, filepath))
    const ignored = await GitIgnoreManager.isIgnored({
      fs: _fs,
      dir, 
      gitdir,
      filepath
    })
    if (ignored) return
    if (!stats) throw new GitError(E.FileReadError, { filepath })
    if (stats.isDirectory()) {
      return await addDir({fs, _fs, core, dir, gitdir, filepath});
    }
    const object = stats.isSymbolicLink()
      ? await fs.readlink(join(dir, filepath))
      : await fs.read(join(dir, filepath))
    if (object === null) throw new GitError(E.FileReadError, { filepath })
    const oid = await writeObject({ fs, gitdir, type, object })
    await GitIndexManager.acquire(
      { fs, filepath: `${gitdir}/index` },
      async function (index) {
        index.insert({ filepath, stats, oid })
      }
    )
    // TODO: return all oids for all files added
  } catch (err) {
    err.caller = 'git.add'
    throw err
  }
}
