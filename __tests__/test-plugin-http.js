/* eslint-env node, browser, jasmine */
import http from 'isomorphic-git/http'

const { clone } = require('isomorphic-git')

const { makeFixture } = require('./__helpers__/FixtureFS.js')

// this is so it works with either Node local tests or Browser WAN tests
const localhost =
  typeof window === 'undefined' ? 'localhost' : window.location.hostname

describe('plugin - http', () => {
  let callCount = 0
  it('clone should call provided http function', async () => {
    const { fs, dir, gitdir } = await makeFixture('test-plugin-http')
    callCount = 0
    await clone({
      http(...args) {
        callCount++
        return http(...args)
      },
      fs,
      dir,
      gitdir,
      depth: 1,
      singleBranch: true,
      url: `http://${localhost}:8888/test-status.git`,
    })
    expect(callCount).toBe(2)
  })
})
