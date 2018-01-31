/* globals jest describe test expect */
import fs from 'fs'
import { createTempDir } from 'jest-fixtures'
import { existsSync } from 'fs'
import { clone } from '..'

jest.setTimeout(30000)

/** @test {clone} */
describe('clone', () => {
  ;(process.env.CI ? test : test.skip)('clone', async () => {
    let dir = await createTempDir()
    let repo = { fs, dir }
    await clone({
      ...repo,
      depth: 1,
      ref: 'master',
      url: `https://github.com/isomorphic-git/isomorphic-git`
    })
    expect(existsSync(`${dir}`)).toBe(true)
    expect(existsSync(`${dir}/.git/objects`)).toBe(true)
    expect(existsSync(`${dir}/.git/refs/remotes/origin/master`)).toBe(true)
    expect(existsSync(`${dir}/package.json`)).toBe(true)
  })
})
