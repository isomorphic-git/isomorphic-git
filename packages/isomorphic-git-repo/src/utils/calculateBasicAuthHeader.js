export function calculateBasicAuthHeader({ username = '', password = '' }) {
  return `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`
}
