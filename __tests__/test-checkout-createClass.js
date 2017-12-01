/* globals describe test expect */
import { createTempDir, copyFixtureIntoTempDir } from 'jest-fixtures'
import fs from 'fs'
import pify from 'pify'
import { createClass } from '../dist/for-node/utils'
import { checkout, list } from '../dist/for-node/commands'

const Git = createClass({ checkout, list })

describe('checkout', () => {
  test('checkout', async () => {
    let workdir = await createTempDir()
    let gitdir = await copyFixtureIntoTempDir(__dirname, 'test-checkout.git')
    let repo = new Git({ fs, workdir, gitdir })
    await repo.checkout({ ref: 'test-branch' })
    let files = await pify(fs.readdir)(workdir)
    expect(files.sort()).toMatchSnapshot()
    let index = await repo.list()
    expect(index).toMatchSnapshot()
  })
})
