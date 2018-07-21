const MAX_UINT32 = 2 ** 32

export function normalizeStats (e) {
  const ctimeSeconds =
    e.ctimeSeconds !== undefined
      ? e.ctimeSeconds
      : Math.floor(e.ctime.valueOf() / 1000)
  const mtimeSeconds =
    e.mtimeSeconds !== undefined
      ? e.mtimeSeconds
      : Math.floor(e.mtime.valueOf() / 1000)
  const ctimeNanoseconds =
    e.ctimeNanoseconds !== undefined
      ? e.ctimeNanoseconds
      : (e.ctime.valueOf() - ctimeSeconds * 1000) * 1000000
  const mtimeNanoseconds =
    e.mtimeNanoseconds !== undefined
      ? e.mtimeNanoseconds
      : (e.mtime.valueOf() - mtimeSeconds * 1000) * 1000000

  return {
    ctimeSeconds: ctimeSeconds % MAX_UINT32,
    ctimeNanoseconds: ctimeNanoseconds % MAX_UINT32,
    mtimeSeconds: mtimeSeconds % MAX_UINT32,
    mtimeNanoseconds: mtimeNanoseconds % MAX_UINT32,
    dev: e.dev % MAX_UINT32,
    ino: e.ino % MAX_UINT32,
    mode: e.mode % MAX_UINT32,
    uid: e.uid % MAX_UINT32,
    gid: e.gid % MAX_UINT32,
    size: e.size % MAX_UINT32
  }
}
