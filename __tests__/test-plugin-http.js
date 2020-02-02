/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')

const { clone, plugins } = require('isomorphic-git')
const { http } = require('isomorphic-git/internal-apis')

// this is so it works with either Node local tests or Browser WAN tests
const localhost =
  typeof window === 'undefined' ? 'localhost' : window.location.hostname

describe('plugin - http', () => {
  let callCount = 0
  beforeAll(() => {
    plugins.http((...args) => {
      callCount++
      return http(...args)
    })
  })
  it('clone should call provided http function', async () => {
    const { dir, gitdir } = await makeFixture('test-plugin-http')
    callCount = 0
    await clone({
      dir,
      gitdir,
      depth: 1,
      singleBranch: true,
      url: `http://${localhost}:8888/test-status.git`
    })
    expect(callCount).toBe(2)
  })
  afterAll(() => {
    plugins.http(null)
  })
})
