/* global test describe expect */
import pkg from '../package.json'
import { version } from '..'

/** @test {version} */
describe('version', () => {
  test('version', () => {
    let v = version()
    expect(v).toEqual(pkg.version)
  })
})
