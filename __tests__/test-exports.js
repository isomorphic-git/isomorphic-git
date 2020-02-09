/* eslint-env node, browser, jasmine */
// @ts-ignore
const snapshots = require('./__snapshots__/test-exports.js.snap')
const registerSnapshots = require('./__helpers__/jasmine-snapshots')

const git = require('isomorphic-git')

describe('exports', () => {
  beforeAll(() => {
    registerSnapshots(snapshots)
  })
  it('exposes only the intended API functions', async () => {
    const names = Object.keys(git)
    expect(names.sort()).toMatchSnapshot()
  })
})
