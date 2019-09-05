/* eslint-env node, browser, jasmine */
// @ts-ignore
const snapshots = require('./__snapshots__/test-getRemoteInfo.js.snap')
const registerSnapshots = require('./__helpers__/jasmine-snapshots')
const { E, getRemoteInfo } = require('isomorphic-git')

describe('getRemoteInfo', () => {
  beforeAll(() => {
    registerSnapshots(snapshots)
  })
  it('getRemoteInfo', async () => {
    const info = await getRemoteInfo({
      url: 'http://localhost:8888/test-dumb-http-server.git'
    })
    expect(info).not.toBeNull()
    expect(info.capabilities).not.toBeNull()
    expect(info.refs).not.toBeNull()
    expect(info.refs).toMatchSnapshot()
  })
  ;(process.browser ? it : xit)(
    'detects "dumb" HTTP server responses',
    async () => {
      let error = null
      try {
        await getRemoteInfo({
          url:
            'http://localhost:9876/base/__tests__/__fixtures__/test-dumb-http-server.git'
        })
      } catch (err) {
        error = err
      }
      expect(error).not.toBeNull()
      expect(error.code).toBe(E.RemoteDoesNotSupportSmartHTTP)
    }
  )
})
