/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')

const { cores, plugins, E } = require('isomorphic-git')

describe('cores', () => {
  it('plugins === cores.get(default)', async () => {
    expect(plugins).toBe(cores.get('default'))
  })
  it('cores.get', async () => {
    // Setup
    let { fs } = await makeFixture('test-cores')
    cores.get('default').set('fs', fs)
    let error = null
    try {
      cores.get('first').set('fs', fs)
    } catch (err) {
      error = err
    }
    expect(error).not.toBeNull()
    expect(error.code).toEqual(E.CoreNotFound)
  })
  it('core.create', async () => {
    // Setup
    let { fs } = await makeFixture('test-cores')
    cores.get('default').set('fs', fs)
    let error = null
    try {
      cores.create('second').set('fs', fs)
    } catch (err) {
      error = err
    }
    expect(error).toBeNull()
    expect(cores.get('second').get('fs')).toBe(fs)
  })
  it('cores have separate plugins', async () => {
    // Setup
    let { fs } = await makeFixture('test-cores')
    plugins.set('fs', fs)
    cores.create('third').set('foo', fs)
    expect(cores.get('default').has('fs')).toBeTruthy()
    expect(cores.get('default').has('foo')).toBeFalsy()
    expect(cores.get('third').has('fs')).toBeFalsy()
    expect(cores.get('third').get('foo')).toBeTruthy()
  })
})
