/* global test describe expect */
import fs from 'fs'
import { Git } from '..'
import { listBranches } from '../dist/for-node/commands'

/** @test {listBranches} */
describe('listBranches', () => {
  test('listBranches', async () => {
    let repo = new Git({
      fs,
      gitdir: '__tests__/__fixtures__/test-listBranches.git'
    })
    let commits = await listBranches(repo)
    expect(commits).toMatchSnapshot()
  })
})
