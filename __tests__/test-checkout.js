/* globals describe test expect */
import { createTempDir, copyFixtureIntoTempDir } from 'jest-fixtures'
import fs from 'fs'
import pify from 'pify'
import { Git } from '..'
import { checkout, list } from '../dist/for-node/commands'

describe('checkout', () => {
  test('checkout', async () => {
    let workdir = await createTempDir()
    let gitdir = await copyFixtureIntoTempDir(__dirname, 'test-checkout.git')
    let repo = new Git({ fs, workdir, gitdir })
    await checkout(repo, { ref: 'test-branch' })
    let files = await pify(fs.readdir)(workdir)
    expect(files.sort()).toMatchSnapshot()
    let index = await list(repo)
    expect(index).toMatchSnapshot()
  })
})
