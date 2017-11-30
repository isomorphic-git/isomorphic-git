/* global test describe expect */
import fs from 'fs'
import { Git } from '..'
import { copyFixtureIntoTempDir } from 'jest-fixtures'

describe('list', () => {
  test('list', async () => {
    let gitdir = await copyFixtureIntoTempDir(__dirname, 'test-list.git')
    let repo = new Git({ fs, gitdir })
    const files = await repo.list()
    expect(files).toMatchSnapshot()
  })
})
