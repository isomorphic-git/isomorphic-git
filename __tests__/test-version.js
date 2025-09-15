/* eslint-env node, browser, jasmine */
import { readFileSync } from 'fs'

import { version } from 'isomorphic-git'

/**
 * @todo Use `import ... with { type: 'json' }` when development uses Node.js 20+.
 * Note this needs Eslint 9
 */
const pkg = JSON.parse(
  readFileSync(import.meta.resolve('../package.json'), 'utf8')
)

describe('version', () => {
  it('version', () => {
    const v = version()
    expect(v).toEqual(pkg.version)
  })
})
