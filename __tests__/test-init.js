/* globals describe test expect */
import fs from 'fs'
import { existsSync } from 'fs'
import { createTempDir } from 'jest-fixtures'

import { init } from '..'

/** @test {init} */
describe('init', () => {
  test('init', async () => {
    let workdir = await createTempDir()
    let repo = { fs, workdir }
    await init(repo)
    expect(existsSync(workdir)).toBe(true)
    expect(existsSync(`${workdir}/.git/objects`)).toBe(true)
    expect(existsSync(`${workdir}/.git/refs/heads`)).toBe(true)
    expect(existsSync(`${workdir}/.git/HEAD`)).toBe(true)
  })
})
