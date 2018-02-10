/* globals describe it expect */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
// import { createTempDir, copyFixtureIntoTempDir } from 'jest-fixtures'
import pify from 'pify'
import { checkout, listFiles } from 'isomorphic-git'

/** @test {checkout} */
describe('checkout', () => {
  it('checkout', async () => {
    let { fs, dir, gitdir } = await makeFixture('test-checkout')
    // let dir = await createTempDir()
    // let gitdir = await copyFixtureIntoTempDir(__dirname, 'test-checkout.git')
    // let repo = { fs, dir, gitdir }
    await checkout({ fs, dir, gitdir, ref: 'test-branch' })
    let files = await pify(fs.readdir)(dir)
    expect(files.sort()).toMatchSnapshot()
    let index = await listFiles({ fs, dir, gitdir })
    expect(index).toMatchSnapshot()
  })
})
