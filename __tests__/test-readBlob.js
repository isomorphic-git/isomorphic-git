/* eslint-env node, browser, jasmine */
const { Errors, readBlob } = require('isomorphic-git')

const { makeFixture } = require('./__helpers__/FixtureFS.js')

describe('readBlob', () => {
  it('test missing', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-readBlob')
    // Test
    let error = null
    try {
      await readBlob({
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
  it('blob', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-readBlob')
    // Test
    const { blob } = await readBlob({
      fs,
      gitdir,
      oid: '4551a1856279dde6ae9d65862a1dff59a5f199d8',
    })
    expect(Buffer.from(blob).toString('utf8')).toMatchInlineSnapshot(`
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
  it('peels tags', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-readBlob')
    // Test
    const { oid } = await readBlob({
      fs,
      gitdir,
      oid: 'cdf8e34555b62edbbe978f20d7b4796cff781f9d',
    })
    expect(oid).toBe('4551a1856279dde6ae9d65862a1dff59a5f199d8')
  })
  it('with simple filepath to blob', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-readBlob')
    // Test
    const { oid, blob } = await readBlob({
      fs,
      gitdir,
      oid: 'be1e63da44b26de8877a184359abace1cddcb739',
      filepath: 'cli.js',
    })
    expect(oid).toEqual('4551a1856279dde6ae9d65862a1dff59a5f199d8')
    expect(Buffer.from(blob).toString('hex')).toMatchInlineSnapshot(
      '"23212f7573722f62696e2f656e76206e6f64650a636f6e7374206d696e696d6973746564203d207265717569726528276d696e696d697374656427290a636f6e737420676974203d207265717569726528272e27290a0a2f2f2054686973207265616c6c792069736e2774206d756368206f66206120434c492e2049742773206d6f73746c7920666f722074657374696e672e0a2f2f204275742069742773207665727920766572736174696c6520616e6420776f726b732073757270726973696e676c792077656c6c2e0a0a6d696e696d6973746564286173796e632066756e6374696f6e20287b205f3a205b636f6d6d616e642c202e2e2e617267735d2c202e2e2e6f707473207d29207b0a2020636f6e737420646972203d2070726f636573732e63776428290a2020636f6e7374207265706f203d2067697428646972290a20206c657420636d64203d20606769742827247b6469727d2729600a2020666f7220286c6574206b6579206f66204f626a6563742e6b657973286f7074732929207b0a202020202f2f205468697320697320686f7720796f7520636865636b20666f7220616e2061727261792c2072696768743f0a20202020696620286f7074735b6b65795d2e6c656e677468203d3d3d20756e646566696e656429207b0a2020202020207265706f5b6b65795d286f7074735b6b65795d290a202020202020636d64202b3d20602e247b6b65797d2827247b6f7074735b6b65795d7d2729600a202020207d20656c7365207b0a2020202020207265706f5b6b65795d282e2e2e6f7074735b6b65795d290a202020202020636d64202b3d20602e247b6b65797d28247b6f7074735b6b65795d2e6d61702878203d3e206027247b787d2760292e6a6f696e28272c2027297d29600a202020207d0a20207d0a2020636d64202b3d20602e247b636f6d6d616e647d28247b617267732e6d61702878203d3e206027247b787d2760292e6a6f696e28272c2027297d29600a2020636f6e736f6c652e6c6f6728636d64290a20206c657420726573756c74203d206177616974207265706f5b636f6d6d616e645d282e2e2e61726773290a202069662028726573756c74203d3d3d20756e646566696e6564292072657475726e0a2020636f6e736f6c652e6c6f67284a534f4e2e737472696e6769667928726573756c742c206e756c6c2c203229290a7d290a"'
    )
  })
  it('with deep filepath to blob', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-readBlob')
    // Test
    const { oid, blob } = await readBlob({
      fs,
      gitdir,
      oid: 'be1e63da44b26de8877a184359abace1cddcb739',
      filepath: 'src/commands/clone.js',
    })
    expect(oid).toEqual('5264f23285d8be3ce45f95c102001ffa1d5391d3')
    expect(Buffer.from(blob).toString('hex')).toMatchInlineSnapshot(
      '"696d706f7274207b20696e6974207d2066726f6d20272e2f696e6974270a696d706f7274207b20636f6e666967207d2066726f6d20272e2f636f6e666967270a696d706f7274207b206665746368207d2066726f6d20272e2f6665746368270a696d706f7274207b20636865636b6f7574207d2066726f6d20272e2f636865636b6f7574270a0a6578706f7274206173796e632066756e6374696f6e20636c6f6e6520287b0a2020776f726b6469722c0a20206769746469722c0a202075726c2c0a202072656d6f74652c0a20207265662c0a202061757468557365726e616d652c0a20206175746850617373776f72642c0a202064657074682c0a202073696e63652c0a20206578636c7564652c0a202072656c61746976652c0a20206f6e70726f67726573730a7d29207b0a202072656d6f7465203d2072656d6f7465207c7c20276f726967696e270a2020617761697420696e6974287b20676974646972207d290a20202f2f204164642072656d6f74650a2020617761697420636f6e666967287b0a202020206769746469722c0a20202020706174683a206072656d6f74652e247b72656d6f74657d2e75726c602c0a2020202076616c75653a2075726c0a20207d290a20202f2f20466574636820636f6d6d6974730a20206177616974206665746368287b0a202020206769746469722c0a202020207265662c0a2020202072656d6f74652c0a2020202061757468557365726e616d652c0a202020206175746850617373776f72642c0a2020202064657074682c0a2020202073696e63652c0a202020206578636c7564652c0a2020202072656c61746976652c0a202020206f6e70726f67726573730a20207d290a20202f2f20436865636b6f7574206272616e63680a2020617761697420636865636b6f7574287b0a20202020776f726b6469722c0a202020206769746469722c0a202020207265662c0a2020202072656d6f74650a20207d290a7d0a"'
    )
  })
  it('with simple filepath to tree', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-readBlob')
    // Test
    let error = null
    try {
      await readBlob({
        fs,
        gitdir,
        oid: 'be1e63da44b26de8877a184359abace1cddcb739',
        filepath: '',
      })
    } catch (err) {
      error = err
    }
    expect(error).not.toBeNull()
    expect(error instanceof Errors.ObjectTypeError).toBe(true)
  })
  it('with erroneous filepath (directory is a file)', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-readBlob')
    // Test
    let error = null
    try {
      await readBlob({
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
    const { fs, gitdir } = await makeFixture('test-readBlob')
    // Test
    let error = null
    try {
      await readBlob({
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
    const { fs, gitdir } = await makeFixture('test-readBlob')
    // Test
    let error = null
    try {
      await readBlob({
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
    const { fs, gitdir } = await makeFixture('test-readBlob')
    // Test
    let error = null
    try {
      await readBlob({
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
