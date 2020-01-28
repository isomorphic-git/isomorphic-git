/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
const registerSnapshots = require('./__helpers__/jasmine-snapshots')
// @ts-ignore
const snapshots = require('./__snapshots__/test-log.js.snap')
const { log } = require('isomorphic-git')
const { pgp } = require('@isomorphic-git/pgp-plugin')

describe('log', () => {
  beforeAll(() => {
    registerSnapshots(snapshots)
  })
  it('HEAD', async () => {
    const { gitdir } = await makeFixture('test-log')
    const commits = await log({ gitdir, ref: 'HEAD' })
    expect(commits.length).toBe(5)
    expect(commits).toMatchSnapshot()
  })
  it('HEAD depth', async () => {
    const { gitdir } = await makeFixture('test-log')
    const commits = await log({ gitdir, ref: 'HEAD', depth: 1 })
    expect(commits.length).toBe(1)
  })
  it('HEAD since', async () => {
    const { gitdir } = await makeFixture('test-log')
    const commits = await log({
      gitdir,
      ref: 'HEAD',
      since: new Date(1501462174000)
    })
    expect(commits.length).toBe(2)
  })
  it('shallow branch', async () => {
    const { gitdir } = await makeFixture('test-log')
    const commits = await log({ gitdir, ref: 'origin/shallow-branch' })
    expect(commits).toMatchSnapshot()
  })
  it('has signing payloads', async () => {
    // Setup
    const { gitdir } = await makeFixture('test-log')
    // Test
    const commits = await log({ gitdir, ref: 'HEAD' })
    expect(commits.length).toBe(5)
    expect(commits).toMatchSnapshot()
    // Verify
    for (const commit of commits) {
      const { valid } = await pgp.verify({
        payload: commit.payload,
        publicKey: `-----BEGIN PGP PUBLIC KEY BLOCK-----

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
dGs=
=QSo+
-----END PGP PUBLIC KEY BLOCK-----`,
        signature: commit.commit.gpgsig
      })
      expect(valid).toEqual(['9609b8a5928ba6b9'])
    }
  })
  it('with complex merging history', async () => {
    const { gitdir } = await makeFixture('test-log-complex')
    const commits = await log({ gitdir, ref: 'master' })
    expect(commits).toMatchSnapshot()
  })
})
