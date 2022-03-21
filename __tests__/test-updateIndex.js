/* eslint-env node, browser, jasmine */
const path = require('path')

const { writeBlob, updateIndex, status, add } = require('isomorphic-git')

const { makeFixture } = require('./__helpers__/FixtureFS.js')

describe('updateIndex', () => {
  it('should be possible to add a file on disk to the index', async () => {
    // Setup
    const { fs, dir } = await makeFixture('test-empty')
    await fs.write(path.join(dir, 'hello.md'), 'Hello, World!')
    // Test
    const oid = await updateIndex({
      fs,
      dir,
      add: true,
      filepath: 'hello.md',
    })
    expect(oid).toBe('b45ef6fec89518d314f546fd6c3025367b721684')
    const fileStatus = await status({
      fs,
      dir,
      filepath: 'hello.md',
    })
    expect(fileStatus).toBe('added')
  })

  it('should be possible to remove a file from the index which is not present in the workdir', async () => {
    // Setup
    const { fs, dir } = await makeFixture('test-empty')
    await fs.write(path.join(dir, 'hello.md'), 'Hello, World!')
    await add({
      fs,
      dir,
      filepath: 'hello.md',
    })
    await fs.rm(path.join(dir, 'hello.md'))
    // Test
    let fileStatus = await status({
      fs,
      dir,
      filepath: 'hello.md',
    })
    expect(fileStatus).toBe('*absent')
    await updateIndex({
      fs,
      dir,
      remove: true,
      filepath: 'hello.md',
    })
    fileStatus = await status({
      fs,
      dir,
      filepath: 'hello.md',
    })
    expect(fileStatus).toBe('absent')
  })

  it('should not remove file from index by default if file still exists in workdir', async () => {
    // Setup
    const { fs, dir } = await makeFixture('test-empty')
    await fs.write(path.join(dir, 'hello.md'), 'Hello, World!')
    await add({
      fs,
      dir,
      filepath: 'hello.md',
    })
    // Test
    let fileStatus = await status({
      fs,
      dir,
      filepath: 'hello.md',
    })
    expect(fileStatus).toBe('added')
    await updateIndex({
      fs,
      dir,
      remove: true,
      filepath: 'hello.md',
    })
    fileStatus = await status({
      fs,
      dir,
      filepath: 'hello.md',
    })
    expect(fileStatus).toBe('added')
  })

  it('should remove file from index which exists on disk if force is used', async () => {
    // Setup
    const { fs, dir } = await makeFixture('test-empty')
    await fs.write(path.join(dir, 'hello.md'), 'Hello, World!')
    await add({
      fs,
      dir,
      filepath: 'hello.md',
    })
    // Test
    let fileStatus = await status({
      fs,
      dir,
      filepath: 'hello.md',
    })
    expect(fileStatus).toBe('added')
    await updateIndex({
      fs,
      dir,
      remove: true,
      force: true,
      filepath: 'hello.md',
    })
    fileStatus = await status({
      fs,
      dir,
      filepath: 'hello.md',
    })
    expect(fileStatus).toBe('*added')
  })

  it('should be possible to add a file from the object database to the index', async () => {
    // Setup
    const { fs, dir } = await makeFixture('test-empty')
    const oid = await writeBlob({
      fs,
      dir,
      blob: Buffer.from('Hello, World!'),
    })
    // Test
    const updatedOid = await updateIndex({
      fs,
      dir,
      add: true,
      filepath: 'hello.md',
      oid,
    })
    expect(updatedOid).toBe(oid)
    const fileStatus = await status({
      fs,
      dir,
      filepath: 'hello.md',
    })
    expect(fileStatus).toBe('*absent')
  })

  it('should be possible to update a file', async () => {
    // Setup
    const { fs, dir } = await makeFixture('test-empty')
    await fs.write(path.join(dir, 'hello.md'), 'Hello, World!')
    await add({
      fs,
      dir,
      filepath: 'hello.md',
    })
    await fs.write(path.join(dir, 'hello.md'), 'Hello World')
    // Test
    let fileStatus = await status({
      fs,
      dir,
      filepath: 'hello.md',
    })
    expect(fileStatus).toBe('*added')
    const oid = await updateIndex({
      fs,
      dir,
      filepath: 'hello.md',
    })
    expect(oid).toBe('5e1c309dae7f45e0f39b1bf3ac3cd9db12e7d689')
    fileStatus = await status({
      fs,
      dir,
      filepath: 'hello.md',
    })
    expect(fileStatus).toBe('added')
  })

  it('should throw if we try to update a new file without providing `add`', async () => {
    // Setup
    const { fs, dir } = await makeFixture('test-empty')
    await fs.write(path.join(dir, 'hello.md'), 'Hello, World!')
    // Test
    let error = null
    try {
      await updateIndex({
        fs,
        dir,
        filepath: 'hello.md',
      })
    } catch (e) {
      error = e
    }
    expect(error).not.toBeNull()
    expect(error.caller).toEqual('git.updateIndex')
    error = error.toJSON()
    delete error.stack
    expect(error).toMatchInlineSnapshot(`
      Object {
        "caller": "git.updateIndex",
        "code": "NotFoundError",
        "data": Object {
          "what": "file at \\"hello.md\\" in index and \\"add\\" not set",
        },
        "message": "Could not find file at \\"hello.md\\" in index and \\"add\\" not set.",
      }
    `)
  })

  it('should throw if we try to update a file which does not exist on disk', async () => {
    // Setup
    const { fs, dir } = await makeFixture('test-empty')
    // Test
    let error = null
    try {
      await updateIndex({
        fs,
        dir,
        filepath: 'hello.md',
      })
    } catch (e) {
      error = e
    }
    expect(error).not.toBeNull()
    expect(error.caller).toEqual('git.updateIndex')
    error = error.toJSON()
    delete error.stack
    expect(error).toMatchInlineSnapshot(`
      Object {
        "caller": "git.updateIndex",
        "code": "NotFoundError",
        "data": Object {
          "what": "file at \\"hello.md\\" on disk and \\"remove\\" not set",
        },
        "message": "Could not find file at \\"hello.md\\" on disk and \\"remove\\" not set.",
      }
    `)
  })

  it('should throw if we try to add a directory', async () => {
    // Setup
    const { fs, dir } = await makeFixture('test-empty')
    await fs.mkdir(path.join(dir, 'hello-world'))
    // Test
    let error = null
    try {
      await updateIndex({
        fs,
        dir,
        filepath: 'hello-world',
      })
    } catch (e) {
      error = e
    }
    expect(error).not.toBeNull()
    expect(error.caller).toEqual('git.updateIndex')
    error = error.toJSON()
    delete error.stack
    expect(error).toMatchInlineSnapshot(`
      Object {
        "caller": "git.updateIndex",
        "code": "InvalidFilepathError",
        "data": Object {
          "reason": "directory",
        },
        "message": "\\"filepath\\" should not be a directory.",
      }
    `)
  })

  it('should throw if we try to remove a directory', async () => {
    // Setup
    const { fs, dir } = await makeFixture('test-empty')
    await fs.mkdir(path.join(dir, 'hello-world'))
    await fs.write(path.join(dir, 'hello-world/a'), 'a')
    await add({
      fs,
      dir,
      filepath: 'hello-world/a',
    })
    // Test
    let error = null
    try {
      await updateIndex({
        fs,
        dir,
        remove: true,
        filepath: 'hello-world',
      })
    } catch (e) {
      error = e
    }
    expect(error).not.toBeNull()
    expect(error.caller).toEqual('git.updateIndex')
    error = error.toJSON()
    delete error.stack
    expect(error).toMatchInlineSnapshot(`
      Object {
        "caller": "git.updateIndex",
        "code": "InvalidFilepathError",
        "data": Object {
          "reason": "directory",
        },
        "message": "\\"filepath\\" should not be a directory.",
      }
    `)
  })

  it('should not throw if we force remove a directory', async () => {
    // Setup
    const { fs, dir } = await makeFixture('test-empty')
    await fs.mkdir(path.join(dir, 'hello-world'))
    await fs.write(path.join(dir, 'hello-world/a'), 'a')
    await add({
      fs,
      dir,
      filepath: 'hello-world/a',
    })
    // Test
    let fileStatus = await status({
      fs,
      dir,
      filepath: 'hello-world/a',
    })
    expect(fileStatus).toBe('added')
    await updateIndex({
      fs,
      dir,
      remove: true,
      force: true,
      filepath: 'hello-world',
    })
    fileStatus = await status({
      fs,
      dir,
      filepath: 'hello-world/a',
    })
    expect(fileStatus).toBe('added')
  })
})
