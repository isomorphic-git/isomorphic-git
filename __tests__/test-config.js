/* global test describe expect */
import fs from 'fs'
import { copyFixtureIntoTempDir } from 'jest-fixtures'
import { config } from '..'

/** @test {config} */
describe('config', () => {
  test('getting', async () => {
    // Setup
    let gitdir = await copyFixtureIntoTempDir(__dirname, 'test-config.git')
    // Test
    let repo = { fs, gitdir }
    let sym = await config({ ...repo, path: 'core.symlinks' })
    let rfv = await config({ ...repo, path: 'core.repositoryformatversion' })
    let url = await config({ ...repo, path: 'remote.origin.url' })
    expect(sym).toBe(false)
    expect(url).toBe('https://github.com/isomorphic-git/isomorphic-git')
    expect(rfv).toBe('0')
  })

  test('setting', async () => {
    // Setup
    let gitdir = await copyFixtureIntoTempDir(__dirname, 'test-config.git')
    // Test
    let repo = { fs, gitdir }
    let bare
    // set to true
    await config({ ...repo, path: 'core.bare', value: true })
    bare = await config({ ...repo, path: 'core.bare' })
    expect(bare).toBe(true)
    // set to false
    await config({ ...repo, path: 'core.bare', value: false })
    bare = await config({ ...repo, path: 'core.bare' })
    expect(bare).toBe(false)
    // set to undefined
    await config({ ...repo, path: 'core.bare', value: undefined })
    bare = await config({ ...repo, path: 'core.bare' })
    expect(bare).toBe(undefined)
    // change a remote
    await config({
      ...repo,
      path: 'remote.origin.url',
      value: 'https://github.com/isomorphic-git/isomorphic-git'
    })
    let url = await config({ ...repo, path: 'remote.origin.url' })
    expect(url).toBe('https://github.com/isomorphic-git/isomorphic-git')
  })
})
