/* globals jest describe test expect */
import fs from 'fs'
import { createTempDir } from 'jest-fixtures'
import { existsSync } from 'fs'
import { Git } from '..'
import { clone } from '../dist/for-node/commands'

jest.setTimeout(30000)

/** @test {clone} */
describe('clone', () => {
  ;(process.env.CI ? test : test.skip)('clone', async () => {
    let dir = await createTempDir()
    let repo = new Git({ fs, dir })
    await clone(repo, {
      depth: 1,
      ref: 'master',
      url: `https://github.com/wmhilton/isomorphic-git`
    })
    expect(existsSync(`${dir}`)).toBe(true)
    expect(existsSync(`${dir}/.git/objects`)).toBe(true)
    expect(existsSync(`${dir}/.git/refs/remotes/origin/master`)).toBe(true)
  })
})
