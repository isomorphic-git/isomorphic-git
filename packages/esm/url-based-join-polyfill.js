/**
 * A polyfill for path.join() using only the URL API.
 * Behaves like Node's path.join: relative in → relative out, absolute in → absolute out.
 *
 * @param  {...string} parts Path segments
 * @returns {string} Joined path (without file://)
 */
export function join(...parts) {
  if (parts.length === 0) return '.'

  // Just join with "/" like path.join does
  const joined = parts.filter(Boolean).join('/')

  // Normalize using URL
  const url = new URL(joined, 'file://')

  let normalized = url.pathname

  // Remove leading "/" if first segment was relative
  if (!parts[0].startsWith('/')) {
    if (normalized.startsWith('/')) {
      normalized = normalized.slice(1)
    }
  }

  return normalized || '.'
}
