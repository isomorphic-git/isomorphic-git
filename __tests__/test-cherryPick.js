/* eslint-env node, browser, jasmine */
const { cherryPick, log } = require('isomorphic-git')

const { makeFixture } = require('./__helpers__/FixtureFS.js')

describe('cherry-pick', () => {
  it("cherry-pick commit from b into a (no conflict)'", async () => {
    // Setup
    const { fs, dir } = await makeFixture('test-cherryPick')

    // Test
    const cpCommitExpected = (
      await log({
        fs,
        dir,
        depth: 1,
        ref: 'v',
      })
    )[0].commit

    const report = await cherryPick({
      fs,
      dir,
      ours: 'a',
      theirs: 'd7676dfe102cd28ec794b25f9a6231af0cdfd16d',
      author: {
        name: 'Mr. Test',
        email: 'mrtest@example.com',
        timestamp: 1262356920,
        timezoneOffset: -0,
      },
    })
    const cpCommitActual = (
      await log({
        fs,
        dir,
        ref: 'a',
        depth: 1,
      })
    )[0].commit

    expect(report.tree).toBe(cpCommitExpected.tree)
    expect(cpCommitExpected.tree).toEqual(cpCommitActual.tree)
    expect(cpCommitExpected.message).toEqual(cpCommitActual.message)
  })
})
