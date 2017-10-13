import git from '..'
import { read } from '../dist/for-node/utils'
import { existsSync } from 'fs'

import { copyFixtureIntoTempDir } from 'jest-fixtures'

jest.setTimeout(60000)

describe('fetch', () => {
  test('fetch (from Github)', async () => {
    // Setup
    let clientDir = await copyFixtureIntoTempDir(__dirname, 'test-fetch.git')
    // Test
    await git()
      .gitdir(clientDir)
      .remote('origin')
      .fetch('master')
  })

  test('shallow fetch (from Github)', async () => {
    // Setup
    let clientDir = await copyFixtureIntoTempDir(__dirname, 'test-fetch.git')
    // Test
    await git()
      .gitdir(clientDir)
      .depth(1)
      .remote('origin')
      .fetch('test-branch-shallow-clone')
    expect(existsSync(`${clientDir}/shallow`)).toBe(true)
    let shallow = await read(`${clientDir}/shallow`, { encoding: 'utf8' })
    expect(shallow === '92e7b4123fbf135f5ffa9b6fe2ec78d07bbc353e\n').toBe(true)
    // Now test deepen
    await git()
      .gitdir(clientDir)
      .depth(2)
      .remote('origin')
      .fetch('test-branch-shallow-clone')
    shallow = await read(`${clientDir}/shallow`, { encoding: 'utf8' })
    expect(shallow === '86ec153c7b48e02f92930d07542680f60d104d31\n').toBe(true)
  })
})
