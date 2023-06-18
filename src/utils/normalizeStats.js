import { normalizeMode } from './normalizeMode'

const MAX_UINT32 = 2 ** 32

function SecondsNanoseconds(givenSeconds, givenNanoseconds, nanoseconds, date) {
  if (givenSeconds !== undefined && givenNanoseconds !== undefined) {
    return [givenSeconds, givenNanoseconds]
  }
  if (nanoseconds === undefined) {
    nanoseconds = BigInt(date.valueOf() * 1e6)
  }
  const seconds = Number(nanoseconds / BigInt(1e9))
  nanoseconds = Number(nanoseconds % BigInt(1e9))
  return [seconds, nanoseconds]
}

export function normalizeStats(e) {
  const [ctimeSeconds, ctimeNanoseconds] = SecondsNanoseconds(
    e.ctimeSeconds,
    e.ctimeNanoseconds,
    e.ctimeNs,
    e.ctime
  )
  const [mtimeSeconds, mtimeNanoseconds] = SecondsNanoseconds(
    e.mtimeSeconds,
    e.mtimeNanoseconds,
    e.mtimeNs,
    e.mtime
  )

  return {
    ctimeSeconds: ctimeSeconds % MAX_UINT32,
    ctimeNanoseconds: ctimeNanoseconds % MAX_UINT32,
    mtimeSeconds: mtimeSeconds % MAX_UINT32,
    mtimeNanoseconds: mtimeNanoseconds % MAX_UINT32,
    dev: Number(e.dev) % MAX_UINT32,
    ino: Number(e.ino) % MAX_UINT32,
    mode: normalizeMode(Number(e.mode) % MAX_UINT32),
    uid: Number(e.uid) % MAX_UINT32,
    gid: Number(e.gid) % MAX_UINT32,
    // size of -1 happens over a BrowserFS HTTP Backend that doesn't serve Content-Length headers
    // (like the Karma webserver) because BrowserFS HTTP Backend uses HTTP HEAD requests to do fs.stat
    size: Number(e.size) > -1 ? Number(e.size) % MAX_UINT32 : 0,
  }
}
