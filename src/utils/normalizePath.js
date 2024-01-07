export function normalizePath(path) {
  let normalizedPath = normalizePathCache.get(path)
  if (!normalizedPath) {
    normalizedPath = normalizePathInternal(path)
    normalizePathCache.set(path, normalizedPath)
  }
  return normalizedPath
}

const normalizePathCache = new Map()
function normalizePathInternal(path) {
  path = path
    .split('/./')
    .join('/') // Replace '/./' with '/'
    .replace(/\/{2,}/g, '/') // Replace consecutive '/'

  if (path === '/.') return '/' // if path === '/.' return '/'
  if (path === './') return '.' // if path === './' return '.'
  if (path.startsWith('./')) path = path.slice(2) // Remove leading './'
  if (path.endsWith('/.')) path = path.slice(0, -2) // Remove trailing '/.'
  if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1) // Remove trailing '/'

  return path || '.' // if path === '' return '.'
}
