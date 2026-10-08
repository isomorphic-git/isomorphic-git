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
    if (!packFile) {
      throw new Error('No packfile found in ' + packDir)
    }
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
    if (!packFile) {
      throw new Error('No packfile found in ' + packDir)
    }
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

  it('should verify packfile only once per packfile', async () => {
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

  it('should verify packfile only once when objects are read concurrently', async () => {
    // Setup
    const { fs, dir } = await makeFixture('test-readObject.git')
    const cache = {}
    const gitdir = dir

    // Count how many times the packfile payload is hashed.
    // The payload is everything except the 20-byte trailer.
    let payloadHashes = 0
    const read = fs.read.bind(fs)
    fs.read = async (filepath, options) => {
      const data = await read(filepath, options)
      if (data && filepath.endsWith('.pack')) {
        const subarray = data.subarray.bind(data)
        data.subarray = (start, end) => {
          if (start === 0 && end === data.length - 20) payloadHashes++
          return subarray(start, end)
        }
      }
      return data
    }

    // Several OIDs from the same packfile
    const oids = [
      'be1e63da44b26de8877a184359abace1cddcb739',
      'a5b694cad298ad4398d5f35420bd0828e4f8b697',
      'ee3c2644add213eecb95cb17a5835b577262b38c',
      '783abe20a4cd5a98741a571f9d045f286e350442',
    ]

    // Test - first reads start concurrently and share one cache
    const objects = await Promise.all(
      oids.map(oid => readObjectPacked({ fs, cache, gitdir, oid }))
    )

    for (const obj of objects) {
      expect(obj).not.toBeNull()
      expect(obj.format).toBe('content')
    }
    expect(payloadHashes).toBe(1)
  })

  it('should throw on every concurrent read when packfile payload is corrupted', async () => {
    // Setup
    const { fs, dir } = await makeFixture('test-readObject.git')
    const cache = {}
    const gitdir = dir

    // Corrupt a byte in the payload (after header, before trailer)
    const packDir = gitdir + '/objects/pack'
    const files = await fs.readdir(packDir)
    const packFile = files.find(f => f.endsWith('.pack'))
    if (!packFile) {
      throw new Error('No packfile found in ' + packDir)
    }
    const packPath = packDir + '/' + packFile
    const data = await fs.read(packPath)
    data[50] ^= 0xff
    await fs.write(packPath, data)

    const oids = [
      'be1e63da44b26de8877a184359abace1cddcb739',
      'a5b694cad298ad4398d5f35420bd0828e4f8b697',
    ]

    // Test - concurrent reads and a later read all fail
    const results = await Promise.allSettled(
      oids.map(oid => readObjectPacked({ fs, cache, gitdir, oid }))
    )
    let error = null
    try {
      await readObjectPacked({ fs, cache, gitdir, oid: oids[0] })
    } catch (e) {
      error = e
    }

    expect(results.map(result => result.status)).toEqual([
      'rejected',
      'rejected',
    ])
    for (const result of results) {
      if (result.status !== 'rejected') continue
      expect(result.reason instanceof Errors.InternalError).toBe(true)
      expect(result.reason.data.message).toContain('Packfile payload corrupted')
    }
    expect(error).not.toBeNull()
    expect(error instanceof Errors.InternalError).toBe(true)
    expect(error.data.message).toContain('Packfile payload corrupted')
  })

  it('should throw descriptive error when packfile cannot be read', async () => {
    // Setup - use a repo with packfile
    const { fs, dir } = await makeFixture('test-readObject.git')
    const cache = {}
    const gitdir = dir

    // Use a known OID from the packfile
    const oid = '0001c3e2753b03648b6c43dd74ba7fe2f21123d6'

    // Delete the .pack file but keep the .idx file
    // This causes fs.read() to return null (file not found)
    const packDir = gitdir + '/objects/pack'
    const files = await fs.readdir(packDir)
    const packFile = files.find(f => f.endsWith('.pack'))
    if (!packFile) {
      throw new Error('No packfile found in ' + packDir)
    }
    await fs.rm(packDir + '/' + packFile)

    // Test - should throw InternalError with descriptive message
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
    expect(error.data.message).toContain('Could not read packfile')
  })
})
