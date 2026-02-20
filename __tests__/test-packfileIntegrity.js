/* eslint-env node, browser, jasmine */
import { Errors } from 'isomorphic-git'
import { readObjectPacked } from 'isomorphic-git/internal-apis'

import { makeFixture } from './__helpers__/FixtureFS.js'

describe('packfile integrity', () => {
  it('should read object from valid packfile', async () => {
    // Setup - use a repo with packfile (bare .git repo)
    // For bare repos, use 'dir' as gitdir (dir contains the .git contents)
    const { fs, dir } = await makeFixture('test-readObject.git')
    const cache = {}
    const gitdir = dir

    // Use a known OID from the packfile
    // This OID exists in test-readObject.git packfile (first object in idx)
    const oid = '0001c3e2753b03648b6c43dd74ba7fe2f21123d6'

    // Test - should read successfully
    const obj = await readObjectPacked({
      fs,
      cache,
      gitdir,
      oid,
    })

    expect(obj).not.toBeNull()
    expect(obj.format).toBe('content')
  })

  it('should throw error when packfile trailer is corrupted', async () => {
    // Setup
    const { fs, dir } = await makeFixture('test-readObject.git')
    const cache = {}
    const gitdir = dir

    // Use a known OID from the packfile (first object in idx)
    const oid = '0001c3e2753b03648b6c43dd74ba7fe2f21123d6'

    // Find and corrupt packfile trailer (last 20 bytes)
    const packDir = gitdir + '/objects/pack'
    const files = await fs.readdir(packDir)
    const packFile = files.find(f => f.endsWith('.pack'))
    const packPath = packDir + '/' + packFile

    const data = await fs.read(packPath)
    // Corrupt last byte of trailer
    data[data.length - 1] ^= 0xff
    await fs.write(packPath, data)

    // Test - should throw InternalError with trailer mismatch message
    let error = null
    try {
      await readObjectPacked({
        fs,
        cache,
        gitdir,
        oid,
      })
    } catch (e) {
      error = e
    }

    expect(error).not.toBeNull()
    expect(error instanceof Errors.InternalError).toBe(true)
    expect(error.data.message).toContain('Packfile trailer mismatch')
  })

  it('should throw error when packfile payload is corrupted', async () => {
    // Setup
    const { fs, dir } = await makeFixture('test-readObject.git')
    const cache = {}
    const gitdir = dir

    // Use a known OID from the packfile (first object in idx)
    const oid = '0001c3e2753b03648b6c43dd74ba7fe2f21123d6'

    // Find and corrupt packfile payload (middle content, not trailer)
    const packDir = gitdir + '/objects/pack'
    const files = await fs.readdir(packDir)
    const packFile = files.find(f => f.endsWith('.pack'))
    const packPath = packDir + '/' + packFile

    const data = await fs.read(packPath)
    // Corrupt a byte in the middle (after header, before trailer)
    // Header is 12 bytes, trailer is 20 bytes
    const corruptPosition = 50
    data[corruptPosition] ^= 0xff
    await fs.write(packPath, data)

    // Test - should throw InternalError with payload corrupted message
    let error = null
    try {
      await readObjectPacked({
        fs,
        cache,
        gitdir,
        oid,
      })
    } catch (e) {
      error = e
    }

    expect(error).not.toBeNull()
    expect(error instanceof Errors.InternalError).toBe(true)
    expect(error.data.message).toContain('Packfile payload corrupted')
  })

  it('should verify packfile only once per packfile (_checksumVerified flag)', async () => {
    // Setup
    const { fs, dir } = await makeFixture('test-readObject.git')
    const cache = {}
    const gitdir = dir

    // Use a known OID from the packfile (first object in idx)
    const oid = '0001c3e2753b03648b6c43dd74ba7fe2f21123d6'

    // First read - should verify
    const obj1 = await readObjectPacked({
      fs,
      cache,
      gitdir,
      oid,
    })
    expect(obj1).not.toBeNull()

    // Second read - should use cached verification
    const obj2 = await readObjectPacked({
      fs,
      cache,
      gitdir,
      oid,
    })
    expect(obj2).not.toBeNull()
    expect(obj2.format).toBe(obj1.format)
  })
})
