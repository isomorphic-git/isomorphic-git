/* global test describe expect */
import fs from 'fs'
import { copyFixtureIntoTempDir } from 'jest-fixtures'

import { createClass } from '../dist/for-node/utils'
import { config } from '../dist/for-node/commands'

const Git = createClass({ config })

describe('config', () => {
  test('getting', async () => {
    // Setup
    let gitdir = await copyFixtureIntoTempDir(__dirname, 'test-config.git')
    // Test
    let repo = new Git({ fs, gitdir })
    let sym = await repo.config({ path: 'core.symlinks' })
    let rfv = await repo.config({ path: 'core.repositoryformatversion' })
    let url = await repo.config({ path: 'remote.origin.url' })
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
    await repo.config({ path: 'core.bare', value: true })
    bare = await repo.config({ path: 'core.bare' })
    expect(bare).toBe(true)
    // set to false
    await repo.config({ path: 'core.bare', value: false })
    bare = await repo.config({ path: 'core.bare' })
    expect(bare).toBe(false)
    // change a remote
    await repo.config({
      path: 'remote.origin.url',
      value: 'https://github.com/wmhilton/isomorphic-git'
    })
    let url = await repo.config({ path: 'remote.origin.url' })
    expect(url).toBe('https://github.com/wmhilton/isomorphic-git')
  })
})
