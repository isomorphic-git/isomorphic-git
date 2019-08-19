export function extractAuthFromUrl (url) {
  // For whatever reason, the `fetch` API does not convert credentials embedded in the URL
  // into Basic Authentication headers automatically. Instead it throws an error!
  // So we must manually parse the URL, rip out the user:password portion if it is present
  // and compute the Authorization header.
  // Note: I tried using new URL(url) but that throws a security exception in Edge. :rolleyes:
  let userpass = url.match(/^https?:\/\/([^/]+)@/)
  if (userpass == null) return null
  userpass = userpass[1]
  const [username, password] = userpass.split(':')
  url = url.replace(`${userpass}@`, '')
  return { url, username, password }
}
