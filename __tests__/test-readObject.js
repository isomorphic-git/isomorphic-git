/* eslint-env node, browser, jasmine */
const { Errors, readObject } = require('isomorphic-git')

const { makeFixture } = require('./__helpers__/FixtureFS.js')

describe('readObject', () => {
  it('test missing', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-readObject')
    // Test
    let error = null
    try {
      await readObject({
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
    const { fs, gitdir } = await makeFixture('test-readObject')
    // Test
    const ref = await readObject({
      fs,
      gitdir,
      oid: 'e10ebb90d03eaacca84de1af0a59b444232da99e',
    })
    expect(ref).toMatchInlineSnapshot(`
      Object {
        "format": "parsed",
        "object": Object {
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
        "source": "objects/e1/0ebb90d03eaacca84de1af0a59b444232da99e",
        "type": "commit",
      }
    `)
    expect(ref.format).toEqual('parsed')
    expect(ref.type).toEqual('commit')
  })
  it('content', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-readObject')
    // Test
    const ref = await readObject({
      fs,
      gitdir,
      oid: 'e10ebb90d03eaacca84de1af0a59b444232da99e',
      format: 'content',
    })
    expect(ref.format).toEqual('content')
    expect(ref.type).toEqual('commit')
    expect(ref.source).toBe('objects/e1/0ebb90d03eaacca84de1af0a59b444232da99e')
    if (ref.format !== 'content') throw new Error('wrong type')
    expect(Buffer.from(ref.object).toString('hex')).toMatchInlineSnapshot(
      '"7472656520653062386633353734303630656532346530336534616633383936663635646432303861363063630a706172656e7420623466383230366439653335393431366230663334323338636265623430306637646138383961380a617574686f722057696c6c2048696c746f6e203c776d68696c746f6e40676d61696c2e636f6d3e2031353032343834323030202d303430300a636f6d6d69747465722057696c6c2048696c746f6e203c776d68696c746f6e40676d61696c2e636f6d3e2031353032343834323030202d303430300a677067736967202d2d2d2d2d424547494e20504750205349474e41545552452d2d2d2d2d0a2056657273696f6e3a20476e7550472076310a200a2069514963424141424167414742514a5a6a68626f41416f4a454a594a754b575369366135563555502f3034305366656d4a3133505242587374326542353967730a2033685078323944524b42684674766b2b75532b383532332f6855667279326f655757643659526b636e6b7878415574426e667a566b49394167524963314e544d0a20683558744c4d51756243414b77384a577656766f5845547a7756414f446d646d764334575351434c752b6f706f65362f573752766b7254443070626b774834450a204d586f686135397349575a2f4661635a5836427959716846796b664a4c386743467652537a6a69714249627350375871324d68346a6b414b596c357a785633750a2071436b3236686e684c2b2b6b7766586c75325964477442392b6c6a33706b314e655771523337397a527a68345031304678584a3138715378637a626b41464f590a20366f356837612f4d716c314b71574239454642757043706a79646d704174506f366c3155733461336c6942354c4a76436839786752324874536852346239374f0a206e49705850346e6779347a3955797258587878706951516e2f6b566e2f754b6774764770386e4f46696f6f3631504369396a7332516d5178637375424f654f2b0a2044644671356b32504d4e5a4c77697a74345038454766564a6f50624c68645950346f57694d437559562f32664e68306f7a6c2f713137364847737a6c66726b650a203333325a306d614a3341357849526a30623776524e48563841416c394468656f334c73706a656f765032697963434846503033675370434b644c5242524334540a2058313042424644386e6f434d584a78623571656e72662b654b526438643467374a7463797a7156676b42513638474947383434565752426f6c4f7a78344279350a20634161772f5359495a4733526f7241633131695a37737661306a464953656a6d457a496562754368537a64574f324f4f575256764d6468795a77444c556741620a205169786832626d5067723368396e787132446d6e0a203d342b444e0a202d2d2d2d2d454e4420504750205349474e41545552452d2d2d2d2d0a0a496d70726f7665207265736f6c766552656620746f2068616e646c65206d6f7265206b696e6473206f6620726566732e204164642074657374730a"'
    )
  })
  it('wrapped', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-readObject')
    // Test
    const ref = await readObject({
      fs,
      gitdir,
      oid: 'e10ebb90d03eaacca84de1af0a59b444232da99e',
      format: 'wrapped',
    })
    expect(ref.format).toEqual('wrapped')
    expect(ref.type).toEqual('wrapped')
    expect(ref.source).toBe('objects/e1/0ebb90d03eaacca84de1af0a59b444232da99e')
    if (ref.format !== 'wrapped') throw new Error('wrong type')
    expect(Buffer.from(ref.object).toString('hex')).toMatchInlineSnapshot(
      '"636f6d6d69742031313133007472656520653062386633353734303630656532346530336534616633383936663635646432303861363063630a706172656e7420623466383230366439653335393431366230663334323338636265623430306637646138383961380a617574686f722057696c6c2048696c746f6e203c776d68696c746f6e40676d61696c2e636f6d3e2031353032343834323030202d303430300a636f6d6d69747465722057696c6c2048696c746f6e203c776d68696c746f6e40676d61696c2e636f6d3e2031353032343834323030202d303430300a677067736967202d2d2d2d2d424547494e20504750205349474e41545552452d2d2d2d2d0a2056657273696f6e3a20476e7550472076310a200a2069514963424141424167414742514a5a6a68626f41416f4a454a594a754b575369366135563555502f3034305366656d4a3133505242587374326542353967730a2033685078323944524b42684674766b2b75532b383532332f6855667279326f655757643659526b636e6b7878415574426e667a566b49394167524963314e544d0a20683558744c4d51756243414b77384a577656766f5845547a7756414f446d646d764334575351434c752b6f706f65362f573752766b7254443070626b774834450a204d586f686135397349575a2f4661635a5836427959716846796b664a4c386743467652537a6a69714249627350375871324d68346a6b414b596c357a785633750a2071436b3236686e684c2b2b6b7766586c75325964477442392b6c6a33706b314e655771523337397a527a68345031304678584a3138715378637a626b41464f590a20366f356837612f4d716c314b71574239454642757043706a79646d704174506f366c3155733461336c6942354c4a76436839786752324874536852346239374f0a206e49705850346e6779347a3955797258587878706951516e2f6b566e2f754b6774764770386e4f46696f6f3631504369396a7332516d5178637375424f654f2b0a2044644671356b32504d4e5a4c77697a74345038454766564a6f50624c68645950346f57694d437559562f32664e68306f7a6c2f713137364847737a6c66726b650a203333325a306d614a3341357849526a30623776524e48563841416c394468656f334c73706a656f765032697963434846503033675370434b644c5242524334540a2058313042424644386e6f434d584a78623571656e72662b654b526438643467374a7463797a7156676b42513638474947383434565752426f6c4f7a78344279350a20634161772f5359495a4733526f7241633131695a37737661306a464953656a6d457a496562754368537a64574f324f4f575256764d6468795a77444c556741620a205169786832626d5067723368396e787132446d6e0a203d342b444e0a202d2d2d2d2d454e4420504750205349474e41545552452d2d2d2d2d0a0a496d70726f7665207265736f6c766552656620746f2068616e646c65206d6f7265206b696e6473206f6620726566732e204164642074657374730a"'
    )
  })
  it('deflated', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-readObject')
    // Test
    const ref = await readObject({
      fs,
      gitdir,
      oid: 'e10ebb90d03eaacca84de1af0a59b444232da99e',
      format: 'deflated',
    })
    expect(ref.format).toEqual('deflated')
    expect(ref.type).toEqual('deflated')
    expect(ref.source).toBe('objects/e1/0ebb90d03eaacca84de1af0a59b444232da99e')
    if (ref.format !== 'deflated') throw new Error('wrong type')
    expect(Buffer.from(ref.object).toString('hex')).toMatchInlineSnapshot(
      '"78019d93c9cea3481084e7cc53d4ddea76010586d1cc68001b0cde30fc06ec1b4b4161966237e6e9dbd373ed53e729158a487d522a625a55f9005896e5ff183a8c01869194f2c206411162cc210c798cc294976431158524e1a0148a308e9926ec703d8008a51207c544c6bc2023568c60ca238e97e2084708c274938492248712138e03a11df0f3b204fbbc1c680dfe7a55e4e7f66f568579f93da6d53f8015208724c44108bec1cf05e6a37e1007fc3bd9acc9fa3c03dffe1b75679867601b36704de3ac7cdd9cdd4f9d011eeefa9cd67f02a31e6d034c2c0318905fcd58551455c91443bd5a8f2789a8a2506b67ddadf1e0bbb9180a9e70b3d71f4837c595c5f2b6a306fdc0615590b39e013cb1674ede3a0795e8c354ac467725091cbf26b7b47b7314fb7e22de9d22ae8b79566e835aa78b5798b2923966cc9ebf4e0c2042301c4fd731d294c34bb2fcc99b68b0fb5a5e9e72d956493569c877afda715cd1866271ed6f9ca9e8beb6b0898ad71eed18700a280905b937fdc75a0fe34720aaef7b4bf477915a4729d3f4c9719767deaa66d4db9ba0e54e043d0be5702f8565f6f89101ad567022a9c971b52a5e69508edc3d3106555e954fbe29d833f65b87dfc88bb31064b3509f038b955a778e97a850f4cb9d012215c8265c9fda923db4be2aef74756cb4e6f94eaa46196c2a96ecad47215fe6aa70b4268dc873e670fbc1250e8ae4cd8501b5d90436aab3375ae4dbbb0b82796ef2ebb55e175ebd1e0fd930198d545ff49c5291b5b55c7ef6dcb5bace713faa177c5931609be8ad5070f6e9fc38bef26540b6b43352cfa2767424c9dd46d4cf4fda78f7d65c7a26902ee5ba6537e2dee89732ed0afcf926cf3d60155abc22cca6f384d16672ce7b4f529452de124cf963df3c319d6c2e7fc7da5eb7219fb98d76488e8eea68e88b01010b5555df4a35d54e813547428beb2e5de183934809ca36d610bf97d6cb0af52a4a8669480879bea3d2f2b2cc487d0b0c8895f0b576efe6c3e01dda2931cbe68f4d3f85f0a99b2e7e56bbc5c4d1a8117749fc0b77b9f88e379d12f27ebcb6c75ba6440cb8e633e1a2cace3a9ec8f5dc72dbaa66c0df68b53d33ffd76477defeaa248c59351d9d30e8704fcb093b3805030524ac9312838a761814799df480a61f4bda7f074a928001f743cffc00fa8263c9"'
    )
  })
  it('from packfile deflated', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-readObject')
    // Test
    const ref = await readObject({
      fs,
      gitdir,
      oid: '0b8faa11b353db846b40eb064dfb299816542a46',
      format: 'deflated',
    })
    // packed objects will always be returned as 'content' format
    expect(ref.format).toEqual('content')
    expect(ref.type).toEqual('commit')
    expect(ref.source).toBe(
      'objects/pack/pack-1a1e70d2f116e8cb0cb42d26019e5c7d0eb01888.pack'
    )
    if (ref.format !== 'content') throw new Error('wrong type')
    expect(Buffer.from(ref.object).toString('hex')).toMatchInlineSnapshot(
      `"7472656520346431363665323666636639666537623231383633343336313337633434613339613231613930660a706172656e7420666264353662343964343030613139656531383561653733353431376264623334633038343632310a617574686f722057696c6c69616d2048696c746f6e203c776d68696c746f6e40676d61696c2e636f6d3e2031353038323034303133202d303430300a636f6d6d69747465722057696c6c69616d2048696c746f6e203c776d68696c746f6e40676d61696c2e636f6d3e2031353038323034303133202d303430300a0a696e646578206f6e206d61737465723a2066626435366234204164642027756e706b6727206b657920746f207061636b6167652e6a736f6e0a"`
    )
  })
  it('from packfile wrapped', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-readObject')
    // Test
    const ref = await readObject({
      fs,
      gitdir,
      oid: '0b8faa11b353db846b40eb064dfb299816542a46',
      format: 'wrapped',
    })
    // packed objects will always be returned as 'content' format
    expect(ref.format).toEqual('content')
    expect(ref.type).toEqual('commit')
    expect(ref.source).toBe(
      'objects/pack/pack-1a1e70d2f116e8cb0cb42d26019e5c7d0eb01888.pack'
    )
    if (ref.format !== 'content') throw new Error('wrong type')
    expect(Buffer.from(ref.object).toString('hex')).toMatchInlineSnapshot(
      `"7472656520346431363665323666636639666537623231383633343336313337633434613339613231613930660a706172656e7420666264353662343964343030613139656531383561653733353431376264623334633038343632310a617574686f722057696c6c69616d2048696c746f6e203c776d68696c746f6e40676d61696c2e636f6d3e2031353038323034303133202d303430300a636f6d6d69747465722057696c6c69616d2048696c746f6e203c776d68696c746f6e40676d61696c2e636f6d3e2031353038323034303133202d303430300a0a696e646578206f6e206d61737465723a2066626435366234204164642027756e706b6727206b657920746f207061636b6167652e6a736f6e0a"`
    )
  })
  it('from packfile content', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-readObject')
    // Test
    const ref = await readObject({
      fs,
      gitdir,
      oid: '0b8faa11b353db846b40eb064dfb299816542a46',
      format: 'content',
    })
    expect(ref.format).toEqual('content')
    expect(ref.type).toEqual('commit')
    expect(ref.source).toBe(
      'objects/pack/pack-1a1e70d2f116e8cb0cb42d26019e5c7d0eb01888.pack'
    )
    if (ref.format !== 'content') throw new Error('wrong type')
    expect(Buffer.from(ref.object).toString('hex')).toMatchInlineSnapshot(
      `"7472656520346431363665323666636639666537623231383633343336313337633434613339613231613930660a706172656e7420666264353662343964343030613139656531383561653733353431376264623334633038343632310a617574686f722057696c6c69616d2048696c746f6e203c776d68696c746f6e40676d61696c2e636f6d3e2031353038323034303133202d303430300a636f6d6d69747465722057696c6c69616d2048696c746f6e203c776d68696c746f6e40676d61696c2e636f6d3e2031353038323034303133202d303430300a0a696e646578206f6e206d61737465723a2066626435366234204164642027756e706b6727206b657920746f207061636b6167652e6a736f6e0a"`
    )
  })
  it('blob with encoding', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-readObject')
    // Test
    const ref = await readObject({
      fs,
      gitdir,
      oid: '4551a1856279dde6ae9d65862a1dff59a5f199d8',
      format: 'parsed',
      encoding: 'utf8',
    })
    expect(ref.format).toEqual('parsed')
    expect(ref.type).toEqual('blob')
    expect(ref.source).toBe(
      'objects/pack/pack-1a1e70d2f116e8cb0cb42d26019e5c7d0eb01888.pack'
    )
    expect(ref.object).toMatchInlineSnapshot(`
      "#!/usr/bin/env node
      const minimisted = require('minimisted')
      const git = require('.')
      
      // This really isn't much of a CLI. It's mostly for testing.
      // But it's very versatile and works surprisingly well.
      
      minimisted(async function ({ _: [command, ...args], ...opts }) {
        const dir = process.cwd()
        const repo = git(dir)
        let cmd = \`git('\${dir}')\`
        for (let key of Object.keys(opts)) {
          // This is how you check for an array, right?
          if (opts[key].length === undefined) {
            repo[key](opts[key])
            cmd += \`.\${key}('\${opts[key]}')\`
          } else {
            repo[key](...opts[key])
            cmd += \`.\${key}(\${opts[key].map(x => \`'\${x}'\`).join(', ')})\`
          }
        }
        cmd += \`.\${command}(\${args.map(x => \`'\${x}'\`).join(', ')})\`
        console.log(cmd)
        let result = await repo[command](...args)
        if (result === undefined) return
        console.log(JSON.stringify(result, null, 2))
      })
      "
    `)
  })
  it('with simple filepath to blob', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-readObject')
    // Test
    const ref = await readObject({
      fs,
      gitdir,
      oid: 'be1e63da44b26de8877a184359abace1cddcb739',
      format: 'parsed',
      filepath: 'cli.js',
    })
    expect(ref.format).toEqual('content')
    expect(ref.type).toEqual('blob')
    expect(ref.source).toBe(
      'objects/pack/pack-1a1e70d2f116e8cb0cb42d26019e5c7d0eb01888.pack'
    )
    expect(ref.oid).toEqual('4551a1856279dde6ae9d65862a1dff59a5f199d8')
    if (ref.format !== 'content') throw new Error('wrong type')
    expect(Buffer.from(ref.object).toString('hex')).toMatchInlineSnapshot(
      '"23212f7573722f62696e2f656e76206e6f64650a636f6e7374206d696e696d6973746564203d207265717569726528276d696e696d697374656427290a636f6e737420676974203d207265717569726528272e27290a0a2f2f2054686973207265616c6c792069736e2774206d756368206f66206120434c492e2049742773206d6f73746c7920666f722074657374696e672e0a2f2f204275742069742773207665727920766572736174696c6520616e6420776f726b732073757270726973696e676c792077656c6c2e0a0a6d696e696d6973746564286173796e632066756e6374696f6e20287b205f3a205b636f6d6d616e642c202e2e2e617267735d2c202e2e2e6f707473207d29207b0a2020636f6e737420646972203d2070726f636573732e63776428290a2020636f6e7374207265706f203d2067697428646972290a20206c657420636d64203d20606769742827247b6469727d2729600a2020666f7220286c6574206b6579206f66204f626a6563742e6b657973286f7074732929207b0a202020202f2f205468697320697320686f7720796f7520636865636b20666f7220616e2061727261792c2072696768743f0a20202020696620286f7074735b6b65795d2e6c656e677468203d3d3d20756e646566696e656429207b0a2020202020207265706f5b6b65795d286f7074735b6b65795d290a202020202020636d64202b3d20602e247b6b65797d2827247b6f7074735b6b65795d7d2729600a202020207d20656c7365207b0a2020202020207265706f5b6b65795d282e2e2e6f7074735b6b65795d290a202020202020636d64202b3d20602e247b6b65797d28247b6f7074735b6b65795d2e6d61702878203d3e206027247b787d2760292e6a6f696e28272c2027297d29600a202020207d0a20207d0a2020636d64202b3d20602e247b636f6d6d616e647d28247b617267732e6d61702878203d3e206027247b787d2760292e6a6f696e28272c2027297d29600a2020636f6e736f6c652e6c6f6728636d64290a20206c657420726573756c74203d206177616974207265706f5b636f6d6d616e645d282e2e2e61726773290a202069662028726573756c74203d3d3d20756e646566696e6564292072657475726e0a2020636f6e736f6c652e6c6f67284a534f4e2e737472696e6769667928726573756c742c206e756c6c2c203229290a7d290a"'
    )
  })
  it('with deep filepath to blob', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-readObject')
    // Test
    const ref = await readObject({
      fs,
      gitdir,
      oid: 'be1e63da44b26de8877a184359abace1cddcb739',
      format: 'parsed',
      filepath: 'src/commands/clone.js',
    })
    expect(ref.format).toEqual('content')
    expect(ref.type).toEqual('blob')
    expect(ref.oid).toEqual('5264f23285d8be3ce45f95c102001ffa1d5391d3')
    if (ref.format !== 'content') throw new Error('wrong type')
    expect(Buffer.from(ref.object).toString('hex')).toMatchInlineSnapshot(
      '"696d706f7274207b20696e6974207d2066726f6d20272e2f696e6974270a696d706f7274207b20636f6e666967207d2066726f6d20272e2f636f6e666967270a696d706f7274207b206665746368207d2066726f6d20272e2f6665746368270a696d706f7274207b20636865636b6f7574207d2066726f6d20272e2f636865636b6f7574270a0a6578706f7274206173796e632066756e6374696f6e20636c6f6e6520287b0a2020776f726b6469722c0a20206769746469722c0a202075726c2c0a202072656d6f74652c0a20207265662c0a202061757468557365726e616d652c0a20206175746850617373776f72642c0a202064657074682c0a202073696e63652c0a20206578636c7564652c0a202072656c61746976652c0a20206f6e70726f67726573730a7d29207b0a202072656d6f7465203d2072656d6f7465207c7c20276f726967696e270a2020617761697420696e6974287b20676974646972207d290a20202f2f204164642072656d6f74650a2020617761697420636f6e666967287b0a202020206769746469722c0a20202020706174683a206072656d6f74652e247b72656d6f74657d2e75726c602c0a2020202076616c75653a2075726c0a20207d290a20202f2f20466574636820636f6d6d6974730a20206177616974206665746368287b0a202020206769746469722c0a202020207265662c0a2020202072656d6f74652c0a2020202061757468557365726e616d652c0a202020206175746850617373776f72642c0a2020202064657074682c0a2020202073696e63652c0a202020206578636c7564652c0a2020202072656c61746976652c0a202020206f6e70726f67726573730a20207d290a20202f2f20436865636b6f7574206272616e63680a2020617761697420636865636b6f7574287b0a20202020776f726b6469722c0a202020206769746469722c0a202020207265662c0a2020202072656d6f74650a20207d290a7d0a"'
    )
  })
  it('with simple filepath to tree', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-readObject')
    // Test
    const ref = await readObject({
      fs,
      gitdir,
      oid: 'be1e63da44b26de8877a184359abace1cddcb739',
      format: 'parsed',
      filepath: '',
    })
    expect(ref.format).toEqual('parsed')
    expect(ref.type).toEqual('tree')
    expect(ref.source).toBe(
      'objects/pack/pack-1a1e70d2f116e8cb0cb42d26019e5c7d0eb01888.pack'
    )
    expect(ref.oid).toEqual('6257985e3378ec42a03a57a7dc8eb952d69a5ff3')
    expect(ref.object).toMatchInlineSnapshot(`
      Array [
        Object {
          "mode": "100644",
          "oid": "375f9392774e7a7c8a1ae23a6d13b5c133e42c45",
          "path": ".babelrc",
          "type": "blob",
        },
        Object {
          "mode": "100644",
          "oid": "bbf3e21f43fa4fe25eb925bfcb7c0434f7c2dc7d",
          "path": ".editorconfig",
          "type": "blob",
        },
        Object {
          "mode": "100644",
          "oid": "4a58bdcdef3eb91264dfca0279959d98c16568d5",
          "path": ".flowconfig",
          "type": "blob",
        },
        Object {
          "mode": "100644",
          "oid": "2b90c4a2353d2977e158c21f4315664063770212",
          "path": ".gitignore",
          "type": "blob",
        },
        Object {
          "mode": "100644",
          "oid": "63ed03aea9d828c86ebde989b336f5e978fdc3f1",
          "path": ".travis.yml",
          "type": "blob",
        },
        Object {
          "mode": "100644",
          "oid": "c675a17ccb1578bca836decf90205fdad743827d",
          "path": "LICENSE.md",
          "type": "blob",
        },
        Object {
          "mode": "100644",
          "oid": "9761716146bbdb47f8a7de3d9df98777df9674f3",
          "path": "README.md",
          "type": "blob",
        },
        Object {
          "mode": "040000",
          "oid": "63a8130fa218d20b0009c1126375a105c1adba8a",
          "path": "__tests__",
          "type": "tree",
        },
        Object {
          "mode": "100644",
          "oid": "bdc76cc9d0da964db203f47333d05185a22d6a18",
          "path": "ci.karma.conf.js",
          "type": "blob",
        },
        Object {
          "mode": "100644",
          "oid": "4551a1856279dde6ae9d65862a1dff59a5f199d8",
          "path": "cli.js",
          "type": "blob",
        },
        Object {
          "mode": "040000",
          "oid": "69be3467cb125fbc55eb5c7e50caa556fb0e34b4",
          "path": "dist",
          "type": "tree",
        },
        Object {
          "mode": "100644",
          "oid": "af56d48cb8af9c5ba3547c12c4a4a61fc16ff971",
          "path": "karma.conf.js",
          "type": "blob",
        },
        Object {
          "mode": "100644",
          "oid": "00b91c8b8ddfb43df70ef334088b7d840e5053db",
          "path": "package-lock.json",
          "type": "blob",
        },
        Object {
          "mode": "100644",
          "oid": "7b12188e7e351c1a761b76b38e36c13b5cba6c1f",
          "path": "package-scripts.js",
          "type": "blob",
        },
        Object {
          "mode": "100644",
          "oid": "bfe174beb9bf440c1c49b6fba0094f16cf9c9490",
          "path": "package.json",
          "type": "blob",
        },
        Object {
          "mode": "100644",
          "oid": "a86d1a6c3997dc73e8bf8687edb15fc087892e9d",
          "path": "rollup.config.js",
          "type": "blob",
        },
        Object {
          "mode": "040000",
          "oid": "ae7b4f3ac2c570dc3597124fc108ecb9d6c2b4fd",
          "path": "src",
          "type": "tree",
        },
        Object {
          "mode": "040000",
          "oid": "0a7ce5f20a8ccba18463a2ae990baf63ba1e3b43",
          "path": "testling",
          "type": "tree",
        },
      ]
    `)
  })
  it('with deep filepath to tree', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-readObject')
    // Test
    const ref = await readObject({
      fs,
      gitdir,
      oid: 'be1e63da44b26de8877a184359abace1cddcb739',
      format: 'parsed',
      filepath: 'src/commands',
    })
    expect(ref.format).toEqual('parsed')
    expect(ref.type).toEqual('tree')
    expect(ref.oid).toEqual('7704a6e8a802efcdbe6cf3dfa114c105f1d5c67a')
    expect(ref.object).toMatchInlineSnapshot(`
      Array [
        Object {
          "mode": "100644",
          "oid": "c0c25b4e4c418eff366132e6cb2b16c8d9a7798c",
          "path": "add.js",
          "type": "blob",
        },
        Object {
          "mode": "100644",
          "oid": "85cd837ae2a5577a6247937cb1e0404a0101705b",
          "path": "checkout.js",
          "type": "blob",
        },
        Object {
          "mode": "100644",
          "oid": "5264f23285d8be3ce45f95c102001ffa1d5391d3",
          "path": "clone.js",
          "type": "blob",
        },
        Object {
          "mode": "100644",
          "oid": "1ac40ceb71b7fd182808decfd14d644d65887d52",
          "path": "commit.js",
          "type": "blob",
        },
        Object {
          "mode": "100644",
          "oid": "9d9432818d654e7884b41223f7ae8ef4defec959",
          "path": "config.js",
          "type": "blob",
        },
        Object {
          "mode": "100644",
          "oid": "1c473b86b3e693e34363b4be9cdcd0c50e0bfed4",
          "path": "fetch.js",
          "type": "blob",
        },
        Object {
          "mode": "100644",
          "oid": "de854e230503c548d530a71442ba0d03824eefbb",
          "path": "findRoot.js",
          "type": "blob",
        },
        Object {
          "mode": "100644",
          "oid": "f309f5b14fc9897a3816547d0129f117788ffef1",
          "path": "init.js",
          "type": "blob",
        },
        Object {
          "mode": "100644",
          "oid": "9184088c0d0b75dba8108433f8d26fece09c36dc",
          "path": "list.js",
          "type": "blob",
        },
        Object {
          "mode": "100644",
          "oid": "1f67512a0eb40a8a955ad3ca56dfcd4231a935f9",
          "path": "listBranches.js",
          "type": "blob",
        },
        Object {
          "mode": "100644",
          "oid": "d740a56e95cada64654c6e9e52616cc3318be4cb",
          "path": "log.js",
          "type": "blob",
        },
        Object {
          "mode": "100644",
          "oid": "600a1006b12f2c7244fc034d8c64ad21c9597237",
          "path": "pack.js",
          "type": "blob",
        },
        Object {
          "mode": "100644",
          "oid": "9b3a67837dcabde4eee4862d6ad78b3ebf68915e",
          "path": "push.js",
          "type": "blob",
        },
        Object {
          "mode": "100644",
          "oid": "46e96d7d5b4cb91210ce169824feda77c3bd6cc3",
          "path": "remove.js",
          "type": "blob",
        },
        Object {
          "mode": "100644",
          "oid": "3a3ea110eb4967ca7e9d3eef41b073e779c329d1",
          "path": "resolveRef.js",
          "type": "blob",
        },
        Object {
          "mode": "100644",
          "oid": "f913d87e7844579afbe02fe116c88a6b51bf1bca",
          "path": "status.js",
          "type": "blob",
        },
        Object {
          "mode": "100644",
          "oid": "67e79f9e10d44eb692be57e746639b9f2b54e816",
          "path": "unpack.js",
          "type": "blob",
        },
        Object {
          "mode": "100644",
          "oid": "007e7738d257fe78da6938990a40e4310dfc0757",
          "path": "verify.js",
          "type": "blob",
        },
        Object {
          "mode": "100644",
          "oid": "9584ccddb392f8185101dca41496fba0fd264d6a",
          "path": "version.js",
          "type": "blob",
        },
      ]
    `)
  })
  it('with erroneous filepath (directory is a file)', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-readObject')
    // Test
    let error = null
    try {
      await readObject({
        fs,
        gitdir,
        oid: 'be1e63da44b26de8877a184359abace1cddcb739',
        format: 'parsed',
        filepath: 'src/commands/clone.js/isntafolder.txt',
      })
    } catch (err) {
      error = err
    }
    expect(error).not.toBeNull()
    expect(error instanceof Errors.ObjectTypeError).toBe(true)
  })
  it('with erroneous filepath (no such directory)', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-readObject')
    // Test
    let error = null
    try {
      await readObject({
        fs,
        gitdir,
        oid: 'be1e63da44b26de8877a184359abace1cddcb739',
        format: 'parsed',
        filepath: 'src/isntafolder',
      })
    } catch (err) {
      error = err
    }
    expect(error).not.toBeNull()
    expect(error instanceof Errors.NotFoundError).toBe(true)
  })
  it('with erroneous filepath (leading slash)', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-readObject')
    // Test
    let error = null
    try {
      await readObject({
        fs,
        gitdir,
        oid: 'be1e63da44b26de8877a184359abace1cddcb739',
        format: 'parsed',
        filepath: '/src',
      })
    } catch (err) {
      error = err
    }
    expect(error).not.toBeNull()
    expect(error instanceof Errors.InvalidFilepathError).toBe(true)
    expect(error.data.reason).toBe('leading-slash')
  })
  it('with erroneous filepath (trailing slash)', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-readObject')
    // Test
    let error = null
    try {
      await readObject({
        fs,
        gitdir,
        oid: 'be1e63da44b26de8877a184359abace1cddcb739',
        format: 'parsed',
        filepath: 'src/',
      })
    } catch (err) {
      error = err
    }
    expect(error).not.toBeNull()
    expect(error instanceof Errors.InvalidFilepathError).toBe(true)
    expect(error.data.reason).toBe('trailing-slash')
  })
})
