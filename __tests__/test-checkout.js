import git from '..'
import pify from 'pify'
import ncp from 'ncp'
import path from 'path'
import fs from 'fs'
import { tmpdir } from './__helpers__'

describe('checkout', () => {
  test('checkout', async () => {
    let dir = await tmpdir()
    await pify(ncp)('__tests__/__fixtures__/test-checkout.git', path.join(dir, '.git'))
    await git(dir).checkout('test-branch')
    let files = await pify(fs.readdir)(dir)
    expect(files.sort()).toMatchSnapshot()
    let index = await git(dir).list()
    expect(index).toMatchSnapshot()
  })
})
