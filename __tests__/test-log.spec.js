/* global describe it expect */
const { expectjs, registerSnapshots } = require('jasmine-snapshot')
const { makeFixture } = require('./__helpers__/FixtureFS.js')
const { log } = require('..')

describe('log', () => {
  beforeAll(() => {
    registerSnapshots(require('./test-log.snap'), 'log')
  })
  it('HEAD', async () => {
    let { fs, gitdir } = await makeFixture('test-log')
    let commits = await log({ fs, gitdir, ref: 'HEAD' })
    expect(commits.length).toBe(5)
    // TODO: get working snapshot
    // expectjs(commits).toMatchSnapshot()
  })
  it('HEAD depth', async () => {
    let { fs, gitdir } = await makeFixture('test-log')
    let commits = await log({ fs, gitdir, ref: 'HEAD', depth: 1 })
    expect(commits.length).toBe(1)
  })
  it('HEAD since', async () => {
    let { fs, gitdir } = await makeFixture('test-log')
    let commits = await log({
      fs,
      gitdir,
      ref: 'HEAD',
      since: new Date(1501462174000)
    })
    expect(commits.length).toBe(2)
  })
  it('test-branch', async () => {
    let { fs, gitdir } = await makeFixture('test-log')
    let commits = await log({ fs, gitdir, ref: 'origin/test-branch' })
    // TODO: get working snapshot
    // expectjs(commits).toMatchSnapshot()
  })
})
