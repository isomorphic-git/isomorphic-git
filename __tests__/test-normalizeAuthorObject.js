/* eslint-env node, browser, jasmine */

const { setConfig } = require('isomorphic-git')
const { normalizeAuthorObject } = require('isomorphic-git/internal-apis')

const { makeFixture } = require('./__helpers__/FixtureFS.js')

describe('normalizeAuthorObject', () => {
  it('return author if all properties are populated', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-normalizeAuthorObject')

    await setConfig({
      fs,
      gitdir,
      path: 'user.name',
      value: `user-config`,
    })

    await setConfig({
      fs,
      gitdir,
      path: 'user.name',
      value: `user-config@example.com`,
    })

    // Test
    const author = {
      name: 'user',
      email: 'user@example.com',
      timestamp: 1720159690,
      timezoneOffset: -120,
    }

    expect(await normalizeAuthorObject({ fs, gitdir, author })).toEqual(author)
  })

  it('return config values and new timestamp if no author was provided', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-normalizeAuthorObject')

    await setConfig({
      fs,
      gitdir,
      path: 'user.name',
      value: `user-config`,
    })

    await setConfig({
      fs,
      gitdir,
      path: 'user.email',
      value: `user-config@example.com`,
    })

    // Test
    const author = await normalizeAuthorObject({ fs, gitdir })
    expect(author.name).toEqual('user-config')
    expect(author.email).toEqual('user-config@example.com')
    expect(typeof author.timestamp).toBe('number')
    expect(typeof author.timezoneOffset).toBe('number')
  })

  it('return undefined if no value can be retrieved', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-normalizeAuthorObject')

    // Test
    expect(await normalizeAuthorObject({ fs, gitdir })).toBeUndefined()
  })
})
