/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
const registerSnapshots = require('./__helpers__/jasmine-snapshots')
// @ts-ignore
const snapshots = require('./__snapshots__/test-log.js.snap')
const { log } = require('isomorphic-git')

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
  it('test-branch', async () => {
    const { gitdir } = await makeFixture('test-log')
    const commits = await log({ gitdir, ref: 'origin/test-branch' })
    expect(commits).toMatchSnapshot()
  })
  it('with signing payloads', async () => {
    // Setup
    const openpgp = require('openpgp/dist/openpgp.min.js')
    const { gitdir } = await makeFixture('test-log')
    // Test
    const commits = await log({ gitdir, ref: 'HEAD', signing: true })
    expect(commits.length).toBe(5)
    expect(commits).toMatchSnapshot()
    // Verify
    for (const commit of commits) {
      const msg = openpgp.message.readSignedContent(
        commit.payload,
        commit.gpgsig
      )
      const keys = msg.getSigningKeyIds().map(keyid => keyid.toHex())
      expect(keys).toEqual(['9609b8a5928ba6b9'])
    }
  })
  it('with complex merging history', async () => {
    const { gitdir } = await makeFixture('test-log-complex')
    const commits = await log({ gitdir, ref: 'master' })
    expect(commits).toMatchSnapshot()
  })
})
