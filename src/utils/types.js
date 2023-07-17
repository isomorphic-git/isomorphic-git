export function isPromiseLike(obj) {
  return isObject(obj) && isFunction(obj.then) && isFunction(obj.catch)
}

export function isObject(obj) {
  return obj && typeof obj === 'object'
}

export function isFunction(obj) {
  return typeof obj === 'function'
}
