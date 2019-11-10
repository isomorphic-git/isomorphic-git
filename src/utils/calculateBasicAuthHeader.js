import { TinyBuffer } from '../utils/TinyBuffer.js'

export function calculateBasicAuthHeader ({ username, password }) {
  return `Basic ${TinyBuffer.from(`${username}:${password}`).toString('base64')}`
}
