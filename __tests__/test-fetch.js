/* eslint-env node, browser, jasmine */
import http from 'isomorphic-git/http'

const { Errors, setConfig, fetch } = require('isomorphic-git')
const { sleep } = require('isomorphic-git/internal-apis')

const { makeFixture } = require('./__helpers__/FixtureFS.js')

// this is so it works with either Node local tests or Browser WAN tests
const localhost =
  typeof window === 'undefined' ? '127.0.0.1' : window.location.hostname

describe('fetch', () => {
  it('fetch (from Github)', async () => {
    const { fs, gitdir } = await makeFixture('test-fetch-cors')
    await setConfig({
      fs,
      gitdir,
      path: 'http.corsProxy',
      value: `http://${localhost}:9999`,
    })
    // Smoke Test
    await fetch({
      fs,
      http,
      gitdir,
      singleBranch: true,
      remote: 'origin',
      ref: 'test-branch-shallow-clone',
    })
    expect(
      await fs.exists(`${gitdir}/refs/remotes/origin/test-branch-shallow-clone`)
    ).toBe(true)
    expect(await fs.exists(`${gitdir}/refs/remotes/origin/master`)).toBe(false)
  })

  it('shallow fetch (from Github)', async () => {
    const { fs, gitdir } = await makeFixture('test-fetch-cors')
    await setConfig({
      fs,
      gitdir,
      path: 'http.corsProxy',
      value: `http://${localhost}:9999`,
    })
    const output = []
    const progress = []
    // Test
    await fetch({
      fs,
      http,
      gitdir,
      onMessage: async x => {
        output.push(x)
      },
      onProgress: async y => {
        progress.push(y)
      },
      depth: 1,
      singleBranch: true,
      remote: 'origin',
      ref: 'test-branch-shallow-clone',
    })
    await sleep(1000) // seems to be a problem spot
    expect(await fs.exists(`${gitdir}/shallow`)).toBe(true)
    // expect(output[0]).toEqual('Counting objects: 551, done.') // No longer reliable. New message seen was "Enumerating objects: 551, done."
    expect(output[output.length - 1].split(' ')[1]).toEqual('551')
    let shallow = (await fs.read(`${gitdir}/shallow`)).toString('utf8')
    expect(shallow === '92e7b4123fbf135f5ffa9b6fe2ec78d07bbc353e\n').toBe(true)
    // Now test deepen
    await fetch({
      fs,
      http,
      gitdir,
      depth: 2,
      singleBranch: true,
      remote: 'origin',
      ref: 'test-branch-shallow-clone',
    })
    await sleep(1000) // seems to be a problem spot
    shallow = (await fs.read(`${gitdir}/shallow`)).toString('utf8')
    expect(shallow === '86ec153c7b48e02f92930d07542680f60d104d31\n').toBe(true)
  })

  it('throws UnknownTransportError if using shorter scp-like syntax', async () => {
    const { fs, gitdir } = await makeFixture('test-fetch-cors')
    await setConfig({
      fs,
      gitdir,
      path: 'http.corsProxy',
      value: `http://${localhost}:9999`,
    })
    // Test
    let err
    try {
      await fetch({
        fs,
        http,
        gitdir,
        depth: 1,
        singleBranch: true,
        remote: 'ssh',
        ref: 'test-branch-shallow-clone',
      })
    } catch (e) {
      err = e
    }
    expect(err).toBeDefined()
    expect(err.code).toEqual(Errors.UnknownTransportError.code)
  })

  it('the SSH -> HTTPS UnknownTransportError suggestion feature', async () => {
    const { fs, gitdir } = await makeFixture('test-fetch-cors')
    await setConfig({
      fs,
      gitdir,
      path: 'http.corsProxy',
      value: `http://${localhost}:9999`,
    })
    // Test
    let err
    try {
      await fetch({
        fs,
        http,
        gitdir,
        depth: 1,
        singleBranch: true,
        remote: 'ssh',
        ref: 'test-branch-shallow-clone',
      })
    } catch (e) {
      err = e
    }
    expect(err).toBeDefined()
    expect(err.code).toBe(Errors.UnknownTransportError.code)
    expect(err.data.suggestion).toBe(
      'https://github.com/isomorphic-git/isomorphic-git.git'
    )
  })

  it('shallow fetch single commit by hash (from Github)', async () => {
    const { fs, gitdir } = await makeFixture('test-fetch-cors')
    await setConfig({
      fs,
      gitdir,
      path: 'http.corsProxy',
      value: `http://${localhost}:9999`,
    })
    // Test
    await fetch({
      fs,
      http,
      gitdir,
      singleBranch: true,
      remote: 'origin',
      depth: 1,
      ref: '36d201c8fea9d87128e7fccd32c21643f355540d',
    })
    expect(await fs.exists(`${gitdir}/shallow`)).toBe(true)
    const shallow = (await fs.read(`${gitdir}/shallow`)).toString('utf8')
    expect(shallow).toEqual('36d201c8fea9d87128e7fccd32c21643f355540d\n')
  })

  it('shallow fetch since (from Github)', async () => {
    const { fs, gitdir } = await makeFixture('test-fetch-cors')
    await setConfig({
      fs,
      gitdir,
      path: 'http.corsProxy',
      value: `http://${localhost}:9999`,
    })
    // Test
    await fetch({
      fs,
      http,
      gitdir,
      since: new Date(1506571200000),
      singleBranch: true,
      remote: 'origin',
      ref: 'test-branch-shallow-clone',
    })
    expect(await fs.exists(`${gitdir}/shallow`)).toBe(true)
    const shallow = (await fs.read(`${gitdir}/shallow`)).toString('utf8')
    expect(shallow).toEqual('36d201c8fea9d87128e7fccd32c21643f355540d\n')
  })

  it('shallow fetch exclude (from Github)', async () => {
    const { fs, gitdir } = await makeFixture('test-fetch-cors')
    await setConfig({
      fs,
      gitdir,
      path: 'http.corsProxy',
      value: `http://${localhost}:9999`,
    })
    // Test
    await fetch({
      fs,
      http,
      gitdir,
      exclude: ['v0.0.5'],
      singleBranch: true,
      remote: 'origin',
      ref: 'test-branch-shallow-clone',
    })
    expect(await fs.exists(`${gitdir}/shallow`)).toBe(true)
    const shallow = (await fs.read(`${gitdir}/shallow`)).toString('utf8')
    expect(shallow).toEqual('0094dadf9804971c851e99b13845d10c8849db12\n')
  })

  it('shallow fetch relative (from Github)', async () => {
    const { fs, gitdir } = await makeFixture('test-fetch-cors')
    await setConfig({
      fs,
      gitdir,
      path: 'http.corsProxy',
      value: `http://${localhost}:9999`,
    })
    // Test
    await fetch({
      fs,
      http,
      gitdir,
      depth: 1,
      singleBranch: true,
      remote: 'origin',
      ref: 'test-branch-shallow-clone',
    })
    expect(await fs.exists(`${gitdir}/shallow`)).toBe(true)
    let shallow = (await fs.read(`${gitdir}/shallow`)).toString('utf8')
    expect(shallow).toEqual('92e7b4123fbf135f5ffa9b6fe2ec78d07bbc353e\n')
    // Now test deepen
    await fetch({
      fs,
      http,
      gitdir,
      relative: true,
      depth: 1,
      singleBranch: true,
      remote: 'origin',
      ref: 'test-branch-shallow-clone',
    })
    await sleep(1000) // seems to be a problem spot
    shallow = (await fs.read(`${gitdir}/shallow`)).toString('utf8')
    expect(shallow).toEqual('86ec153c7b48e02f92930d07542680f60d104d31\n')
  })

  it('errors if missing refspec', async () => {
    const { fs, gitdir } = await makeFixture('test-issue-84')
    await setConfig({
      fs,
      gitdir,
      path: 'http.corsProxy',
      value: `http://${localhost}:9999`,
    })
    // Test
    let err = null
    try {
      await fetch({
        fs,
        http,
        gitdir,
        since: new Date(1506571200000),
        singleBranch: true,
        remote: 'origin',
        ref: 'test-branch-shallow-clone',
      })
    } catch (e) {
      err = e
    }
    expect(err).toBeDefined()
    expect(err instanceof Errors.NoRefspecError).toBe(true)
  })

  it('fetch empty repository from git-http-mock-server', async () => {
    const { fs, dir, gitdir } = await makeFixture('test-empty')
    await fetch({
      fs,
      http,
      dir,
      gitdir,
      depth: 1,
      url: `http://${localhost}:8888/test-empty.git`,
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
    await setConfig({
      fs,
      gitdir,
      path: 'remote.origin.url',
      value: `http://${localhost}:8888/test-fetch-server.git`,
    })
    expect(await fs.exists(`${gitdir}/refs/remotes/origin/test-prune`)).toBe(
      true
    )
    const { pruned } = await fetch({
      fs,
      http,
      dir,
      gitdir,
      depth: 1,
      prune: true,
    })
    expect(pruned).toEqual(['refs/remotes/origin/test-prune'])
    expect(await fs.exists(`${gitdir}/refs/remotes/origin/test-prune`)).toBe(
      false
    )
  })

  it('fetch --prune-tags from git-http-mock-server', async () => {
    const { fs, dir, gitdir } = await makeFixture('test-fetch-client')
    await setConfig({
      fs,
      gitdir,
      path: 'remote.origin.url',
      value: `http://${localhost}:8888/test-fetch-server.git`,
    })
    expect(await fs.exists(`${gitdir}/refs/tags/v1.0.0-beta1`)).toBe(true)
    const oldValue = await fs.read(`${gitdir}/refs/tags/v1.0.0`, 'utf8')
    try {
      await fetch({
        fs,
        http,
        dir,
        gitdir,
        depth: 1,
        tags: true,
        pruneTags: true,
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
