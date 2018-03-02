/* global describe it expect */
const pkg = require('../package.json')
const { version } = require('isomorphic-git')

describe('version', () => {
  it('version', () => {
    let v = version()
    expect(v).toEqual(pkg.version)
  })
})
