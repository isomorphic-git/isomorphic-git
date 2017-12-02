/* global test describe expect */
import fs from 'fs'
import { copyFixtureIntoTempDir } from 'jest-fixtures'

import { Git } from '..'
import { list } from '../dist/for-node/commands'

describe('list', () => {
  test('list', async () => {
    let gitdir = await copyFixtureIntoTempDir(__dirname, 'test-list.git')
    let repo = new Git({ fs, gitdir })
    const files = await list(repo)
    expect(files).toMatchSnapshot()
  })
})
