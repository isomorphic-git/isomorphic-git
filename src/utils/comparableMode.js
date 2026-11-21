/**
 * Git reports a file as changed when its mode changes, even if its content
 * is the same (`chmod +x`, or a file replaced by a symlink to the same text).
 * With `core.filemode = false` the executable bit is not trusted, so every
 * regular file compares as `100644`. Other type changes are always reported.
 *
 * @param {number} mode - a normalized git mode
 * @param {boolean} filemode - the value of `core.filemode`
 * @returns {number}
 */
export function comparableMode(mode, filemode) {
  if (!filemode && mode >> 12 === 0b1000) return 0o100644
  return mode
}
