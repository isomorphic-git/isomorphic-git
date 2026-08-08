import { dirname } from './dirname.js'

/**
 * Recursively creates the directory at `filepath`, creating any missing parent
 * directories along the way. This is a portable replacement for
 * `fs.mkdir(path, { recursive: true })`: recursive `mkdir` is NOT part of
 * isomorphic-git's required `fs` contract (see docs/fs.md — `mkdir` is only
 * `mkdir(path[, mode])`) and is unimplemented by some backends such as
 * lightning-fs, so we build it here on top of a single-level `mkdir(path)`
 * primitive only — mirroring how `rmRecursive` provides `rm({ recursive: true })`.
 *
 * It takes the raw single-level `mkdir` *function* (typically `fs._mkdir`)
 * rather than the FileSystem wrapper, to stay decoupled from that type.
 *
 * `EEXIST` is treated as success, so two callers concurrently creating the same
 * directory (e.g. several reflog writes into `.git/logs/refs/*` during a stash)
 * don't fail each other. On backends whose layers are only eventually
 * consistent — e.g. an async copy-on-write overlay — a just-created parent may
 * not yet be visible when its child is created, so `mkdir` can throw a
 * transient `ENOENT`; those are retried a bounded number of times rather than
 * surfaced as a spurious failure.
 *
 * @param {(filepath: string) => Promise<unknown>} mkdir - Creates a single directory (non-recursive).
 * @param {string} filepath - The directory to create.
 * @param {number} [retries=10] - Max transient-ENOENT retries after the parent exists.
 * @returns {Promise<void>}
 */
export async function mkdirp(mkdir, filepath, retries = 10) {
  try {
    await mkdir(filepath)
  } catch (err) {
    // Some fs implementations signal success by yielding a null error.
    if (err === null) return
    // The directory already exists — that's fine.
    if (err.code === 'EEXIST') return
    // Anything other than a missing parent is a real error.
    if (err.code !== 'ENOENT') throw err
    const parent = dirname(filepath)
    // Stop if we've walked past the filesystem root.
    if (parent === '.' || parent === '/' || parent === filepath) throw err
    // Create the missing parent(s) first, honoring the same retry budget.
    await mkdirp(mkdir, parent, retries)
    // Then (re)create this directory. On an eventually-consistent backend the
    // parent may not be visible immediately after its mkdir resolves, so a
    // repeated ENOENT here is transient — retry a bounded number of times,
    // yielding between attempts so the pending write can settle.
    for (let attempt = 0; ; attempt++) {
      try {
        await mkdir(filepath)
        return
      } catch (err2) {
        if (err2 === null || err2.code === 'EEXIST') return
        if (err2.code === 'ENOENT' && attempt < retries) {
          // Give the backend a turn of the event loop to become consistent.
          await new Promise(resolve => setTimeout(resolve, 0))
          continue
        }
        throw err2
      }
    }
  }
}
