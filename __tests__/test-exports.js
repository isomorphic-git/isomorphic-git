/* eslint-env node, browser, jasmine */
const snapshots = require('./__snapshots__/test-exports.js.snap')
const registerSnapshots = require('./__helpers__/jasmine-snapshots')

const git = require('isomorphic-git')

describe('exports', () => {
  beforeAll(() => {
    registerSnapshots(snapshots)
  })
  it('exposes only the intended API functions', async () => {
    let names = Object.keys(git)
    expect(names).toMatchSnapshot()
  })
})
