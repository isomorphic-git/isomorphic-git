/* global test describe expect */
import fs from 'fs'
import { copyFixtureIntoTempDir } from 'jest-fixtures'

import { Git } from '..'
import { config } from '../dist/for-node/commands'

describe('config', () => {
  test('getting', async () => {
    // Setup
    let gitdir = await copyFixtureIntoTempDir(__dirname, 'test-config.git')
    // Test
    let repo = new Git({ fs, gitdir })
    let sym = await config(repo, { path: 'core.symlinks' })
    let rfv = await config(repo, { path: 'core.repositoryformatversion' })
    let url = await config(repo, { path: 'remote.origin.url' })
    expect(sym).toBe(false)
    expect(url).toBe('https://github.com/wmhilton/isomorphic-git')
    expect(rfv).toBe('0')
  })

  test('setting', async () => {
    // Setup
    let gitdir = await copyFixtureIntoTempDir(__dirname, 'test-config.git')
    // Test
    let repo = new Git({ fs, gitdir })
    let bare
    // set to true
    await config(repo, { path: 'core.bare', value: true })
    bare = await config(repo, { path: 'core.bare' })
    expect(bare).toBe(true)
    // set to false
    await config(repo, { path: 'core.bare', value: false })
    bare = await config(repo, { path: 'core.bare' })
    expect(bare).toBe(false)
    // change a remote
    await config(repo, {
      path: 'remote.origin.url',
      value: 'https://github.com/wmhilton/isomorphic-git'
    })
    let url = await config(repo, { path: 'remote.origin.url' })
    expect(url).toBe('https://github.com/wmhilton/isomorphic-git')
  })
})
