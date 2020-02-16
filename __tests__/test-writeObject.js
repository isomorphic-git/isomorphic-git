/* eslint-env node, browser, jasmine */
const { writeObject } = require('isomorphic-git')

const { makeFixture } = require('./__helpers__/FixtureFS.js')

// NOTE: These are mostly the `readObject` tests but in reverse
describe('writeObject', () => {
  it('parsed', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-writeObject')
    // Test
    const oid = await writeObject({
      fs,
      gitdir,
      format: 'parsed',
      type: 'commit',
      object: {
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
  it('content', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-writeObject')
    // Test
    const oid = await writeObject({
      fs,
      gitdir,
      type: 'commit',
      object: Buffer.from(
        '7472656520653062386633353734303630656532346530336534616633383936663635646432303861363063630a706172656e7420623466383230366439653335393431366230663334323338636265623430306637646138383961380a617574686f722057696c6c2048696c746f6e203c776d68696c746f6e40676d61696c2e636f6d3e2031353032343834323030202d303430300a636f6d6d69747465722057696c6c2048696c746f6e203c776d68696c746f6e40676d61696c2e636f6d3e2031353032343834323030202d303430300a677067736967202d2d2d2d2d424547494e20504750205349474e41545552452d2d2d2d2d0a2056657273696f6e3a20476e7550472076310a200a2069514963424141424167414742514a5a6a68626f41416f4a454a594a754b575369366135563555502f3034305366656d4a3133505242587374326542353967730a2033685078323944524b42684674766b2b75532b383532332f6855667279326f655757643659526b636e6b7878415574426e667a566b49394167524963314e544d0a20683558744c4d51756243414b77384a577656766f5845547a7756414f446d646d764334575351434c752b6f706f65362f573752766b7254443070626b774834450a204d586f686135397349575a2f4661635a5836427959716846796b664a4c386743467652537a6a69714249627350375871324d68346a6b414b596c357a785633750a2071436b3236686e684c2b2b6b7766586c75325964477442392b6c6a33706b314e655771523337397a527a68345031304678584a3138715378637a626b41464f590a20366f356837612f4d716c314b71574239454642757043706a79646d704174506f366c3155733461336c6942354c4a76436839786752324874536852346239374f0a206e49705850346e6779347a3955797258587878706951516e2f6b566e2f754b6774764770386e4f46696f6f3631504369396a7332516d5178637375424f654f2b0a2044644671356b32504d4e5a4c77697a74345038454766564a6f50624c68645950346f57694d437559562f32664e68306f7a6c2f713137364847737a6c66726b650a203333325a306d614a3341357849526a30623776524e48563841416c394468656f334c73706a656f765032697963434846503033675370434b644c5242524334540a2058313042424644386e6f434d584a78623571656e72662b654b526438643467374a7463797a7156676b42513638474947383434565752426f6c4f7a78344279350a20634161772f5359495a4733526f7241633131695a37737661306a464953656a6d457a496562754368537a64574f324f4f575256764d6468795a77444c556741620a205169786832626d5067723368396e787132446d6e0a203d342b444e0a202d2d2d2d2d454e4420504750205349474e41545552452d2d2d2d2d0a0a496d70726f7665207265736f6c766552656620746f2068616e646c65206d6f7265206b696e6473206f6620726566732e204164642074657374730a',
        'hex'
      ),
      format: 'content',
    })
    expect(oid).toBe('e10ebb90d03eaacca84de1af0a59b444232da99e')
  })
  it('wrapped', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-writeObject')
    // Test
    const oid = await writeObject({
      fs,
      gitdir,
      object: Buffer.from(
        '636f6d6d69742031313133007472656520653062386633353734303630656532346530336534616633383936663635646432303861363063630a706172656e7420623466383230366439653335393431366230663334323338636265623430306637646138383961380a617574686f722057696c6c2048696c746f6e203c776d68696c746f6e40676d61696c2e636f6d3e2031353032343834323030202d303430300a636f6d6d69747465722057696c6c2048696c746f6e203c776d68696c746f6e40676d61696c2e636f6d3e2031353032343834323030202d303430300a677067736967202d2d2d2d2d424547494e20504750205349474e41545552452d2d2d2d2d0a2056657273696f6e3a20476e7550472076310a200a2069514963424141424167414742514a5a6a68626f41416f4a454a594a754b575369366135563555502f3034305366656d4a3133505242587374326542353967730a2033685078323944524b42684674766b2b75532b383532332f6855667279326f655757643659526b636e6b7878415574426e667a566b49394167524963314e544d0a20683558744c4d51756243414b77384a577656766f5845547a7756414f446d646d764334575351434c752b6f706f65362f573752766b7254443070626b774834450a204d586f686135397349575a2f4661635a5836427959716846796b664a4c386743467652537a6a69714249627350375871324d68346a6b414b596c357a785633750a2071436b3236686e684c2b2b6b7766586c75325964477442392b6c6a33706b314e655771523337397a527a68345031304678584a3138715378637a626b41464f590a20366f356837612f4d716c314b71574239454642757043706a79646d704174506f366c3155733461336c6942354c4a76436839786752324874536852346239374f0a206e49705850346e6779347a3955797258587878706951516e2f6b566e2f754b6774764770386e4f46696f6f3631504369396a7332516d5178637375424f654f2b0a2044644671356b32504d4e5a4c77697a74345038454766564a6f50624c68645950346f57694d437559562f32664e68306f7a6c2f713137364847737a6c66726b650a203333325a306d614a3341357849526a30623776524e48563841416c394468656f334c73706a656f765032697963434846503033675370434b644c5242524334540a2058313042424644386e6f434d584a78623571656e72662b654b526438643467374a7463797a7156676b42513638474947383434565752426f6c4f7a78344279350a20634161772f5359495a4733526f7241633131695a37737661306a464953656a6d457a496562754368537a64574f324f4f575256764d6468795a77444c556741620a205169786832626d5067723368396e787132446d6e0a203d342b444e0a202d2d2d2d2d454e4420504750205349474e41545552452d2d2d2d2d0a0a496d70726f7665207265736f6c766552656620746f2068616e646c65206d6f7265206b696e6473206f6620726566732e204164642074657374730a',
        'hex'
      ),
      format: 'wrapped',
    })
    expect(oid).toBe('e10ebb90d03eaacca84de1af0a59b444232da99e')
  })
  it('deflated', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-writeObject')
    // Test
    const oid = await writeObject({
      fs,
      gitdir,
      oid: 'e10ebb90d03eaacca84de1af0a59b444232da99e',
      object: Buffer.from(
        '78019d93c9cea3481084e7cc53d4ddea76010586d1cc68001b0cde30fc06ec1b4b4161966237e6e9dbd373ed53e729158a487d522a625a55f9005896e5ff183a8c01869194f2c206411162cc210c798cc294976431158524e1a0148a308e9926ec703d8008a51207c544c6bc2023568c60ca238e97e2084708c274938492248712138e03a11df0f3b204fbbc1c680dfe7a55e4e7f66f568579f93da6d53f8015208724c44108bec1cf05e6a37e1007fc3bd9acc9fa3c03dffe1b75679867601b36704de3ac7cdd9cdd4f9d011eeefa9cd67f02a31e6d034c2c0318905fcd58551455c91443bd5a8f2789a8a2506b67ddadf1e0bbb9180a9e70b3d71f4837c595c5f2b6a306fdc0615590b39e013cb1674ede3a0795e8c354ac467725091cbf26b7b47b7314fb7e22de9d22ae8b79566e835aa78b5798b2923966cc9ebf4e0c2042301c4fd731d294c34bb2fcc99b68b0fb5a5e9e72d956493569c877afda715cd1866271ed6f9ca9e8beb6b0898ad71eed18700a280905b937fdc75a0fe34720aaef7b4bf477915a4729d3f4c9719767deaa66d4db9ba0e54e043d0be5702f8565f6f89101ad567022a9c971b52a5e69508edc3d3106555e954fbe29d833f65b87dfc88bb31064b3509f038b955a778e97a850f4cb9d012215c8265c9fda923db4be2aef74756cb4e6f94eaa46196c2a96ecad47215fe6aa70b4268dc873e670fbc1250e8ae4cd8501b5d90436aab3375ae4dbbb0b82796ef2ebb55e175ebd1e0fd930198d545ff49c5291b5b55c7ef6dcb5bace713faa177c5931609be8ad5070f6e9fc38bef26540b6b43352cfa2767424c9dd46d4cf4fda78f7d65c7a26902ee5ba6537e2dee89732ed0afcf926cf3d60155abc22cca6f384d16672ce7b4f529452de124cf963df3c319d6c2e7fc7da5eb7219fb98d76488e8eea68e88b01010b5555df4a35d54e813547428beb2e5de183934809ca36d610bf97d6cb0af52a4a8669480879bea3d2f2b2cc487d0b0c8895f0b576efe6c3e01dda2931cbe68f4d3f85f0a99b2e7e56bbc5c4d1a8117749fc0b77b9f88e379d12f27ebcb6c75ba6440cb8e633e1a2cace3a9ec8f5dc72dbaa66c0df68b53d33ffd76477defeaa248c59351d9d30e8704fcb093b3805030524ac9312838a761814799df480a61f4bda7f074a928001f743cffc00fa8263c9',
        'hex'
      ),
      format: 'deflated',
    })
    expect(oid).toEqual('e10ebb90d03eaacca84de1af0a59b444232da99e')
  })
  it('blob with encoding', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-writeObject')
    // Test
    const oid = await writeObject({
      fs,
      gitdir,
      type: 'blob',
      object: `#!/usr/bin/env node
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
`,
      format: 'parsed',
      encoding: 'utf8',
    })
    expect(oid).toEqual('4551a1856279dde6ae9d65862a1dff59a5f199d8')
  })
  it('tree', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-writeObject')
    // Test
    const oid = await writeObject({
      fs,
      gitdir,
      type: 'tree',
      format: 'parsed',
      object: [
        {
          mode: '100644',
          oid: '375f9392774e7a7c8a1ae23a6d13b5c133e42c45',
          path: '.babelrc',
          type: 'blob',
        },
        {
          mode: '100644',
          oid: 'bbf3e21f43fa4fe25eb925bfcb7c0434f7c2dc7d',
          path: '.editorconfig',
          type: 'blob',
        },
        {
          mode: '100644',
          oid: '4a58bdcdef3eb91264dfca0279959d98c16568d5',
          path: '.flowconfig',
          type: 'blob',
        },
        {
          mode: '100644',
          oid: '2b90c4a2353d2977e158c21f4315664063770212',
          path: '.gitignore',
          type: 'blob',
        },
        {
          mode: '100644',
          oid: '63ed03aea9d828c86ebde989b336f5e978fdc3f1',
          path: '.travis.yml',
          type: 'blob',
        },
        {
          mode: '100644',
          oid: 'c675a17ccb1578bca836decf90205fdad743827d',
          path: 'LICENSE.md',
          type: 'blob',
        },
        {
          mode: '100644',
          oid: '9761716146bbdb47f8a7de3d9df98777df9674f3',
          path: 'README.md',
          type: 'blob',
        },
        {
          mode: '040000',
          oid: '63a8130fa218d20b0009c1126375a105c1adba8a',
          path: '__tests__',
          type: 'tree',
        },
        {
          mode: '100644',
          oid: 'bdc76cc9d0da964db203f47333d05185a22d6a18',
          path: 'ci.karma.conf.js',
          type: 'blob',
        },
        {
          mode: '100644',
          oid: '4551a1856279dde6ae9d65862a1dff59a5f199d8',
          path: 'cli.js',
          type: 'blob',
        },
        {
          mode: '040000',
          oid: '69be3467cb125fbc55eb5c7e50caa556fb0e34b4',
          path: 'dist',
          type: 'tree',
        },
        {
          mode: '100644',
          oid: 'af56d48cb8af9c5ba3547c12c4a4a61fc16ff971',
          path: 'karma.conf.js',
          type: 'blob',
        },
        {
          mode: '100644',
          oid: '00b91c8b8ddfb43df70ef334088b7d840e5053db',
          path: 'package-lock.json',
          type: 'blob',
        },
        {
          mode: '100644',
          oid: '7b12188e7e351c1a761b76b38e36c13b5cba6c1f',
          path: 'package-scripts.js',
          type: 'blob',
        },
        {
          mode: '100644',
          oid: 'bfe174beb9bf440c1c49b6fba0094f16cf9c9490',
          path: 'package.json',
          type: 'blob',
        },
        {
          mode: '100644',
          oid: 'a86d1a6c3997dc73e8bf8687edb15fc087892e9d',
          path: 'rollup.config.js',
          type: 'blob',
        },
        {
          mode: '040000',
          oid: 'ae7b4f3ac2c570dc3597124fc108ecb9d6c2b4fd',
          path: 'src',
          type: 'tree',
        },
        {
          mode: '040000',
          oid: '0a7ce5f20a8ccba18463a2ae990baf63ba1e3b43',
          path: 'testling',
          type: 'tree',
        },
      ],
    })
    expect(oid).toEqual('6257985e3378ec42a03a57a7dc8eb952d69a5ff3')
  })
  it('tree entries sorted correctly', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-writeObject')
    // Test
    const oid = await writeObject({
      fs,
      gitdir,
      type: 'tree',
      format: 'parsed',
      object: [
        {
          mode: '040000',
          path: 'config',
          oid: 'd564d0bc3dd917926892c55e3706cc116d5b165e',
          type: 'tree',
        },
        {
          mode: '100644',
          path: 'config ',
          oid: 'e69de29bb2d1d6434b8b29ae775ad8c2e48c5391',
          type: 'blob',
        },
        {
          mode: '100644',
          path: 'config.',
          oid: 'e69de29bb2d1d6434b8b29ae775ad8c2e48c5391',
          type: 'blob',
        },
        {
          mode: '100644',
          path: 'config0',
          oid: 'e69de29bb2d1d6434b8b29ae775ad8c2e48c5391',
          type: 'blob',
        },
        {
          mode: '100644',
          path: 'config~',
          oid: 'e69de29bb2d1d6434b8b29ae775ad8c2e48c5391',
          type: 'blob',
        },
      ],
    })
    expect(oid).toEqual('c8a72f5bd8633663210490897b798ddc3ff9ca64')
  })
  it('annotated tag', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-writeObject')
    // Test
    const oid = await writeObject({
      fs,
      gitdir,
      format: 'parsed',
      type: 'tag',
      object: {
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
