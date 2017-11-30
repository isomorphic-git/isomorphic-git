/* globals describe test expect */
import fs from 'fs'
import { Git } from '..'
import pify from 'pify'
import { createTempDir, copyFixtureIntoTempDir } from 'jest-fixtures'

describe('checkout', () => {
  test('checkout', async () => {
    let workdir = await createTempDir()
    let gitdir = await copyFixtureIntoTempDir(__dirname, 'test-checkout.git')
    let repo = new Git({ fs, workdir, gitdir })
    await repo.checkout('test-branch')
    let files = await pify(fs.readdir)(workdir)
    expect(files.sort()).toMatchSnapshot()
    let index = await repo.list()
    expect(index).toMatchSnapshot()
  })
})
