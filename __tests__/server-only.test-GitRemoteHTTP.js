/* global describe it expect */
const server = require('./__helpers__/http-backend')
const { managers } = require('isomorphic-git/internal-apis')
const { GitRemoteHTTP } = managers

const nock = require('nock')
const path = require('path')

const { get } = server('__tests__/__fixtures__')

describe('GitRemoteHTTP', () => {
  beforeAll(() => {
    nock.back.fixtures = path.join(__dirname, '__nockbacks__')
  })
  it('preparePull (Github response)', async () => {
    // Setup
    let { nockDone } = await nock.back(
      'GitRemoteHTTP - preparePull (Github response).json'
    )
    // Test
    let remote = await GitRemoteHTTP.preparePull({
      url: 'https://github.com/isomorphic-git/isomorphic-git'
    })
    expect(remote).toBeTruthy()
    expect(remote.symrefs.size > 0)
    expect(remote.symrefs.get('HEAD')).toBe('refs/heads/master')
    // Teardown
    nockDone()
  })

  it('preparePull (mock response)', async () => {
    // Setup
    let { nockDone } = await nock.back(
      'GitRemoteHTTP - preparePull (mock response).json'
    )
    // Test
    let remote = await GitRemoteHTTP.preparePull({
      url: 'http://example.dev/test-GitRemoteHTTP'
    })
    expect(remote).toBeTruthy()
    // Teardown
    nockDone()
  })

  it('preparePush (mock response)', async () => {
    // Setup
    let { nockDone } = await nock.back(
      'GitRemoteHTTP - preparePush (mock response).json'
    )
    // Test
    let remote = await GitRemoteHTTP.preparePush({
      url: 'http://example.dev/test-GitRemoteHTTP'
    })
    expect(remote).toBeTruthy()
    // Teardown
    nockDone()
  })
})
