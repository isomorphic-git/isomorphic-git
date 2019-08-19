/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')

const { clone, plugins } = require('isomorphic-git')
const { http } = require('isomorphic-git/internal-apis')

describe('plugin - http', () => {
  let callCount = 0
  beforeAll(() => {
    plugins.set('http', (...args) => {
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
      url: 'http://localhost:8888/test-status.git'
    })
    expect(callCount).toBe(2)
  })
  afterAll(() => {
    plugins.delete('http')
  })
})
