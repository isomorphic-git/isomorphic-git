import git from '..'
import pify from 'pify'
import fs from 'fs'
import { createTempDir, copyFixtureIntoTempDir } from 'jest-fixtures'

describe('checkout', () => {
  test('checkout', async () => {
    let workdir = await createTempDir()
    let gitdir = await copyFixtureIntoTempDir(__dirname, 'test-checkout.git')
    await git()
      .gitdir(gitdir)
      .workdir(workdir)
      .checkout('test-branch')
    let files = await pify(fs.readdir)(workdir)
    expect(files.sort()).toMatchSnapshot()
    let index = await git()
      .gitdir(gitdir)
      .workdir(workdir)
      .list()
    expect(index).toMatchSnapshot()
  })
})
