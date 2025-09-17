import { readdirSync } from 'fs'
// polyfill toMatchInlineSnapshot
import './__helpers__/jasmine-inline-snapshots.js'

// This used to use webpack's require.context() but that doesn't work with ESM
// The dynamic import is equivalent though
for (const path of readdirSync(import.meta.dirname)) {
  if (path.startsWith('test-')) await import('./' + path)
}
