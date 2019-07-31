const deepget = (keys, map) => {
  for (let key of keys) {
    if (!map.has(key)) map.set(key, new Map())
    map = map.get(key)
  }
  return map
}

export class DeepMap {
  constructor () {
    this._root = new Map()
  }
  set (keys, value) {
    let lastKey = keys.pop()
    let lastMap = deepget(keys, this._root)
    lastMap.set(lastKey, value)
  }
  get (keys) {
    let lastKey = keys.pop()
    let lastMap = deepget(keys, this._root)
    return lastMap.get(lastKey)
  }
  has (keys) {
    let lastKey = keys.pop()
    let lastMap = deepget(keys, this._root)
    return lastMap.has(lastKey)
  }
}
