import { normalizeMode } from './normalizeMode'

const MAX_UINT32 = 2 ** 32

function SecondsNanoseconds(
  givenSeconds,
  givenNanoseconds,
  milliseconds,
  date
) {
  // For non-browser (local) scenarios conversions happens in FileSystem
  if (givenSeconds !== undefined && givenNanoseconds !== undefined) {
    return [givenSeconds, givenNanoseconds]
  }
  // For browser scenarios isomorphic-git 'add' will be used to write the index. Reading and writing are handled using normalizeStats ( see FileSystem.js lstat() ).
  milliseconds = milliseconds || date.valueOf()
  const seconds = Math.trunc(milliseconds / 1000)
  const nanoseconds = (milliseconds - seconds * 1000) * 1000000 // nanoseconds with millisecond precision

  return [seconds, nanoseconds]
}

export function normalizeStats(e) {
  const [ctimeSeconds, ctimeNanoseconds] = SecondsNanoseconds(
    e.ctimeSeconds,
    e.ctimeNanoseconds,
    e.ctimeMs,
    e.ctime
  )
  const [mtimeSeconds, mtimeNanoseconds] = SecondsNanoseconds(
    e.mtimeSeconds,
    e.mtimeNanoseconds,
    e.mtimeMs,
    e.mtime
  )

  return {
    ctimeSeconds: ctimeSeconds % MAX_UINT32,
    ctimeNanoseconds: ctimeNanoseconds % MAX_UINT32,
    mtimeSeconds: mtimeSeconds % MAX_UINT32,
    mtimeNanoseconds: mtimeNanoseconds % MAX_UINT32,
    dev: e.dev % MAX_UINT32,
    ino: e.ino % MAX_UINT32,
    mode: normalizeMode(e.mode % MAX_UINT32),
    uid: e.uid % MAX_UINT32,
    gid: e.gid % MAX_UINT32,
    // size of -1 happens over a BrowserFS HTTP Backend that doesn't serve Content-Length headers
    // (like the Karma webserver) because BrowserFS HTTP Backend uses HTTP HEAD requests to do fs.stat
    size: e.size > -1 ? e.size % MAX_UINT32 : 0,
  }
}
