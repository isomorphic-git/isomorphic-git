/* eslint-env node, browser, jasmine */
import {
  checkout,
  init,
  setConfig,
  writeBlob,
  writeCommit,
  writeRef,
  writeTree,
} from 'isomorphic-git'
import { GitIndexManager } from 'isomorphic-git/internal-apis'

import { makeFixture } from './__helpers__/FixtureFS.js'

const author = {
  name: 'Test',
  email: 'test@example.com',
  timestamp: 1,
  timezoneOffset: 0,
}
const SYMLINK_MODE = 0o120000

/** Prepare branches without requiring native symlink creation. */
async function prepare() {
  const fixture = await makeFixture('test-checkout-symlink-stubs')
  await init(fixture)
  await setConfig({ ...fixture, path: 'core.symlinks', value: false })
  fixture.fs._symlink = async function () {
    throw Object.assign(new Error('Symlinks are unsupported'), {
      code: 'ENOSYS',
    })
  }
  let parent = []
  for (const [branch, target] of [
    ['local', 'local-target'],
    ['incoming', 'remote-target'],
  ]) {
    const blob = await writeBlob({ ...fixture, blob: Buffer.from(target) })
    const tree = await writeTree({
      ...fixture,
      tree: [{ path: 'alias', mode: '120000', type: 'blob', oid: blob }],
    })
    const oid = await writeCommit({
      ...fixture,
      commit: { tree, parent, message: branch, author, committer: author },
    })
    await writeRef({ ...fixture, ref: `refs/heads/${branch}`, value: oid })
    parent = [oid]
  }
  return fixture
}

describe('checkout with unsupported symlinks', () => {
  for (const nonBlocking of [false, true]) {
    it(`creates and updates link-target stubs while preserving the index mode (nonBlocking=${nonBlocking})`, async () => {
      const fixture = await prepare()
      for (const [ref, target] of [
        ['local', 'local-target'],
        ['incoming', 'remote-target'],
        ['local', 'local-target'],
      ]) {
        await checkout({ ...fixture, ref, nonBlocking })
        const filepath = `${fixture.dir}/alias`
        expect((await fixture.fs.lstat(filepath)).isFile()).toBe(true)
        expect((await fixture.fs.read(filepath)).toString()).toBe(target)
        await GitIndexManager.acquire(
          { fs: fixture.fs, gitdir: fixture.gitdir, cache: {} },
          index => {
            expect(index.entriesMap.get('alias').mode).toBe(SYMLINK_MODE)
          }
        )
      }
    })

    for (const code of ['ENOENT', 'EISDIR']) {
      it(`reports a checkout conflict when a stub cannot be read (${code}, nonBlocking=${nonBlocking})`, async () => {
        const fixture = await prepare()
        await checkout({ ...fixture, ref: 'local', nonBlocking })
        const filepath = `${fixture.dir}/alias`
        const indexPath = `${fixture.gitdir}/index`
        const index = await fixture.fs.read(indexPath)
        const readFile = fixture.fs._readFile
        fixture.fs._readFile = async function (path, ...args) {
          if (path === filepath) {
            throw Object.assign(new Error('Stub became unavailable'), { code })
          }
          return readFile(path, ...args)
        }
        try {
          await expect(
            checkout({ ...fixture, ref: 'incoming', nonBlocking })
          ).rejects.toMatchObject({
            code: 'CheckoutConflictError',
            data: { filepaths: ['alias'] },
          })
        } finally {
          fixture.fs._readFile = readFile
        }
        expect(await fixture.fs.read(indexPath)).toEqual(index)
        expect((await fixture.fs.read(filepath)).toString()).toBe(
          'local-target'
        )
      })
    }
  }
})
