import fs from 'fs'
import { existsSync } from 'fs'
import { createTempDir } from 'jest-fixtures'

import { createClass } from '../dist/for-node/utils'
import { init } from '../dist/for-node/commands'

const Git = createClass({ init })

describe('init', () => {
  test('init', async () => {
    let dir = await createTempDir()
    let repo = new Git({ fs, dir })
    await repo.init()
    expect(existsSync(dir)).toBe(true)
    expect(existsSync(`${dir}/.git/objects`)).toBe(true)
    expect(existsSync(`${dir}/.git/refs/heads`)).toBe(true)
    expect(existsSync(`${dir}/.git/HEAD`)).toBe(true)
  })
})
