import fs from 'fs'
import { existsSync } from 'fs'
import { createTempDir } from 'jest-fixtures'

import { Git } from '..'
import { init } from '..'

describe('init', () => {
  test('init', async () => {
    let dir = await createTempDir()
    let repo = new Git({ fs, dir })
    await init(repo)
    expect(existsSync(dir)).toBe(true)
    expect(existsSync(`${dir}/.git/objects`)).toBe(true)
    expect(existsSync(`${dir}/.git/refs/heads`)).toBe(true)
    expect(existsSync(`${dir}/.git/HEAD`)).toBe(true)
  })
})
