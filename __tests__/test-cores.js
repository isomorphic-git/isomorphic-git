/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')

const { cores, plugins, E } = require('isomorphic-git')

describe('cores', () => {
  it('plugins === cores.get(default)', async () => {
    expect(plugins).toBe(cores.get('default'))
  })
  it('cores.get', async () => {
    // Setup
    const { _fs } = await makeFixture('test-cores')
    cores.get('default').set('fs', _fs)
    let error = null
    try {
      cores.get('first').set('fs', _fs)
    } catch (err) {
      error = err
    }
    expect(error).not.toBeNull()
    expect(error.code).toEqual(E.CoreNotFound)
  })
  it('core.create', async () => {
    // Setup
    const { _fs } = await makeFixture('test-cores')
    cores.get('default').set('fs', _fs)
    let error = null
    try {
      cores.create('second').set('fs', _fs)
    } catch (err) {
      error = err
    }
    expect(error).toBeNull()
    expect(cores.get('second').get('fs')).toBe(_fs)
  })
  it('cores have separate plugins', async () => {
    // Setup
    const { _fs } = await makeFixture('test-cores')
    plugins.set('fs', _fs)
    cores.create('third').set('foo', _fs)
    expect(cores.get('default').has('fs')).toBeTruthy()
    expect(cores.get('default').has('foo')).toBeFalsy()
    expect(cores.get('third').has('fs')).toBeFalsy()
    expect(cores.get('third').get('foo')).toBeTruthy()
  })
  it('plugin schema violation', async () => {
    // Setup
    const fs = {
      readFile () {}
    }
    let error = null
    try {
      plugins.set('fs', fs)
    } catch (err) {
      error = err
    }
    expect(error).not.toBeNull()
    expect(error.code).toEqual(E.PluginSchemaViolation)
  })
  it('unrecognized plugin', async () => {
    // Setup
    const { _fs } = await makeFixture('test-cores')
    let error = null
    try {
      plugins.set('fz', _fs)
    } catch (err) {
      error = err
    }
    expect(error).not.toBeNull()
    expect(error.code).toEqual(E.PluginUnrecognized)
  })
})
