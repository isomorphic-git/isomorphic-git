/* global test describe expect */
import _fs from 'fs'
import { managers, models } from '../dist/for-node/internal-apis'
const { GitObjectManager } = managers
const { FileSystem } = models
const fs = new FileSystem(_fs)

describe('GitObjectManager', () => {
  test('test missing', async () => {
    let ref = GitObjectManager.read({
      fs,
      gitdir: '__tests__/__fixtures__/test-GitObjectManager.git',
      oid: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
    })
    await expect(ref).rejects.toMatchSnapshot()
  })
  test('test shallow', async () => {
    let ref = GitObjectManager.read({
      fs,
      gitdir: '__tests__/__fixtures__/test-GitObjectManager.git',
      oid: 'b8b1fcecbc6f5ea8bc915c3ac319e8c9eb204f95'
    })
    await expect(ref).rejects.toMatchSnapshot()
  })
})
