/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')

const { config, push, E } = require('isomorphic-git')

// this is so it works with either Node local tests or Browser WAN tests
const localhost =
  typeof window === 'undefined' ? 'localhost' : window.location.hostname

describe('credentialManager', () => {
  it('with valid credentials', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-push')
    await config({
      fs,
      gitdir,
      path: 'remote.auth.url',
      value: `http://${localhost}:8888/test-push-server-auth.git`
    })
    // Test
    let fillCalled = false
    let approvedCalled = false
    let rejectedCalled = false
    await push({
      fs,
      gitdir,
      remote: 'auth',
      ref: 'master',
      async onFill ({ url }) {
        fillCalled = true
        return {
          username: 'testuser',
          password: 'testpassword'
        }
      },
      async onApproved (auth) {
        approvedCalled = true
      },
      async onRejected (auth) {
        rejectedCalled = true
      }
    })
    expect(fillCalled).toBe(true)
    expect(approvedCalled).toBe(true)
    expect(rejectedCalled).toBe(false)
  })
  it('with invalid credentials', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-push')
    await config({
      fs,
      gitdir,
      path: 'remote.auth.url',
      value: `http://${localhost}:8888/test-push-server-auth.git`
    })
    // Test
    let fillCalled = false
    let approvedCalled = false
    let rejectedCalled = false
    let err
    try {
      await push({
        fs,
        gitdir,
        remote: 'auth',
        ref: 'master',
        async onFill ({ url }) {
          fillCalled = true
          return {
            username: 'testuser',
            password: 'NoT_rIgHt'
          }
        },
        async onApproved (auth) {
          approvedCalled = true
        },
        async onRejected (auth) {
          rejectedCalled = true
        }
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
