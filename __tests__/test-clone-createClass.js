/* globals jest describe test expect */
import fs from 'fs'
import { createTempDir } from 'jest-fixtures'
import { existsSync } from 'fs'
import { createClass } from '../dist/for-node/utils'
import { clone } from '../dist/for-node/commands'

const Git = createClass({ clone })
jest.setTimeout(30000)

describe('clone', () => {
  ;(process.env.CI ? test : test.skip)('clone', async () => {
    let dir = await createTempDir()
    let repo = new Git({ fs, dir })
    await repo.clone({
      depth: 1,
      ref: 'master',
      url: `https://github.com/wmhilton/isomorphic-git`
    })
    expect(existsSync(`${dir}`)).toBe(true)
    expect(existsSync(`${dir}/.git/objects`)).toBe(true)
    expect(existsSync(`${dir}/.git/refs/remotes/origin/master`)).toBe(true)
  })
})
