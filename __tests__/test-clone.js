/* globals jest describe test expect */
import fs from 'fs'
import { createTempDir } from 'jest-fixtures'
import { existsSync } from 'fs'
import { clone } from '../dist/for-node/commands'

jest.setTimeout(30000)

/** @test {clone} */
describe('clone', () => {
  ;(process.env.CI ? test : test.skip)('clone', async () => {
    let workdir = await createTempDir()
    let repo = { fs, workdir }
    await clone({
      ...repo,
      depth: 1,
      ref: 'master',
      url: `https://github.com/wmhilton/isomorphic-git`
    })
    expect(existsSync(`${workdir}`)).toBe(true)
    expect(existsSync(`${workdir}/.git/objects`)).toBe(true)
    expect(existsSync(`${workdir}/.git/refs/remotes/origin/master`)).toBe(true)
    expect(existsSync(`${workdir}/package.json`)).toBe(true)
  })
})
