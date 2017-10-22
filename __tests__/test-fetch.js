/* global jest test describe expect */
import git from '..'
import { read } from '../dist/for-node/utils'
import { existsSync } from 'fs'

import { copyFixtureIntoTempDir } from 'jest-fixtures'
jest.setTimeout(60000)

describe('fetch', () => {
  ;(process.env.CI ? test : test.skip)('fetch (from Github)', async () => {
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
    let output = []
    // Test
    await git()
      .gitdir(clientDir)
      .depth(1)
      .remote('origin')
      .onprogress(output.push.bind(output))
      .fetch('test-branch-shallow-clone')
    expect(existsSync(`${clientDir}/shallow`)).toBe(true)
    expect(output).toMatchSnapshot()
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

  test('shallow fetch since (from Github)', async () => {
    // Setup
    let clientDir = await copyFixtureIntoTempDir(__dirname, 'test-fetch.git')
    // Test
    await git()
      .gitdir(clientDir)
      .since(new Date(1506571200000))
      .remote('origin')
      .fetch('test-branch-shallow-clone')
    expect(existsSync(`${clientDir}/shallow`)).toBe(true)
    let shallow = await read(`${clientDir}/shallow`, { encoding: 'utf8' })
    expect(shallow).toEqual('36d201c8fea9d87128e7fccd32c21643f355540d\n')
  })

  test('shallow fetch exclude (from Github)', async () => {
    // Setup
    let clientDir = await copyFixtureIntoTempDir(__dirname, 'test-fetch.git')
    // Test
    await git()
      .gitdir(clientDir)
      .exclude(['v0.0.5'])
      .remote('origin')
      .fetch('test-branch-shallow-clone')
    expect(existsSync(`${clientDir}/shallow`)).toBe(true)
    let shallow = await read(`${clientDir}/shallow`, { encoding: 'utf8' })
    expect(shallow).toEqual('0094dadf9804971c851e99b13845d10c8849db12\n')
  })

  test('shallow fetch relative (from Github)', async () => {
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
      .relative()
      .depth(1)
      .remote('origin')
      .fetch('test-branch-shallow-clone')
    shallow = await read(`${clientDir}/shallow`, { encoding: 'utf8' })
    expect(shallow === '86ec153c7b48e02f92930d07542680f60d104d31\n').toBe(true)
  })
})
