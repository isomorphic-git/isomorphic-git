/* eslint-env node, browser, jasmine */
import CacheFS from '@isomorphic-git/lightning-fs/src/CacheFS.js'
import PromisifiedFS from '@isomorphic-git/lightning-fs/src/PromisifiedFS.js'
import { abortMerge, add, commit, init } from 'isomorphic-git'
import { FileSystem, GitIndexManager } from 'isomorphic-git/internal-apis'

/** Run LightningFS's real filesystem operations with its IndexedDB boundary held in memory. */
function createMemoryLightningFS() {
  const backend = Object.create(PromisifiedFS.prototype)
  backend._cache = new CacheFS()
  backend._cache.activate()
  const storage = {
    records: new Map(),
    async readFile(inode) {
      return this.records.get(inode)
    },
    async writeFile(inode, data) {
      this.records.set(inode, data)
    },
    async unlink(inode) {
      this.records.delete(inode)
    },
  }
  backend._idb = storage
  backend.saveSuperblock = function () {}
  const commands = [
    'readFile',
    'writeFile',
    'mkdir',
    'rmdir',
    'unlink',
    'stat',
    'lstat',
    'readdir',
    'readlink',
    'symlink',
    'rename',
  ]
  const fs = new FileSystem({
    promises: Object.fromEntries(
      commands.map(command => [command, backend[command].bind(backend)])
    ),
  })
  return { fs, storage }
}

describe('LightningFS rename safety', () => {
  for (const existingType of ['file', 'symlink']) {
    for (const mode of [0o100644, 0o120000]) {
      it(`restores regular files and rejects unsafe symlink moves (existing=${existingType}, mode=${mode})`, async () => {
        const { fs, storage } = createMemoryLightningFS()
        await fs.mkdir('/repo')
        const fixture = { fs, dir: '/repo', gitdir: '/git' }
        await init(fixture)
        await fs.write('/repo/target', 'Keep this target')
        if (mode === 0o120000) {
          await fs.writelink('/repo/alias', Buffer.from('/repo/target'))
        } else {
          await fs.write('/repo/alias', 'HEAD bytes')
        }
        await add({ ...fixture, filepath: 'alias' })
        // LightningFS reports permission bits without the symlink type bits.
        const committedStats = await fs.lstat('/repo/alias')
        committedStats.mode = mode
        await GitIndexManager.acquire(
          { fs, gitdir: '/git', cache: {} },
          index => {
            index.insert({
              filepath: 'alias',
              stats: committedStats,
              oid: index.entriesMap.get('alias').oid,
            })
          }
        )
        await commit({
          ...fixture,
          message: 'Original',
          author: { name: 'Test', email: 'test@example.com' },
        })
        await fs.rm('/repo/alias')
        if (existingType === 'symlink') {
          await fs.writelink('/repo/alias', Buffer.from('target'))
        } else {
          await fs.write('/repo/alias', 'Keep this file')
        }
        await add({ ...fixture, filepath: 'alias' })
        const originalTarget =
          existingType === 'symlink' ? await fs.readlink('/repo/alias') : null
        const recordsBefore = storage.records.size
        if (existingType === 'file' && mode === 0o100644) {
          await abortMerge(fixture)
          expect((await fs.read('/repo/alias')).toString()).toBe('HEAD bytes')
          expect(storage.records.size).toBe(recordsBefore)
          expect(await fs.readdir('/repo')).toEqual(['alias', 'target'])
          expect((await fs.read('/repo/target')).toString()).toBe(
            'Keep this target'
          )
          return
        }
        await expect(abortMerge(fixture)).rejects.toMatchObject({
          code: 'InternalError',
        })
        expect(fs._renamePreservesSymlinks).toBe(false)
        expect(await fs.readdir('/repo')).toEqual(['alias', 'target'])
        expect(storage.records.size).toBe(recordsBefore)
        expect((await fs.read('/repo/target')).toString()).toBe(
          'Keep this target'
        )
        if (existingType === 'symlink') {
          expect(await fs.readlink('/repo/alias')).toEqual(originalTarget)
        } else {
          expect((await fs.read('/repo/alias')).toString()).toBe(
            'Keep this file'
          )
        }
      })
    }
  }
})
