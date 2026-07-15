import { UnsafeFilepathError } from '../errors/UnsafeFilepathError.js'

/**
 * Refuse to materialize a working-tree entry whose parent path traverses a
 * symbolic link. A leading component that is a symlink could otherwise redirect
 * a write or mkdir outside the working tree. git applies the same check: it does
 * not follow symlinks in the leading path when writing working-tree files.
 *
 * @param {import('../models/FileSystem.js').FileSystem} fs
 * @param {string} dir
 * @param {string} fullpath
 */
export async function assertNoSymlinkInLeadingPath(fs, dir, fullpath) {
  const parts = fullpath.split('/')
  parts.pop() // the final segment is the entry being written, not a leading dir
  let current = dir
  for (const part of parts) {
    if (part === '' || part === '.') continue
    current = `${current}/${part}`
    const stats = await fs.lstat(current)
    // lstat returns null when the path doesn't exist yet (nothing to traverse).
    if (stats && stats.isSymbolicLink()) {
      throw new UnsafeFilepathError(fullpath)
    }
  }
}
