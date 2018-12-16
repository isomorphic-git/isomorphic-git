import { GitPackIndex } from '../models/GitPackIndex.js'

const PackfileCache = new Map()

async function loadPackIndex ({
  fs,
  filename,
  getExternalRefDelta,
  emitter,
  emitterPrefix
}) {
  const idx = await fs.read(filename)
  return GitPackIndex.fromIdx({ idx, getExternalRefDelta })
}

export function readPackIndex ({
  fs,
  filename,
  getExternalRefDelta,
  emitter,
  emitterPrefix
}) {
  // Try to get the packfile index from the in-memory cache
  let p = PackfileCache.get(filename)
  if (!p) {
    p = loadPackIndex({
      fs,
      filename,
      getExternalRefDelta,
      emitter,
      emitterPrefix
    })
    PackfileCache.set(filename, p)
  }
  return p
}
