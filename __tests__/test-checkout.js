/* globals describe it expect */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
import pify from 'pify'
import { checkout, listFiles } from 'isomorphic-git'

/** @test {checkout} */
describe('checkout', () => {
  it('checkout', async () => {
    let { fs, dir, gitdir } = await makeFixture('test-checkout')
    await checkout({ fs, dir, gitdir, ref: 'test-branch' })
    let files = await pify(fs.readdir)(dir)
    expect(files.sort()).toMatchSnapshot()
    let index = await listFiles({ fs, dir, gitdir })
    expect(index).toMatchSnapshot()
  })
})
