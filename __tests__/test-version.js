/* eslint-env node, browser, jasmine */
const { version } = require('isomorphic-git')

const pkg = require('../package.json')

describe('version', () => {
  it('version', () => {
    const v = version()
    expect(v).toEqual(pkg.version)
  })
})
