/* eslint-env node, browser, jasmine */
const { listCommitsAndTags } = require('isomorphic-git/internal-apis')

const { makeFixture } = require('./__helpers__/FixtureFS.js')

describe('listCommitsAndTags', () => {
  it('listCommitsAndTags', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-listCommitsAndTags')
    // Test
    const commits = await listCommitsAndTags({
      fs,
      gitdir,
      start: ['c60bbbe99e96578105c57c4b3f2b6ebdf863edbc'],
      finish: ['c77052f99c33dbe3d2a120805fcebe9e2194b6f9'],
    })
    expect([...commits]).toMatchInlineSnapshot(`
      Array [
        "c60bbbe99e96578105c57c4b3f2b6ebdf863edbc",
        "e05547ea87ea55eff079de295ff56f483e5b4439",
        "ebdedf722a3ec938da3fd53eb74fdea55c48a19d",
        "0518502faba1c63489562641c36a989e0f574d95",
      ]
    `)
  })
})
