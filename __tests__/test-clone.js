/* globals jest describe test expect */
import fs from 'fs'
import { Git } from '..'
import { createTempDir } from 'jest-fixtures'
import { existsSync } from 'fs'

jest.setTimeout(30000)

describe('clone', () => {
  ;(process.env.CI ? test : test.skip)('clone', async () => {
    let dir = await createTempDir()
    let repo = new Git({ fs, dir })
    await repo
      .depth(1)
      .branch('master')
      .clone(`https://github.com/wmhilton/isomorphic-git`)
    expect(existsSync(`${dir}`)).toBe(true)
    expect(existsSync(`${dir}/.git/objects`)).toBe(true)
    expect(existsSync(`${dir}/.git/refs/remotes/origin/master`)).toBe(true)
  })
})
