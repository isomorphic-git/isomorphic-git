import git from '..'
import pkg from '../package.json'

describe('version', () => {
  test('version', () => {
    let v = git().version()
    expect(v).toEqual(pkg.version)
  })
})
