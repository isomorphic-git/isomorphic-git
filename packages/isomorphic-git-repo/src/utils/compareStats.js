import { normalizeStats } from './normalizeStats.js'

export function compareStats(entry, stats, filemode = true, trustino = true) {
  // Comparison based on the description in Paragraph 4 of
  // https://www.kernel.org/pub/software/scm/git/docs/technical/racy-git.txt
  const e = normalizeStats(entry)
  const s = normalizeStats(stats)
  const staleness =
    (filemode && e.mode !== s.mode) ||
    e.mtimeSeconds !== s.mtimeSeconds ||
    e.ctimeSeconds !== s.ctimeSeconds ||
    e.uid !== s.uid ||
    e.gid !== s.gid ||
    (trustino && e.ino !== s.ino) ||
    e.size !== s.size
  return staleness
}
