import { join } from './join'

/**
 * Removes the directory at the specified filepath recursively. Used internally to replicate the behavior of
 * fs.promises.rm({ recursive: true, force: true }) from Node.js 14 and above when not available. If the provided
 * filepath resolves to a file, it will be removed.
 *
 * @param {import('../models/FileSystem.js').FileSystem} fs
 * @param {string} filepath - The file or directory to remove.
 */
export async function rmRecursive(fs, filepath) {
  const entries = await fs.readdir(filepath)
  if (entries == null) {
    await fs.rm(filepath)
  } else if (entries.length) {
    await Promise.all(
      entries.map(entry => {
        const subpath = join(filepath, entry)
        return fs.lstat(subpath).then(stat => {
          if (!stat) return
          return stat.isDirectory() ? rmRecursive(fs, subpath) : fs.rm(subpath)
        })
      })
    ).then(() => fs.rmdir(filepath))
  } else {
    await fs.rmdir(filepath)
  }
}
