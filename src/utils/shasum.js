import createHash from 'sha.js'

// This is modeled after @dominictarr's "shasum" module,
// but without the 'json-stable-stringify' dependency and
// extra type-casting features.
export function shasum (buffer) {
  return createHash('sha1')
    .update(buffer)
    .digest('hex')
}
