/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')

const { clone, cores } = require('isomorphic-git')
const { http } = require('isomorphic-git/internal-apis')

describe('plugin - http', () => {
  it('clone should call provided http function', async () => {
    // Setup
    const { core, dir, gitdir } = await makeFixture('test-plugin-http')
    let callCount = 0
    // Test
    cores.get(core).set('http', (...args) => {
      callCount++
      return http(...args)
    })
    await clone({
      core,
      dir,
      gitdir,
      depth: 1,
      singleBranch: true,
      url: 'http://localhost:8888/test-status.git'
    })
    expect(callCount).toBe(2)
  })
})
