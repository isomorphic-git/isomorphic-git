/* eslint-env node, browser, jasmine */
const { uploadPack, collect } = require('isomorphic-git/internal-apis')

const { makeFixture } = require('./__helpers__/FixtureFS.js')

describe('uploadPack', () => {
  it('advertiseRefs: true', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-uploadPack')
    const res = await uploadPack({ fs, gitdir, advertiseRefs: true })
    const buffer = Buffer.from(await collect(res))
    expect(buffer.toString('utf8')).toBe(
      `00f15a8905a02e181fe1821068b8c0f48cb6633d5b81 HEAD\0thin-pack side-band side-band-64k shallow deepen-since deepen-not allow-tip-sha1-in-want allow-reachable-sha1-in-want symref=HEAD:refs/heads/master agent=git/isomorphic-git@0.0.0-development
003f5a8905a02e181fe1821068b8c0f48cb6633d5b81 refs/heads/master
0000`
    )
  })
})
