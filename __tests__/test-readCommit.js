/* eslint-env node, browser, jasmine */
const { Errors, readCommit } = require('isomorphic-git')

const { makeFixture } = require('./__helpers__/FixtureFS.js')

describe('readCommit', () => {
  it('test missing', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-readCommit')
    // Test
    let error = null
    try {
      await readCommit({
        fs,
        gitdir,
        oid: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      })
    } catch (err) {
      error = err
    }
    expect(error).not.toBeNull()
    expect(error instanceof Errors.NotFoundError).toBe(true)
  })
  it('parsed', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-readCommit')
    // Test
    const result = await readCommit({
      fs,
      gitdir,
      oid: 'e10ebb90d03eaacca84de1af0a59b444232da99e',
    })
    expect(result).toMatchInlineSnapshot(`
      Object {
        "commit": Object {
          "author": Object {
            "email": "wmhilton@gmail.com",
            "name": "Will Hilton",
            "timestamp": 1502484200,
            "timezoneOffset": 240,
          },
          "committer": Object {
            "email": "wmhilton@gmail.com",
            "name": "Will Hilton",
            "timestamp": 1502484200,
            "timezoneOffset": 240,
          },
          "gpgsig": "-----BEGIN PGP SIGNATURE-----
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
      -----END PGP SIGNATURE-----",
          "message": "Improve resolveRef to handle more kinds of refs. Add tests
      ",
          "parent": Array [
            "b4f8206d9e359416b0f34238cbeb400f7da889a8",
          ],
          "tree": "e0b8f3574060ee24e03e4af3896f65dd208a60cc",
        },
        "oid": "e10ebb90d03eaacca84de1af0a59b444232da99e",
        "payload": "tree e0b8f3574060ee24e03e4af3896f65dd208a60cc
      parent b4f8206d9e359416b0f34238cbeb400f7da889a8
      author Will Hilton <wmhilton@gmail.com> 1502484200 -0400
      committer Will Hilton <wmhilton@gmail.com> 1502484200 -0400
      
      Improve resolveRef to handle more kinds of refs. Add tests
      ",
      }
    `)
  })
  it('from packfile', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-readCommit')
    // Test
    const result = await readCommit({
      fs,
      gitdir,
      oid: '0b8faa11b353db846b40eb064dfb299816542a46',
    })
    expect(result).toMatchInlineSnapshot(`
      Object {
        "commit": Object {
          "author": Object {
            "email": "wmhilton@gmail.com",
            "name": "William Hilton",
            "timestamp": 1508204013,
            "timezoneOffset": 240,
          },
          "committer": Object {
            "email": "wmhilton@gmail.com",
            "name": "William Hilton",
            "timestamp": 1508204013,
            "timezoneOffset": 240,
          },
          "message": "index on master: fbd56b4 Add 'unpkg' key to package.json
      ",
          "parent": Array [
            "fbd56b49d400a19ee185ae735417bdb34c084621",
          ],
          "tree": "4d166e26fcf9fe7b21863436137c44a39a21a90f",
        },
        "oid": "0b8faa11b353db846b40eb064dfb299816542a46",
        "payload": "tree 4d166e26fcf9fe7b21863436137c44a39a21a90f
      parent fbd56b49d400a19ee185ae735417bdb34c084621
      author William Hilton <wmhilton@gmail.com> 1508204013 -0400
      committer William Hilton <wmhilton@gmail.com> 1508204013 -0400
      
      index on master: fbd56b4 Add 'unpkg' key to package.json
      ",
      }
    `)
  })
  it('peels tags', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-readCommit')
    // Test
    const result = await readCommit({
      fs,
      gitdir,
      oid: '587d3f8290b513e2ee85ecd317e6efecd545aee6',
    })
    expect(result.oid).toBe('033417ae18b174f078f2f44232cb7a374f4c60ce')
  })
})
