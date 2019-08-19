/* eslint-env node, browser, jasmine */
const pkg = require('../package.json')
const { version } = require('isomorphic-git')

describe('version', () => {
  it('version', () => {
    const v = version()
    expect(v).toEqual(pkg.version)
  })
})
