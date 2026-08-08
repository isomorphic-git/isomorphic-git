export function extractAuthFromUrl(url) {
  // For whatever reason, the `fetch` API does not convert credentials embedded in the URL
  // into Basic Authentication headers automatically. Instead it throws an error!
  // So we must manually parse the URL, rip out the user:password portion if it is present
  // and compute the Authorization header.
  // Note: I tried using new URL(url) but that throws a security exception in Edge. :rolleyes:
  let userpass = url.match(/^https?:\/\/([^/]+)@/)
  // No credentials, return the url unmodified and an empty auth object
  if (userpass == null) return { url, auth: {} }
  userpass = userpass[1]
  // Only the first colon separates the two halves. A colon inside the
  // password is legal, and `split(':')` would drop everything after it,
  // so the request would go out with a truncated secret and come back 401.
  const separatorIndex = userpass.indexOf(':')
  const username =
    separatorIndex === -1 ? userpass : userpass.slice(0, separatorIndex)
  const password =
    separatorIndex === -1 ? undefined : userpass.slice(separatorIndex + 1)
  // Remove credentials from URL
  url = url.replace(`${userpass}@`, '')
  // Has credentials, return the fetch-safe URL and the parsed credentials
  return { url, auth: { username, password } }
}
