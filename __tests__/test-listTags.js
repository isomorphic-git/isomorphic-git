/* global test describe expect */
import _fs from 'fs'
import { models } from 'isomorphic-git/internal-apis'
import { listTags } from 'isomorphic-git'
const { FileSystem } = models
const fs = new FileSystem(_fs)

describe('listTags', () => {
  test('listTags', async () => {
    let refs = await listTags({
      fs,
      gitdir: '__tests__/__fixtures__/test-listTags.git'
    })
    expect(refs).toMatchSnapshot()
  })
})
