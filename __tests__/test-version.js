/* eslint-env node, browser, jasmine */
import { version } from 'isomorphic-git'

import pkg from '../package.json'

describe('version', () => {
  it('version', () => {
    const v = version()
    expect(v).toEqual(pkg.version)
  })
})
