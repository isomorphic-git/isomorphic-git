/* eslint-env node, browser, jasmine */
import http from 'isomorphic-git/http'

const { setConfig, push, E } = require('isomorphic-git')

const { makeFixture } = require('./__helpers__/FixtureFS.js')

// this is so it works with either Node local tests or Browser WAN tests
const localhost =
  typeof window === 'undefined' ? 'localhost' : window.location.hostname

describe('credentialManager', () => {
  it('with valid credentials', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-push')
    await setConfig({
      fs,
      gitdir,
      path: 'remote.auth.url',
      value: `http://${localhost}:8888/test-push-server-auth.git`,
    })
    // Test
    let fillCalled = false
    let approvedCalled = false
    let rejectedCalled = false
    await push({
      fs,
      http,
      gitdir,
      remote: 'auth',
      ref: 'master',
      async onAuth({ url }) {
        fillCalled = true
        return {
          username: 'testuser',
          password: 'testpassword',
        }
      },
      async onAuthSuccess(auth) {
        approvedCalled = true
      },
      async onAuthFailure(auth) {
        rejectedCalled = true
      },
    })
    expect(fillCalled).toBe(true)
    expect(approvedCalled).toBe(true)
    expect(rejectedCalled).toBe(false)
  })
  it('with invalid credentials', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-push')
    await setConfig({
      fs,
      gitdir,
      path: 'remote.auth.url',
      value: `http://${localhost}:8888/test-push-server-auth.git`,
    })
    // Test
    let fillCalled = false
    let approvedCalled = false
    let rejectedCalled = false
    let err
    try {
      await push({
        fs,
        http,
        gitdir,
        remote: 'auth',
        ref: 'master',
        async onAuth({ url }) {
          fillCalled = true
          return {
            username: 'testuser',
            password: 'NoT_rIgHt',
          }
        },
        async onAuthSuccess(auth) {
          approvedCalled = true
        },
        async onAuthFailure(auth) {
          rejectedCalled = true
        },
      })
    } catch (e) {
      err = e
    }
    expect(err).toBeDefined()
    expect(err.code).toBe(E.HTTPError)
    expect(fillCalled).toBe(true)
    expect(approvedCalled).toBe(false)
    expect(rejectedCalled).toBe(true)
  })
})
