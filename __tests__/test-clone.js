/* eslint-env node, browser, jasmine */
import http from 'isomorphic-git/http'

const {
  Errors,
  checkout,
  clone,
  currentBranch,
  resolveRef,
  getConfig,
} = require('isomorphic-git')

const { makeFixture } = require('./__helpers__/FixtureFS.js')

// this is so it works with either Node local tests or Browser WAN tests
const localhost =
  typeof window === 'undefined' ? 'localhost' : window.location.hostname

describe('clone', () => {
  // Note: for a long time this test was disabled because it took too long.
  // It seems to only take a couple seconds longer than the "shallow fetch" tests now,
  // so I'm enabling it.
  // Update: well, it's now slow enough on Edge that it's failing. Which is odd bc
  // it's the New Edge with is Chromium-based.
  ;(process.browser ? xit : it)('clone with noTags', async () => {
    const { fs, dir, gitdir } = await makeFixture('isomorphic-git')
    await clone({
      fs,
      http,
      dir,
      gitdir,
      depth: 1,
      ref: 'test-branch',
      noTags: true,
      url: 'https://github.com/isomorphic-git/isomorphic-git.git',
      corsProxy: process.browser ? `http://${localhost}:9999` : undefined,
      noCheckout: true,
    })
    expect(await fs.exists(`${dir}`)).toBe(true)
    expect(await fs.exists(`${gitdir}/objects`)).toBe(true)
    expect(
      await resolveRef({ fs, gitdir, ref: 'refs/remotes/origin/test-branch' })
    ).toBe('e10ebb90d03eaacca84de1af0a59b444232da99e')
    expect(
      await resolveRef({ fs, gitdir, ref: 'refs/heads/test-branch' })
    ).toBe('e10ebb90d03eaacca84de1af0a59b444232da99e')
    let err = null
    try {
      await resolveRef({ fs, gitdir, ref: 'refs/tags/v0.0.1' })
    } catch (e) {
      err = e
    }
    expect(err).not.toBeNull()
    expect(err.code).toBe(Errors.NotFoundError.code)
  })
  it('clone with noCheckout', async () => {
    const { fs, dir, gitdir } = await makeFixture('isomorphic-git')
    await clone({
      fs,
      http,
      dir,
      gitdir,
      depth: 1,
      ref: 'test-branch',
      singleBranch: true,
      noCheckout: true,
      url: 'https://github.com/isomorphic-git/isomorphic-git.git',
      corsProxy: process.browser ? `http://${localhost}:9999` : undefined,
    })
    expect(await fs.exists(`${dir}`)).toBe(true)
    expect(await fs.exists(`${gitdir}/objects`)).toBe(true)
    expect(await fs.exists(`${gitdir}/refs/remotes/origin/test-branch`)).toBe(
      true
    )
    expect(await fs.exists(`${gitdir}/refs/heads/test-branch`)).toBe(true)
    expect(await fs.exists(`${dir}/package.json`)).toBe(false)
  })
  it('clone a tag', async () => {
    const { fs, dir, gitdir } = await makeFixture('isomorphic-git')
    await clone({
      fs,
      http,
      dir,
      gitdir,
      depth: 1,
      singleBranch: true,
      ref: 'test-tag',
      url: 'https://github.com/isomorphic-git/isomorphic-git.git',
      corsProxy: process.browser ? `http://${localhost}:9999` : undefined,
    })
    expect(await fs.exists(`${dir}`)).toBe(true)
    expect(await fs.exists(`${gitdir}/objects`)).toBe(true)
    expect(await fs.exists(`${gitdir}/refs/remotes/origin/test-tag`)).toBe(
      false
    )
    expect(await fs.exists(`${gitdir}/refs/heads/test-tag`)).toBe(false)
    expect(await fs.exists(`${gitdir}/refs/tags/test-tag`)).toBe(true)
    expect(await fs.exists(`${dir}/package.json`)).toBe(true)
  })
  it('clone should not peel tag', async () => {
    const { fs, dir, gitdir } = await makeFixture('isomorphic-git')
    await clone({
      fs,
      http,
      dir,
      gitdir,
      url: `http://${localhost}:8888/test-git-http-mock-server.git`,
    })
    const oid = await fs._readFile(`${gitdir}/refs/tags/v1.0.0`, 'utf8')
    expect(oid.trim()).toBe('db34227a52a6490fc80a13da3916ea91d183fc3f')
  })
  it('clone with an unregistered protocol', async () => {
    const { fs, dir, gitdir } = await makeFixture('isomorphic-git')
    const url = `foobar://github.com/isomorphic-git/isomorphic-git`
    let error = null
    try {
      await clone({
        fs,
        http,
        dir,
        gitdir,
        depth: 1,
        singleBranch: true,
        ref: 'test-tag',
        url,
      })
    } catch (err) {
      error = err
    }
    expect(error.message).toEqual(
      `Git remote "${url}" uses an unrecognized transport protocol: "foobar"`
    )
    expect(error.caller).toEqual('git.clone')
  })

  it('clone from git-http-mock-server', async () => {
    const { fs, dir, gitdir } = await makeFixture('test-clone-karma')
    await clone({
      fs,
      http,
      dir,
      gitdir,
      depth: 1,
      singleBranch: true,
      url: `http://${localhost}:8888/test-clone.git`,
    })
    expect(await fs.exists(`${dir}`)).toBe(true, `'dir' exists`)
    expect(await fs.exists(`${gitdir}/objects`)).toBe(
      true,
      `'gitdir/objects' exists`
    )
    expect(await fs.exists(`${gitdir}/refs/heads/master`)).toBe(
      true,
      `'gitdir/refs/heads/master' exists`
    )
    expect(await fs.exists(`${dir}/a.txt`)).toBe(true, `'a.txt' exists`)
  })

  it('should throw error if server resets connection before reading packetlines', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixture(
      'test-clone-error-before-packetlines'
    )
    const instrumentedHttp = {
      request() {
        return http.request.apply(null, arguments).then(response => {
          const contentType = response.headers['content-type']
          if (contentType === 'application/x-git-upload-pack-result') {
            const body = `0034shallow 97c024f73eaab2781bf3691597bc7c833cb0e22f00000008NAK
0023\x02Enumerating objects: 5, done.
0022\x02Counting objects:  20% (1/5)
0022\x02Counting objects:  40% (2/5)
0022\x02Counting objects:  60% (3/5)
0022\x02Counting objects:  80% (4/5)
0029\x02Counting objects: 100% (5/5), done.
002c\x02Compressing objects: 100% (2/2), done.
0012\x01PACK\x00\x00\x00\x02\x00\x00\x00\x05
0039\x02Total 5 (delta 0), reused 0 (delta 0), pack-reused 0`
              .split('\n')
              .map(it => Buffer.from(it + '\n'))
              .values()
            body.next = new Proxy(body.next, {
              apply(target, self, args) {
                const result = target.apply(self, args)
                if (~result.value.indexOf('shallow')) {
                  throw Object.assign(new Error('aborted'), {
                    code: 'ECONNRESET',
                  })
                }
                return result
              },
            })
            response.body = body
          }
          return response
        })
      },
    }
    // Test
    let error
    try {
      await clone({
        fs,
        http: instrumentedHttp,
        dir,
        gitdir,
        depth: 1,
        singleBranch: true,
        url: `http://${localhost}:8888/test-clone.git`,
      })
    } catch (e) {
      error = e
    }
    expect(error).not.toBeNull()
    expect(error.message).toEqual('aborted')
    expect(error.caller).toEqual('git.clone')
    expect(error.code).toEqual('ECONNRESET')
  })

  it('should throw error if server resets connection while reading packetlines', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixture(
      'test-clone-error-during-packetlines'
    )
    const instrumentedHttp = {
      request() {
        return http.request.apply(null, arguments).then(response => {
          const contentType = response.headers['content-type']
          if (contentType === 'application/x-git-upload-pack-result') {
            const body = `0037unshallow 1f6d22958fa079fc2205bb5ae1224d9677f1eaf9
0034shallow 97c024f73eaab2781bf3691597bc7c833cb0e22f00000008NAK
0023\x02Enumerating objects: 5, done.
0022\x02Counting objects:  20% (1/5)
0022\x02Counting objects:  40% (2/5)
0022\x02Counting objects:  60% (3/5)
0022\x02Counting objects:  80% (4/5)
0029\x02Counting objects: 100% (5/5), done.
002c\x02Compressing objects: 100% (2/2), done.
0012\x01PACK\x00\x00\x00\x02\x00\x00\x00\x05
0039\x02Total 5 (delta 0), reused 0 (delta 0), pack-reused 0`
              .split('\n')
              .map(it => Buffer.from(it + '\n'))
              .values()
            body.next = new Proxy(body.next, {
              apply(target, self, args) {
                const result = target.apply(self, args)
                if (~result.value.indexOf('shallow')) {
                  throw Object.assign(new Error('aborted'), {
                    code: 'ECONNRESET',
                  })
                }
                return result
              },
            })
            response.body = body
          }
          return response
        })
      },
    }
    // Test
    let error
    try {
      await clone({
        fs,
        http: instrumentedHttp,
        dir,
        gitdir,
        depth: 1,
        singleBranch: true,
        url: `http://${localhost}:8888/test-clone.git`,
      })
    } catch (e) {
      error = e
    }
    expect(error).not.toBeNull()
    expect(error.message).toEqual('aborted')
    expect(error.caller).toEqual('git.clone')
    expect(error.code).toEqual('ECONNRESET')
  })

  it('should throw error if server resets connection before reading packfile', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixture(
      'test-clone-error-before-packfile'
    )
    const instrumentedHttp = {
      request() {
        return http.request.apply(null, arguments).then(response => {
          const contentType = response.headers['content-type']
          if (contentType === 'application/x-git-upload-pack-result') {
            const body = `0034shallow 97c024f73eaab2781bf3691597bc7c833cb0e22f00000008NAK
0023\x02Enumerating objects: 5, done.
0022\x02Counting objects:  20% (1/5)
0022\x02Counting objects:  40% (2/5)
0022\x02Counting objects:  60% (3/5)
0022\x02Counting objects:  80% (4/5)
0029\x02Counting objects: 100% (5/5), done.
002c\x02Compressing objects: 100% (2/2), done.
0012\x01PACK\x00\x00\x00\x02\x00\x00\x00\x05
0039\x02Total 5 (delta 0), reused 0 (delta 0), pack-reused 0`
              .split('\n')
              .map(it => Buffer.from(it + '\n'))
              .values()
            body.next = new Proxy(body.next, {
              apply(target, self, args) {
                const result = target.apply(self, args)
                if (~result.value.indexOf('PACK')) {
                  throw Object.assign(new Error('aborted'), {
                    code: 'ECONNRESET',
                  })
                }
                return result
              },
            })
            response.body = body
          }
          return response
        })
      },
    }
    // Test
    let error
    try {
      await clone({
        fs,
        http: instrumentedHttp,
        dir,
        gitdir,
        depth: 1,
        singleBranch: true,
        url: `http://${localhost}:8888/test-clone.git`,
      })
    } catch (e) {
      error = e
    }
    expect(error).not.toBeNull()
    expect(error.message).toEqual('aborted')
    expect(error.caller).toEqual('git.clone')
    expect(error.code).toEqual('ECONNRESET')
  })

  it('should not throw TypeError error if packfile is empty', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixture(
      'test-clone-error-empty-packfile'
    )
    const instrumentedHttp = {
      request() {
        return http.request.apply(null, arguments).then(response => {
          const contentType = response.headers['content-type']
          if (contentType === 'application/x-git-upload-pack-result') {
            response.body = `0012\x01PACK\x00\x00\x00\x02\x00\x00\x00\x05
0039\x02Total 5 (delta 0), reused 0 (delta 0), pack-reused 0`
              .split('\n')
              .map(it => Buffer.from(it + '\n'))
              .values()
          }
          return response
        })
      },
    }
    // Test
    let error
    try {
      await clone({
        fs,
        http: instrumentedHttp,
        dir,
        gitdir,
        depth: 1,
        singleBranch: true,
        url: `http://${localhost}:8888/test-clone.git`,
      })
    } catch (e) {
      error = e
    }
    expect(error).not.toBeNull()
    expect(error.name).not.toEqual('TypeError')
    expect(error.name).toEqual('CommitNotFetchedError')
    expect(error.caller).toEqual('git.clone')
  })

  it('clone default branch with --singleBranch', async () => {
    const { fs, dir, gitdir } = await makeFixture('test-clone-karma')
    await clone({
      fs,
      http,
      dir,
      gitdir,
      depth: 1,
      singleBranch: true,
      url: `http://${localhost}:8888/test-clone-no-master.git`,
    })
    expect(await currentBranch({ fs, dir, gitdir })).toBe('i-am-not-master')
  })

  it('create tracking for remote branch', async () => {
    const { fs, dir, gitdir } = await makeFixture('test-clone-branch-with-dot')
    await clone({
      fs,
      http,
      dir,
      gitdir,
      url: `http://${localhost}:8888/test-branch-with-dot.git`,
    })
    await checkout({ fs, dir, gitdir, ref: 'v1.0.x' })
    const config = await fs.read(gitdir + '/config', 'utf8')
    expect(config).toContain(
      '\n[branch "v1.0.x"]\n\tmerge = refs/heads/v1.0.x\n\tremote = origin'
    )
  })

  it('clone empty repository from git-http-mock-server', async () => {
    const { fs, dir, gitdir } = await makeFixture('test-clone-empty')
    await clone({
      fs,
      http,
      dir,
      gitdir,
      depth: 1,
      url: `http://${localhost}:8888/test-empty.git`,
    })
    expect(await fs.exists(`${dir}`)).toBe(true, `'dir' exists`)
    expect(await fs.exists(`${gitdir}/HEAD`)).toBe(true, `'gitdir/HEAD' exists`)
    expect((await fs.read(`${gitdir}/HEAD`)).toString('utf-8').trim()).toEqual(
      'ref: refs/heads/master',
      `'gitdir/HEAD' points to refs/heads/master`
    )
    expect(await fs.exists(`${gitdir}/refs/heads/master`)).toBe(
      false,
      `'gitdir/refs/heads/master' does not exist`
    )
  })

  it('removes the gitdir when clone fails', async () => {
    const { fs, dir, gitdir } = await makeFixture('isomorphic-git')
    const url = `foobar://github.com/isomorphic-git/isomorphic-git`
    try {
      await clone({
        fs,
        http,
        dir,
        gitdir,
        depth: 1,
        singleBranch: true,
        ref: 'test-tag',
        url,
      })
    } catch (err) {
      // Intentionally left blank.
    }
    expect(await fs.exists(gitdir)).toBe(false, `'gitdir' does not exist`)
  })

  it('should set up the remote tracking branch by default', async () => {
    const { fs, dir, gitdir } = await makeFixture('isomorphic-git')
    await clone({
      fs,
      http,
      dir,
      gitdir,
      depth: 1,
      singleBranch: true,
      remote: 'foo',
      url: 'https://github.com/isomorphic-git/isomorphic-git.git',
      corsProxy: process.browser ? `http://${localhost}:9999` : undefined,
    })

    const [merge, remote] = await Promise.all([
      await getConfig({ fs, dir, gitdir, path: 'branch.main.merge' }),
      await getConfig({ fs, dir, gitdir, path: 'branch.main.remote' }),
    ])

    expect(merge).toBe('refs/heads/main')
    expect(remote).toBe('foo')
  })

  it('clone with post-checkout hook', async () => {
    const { fs, dir, gitdir } = await makeFixture('test-clone-karma')
    const onPostCheckout = []
    await clone({
      fs,
      http,
      dir,
      gitdir,
      depth: 1,
      singleBranch: true,
      url: `http://${localhost}:8888/test-clone.git`,
      onPostCheckout: args => {
        onPostCheckout.push(args)
      },
    })

    expect(onPostCheckout).toEqual([
      {
        newHead: '97c024f73eaab2781bf3691597bc7c833cb0e22f',
        previousHead: '0000000000000000000000000000000000000000',
        type: 'branch',
      },
    ])
  })

  if (typeof process === 'object' && (process.versions || {}).node) {
    it('should allow agent to be used with built-in http plugin for Node.js', async () => {
      const { fs, dir, gitdir } = await makeFixture('isomorphic-git')
      const connectionLog = []
      const { Agent } = require('https')
      const httpWithAgent = {
        async request({ url, method, headers, body }) {
          const agent = new Agent()
          // @ts-ignore
          agent.createConnection = new Proxy(agent.createConnection, {
            apply(target, self, args) {
              const { hostname, port, method: method_ } = args[0]
              connectionLog.push(`${method_} ${hostname}:${port}`)
              return target.apply(self, args)
            },
          })
          return http.request({ url, method, headers, agent, body })
        },
      }
      await clone({
        fs,
        http: httpWithAgent,
        dir,
        gitdir,
        depth: 1,
        ref: 'test-branch',
        singleBranch: true,
        noCheckout: true,
        url: 'https://github.com/isomorphic-git/isomorphic-git.git',
      })
      expect(connectionLog.length).not.toBe(0)
      expect(connectionLog[0]).toEqual('GET github.com:443')
      expect(connectionLog[1]).toEqual('POST github.com:443')
    })
  }
})
