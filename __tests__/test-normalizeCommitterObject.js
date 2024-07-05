/* eslint-env node, browser, jasmine */

const { setConfig } = require('isomorphic-git')
const { normalizeCommitterObject } = require('isomorphic-git/internal-apis')

const { makeFixture } = require('./__helpers__/FixtureFS.js')

describe('normalizeCommitterObject', () => {
  it('return committer if all properties are populated', async () => {
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
      name: 'user-author',
      email: 'user-author@example.com',
      timestamp: 1720159690,
      timezoneOffset: -120,
    }

    const committer = {
      name: 'user-author',
      email: 'user-author@example.com',
      timestamp: 1720165308,
      timezoneOffset: -60,
    }

    expect(
      await normalizeCommitterObject({ fs, gitdir, author, committer })
    ).toEqual(committer)
  })

  it('return author values if no committer was provided', async () => {
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
    const author = {
      name: 'user-author',
      email: 'user-author@example.com',
      timestamp: 1720159690,
      timezoneOffset: -120,
    }

    expect(await normalizeCommitterObject({ fs, gitdir, author })).toEqual(
      author
    )
  })

  it('return config values and new timestamp if no author or committer was provided', async () => {
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
    const committer = await normalizeCommitterObject({ fs, gitdir })
    expect(committer.name).toEqual('user-config')
    expect(committer.email).toEqual('user-config@example.com')
    expect(typeof committer.timestamp).toBe('number')
    expect(typeof committer.timezoneOffset).toBe('number')
  })

  it('return undefined if no value can be retrieved', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-normalizeAuthorObject')

    // Test
    expect(await normalizeCommitterObject({ fs, gitdir })).toBeUndefined()
  })
})
