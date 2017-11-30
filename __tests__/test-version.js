/* global test describe expect */
import { Git } from '..'
import pkg from '../package.json'

describe('version', () => {
  test('version', () => {
    let v = new Git().version()
    expect(v).toEqual(pkg.version)
  })
})
