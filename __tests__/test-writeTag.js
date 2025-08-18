/* eslint-env node, browser, jasmine */
const { writeTag } = require('isomorphic-git')

const { makeFixture } = require('./__helpers__/FixtureFS.js')

// NOTE: These are mostly the `readObject` tests but in reverse
describe('writeTag', () => {
  it('annotated tag', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-writeTag')
    // Test
    const oid = await writeTag({
      fs,
      gitdir,
      tag: {
        object: 'af4d84a6a9fa7a74acdad07fddf9f17ff3a974ae',
        type: 'commit',
        tag: 'v0.0.9',
        tagger: {
          name: 'Will Hilton',
          email: 'wmhilton@gmail.com',
          timestamp: 1507071414,
          timezoneOffset: 240,
        },
        message: '0.0.9',
        gpgsig: `-----BEGIN PGP SIGNATURE-----
Version: GnuPG v1

iQIcBAABAgAGBQJZ1BW2AAoJEJYJuKWSi6a5S6EQAJQkK+wIXijDf4ZfVeP1E7Be
aDDdOLga0/gj5p2p081TLLlaKKLcYj2pub8BfFVpEmvT0QRaKaMb+wAtO5PBHTbn
y2s3dCmqqAPQa0AXrChverKomK/gUYZfFzckS8GaJTiw2RyvheXOLOEGSLTHOwy2
wjP8KxGOWfHlXZEhn/Z406OlcYMzMSL70H26pgyggSTe5RNfpXEBAgWmIAA51eEM
9tF9xuijc0mlr6vzxYVmfwat4u38nrwX7JvWp2CvD/qwILMAYGIcZqRXK5jWHemD
/x5RtUGU4cr47++FD3N3zBWx0dBiCMNUwT/v68kmhrBVX20DhcC6UX38yf1sdDfZ
yapht2+TakKQuw/T/K/6bFjoa8MIHdAx7WCnMV84M0qfMr+e9ImeH5Hj592qw4Gh
vSY80gKslkXjRnVes7VHXoL/lVDvCM2VNskWTTLGHqt+rIvSXNFGP05OGtdFYu4d
K9oFVEoRPFTRSeF/9EztyeLb/gtSdBmWP2AhZn9ip0a7rjbyv5yeayZTsedoUfe5
o8cB++UXreD+h3c/F6mTRs8aVELhQTZNZ677PY71HJKsCLbQJAd4n+gS1n8Y/7wv
Zp4YxnShDkMTV3rxZc27vehq2g9gKJzQsueLyZPJTzCHqujumiLbdYV4i4X4CZjy
dBWrLc3kdnemrlhSRzR2
=PrR1
-----END PGP SIGNATURE-----
`,
      },
    })
    expect(oid).toEqual('6e90dfd7573404a225888071ecaa572882b4e45c')
  })
})
