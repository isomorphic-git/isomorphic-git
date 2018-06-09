export function cacheIsStale ({ entry, stats }) {
  // Comparison based on the description in Paragraph 4 of
  // https://www.kernel.org/pub/software/scm/git/docs/technical/racy-git.txt
  return (
    entry.mode !== stats.mode ||
    entry.mtime.valueOf() !== stats.mtime.valueOf() ||
    entry.ctime.valueOf() !== stats.ctime.valueOf() ||
    entry.uid !== stats.uid ||
    entry.gid !== stats.gid ||
    entry.ino !== stats.ino >> 0 ||
    entry.size !== stats.size
  )
}
