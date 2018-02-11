/* global describe it expect */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
const nock = require('nock')
const server = require('./__helpers__/http-backend')

const { getRemoteInfo } = require('isomorphic-git')

describe('getRemoteInfo', () => {
  it('getRemoteInfo', async () => {
    // Setup
    let { fs, dir, gitdir } = await makeFixture('test-getRemoteInfo')
    // Test
    const { get } = server(dir)
    nock('http://example.localhost')
      .get(/.*/)
      .reply(200, get)

    let remote = await getRemoteInfo({
      url: 'http://example.localhost/isomorphic-git.git'
    })
    // Note: we don't compare 'remote' in its entireity because
    // remote.capabilities includes the useragent of "git" which
    // is windows locally and linux in Travis etc.
    // However the refs should be deterministic.
    expect(remote.refs).toMatchSnapshot()
  })
})
