/* eslint-env node, browser, jasmine */
import { MemoryFS } from '../src/utils/MemoryFS.js'

describe('MemoryFS', () => {
  let fs

  beforeEach(() => {
    fs = new MemoryFS()
  })

  // -------------------------------------------------------------------------
  // Root directory
  // -------------------------------------------------------------------------

  describe('initial state', () => {
    it('has a root directory', async () => {
      const stat = await fs.promises.stat('/')
      expect(stat.isDirectory()).toBe(true)
    })

    it('root directory is initially empty', async () => {
      const entries = await fs.promises.readdir('/')
      expect(entries).toEqual([])
    })
  })

  // -------------------------------------------------------------------------
  // mkdir
  // -------------------------------------------------------------------------

  describe('mkdir', () => {
    it('creates a directory', async () => {
      await fs.promises.mkdir('/mydir')
      const stat = await fs.promises.stat('/mydir')
      expect(stat.isDirectory()).toBe(true)
    })

    it('lists created directory under parent', async () => {
      await fs.promises.mkdir('/mydir')
      expect(await fs.promises.readdir('/')).toEqual(['mydir'])
    })

    it('throws EEXIST when directory already exists', async () => {
      await fs.promises.mkdir('/mydir')
      await expect(fs.promises.mkdir('/mydir')).rejects.toMatchObject({
        code: 'EEXIST',
      })
    })

    it('recursive mkdir does not throw when directory already exists', async () => {
      await fs.promises.mkdir('/mydir')
      await expect(
        fs.promises.mkdir('/mydir', { recursive: true })
      ).resolves.toBeUndefined()
    })

    it('recursive mkdir creates nested directories', async () => {
      await fs.promises.mkdir('/a/b/c', { recursive: true })
      expect((await fs.promises.stat('/a')).isDirectory()).toBe(true)
      expect((await fs.promises.stat('/a/b')).isDirectory()).toBe(true)
      expect((await fs.promises.stat('/a/b/c')).isDirectory()).toBe(true)
    })

    it('throws ENOENT when parent does not exist (non-recursive)', async () => {
      await expect(fs.promises.mkdir('/noparent/child')).rejects.toMatchObject({
        code: 'ENOENT',
      })
    })
  })

  // -------------------------------------------------------------------------
  // writeFile / readFile
  // -------------------------------------------------------------------------

  describe('writeFile / readFile', () => {
    it('writes and reads a string file', async () => {
      await fs.promises.writeFile('/hello.txt', 'Hello, World!', 'utf8')
      const content = await fs.promises.readFile('/hello.txt', 'utf8')
      expect(content).toBe('Hello, World!')
    })

    it('writes and reads a binary file (Uint8Array)', async () => {
      const data = new Uint8Array([0x41, 0x42, 0x43])
      await fs.promises.writeFile('/bin.bin', data)
      const result = await fs.promises.readFile('/bin.bin')
      expect(result).toEqual(Buffer.from(data))
    })

    it('overwrites an existing file', async () => {
      await fs.promises.writeFile('/file.txt', 'first', 'utf8')
      await fs.promises.writeFile('/file.txt', 'second', 'utf8')
      const content = await fs.promises.readFile('/file.txt', 'utf8')
      expect(content).toBe('second')
    })

    it('throws ENOENT when reading a non-existent file', async () => {
      await expect(
        fs.promises.readFile('/nonexistent.txt')
      ).rejects.toMatchObject({ code: 'ENOENT' })
    })

    it('throws ENOENT when writing to a non-existent parent', async () => {
      await expect(
        fs.promises.writeFile('/nosuchdir/file.txt', 'data')
      ).rejects.toMatchObject({ code: 'ENOENT' })
    })

    it('throws EISDIR when reading a directory path', async () => {
      await fs.promises.mkdir('/adir')
      await expect(fs.promises.readFile('/adir')).rejects.toMatchObject({
        code: 'EISDIR',
      })
    })
  })

  // -------------------------------------------------------------------------
  // unlink
  // -------------------------------------------------------------------------

  describe('unlink', () => {
    it('removes a file', async () => {
      await fs.promises.writeFile('/del.txt', 'bye')
      await fs.promises.unlink('/del.txt')
      await expect(fs.promises.stat('/del.txt')).rejects.toMatchObject({
        code: 'ENOENT',
      })
    })

    it('throws ENOENT when file does not exist', async () => {
      await expect(fs.promises.unlink('/ghost.txt')).rejects.toMatchObject({
        code: 'ENOENT',
      })
    })

    it('throws EISDIR when path is a directory', async () => {
      await fs.promises.mkdir('/d')
      await expect(fs.promises.unlink('/d')).rejects.toMatchObject({
        code: 'EISDIR',
      })
    })

    it('file no longer appears in readdir after unlink', async () => {
      await fs.promises.mkdir('/parent')
      await fs.promises.writeFile('/parent/child.txt', 'x')
      await fs.promises.unlink('/parent/child.txt')
      expect(await fs.promises.readdir('/parent')).toEqual([])
    })
  })

  // -------------------------------------------------------------------------
  // rmdir
  // -------------------------------------------------------------------------

  describe('rmdir', () => {
    it('removes an empty directory', async () => {
      await fs.promises.mkdir('/empty')
      await fs.promises.rmdir('/empty')
      await expect(fs.promises.stat('/empty')).rejects.toMatchObject({
        code: 'ENOENT',
      })
    })

    it('throws ENOTEMPTY when directory has children', async () => {
      await fs.promises.mkdir('/full')
      await fs.promises.writeFile('/full/f.txt', 'x')
      await expect(fs.promises.rmdir('/full')).rejects.toMatchObject({
        code: 'ENOTEMPTY',
      })
    })

    it('throws ENOENT when directory does not exist', async () => {
      await expect(fs.promises.rmdir('/nope')).rejects.toMatchObject({
        code: 'ENOENT',
      })
    })
  })

  // -------------------------------------------------------------------------
  // stat / lstat
  // -------------------------------------------------------------------------

  describe('stat', () => {
    it('returns correct type for a file', async () => {
      await fs.promises.writeFile('/f.txt', 'data')
      const s = await fs.promises.stat('/f.txt')
      expect(s.isFile()).toBe(true)
      expect(s.isDirectory()).toBe(false)
    })

    it('returns correct type for a directory', async () => {
      await fs.promises.mkdir('/d')
      const s = await fs.promises.stat('/d')
      expect(s.isDirectory()).toBe(true)
      expect(s.isFile()).toBe(false)
    })

    it('returns correct size for a file', async () => {
      await fs.promises.writeFile('/size.txt', 'ABCDE')
      const s = await fs.promises.stat('/size.txt')
      expect(s.size).toBe(5)
    })

    it('lstat behaves identically to stat (no symlinks)', async () => {
      await fs.promises.writeFile('/f.txt', 'x')
      const st = await fs.promises.stat('/f.txt')
      const lt = await fs.promises.lstat('/f.txt')
      expect(st.size).toBe(lt.size)
      expect(st.isFile()).toBe(lt.isFile())
    })

    it('throws ENOENT for a missing path', async () => {
      await expect(fs.promises.stat('/missing')).rejects.toMatchObject({
        code: 'ENOENT',
      })
    })
  })

  // -------------------------------------------------------------------------
  // readdir
  // -------------------------------------------------------------------------

  describe('readdir', () => {
    it('returns sorted list of children', async () => {
      await fs.promises.mkdir('/z')
      await fs.promises.writeFile('/z/b.txt', 'b')
      await fs.promises.writeFile('/z/a.txt', 'a')
      await fs.promises.mkdir('/z/c')
      expect(await fs.promises.readdir('/z')).toEqual(['a.txt', 'b.txt', 'c'])
    })

    it('does not include deeply nested paths', async () => {
      await fs.promises.mkdir('/top')
      await fs.promises.mkdir('/top/sub')
      await fs.promises.writeFile('/top/sub/deep.txt', 'deep')
      expect(await fs.promises.readdir('/top')).toEqual(['sub'])
    })

    it('throws ENOENT for a missing directory', async () => {
      await expect(fs.promises.readdir('/nope')).rejects.toMatchObject({
        code: 'ENOENT',
      })
    })

    it('throws ENOTDIR when path is a file', async () => {
      await fs.promises.writeFile('/file.txt', 'x')
      await expect(fs.promises.readdir('/file.txt')).rejects.toMatchObject({
        code: 'ENOTDIR',
      })
    })
  })

  // -------------------------------------------------------------------------
  // rm (recursive)
  // -------------------------------------------------------------------------

  describe('rm', () => {
    it('removes a file', async () => {
      await fs.promises.writeFile('/del.txt', 'x')
      await fs.promises.rm('/del.txt')
      await expect(fs.promises.stat('/del.txt')).rejects.toMatchObject({
        code: 'ENOENT',
      })
    })

    it('recursively removes a directory and its contents', async () => {
      await fs.promises.mkdir('/tree')
      await fs.promises.mkdir('/tree/branch')
      await fs.promises.writeFile('/tree/branch/leaf.txt', 'leaf')
      await fs.promises.rm('/tree', { recursive: true })
      await expect(fs.promises.stat('/tree')).rejects.toMatchObject({
        code: 'ENOENT',
      })
    })

    it('does not throw when force:true and path missing', async () => {
      await expect(
        fs.promises.rm('/missing', { force: true })
      ).resolves.toBeUndefined()
    })

    it('throws EISDIR when removing a directory without recursive flag', async () => {
      await fs.promises.mkdir('/d')
      await expect(fs.promises.rm('/d')).rejects.toMatchObject({
        code: 'EISDIR',
      })
    })
  })

  // -------------------------------------------------------------------------
  // Integration: use MemoryFS with isomorphic-git git.init
  // -------------------------------------------------------------------------

  describe('integration with isomorphic-git', () => {
    it('can be used to git.init a repository', async () => {
      // Dynamically import to avoid making all tests depend on the full bundle
      const git = await import('isomorphic-git')
      await fs.promises.mkdir('/repo')
      await git.init({ fs, dir: '/repo' })
      const entries = await fs.promises.readdir('/repo')
      expect(entries).toContain('.git')
    })

    it('can write a file and git.add it', async () => {
      const git = await import('isomorphic-git')
      await fs.promises.mkdir('/repo')
      await git.init({ fs, dir: '/repo' })
      await fs.promises.writeFile('/repo/hello.txt', 'Hello, isomorphic-git!', 'utf8')
      await git.add({ fs, dir: '/repo', filepath: 'hello.txt' })
      const status = await git.status({ fs, dir: '/repo', filepath: 'hello.txt' })
      expect(status).toBe('added')
    })

    it('can commit to a MemoryFS-backed repository', async () => {
      const git = await import('isomorphic-git')
      await fs.promises.mkdir('/repo')
      await git.init({ fs, dir: '/repo' })
      await fs.promises.writeFile('/repo/readme.md', '# Hello', 'utf8')
      await git.add({ fs, dir: '/repo', filepath: 'readme.md' })
      const sha = await git.commit({
        fs,
        dir: '/repo',
        message: 'Initial commit',
        author: { name: 'Test', email: 'test@example.com' },
      })
      expect(sha).toMatch(/^[0-9a-f]{40}$/)
    })
  })
})
