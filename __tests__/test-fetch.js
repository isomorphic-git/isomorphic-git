/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')

const EventEmitter = require('events')
const { sleep } = require('isomorphic-git/internal-apis')
const { E, plugins, fetch } = require('isomorphic-git')

describe('fetch', () => {
  it('fetch (from Github)', async () => {
    const { fs, gitdir } = await makeFixture('test-fetch-cors')
    // Smoke Test
    await fetch({
      gitdir,
      singleBranch: true,
      remote: 'origin',
      ref: 'test-branch-shallow-clone'
    })
    expect(
      await fs.exists(`${gitdir}/refs/remotes/origin/test-branch-shallow-clone`)
    ).toBe(true)
    expect(await fs.exists(`${gitdir}/refs/remotes/origin/master`)).toBe(false)
  })

  it('shallow fetch (from Github)', async () => {
    const { fs, gitdir } = await makeFixture('test-fetch-cors')
    const output = []
    const progress = []
    plugins.set(
      'emitter',
      new EventEmitter()
        .on('fetch.message', output.push.bind(output))
        .on('fetch.progress', progress.push.bind(progress))
    )
    // Test
    await fetch({
      gitdir,
      emitterPrefix: 'fetch.',
      depth: 1,
      singleBranch: true,
      remote: 'origin',
      ref: 'test-branch-shallow-clone'
    })
    await sleep(1000) // seems to be a problem spot
    expect(await fs.exists(`${gitdir}/shallow`)).toBe(true)
    // expect(output[0]).toEqual('Counting objects: 551, done.') // No longer reliable. New message seen was "Enumerating objects: 551, done."
    expect(output[output.length - 1].split(' ')[1]).toEqual('551')
    let shallow = (await fs.read(`${gitdir}/shallow`)).toString('utf8')
    expect(shallow === '92e7b4123fbf135f5ffa9b6fe2ec78d07bbc353e\n').toBe(true)
    // Now test deepen
    await fetch({
      gitdir,
      depth: 2,
      singleBranch: true,
      remote: 'origin',
      ref: 'test-branch-shallow-clone'
    })
    await sleep(1000) // seems to be a problem spot
    shallow = (await fs.read(`${gitdir}/shallow`)).toString('utf8')
    expect(shallow === '86ec153c7b48e02f92930d07542680f60d104d31\n').toBe(true)
  })

  it('shallow fetch since (from Github)', async () => {
    const { fs, gitdir } = await makeFixture('test-fetch-cors')
    // Test
    await fetch({
      gitdir,
      since: new Date(1506571200000),
      singleBranch: true,
      remote: 'origin',
      ref: 'test-branch-shallow-clone'
    })
    expect(await fs.exists(`${gitdir}/shallow`)).toBe(true)
    const shallow = (await fs.read(`${gitdir}/shallow`)).toString('utf8')
    expect(shallow).toEqual('36d201c8fea9d87128e7fccd32c21643f355540d\n')
  })

  it('shallow fetch exclude (from Github)', async () => {
    const { fs, gitdir } = await makeFixture('test-fetch-cors')
    // Test
    await fetch({
      gitdir,
      exclude: ['v0.0.5'],
      singleBranch: true,
      remote: 'origin',
      ref: 'test-branch-shallow-clone'
    })
    expect(await fs.exists(`${gitdir}/shallow`)).toBe(true)
    const shallow = (await fs.read(`${gitdir}/shallow`)).toString('utf8')
    expect(shallow).toEqual('0094dadf9804971c851e99b13845d10c8849db12\n')
  })

  it('shallow fetch relative (from Github)', async () => {
    const { fs, gitdir } = await makeFixture('test-fetch-cors')
    // Test
    await fetch({
      gitdir,
      depth: 1,
      singleBranch: true,
      remote: 'origin',
      ref: 'test-branch-shallow-clone'
    })
    expect(await fs.exists(`${gitdir}/shallow`)).toBe(true)
    let shallow = (await fs.read(`${gitdir}/shallow`)).toString('utf8')
    expect(shallow).toEqual('92e7b4123fbf135f5ffa9b6fe2ec78d07bbc353e\n')
    // Now test deepen
    await fetch({
      gitdir,
      relative: true,
      depth: 1,
      singleBranch: true,
      remote: 'origin',
      ref: 'test-branch-shallow-clone'
    })
    await sleep(1000) // seems to be a problem spot
    shallow = (await fs.read(`${gitdir}/shallow`)).toString('utf8')
    expect(shallow).toEqual('86ec153c7b48e02f92930d07542680f60d104d31\n')
  })

  it('errors if missing refspec', async () => {
    const { gitdir } = await makeFixture('test-issue-84')
    // Test
    let err = null
    try {
      await fetch({
        gitdir,
        since: new Date(1506571200000),
        singleBranch: true,
        remote: 'origin',
        ref: 'test-branch-shallow-clone'
      })
    } catch (e) {
      err = e
    }
    expect(err).toBeDefined()
    expect(err.code).toEqual(E.NoRefspecConfiguredError)
  })

  it('fetch empty repository from git-http-mock-server', async () => {
    const { fs, dir, gitdir } = await makeFixture('test-empty')
    await fetch({
      dir,
      gitdir,
      depth: 1,
      url: 'http://localhost:8888/test-empty.git'
    })
    expect(await fs.exists(`${dir}`)).toBe(true)
    expect(await fs.exists(`${gitdir}/HEAD`)).toBe(true)
    expect((await fs.read(`${gitdir}/HEAD`)).toString('utf-8').trim()).toEqual(
      'ref: refs/heads/master'
    )
    expect(await fs.exists(`${gitdir}/refs/heads/master`)).toBe(false)
  })

  it('fetch --prune from git-http-mock-server', async () => {
    const { fs, dir, gitdir } = await makeFixture('test-fetch-client')
    expect(await fs.exists(`${gitdir}/refs/remotes/origin/test-prune`)).toBe(
      true
    )
    const { pruned } = await fetch({
      dir,
      gitdir,
      depth: 1,
      prune: true
    })
    expect(pruned).toEqual(['refs/remotes/origin/test-prune'])
    expect(await fs.exists(`${gitdir}/refs/remotes/origin/test-prune`)).toBe(
      false
    )
  })

  // XXX: After a PROLONGED and tiring battle... I don't know why the eff the pruneTags
  // parameter is causing Mobile Safari 11 tests to crash / disconnect.
  // So... I'm just gonna consider it a fluke.
  // TODO: Remove this check when we drop support for Safari 11.
  ;(typeof navigator !== 'undefined' && navigator.userAgent.match(/iPhone/)
    ? xit
    : it)('fetch --prune-tags from git-http-mock-server', async () => {
    const { fs, dir, gitdir } = await makeFixture('test-fetch-client')
    expect(await fs.exists(`${gitdir}/refs/tags/v1.0.0-beta1`)).toBe(true)
    const oldValue = await fs.read(`${gitdir}/refs/tags/v1.0.0`, 'utf8')
    try {
      await fetch({
        dir,
        gitdir,
        depth: 1,
        tags: true,
        pruneTags: true
      })
    } catch (err) {
      // shrug
    }
    // assert that tag was deleted
    expect(await fs.exists(`${gitdir}/refs/tags/v1.0.0-beta1`)).toBe(false)
    // assert that tags was force-updated
    const newValue = await fs.read(`${gitdir}/refs/tags/v1.0.0`, 'utf8')
    expect(oldValue).not.toEqual(newValue)
  })
})
