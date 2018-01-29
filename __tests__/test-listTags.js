/* global test describe expect */
import _fs from 'fs'
import { models } from '../dist/for-node/internal-apis'
import { listTags } from '..'
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
