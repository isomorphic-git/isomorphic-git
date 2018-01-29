/* global test describe expect */
import fs from 'fs'
import { copyFixtureIntoTempDir } from 'jest-fixtures'
import { listFiles } from '..'

/** @test {listFiles} */
describe('listFiles', () => {
  test('listFiles', async () => {
    let gitdir = await copyFixtureIntoTempDir(__dirname, 'test-listFiles.git')
    let repo = { fs, gitdir }
    const files = await listFiles(repo)
    expect(files).toMatchSnapshot()
  })
})
