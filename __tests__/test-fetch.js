/* global jest jasmine describe it expect */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
const EventEmitter = require('events')
const { models, utils } = require('isomorphic-git/internal-apis')
const { fetch } = require('isomorphic-git')
const { FileSystem } = models
const { sleep } = utils

/** @test {fetch} */
describe('fetch', () => {
  it('fetch (from Github)', async () => {
    // Setup
    let { fs, dir, gitdir } = await makeFixture('test-fetch')
    fs = new FileSystem(fs)
    // Test
    await fetch({
      fs,
      gitdir,
      remote: 'origin',
      ref: 'test-branch-shallow-clone'
    })
  })

  it('shallow fetch (from Github)', async () => {
    // Setup
    let { fs, dir, gitdir } = await makeFixture('test-fetch')
    fs = new FileSystem(fs)
    let output = []
    let progress = []
    let emitter = new EventEmitter()
    emitter
      .on('message', output.push.bind(output))
      .on('progress', progress.push.bind(progress))
    // Test
    await fetch({
      fs,
      gitdir,
      emitter,
      depth: 1,
      singleBranch: true,
      remote: 'origin',
      ref: 'test-branch-shallow-clone'
    })
    expect(await fs.exists(`${gitdir}/shallow`)).toBe(true)
    let shallow = await fs.read(`${gitdir}/shallow`, { encoding: 'utf8' })
    expect(shallow).toEqual('92e7b4123fbf135f5ffa9b6fe2ec78d07bbc353e\n')
    expect(output).toMatchSnapshot()
    expect(progress).toMatchSnapshot()
    // Now test deepen
    await fetch({
      fs,
      gitdir,
      depth: 2,
      singleBranch: true,
      remote: 'origin',
      ref: 'test-branch-shallow-clone'
    })
    await sleep(1000) // seems to be a problem spot
    shallow = await fs.read(`${gitdir}/shallow`, { encoding: 'utf8' })
    expect(shallow).toEqual('86ec153c7b48e02f92930d07542680f60d104d31\n')
  })

  it('shallow fetch since (from Github)', async () => {
    // Setup
    let { fs, dir, gitdir } = await makeFixture('test-fetch')
    fs = new FileSystem(fs)
    // Test
    await fetch({
      fs,
      gitdir,
      since: new Date(1506571200000),
      singleBranch: true,
      remote: 'origin',
      ref: 'test-branch-shallow-clone'
    })
    expect(await fs.exists(`${gitdir}/shallow`)).toBe(true)
    let shallow = await fs.read(`${gitdir}/shallow`, { encoding: 'utf8' })
    expect(shallow).toEqual('36d201c8fea9d87128e7fccd32c21643f355540d\n')
  })

  it('shallow fetch exclude (from Github)', async () => {
    // Setup
    let { fs, dir, gitdir } = await makeFixture('test-fetch')
    fs = new FileSystem(fs)
    // Test
    await fetch({
      fs,
      gitdir,
      exclude: ['v0.0.5'],
      singleBranch: true,
      remote: 'origin',
      ref: 'test-branch-shallow-clone'
    })
    expect(await fs.exists(`${gitdir}/shallow`)).toBe(true)
    let shallow = await fs.read(`${gitdir}/shallow`, { encoding: 'utf8' })
    expect(shallow).toEqual('0094dadf9804971c851e99b13845d10c8849db12\n')
  })

  it('shallow fetch relative (from Github)', async () => {
    // Setup
    let { fs, dir, gitdir } = await makeFixture('test-fetch')
    fs = new FileSystem(fs)
    // Test
    await fetch({
      fs,
      gitdir,
      depth: 1,
      singleBranch: true,
      remote: 'origin',
      ref: 'test-branch-shallow-clone'
    })
    expect(await fs.exists(`${gitdir}/shallow`)).toBe(true)
    let shallow = await fs.read(`${gitdir}/shallow`, { encoding: 'utf8' })
    expect(shallow).toEqual('92e7b4123fbf135f5ffa9b6fe2ec78d07bbc353e\n')
    // Now test deepen
    await fetch({
      fs,
      gitdir,
      relative: true,
      depth: 1,
      singleBranch: true,
      remote: 'origin',
      ref: 'test-branch-shallow-clone'
    })
    await sleep(1000) // seems to be a problem spot
    shallow = await fs.read(`${gitdir}/shallow`, { encoding: 'utf8' })
    expect(shallow).toEqual('86ec153c7b48e02f92930d07542680f60d104d31\n')
  })
})
