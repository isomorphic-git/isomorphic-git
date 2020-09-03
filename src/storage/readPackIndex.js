import { GitPackIndex } from '../models/GitPackIndex.js'

async function loadPackIndex({
  fs,
  filename,
  getExternalRefDelta,
  emitter,
  emitterPrefix,
}) {
  const idx = await fs.read(filename)
  return GitPackIndex.fromIdx({ idx, getExternalRefDelta })
}

export function readPackIndex({
  fs,
  cache,
  filename,
  getExternalRefDelta,
  emitter,
  emitterPrefix,
}) {
  // Try to get the packfile index from the in-memory cache
  if (!cache.packfiles) cache.packfiles = new Map()
  let p = cache.packfiles.get(filename)
  if (!p) {
    p = loadPackIndex({
      fs,
      filename,
      getExternalRefDelta,
      emitter,
      emitterPrefix,
    })
    cache.packfiles.set(filename, p)
  }
  return p
}
