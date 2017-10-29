/* global test describe expect */
import { GitObjectManager } from '../dist/for-node/managers'

describe('resolveRef', () => {
  test('test missing', async () => {
    let ref = GitObjectManager.read({
      gitdir: '__tests__/__fixtures__/test-resolveRef.git',
      oid: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
    })
    await expect(ref).rejects.toMatchSnapshot()
  })
  test('test shallow', async () => {
    let ref = GitObjectManager.read({
      gitdir: '__tests__/__fixtures__/test-resolveRef.git',
      oid: 'b8b1fcecbc6f5ea8bc915c3ac319e8c9eb204f95'
    })
    await expect(ref).rejects.toMatchSnapshot()
  })
})
