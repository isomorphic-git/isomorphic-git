import { assertNoSymlinkInLeadingPath } from './assertNoSymlinkInLeadingPath.js'

/**
 * Materialize one tracked blob in the working tree.
 *
 * A symlink must never be followed when writing, neither in the leading path
 * nor at the destination itself: a tracked symlink can point anywhere, so
 * following one redirects the write outside the working tree. git behaves the
 * same way — it replaces the symlink instead of writing through it.
 *
 * @param {object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {string} args.dir - The working tree directory path
 * @param {string} args.filepath - Path of the entry, relative to `dir`
 * @param {number} args.mode - The entry's file mode, e.g. 0o100644
 * @param {Uint8Array|string} args.content - The blob contents
 * @returns {Promise<void>}
 */
export async function writeWorkingTreeEntry({
  fs,
  dir,
  filepath,
  mode,
  content,
}) {
  await assertNoSymlinkInLeadingPath(fs, dir, filepath)
  const path = `${dir}/${filepath}`
  const symlink = mode === 0o120000
  // lstat does not follow the final component, so an existing symlink is
  // removed rather than written through. Removing it first also lets `mode`
  // take effect, which only happens when the file is created.
  const stats = await fs.lstat(path)
  if (stats && (symlink || stats.isSymbolicLink())) {
    await fs.rm(path)
  }
  if (symlink) {
    await fs.writelink(path, Buffer.from(content))
  } else {
    await fs.write(path, content, { mode })
  }
}
