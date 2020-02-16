/* eslint-env node, browser, jasmine */
const { listTags } = require('isomorphic-git')

const { makeFixture } = require('./__helpers__/FixtureFS.js')

describe('listTags', () => {
  it('listTags', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-listTags')
    // Test
    const refs = await listTags({
      fs,
      gitdir,
    })
    expect(refs).toMatchInlineSnapshot(`
      Array [
        "local-tag",
        "test-tag",
        "v0.0.1",
        "v0.0.10",
        "v0.0.11",
        "v0.0.12",
        "v0.0.13",
        "v0.0.14",
        "v0.0.15",
        "v0.0.16",
        "v0.0.17",
        "v0.0.18",
        "v0.0.19",
        "v0.0.2",
        "v0.0.20",
        "v0.0.21",
        "v0.0.22",
        "v0.0.23",
        "v0.0.24",
        "v0.0.25",
        "v0.0.26",
        "v0.0.27",
        "v0.0.28",
        "v0.0.29",
        "v0.0.3",
        "v0.0.30",
        "v0.0.31",
        "v0.0.32",
        "v0.0.33",
        "v0.0.34",
        "v0.0.35",
        "v0.0.36",
        "v0.0.37",
        "v0.0.38",
        "v0.0.4",
        "v0.0.5",
        "v0.0.6",
        "v0.0.7",
        "v0.0.8",
        "v0.0.9",
        "v0.1.0",
      ]
    `)
  })
})
