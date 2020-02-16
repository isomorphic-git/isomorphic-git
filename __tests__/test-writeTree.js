/* eslint-env node, browser, jasmine */
const { writeTree } = require('isomorphic-git')

const { makeFixture } = require('./__helpers__/FixtureFS.js')

// NOTE: These are mostly the `readObject` tests but in reverse
describe('writeTree', () => {
  it('tree', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-writeTree')
    // Test
    const oid = await writeTree({
      fs,
      gitdir,
      tree: [
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
    const { fs, gitdir } = await makeFixture('test-writeTree')
    // Test
    const oid = await writeTree({
      fs,
      gitdir,
      tree: [
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
})
