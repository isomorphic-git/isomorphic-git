import { log } from './log.js'
import { normalizeStats } from './normalizeStats.js'

export function compareStats (entry, stats) {
  // Comparison based on the description in Paragraph 4 of
  // https://www.kernel.org/pub/software/scm/git/docs/technical/racy-git.txt
  const e = normalizeStats(entry)
  const s = normalizeStats(stats)
  const staleness =
    e.mode !== s.mode ||
    e.mtimeSeconds !== s.mtimeSeconds ||
    e.ctimeSeconds !== s.ctimeSeconds ||
    e.uid !== s.uid ||
    e.gid !== s.gid ||
    e.ino !== s.ino ||
    e.size !== s.size
  // console.log(staleness ? 'stale:' : 'fresh:')
  if (staleness && log.enabled) {
    console.table([justWhatMatters(e), justWhatMatters(s)])
  }
  return staleness
}

function justWhatMatters (e) {
  return {
    mode: e.mode,
    mtimeSeconds: e.mtimeSeconds,
    ctimeSeconds: e.ctimeSeconds,
    uid: e.uid,
    gid: e.gid,
    ino: e.ino,
    size: e.size
  }
}
