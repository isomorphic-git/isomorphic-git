const deepget = (keys, map) => {
  for (const key of keys) {
    if (!map.has(key)) map.set(key, new Map())
    map = map.get(key)
  }
  return map
}

export class DeepMap {
  constructor() {
    this._root = new Map()
  }

  set(keys, value) {
    const lastKey = keys.pop()
    const lastMap = deepget(keys, this._root)
    lastMap.set(lastKey, value)
  }

  get(keys) {
    const lastKey = keys.pop()
    const lastMap = deepget(keys, this._root)
    return lastMap.get(lastKey)
  }

  has(keys) {
    const lastKey = keys.pop()
    const lastMap = deepget(keys, this._root)
    return lastMap.has(lastKey)
  }
}
