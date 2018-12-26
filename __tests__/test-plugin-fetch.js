/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')

const { clone, plugins } = require('isomorphic-git')
const { fetch } = require('isomorphic-git/internal-apis')

describe('plugin - fetch', () => {
  let callCount = 0
  beforeAll(() => {
    plugins.set('fetch', (...args) => {
      callCount++
      return fetch(...args)
    })
  })
  it('clone should call provided fetch function', async () => {
    let { dir, gitdir } = await makeFixture('test-plugin-fetch')
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
    plugins.delete('fetch')
  })
})
