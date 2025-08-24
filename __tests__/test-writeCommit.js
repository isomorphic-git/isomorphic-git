/* eslint-env node, browser, jasmine */
const { writeCommit } = require('isomorphic-git')

const { makeFixture } = require('./__helpers__/FixtureFS.js')

describe('writeCommit', () => {
  it('parsed', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-writeCommit')
    // Test
    const oid = await writeCommit({
      fs,
      gitdir,
      commit: {
        author: {
          email: 'wmhilton@gmail.com',
          name: 'Will Hilton',
          timestamp: 1502484200,
          timezoneOffset: 240,
        },
        committer: {
          email: 'wmhilton@gmail.com',
          name: 'Will Hilton',
          timestamp: 1502484200,
          timezoneOffset: 240,
        },
        gpgsig: `-----BEGIN PGP SIGNATURE-----
Version: GnuPG v1

iQIcBAABAgAGBQJZjhboAAoJEJYJuKWSi6a5V5UP/040SfemJ13PRBXst2eB59gs
3hPx29DRKBhFtvk+uS+8523/hUfry2oeWWd6YRkcnkxxAUtBnfzVkI9AgRIc1NTM
h5XtLMQubCAKw8JWvVvoXETzwVAODmdmvC4WSQCLu+opoe6/W7RvkrTD0pbkwH4E
MXoha59sIWZ/FacZX6ByYqhFykfJL8gCFvRSzjiqBIbsP7Xq2Mh4jkAKYl5zxV3u
qCk26hnhL++kwfXlu2YdGtB9+lj3pk1NeWqR379zRzh4P10FxXJ18qSxczbkAFOY
6o5h7a/Mql1KqWB9EFBupCpjydmpAtPo6l1Us4a3liB5LJvCh9xgR2HtShR4b97O
nIpXP4ngy4z9UyrXXxxpiQQn/kVn/uKgtvGp8nOFioo61PCi9js2QmQxcsuBOeO+
DdFq5k2PMNZLwizt4P8EGfVJoPbLhdYP4oWiMCuYV/2fNh0ozl/q176HGszlfrke
332Z0maJ3A5xIRj0b7vRNHV8AAl9Dheo3LspjeovP2iycCHFP03gSpCKdLRBRC4T
X10BBFD8noCMXJxb5qenrf+eKRd8d4g7JtcyzqVgkBQ68GIG844VWRBolOzx4By5
cAaw/SYIZG3RorAc11iZ7sva0jFISejmEzIebuChSzdWO2OOWRVvMdhyZwDLUgAb
Qixh2bmPgr3h9nxq2Dmn
=4+DN
-----END PGP SIGNATURE-----`,
        message: 'Improve resolveRef to handle more kinds of refs. Add tests\n',
        parent: ['b4f8206d9e359416b0f34238cbeb400f7da889a8'],
        tree: 'e0b8f3574060ee24e03e4af3896f65dd208a60cc',
      },
    })
    expect(oid).toEqual('e10ebb90d03eaacca84de1af0a59b444232da99e')
  })
})
