/* global test describe expect */
import { listTags } from '..'
import { FileSystem } from '../dist/for-node/models'
import _fs from 'fs'
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
