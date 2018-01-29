/* global jest test describe expect */
import _fs from 'fs'
import EventEmitter from 'events'
import { copyFixtureIntoTempDir } from 'jest-fixtures'
import { models, utils } from '../dist/for-node/internal-apis'
import { fetch } from '..'
const { FileSystem } = models
const { sleep } = utils
const fs = new FileSystem(_fs)

jest.setTimeout(10000)

/** @test {fetch} */
describe('fetch', () => {
  ;(process.env.CI ? test : test.skip)('fetch (from Github)', async () => {
    // Setup
    let gitdir = await copyFixtureIntoTempDir(__dirname, 'test-fetch.git')
    // Test
    let repo = { fs, gitdir }
    await fetch({
      ...repo,
      remote: 'origin',
      ref: 'master'
    })
  })

  test('shallow fetch (from Github)', async () => {
    // Setup
    let gitdir = await copyFixtureIntoTempDir(__dirname, 'test-fetch.git')
    let output = []
    let progress = []
    let emitter = new EventEmitter()
    emitter
      .on('message', output.push.bind(output))
      .on('progress', progress.push.bind(progress))
    // Test
    let repo = { fs, gitdir }
    await fetch({
      ...repo,
      emitter,
      depth: 1,
      remote: 'origin',
      ref: 'test-branch-shallow-clone'
    })
    expect(await fs.exists(`${gitdir}/shallow`)).toBe(true)
    expect(output).toMatchSnapshot()
    expect(progress).toMatchSnapshot()
    let shallow = await fs.read(`${gitdir}/shallow`, { encoding: 'utf8' })
    expect(shallow === '92e7b4123fbf135f5ffa9b6fe2ec78d07bbc353e\n').toBe(true)
    // Now test deepen
    await fetch({
      ...repo,
      depth: 2,
      remote: 'origin',
      ref: 'test-branch-shallow-clone'
    })
    await sleep(1000) // seems to be a problem spot
    shallow = await fs.read(`${gitdir}/shallow`, { encoding: 'utf8' })
    expect(shallow === '86ec153c7b48e02f92930d07542680f60d104d31\n').toBe(true)
  })

  test('shallow fetch since (from Github)', async () => {
    // Setup
    let gitdir = await copyFixtureIntoTempDir(__dirname, 'test-fetch.git')
    // Test
    let repo = { fs, gitdir }
    await fetch({
      ...repo,
      since: new Date(1506571200000),
      remote: 'origin',
      ref: 'test-branch-shallow-clone'
    })
    expect(await fs.exists(`${gitdir}/shallow`)).toBe(true)
    let shallow = await fs.read(`${gitdir}/shallow`, { encoding: 'utf8' })
    expect(shallow).toEqual('36d201c8fea9d87128e7fccd32c21643f355540d\n')
  })

  test('shallow fetch exclude (from Github)', async () => {
    // Setup
    let gitdir = await copyFixtureIntoTempDir(__dirname, 'test-fetch.git')
    // Test
    let repo = { fs, gitdir }
    await fetch({
      ...repo,
      exclude: ['v0.0.5'],
      remote: 'origin',
      ref: 'test-branch-shallow-clone'
    })
    expect(await fs.exists(`${gitdir}/shallow`)).toBe(true)
    let shallow = await fs.read(`${gitdir}/shallow`, { encoding: 'utf8' })
    expect(shallow).toEqual('0094dadf9804971c851e99b13845d10c8849db12\n')
  })

  test('shallow fetch relative (from Github)', async () => {
    // Setup
    let gitdir = await copyFixtureIntoTempDir(__dirname, 'test-fetch.git')
    // Test
    let repo = { fs, gitdir }
    await fetch({
      ...repo,
      depth: 1,
      remote: 'origin',
      ref: 'test-branch-shallow-clone'
    })
    expect(await fs.exists(`${gitdir}/shallow`)).toBe(true)
    let shallow = await fs.read(`${gitdir}/shallow`, { encoding: 'utf8' })
    expect(shallow).toEqual('92e7b4123fbf135f5ffa9b6fe2ec78d07bbc353e\n')
    // Now test deepen
    await fetch({
      ...repo,
      relative: true,
      depth: 1,
      remote: 'origin',
      ref: 'test-branch-shallow-clone'
    })
    await sleep(1000) // seems to be a problem spot
    shallow = await fs.read(`${gitdir}/shallow`, { encoding: 'utf8' })
    expect(shallow).toEqual('86ec153c7b48e02f92930d07542680f60d104d31\n')
  })
})
