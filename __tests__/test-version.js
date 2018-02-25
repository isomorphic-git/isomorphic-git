/* global describe it expect */
const pkg = require('../package.json')
const { version } = require('..')

describe('version', () => {
  it('version', () => {
    let v = version()
    expect(v).toEqual(pkg.version)
  })
})
