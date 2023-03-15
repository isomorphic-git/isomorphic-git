/* eslint-env node, browser, jasmine */
const { Errors, readTree } = require('isomorphic-git')

const { makeFixture } = require('./__helpers__/FixtureFS.js')

describe('readTree', () => {
  it('read a tree directly', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-readTree')
    // Test
    const { oid, tree } = await readTree({
      fs,
      gitdir,
      oid: '6257985e3378ec42a03a57a7dc8eb952d69a5ff3',
    })
    expect(oid).toEqual('6257985e3378ec42a03a57a7dc8eb952d69a5ff3')
    expect(tree).toMatchInlineSnapshot(`
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
  it('peels tags', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-readTree')
    // Test
    const { oid, tree } = await readTree({
      fs,
      gitdir,
      oid: '86167ce7861387275b2fbd188e031e00aff446f9',
    })
    expect(oid).toEqual('6257985e3378ec42a03a57a7dc8eb952d69a5ff3')
    expect(tree).toMatchInlineSnapshot(`
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
  it('with simple filepath to tree', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-readTree')
    // Test
    const { oid, tree } = await readTree({
      fs,
      gitdir,
      oid: 'be1e63da44b26de8877a184359abace1cddcb739',
      filepath: '',
    })
    expect(oid).toEqual('6257985e3378ec42a03a57a7dc8eb952d69a5ff3')
    expect(tree).toMatchInlineSnapshot(`
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
    const { fs, gitdir } = await makeFixture('test-readTree')
    // Test
    const { oid, tree } = await readTree({
      fs,
      gitdir,
      oid: 'be1e63da44b26de8877a184359abace1cddcb739',
      filepath: 'src/commands',
    })
    expect(oid).toEqual('7704a6e8a802efcdbe6cf3dfa114c105f1d5c67a')
    expect(tree).toMatchInlineSnapshot(`
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
    const { fs, gitdir } = await makeFixture('test-readTree')
    // Test
    let error = null
    try {
      await readTree({
        fs,
        gitdir,
        oid: 'be1e63da44b26de8877a184359abace1cddcb739',
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
    const { fs, gitdir } = await makeFixture('test-readTree')
    // Test
    let error = null
    try {
      await readTree({
        fs,
        gitdir,
        oid: 'be1e63da44b26de8877a184359abace1cddcb739',
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
    const { fs, gitdir } = await makeFixture('test-readTree')
    // Test
    let error = null
    try {
      await readTree({
        fs,
        gitdir,
        oid: 'be1e63da44b26de8877a184359abace1cddcb739',
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
    const { fs, gitdir } = await makeFixture('test-readTree')
    // Test
    let error = null
    try {
      await readTree({
        fs,
        gitdir,
        oid: 'be1e63da44b26de8877a184359abace1cddcb739',
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
