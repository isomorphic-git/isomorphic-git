/* global test describe expect */
import fs from 'fs'
import { listBranches } from '../dist/for-node/commands'

describe('listBranches', () => {
  test('listBranches', async () => {
    let commits = await listBranches({
      gitdir: '__tests__/__fixtures__/test-listBranches.git',
      fs
    })
    expect(commits).toMatchSnapshot()
  })
})
