/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')

const { plugins, config, push, E } = require('isomorphic-git')

// this is so it works with either Node local tests or Browser WAN tests
const localhost =
  typeof window === 'undefined' ? 'localhost' : window.location.hostname

describe('credentialManager', () => {
  it('with valid credentials', async () => {
    // Setup
    const { gitdir } = await makeFixture('test-push')
    await config({
      gitdir,
      path: 'remote.auth.url',
      value: `http://${localhost}:8888/test-push-server-auth.git`
    })
    // Test
    let fillCalled = false
    let approvedCalled = false
    let rejectedCalled = false
    plugins.credentialManager({
      async fill ({ url }) {
        fillCalled = true
        return {
          username: 'testuser',
          password: 'testpassword'
        }
      },
      async approved (auth) {
        approvedCalled = true
      },
      async rejected (auth) {
        rejectedCalled = true
      }
    })
    await push({
      gitdir,
      remote: 'auth',
      ref: 'master'
    })
    expect(fillCalled).toBe(true)
    expect(approvedCalled).toBe(true)
    expect(rejectedCalled).toBe(false)
  })
  it('with invalid credentials', async () => {
    // Setup
    const { gitdir } = await makeFixture('test-push')
    await config({
      gitdir,
      path: 'remote.auth.url',
      value: `http://${localhost}:8888/test-push-server-auth.git`
    })
    // Test
    let fillCalled = false
    let approvedCalled = false
    let rejectedCalled = false
    plugins.credentialManager({
      async fill ({ url }) {
        fillCalled = true
        return {
          username: 'testuser',
          password: 'NoT_rIgHt'
        }
      },
      async approved (auth) {
        approvedCalled = true
      },
      async rejected (auth) {
        rejectedCalled = true
      }
    })
    let err
    try {
      await push({
        gitdir,
        remote: 'auth',
        ref: 'master'
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
