/* eslint-env node, browser, jasmine */
const snapshots = require('./__snapshots__/server-only.test-getRemoteInfo.js.snap')
const registerSnapshots = require('./__helpers__/jasmine-snapshots')
const nock = require('nock')
const path = require('path')

const { getRemoteInfo } = require('isomorphic-git')

// TODO: Get nock working in browser
describe('getRemoteInfo', () => {
  beforeAll(() => {
    registerSnapshots(snapshots)
    nock.back.fixtures = path.join(__dirname, '__nockbacks__')
  })

  it('getRemoteInfo', async () => {
    // Setup
    let { nockDone } = await nock.back('getRemoteInfo - getRemoteInfo.json')
    // Test
    let remote = await getRemoteInfo({
      url: 'https://github.com/isomorphic-git/isomorphic-git.git'
    })
    // Note: we don't compare 'remote' in its entireity because
    // remote.capabilities includes the useragent of "git" which
    // is windows locally and linux in Travis etc.
    // However the refs should be deterministic.
    expect(remote.refs).toMatchSnapshot()
    nockDone()
  })
})
