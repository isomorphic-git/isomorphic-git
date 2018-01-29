/* global test describe expect */
import fs from 'fs'
import { listBranches } from '..'

/** @test {listBranches} */
describe('listBranches', () => {
  test('listBranches', async () => {
    let repo = {
      fs,
      gitdir: '__tests__/__fixtures__/test-listBranches.git'
    }
    let commits = await listBranches(repo)
    expect(commits).toMatchSnapshot()
  })
  test('remote', async () => {
    let repo = {
      fs,
      gitdir: '__tests__/__fixtures__/test-listBranches.git',
      remote: 'origin'
    }
    let commits = await listBranches(repo)
    expect(commits).toMatchSnapshot()
  })
})
