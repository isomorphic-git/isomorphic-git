/* global test describe expect */
import pkg from '../package.json'
import { Git } from '..'

describe('version', () => {
  test('version', () => {
    let v = Git.version()
    expect(v).toEqual(pkg.version)
  })
})
