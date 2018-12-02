export function fetch (...args) {
  return global.fetch ? global.fetch(...args) : require('node-fetch')(...args)
}
