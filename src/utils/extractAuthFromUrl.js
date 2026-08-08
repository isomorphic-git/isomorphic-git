// The `@` that ends the credentials is the last one before the path, and the
// scheme is matched case-insensitively: `HTTPS://user:pass@host/x` is a URL
// like any other, and leaving the credentials in it is what `fetch` rejects.
const CREDENTIALS = /^(https?:\/\/)([^/]+)@/i

export function extractAuthFromUrl(url) {
  // For whatever reason, the `fetch` API does not convert credentials embedded in the URL
  // into Basic Authentication headers automatically. Instead it throws an error!
  // So we must manually parse the URL, rip out the user:password portion if it is present
  // and compute the Authorization header.
  const credentials = url.match(CREDENTIALS)
  // No credentials, return the url unmodified and an empty auth object
  if (credentials == null) return { url, auth: {} }
  // Has credentials, return the fetch-safe URL and the parsed credentials.
  // The credentials are cut out of the original string rather than read back
  // off the parsed URL: serializing that one would also drop an explicit
  // `:443` and append a slash to a URL that has no path, and this return value
  // is what the request goes out against.
  return {
    url: url.replace(CREDENTIALS, '$1'),
    auth: parseUserinfo(url, credentials[2]),
  }
}

function parseUserinfo(url, userpass) {
  // `URL` splits the two halves the way the platform does, so the first colon
  // separates them and any later one stays in the password. Only the split is
  // taken from it, for the reason above.
  const parsed = parseUrl(url)
  // A password is absent, not empty, when no colon was written at all. `URL`
  // reports `''` for both, and the difference is worth keeping.
  const hasPassword = userpass.indexOf(':') !== -1

  if (parsed !== null) {
    return {
      username: decodeUserinfo(parsed.username),
      password: hasPassword ? decodeUserinfo(parsed.password) : undefined,
    }
  }

  // No `URL` to parse with, or it rejected a string the expression above
  // accepted. Split on the first colon by hand, without the percent-decoding.
  const separatorIndex = userpass.indexOf(':')
  return {
    username: hasPassword ? userpass.slice(0, separatorIndex) : userpass,
    password: hasPassword ? userpass.slice(separatorIndex + 1) : undefined,
  }
}

function parseUrl(url) {
  if (typeof URL !== 'function') return null
  try {
    return new URL(url)
  } catch (_) {
    return null
  }
}

// `URL` hands back the userinfo still percent-encoded, so `p:ss` arrives as
// `p%3Ass` and has to be decoded before it reaches the Authorization header. A
// lone `%` is not something the parser encodes, and it makes the decode throw,
// so the raw value stands in whenever the decode fails.
function decodeUserinfo(value) {
  try {
    return decodeURIComponent(value)
  } catch (_) {
    return value
  }
}
