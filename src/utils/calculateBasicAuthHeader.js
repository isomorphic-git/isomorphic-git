// Loopback addresses are exempt since credentials sent to them never leave the local machine.
const INSECURE_URL = /^http:\/\/(?!(localhost|127\.0\.0\.1|\[::1\])(:|\/|$))/i

export function calculateBasicAuthHeader({ username = '', password = '' }, url) {
  if (url && INSECURE_URL.test(url)) {
    throw new Error(
      `Refusing to send credentials over insecure HTTP connection to ${url}`
    )
  }
  return `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`
}
