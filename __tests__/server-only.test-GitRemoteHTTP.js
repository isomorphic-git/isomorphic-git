/* eslint-env node, browser, jasmine */
const { GitRemoteHTTP } = require('isomorphic-git/internal-apis')

const nock = require('nock')
const path = require('path')

describe('GitRemoteHTTP', () => {
  beforeAll(() => {
    nock.back.fixtures = path.join(__dirname, '__nockbacks__')
  })

  it('capabilities', async () => {
    // Test
    const caps = await GitRemoteHTTP.capabilities()
    expect(caps).toEqual(expect.arrayContaining(['discover', 'connect']))
  })

  it('preparePull (Github response)', async () => {
    // Setup
    const { nockDone } = await nock.back(
      'GitRemoteHTTP - preparePull (Github response).json'
    )
    // Test
    const remote = await GitRemoteHTTP.discover({
      core: 'default',
      service: 'git-upload-pack',
      url: 'https://github.com/isomorphic-git/isomorphic-git',
      headers: {}
    })
    expect(remote).toBeTruthy()
    expect(remote.symrefs.size > 0)
    expect(remote.symrefs.get('HEAD')).toBe('refs/heads/master')
    // Teardown
    nockDone()
  })

  it('preparePull (mock response)', async () => {
    // Setup
    const { nockDone } = await nock.back(
      'GitRemoteHTTP - preparePull (mock response).json'
    )
    // Test
    const remote = await GitRemoteHTTP.discover({
      core: 'default',
      service: 'git-upload-pack',
      url: 'http://example.dev/test-GitRemoteHTTP',
      headers: {}
    })
    expect(remote).toBeTruthy()
    // Teardown
    nockDone()
  })

  it('preparePush (mock response)', async () => {
    // Setup
    const { nockDone } = await nock.back(
      'GitRemoteHTTP - preparePush (mock response).json'
    )
    // Test
    const remote = await GitRemoteHTTP.discover({
      core: 'default',
      service: 'git-receive-pack',
      url: 'http://example.dev/test-GitRemoteHTTP',
      headers: {}
    })
    expect(remote).toBeTruthy()
    // Teardown
    nockDone()
  })

  it('handle HTTP error codes', async () => {
    // Setup
    /* Nock is broken, see https://github.com/node-nock/nock/issues/469 */
    // Test
    let error = null
    try {
      await GitRemoteHTTP.discover({
        core: 'default',
        service: 'git-receive-pack',
        url: 'https://github.com/isomorphic-git/not-there',
        discover: {},
        headers: {}
      })
    } catch (err) {
      error = err
    }
    expect(error).not.toBeNull()
    expect(error.message).toBe('HTTP Error: 401 Authorization Required')
  })
})
