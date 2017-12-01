/* global test describe expect */
import pkg from '../package.json'
import { createClass } from '../dist/for-node/utils'

const Git = createClass()

describe('version', () => {
  test('version', () => {
    let v = Git.version()
    expect(v).toEqual(pkg.version)
  })
})
