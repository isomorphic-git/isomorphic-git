/* eslint-env node, browser, jasmine */
import http from 'isomorphic-git/http'

const {
  Errors,
  clone,
  setConfig,
  push,
  listBranches,
  resolveRef,
} = require('isomorphic-git')

const { makeFixture } = require('./__helpers__/FixtureFS.js')

// this is so it works with either Node local tests or Browser WAN tests
const localhost =
  typeof window === 'undefined' ? 'localhost' : window.location.hostname

describe('push', () => {
  it('push', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-push')
    await setConfig({
      fs,
      gitdir,
      path: 'remote.karma.url',
      value: `http://${localhost}:8888/test-push-server.git`,
    })
    const output = []
    const onPrePush = []
    // Test
    const res = await push({
      fs,
      http,
      gitdir,
      onMessage: async m => {
        output.push(m)
      },
      remote: 'karma',
      ref: 'refs/heads/master',
      onPrePush: args => {
        onPrePush.push(args)
        return true
      },
    })
    expect(res).toBeTruthy()
    expect(res.ok).toBe(true)
    expect(res.refs['refs/heads/master'].ok).toBe(true)
    expect(output).toMatchInlineSnapshot(`
      Array [
        "build started...
      ",
        "build completed...
      ",
        "tests started...
      ",
        "tests completed...
      ",
        "starting server...
      ",
        "server running
      ",
        "Here is a message from 'post-receive' hook.
      ",
      ]
    `)
    expect(onPrePush).toEqual([
      {
        localRef: {
          oid: 'c03e131196f43a78888415924bcdcbf3090f3316',
          ref: 'refs/heads/master',
        },
        remote: 'karma',
        remoteRef: {
          oid: '5a8905a02e181fe1821068b8c0f48cb6633d5b81',
          ref: 'refs/heads/master',
        },
        url: `http://${localhost}:8888/test-push-server.git`,
      },
    ])

    // Test that remote ref is updated
    expect(
      await resolveRef({ fs, gitdir, ref: 'refs/remotes/karma/master' })
    ).toEqual(await resolveRef({ fs, gitdir, ref: 'refs/heads/master' }))
    expect(
      await resolveRef({ fs, gitdir, ref: 'refs/remotes/karma/master' })
    ).toEqual('c03e131196f43a78888415924bcdcbf3090f3316')
  })
  it('push empty', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixture('test-fetch-server')
    await clone({
      fs,
      http,
      dir,
      gitdir,
      url: `http://${localhost}:8888/test-fetch-server.git`,
    })
    // Test
    const res = await push({
      fs,
      http,
      gitdir,
    })
    expect(res).toBeTruthy()
    expect(res.ok).toBe(true)
    expect(res.refs['refs/heads/master'].ok).toBe(true)
  })
  it('push without ref', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-push')
    await setConfig({
      fs,
      gitdir,
      path: 'remote.karma.url',
      value: `http://${localhost}:8888/test-push-server.git`,
    })
    // Test
    const res = await push({
      fs,
      http,
      gitdir,
      remote: 'karma',
    })
    expect(res).toBeTruthy()
    expect(res.ok).toBe(true)
    expect(res.refs['refs/heads/master'].ok).toBe(true)
  })
  it('push with ref !== remoteRef', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-push')
    await setConfig({
      fs,
      gitdir,
      path: 'remote.karma.url',
      value: `http://${localhost}:8888/test-push-server.git`,
    })
    // Test
    const onPrePush = []
    const res = await push({
      fs,
      http,
      gitdir,
      remote: 'karma',
      ref: 'master',
      remoteRef: 'foobar',
      onPrePush: args => {
        onPrePush.push(args)
        return true
      },
    })
    expect(res).toBeTruthy()
    expect(res.ok).toBe(true)
    expect(res.refs['refs/heads/foobar'].ok).toBe(true)
    expect(await listBranches({ fs, gitdir, remote: 'karma' })).toContain(
      'foobar'
    )
    expect(onPrePush).toEqual([
      {
        localRef: {
          oid: 'c03e131196f43a78888415924bcdcbf3090f3316',
          ref: 'refs/heads/master',
        },
        remote: 'karma',
        remoteRef: {
          oid: '0000000000000000000000000000000000000000',
          ref: 'refs/heads/foobar',
        },
        url: `http://${localhost}:8888/test-push-server.git`,
      },
    ])
  })
  it('push with lightweight tag', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-push')
    await setConfig({
      fs,
      gitdir,
      path: 'remote.karma.url',
      value: `http://${localhost}:8888/test-push-server.git`,
    })
    // Test
    const onPrePush = []
    const res = await push({
      fs,
      http,
      gitdir,
      remote: 'karma',
      ref: 'lightweight-tag',
      onPrePush: args => {
        onPrePush.push(args)
        return true
      },
    })
    expect(res).toBeTruthy()
    expect(res.ok).toBe(true)
    expect(res.refs['refs/tags/lightweight-tag'].ok).toBe(true)
    expect(onPrePush).toEqual([
      {
        localRef: {
          oid: 'c03e131196f43a78888415924bcdcbf3090f3316',
          ref: 'refs/tags/lightweight-tag',
        },
        remote: 'karma',
        remoteRef: {
          oid: '0000000000000000000000000000000000000000',
          ref: 'refs/tags/lightweight-tag',
        },
        url: `http://${localhost}:8888/test-push-server.git`,
      },
    ])
    // See #1900: make sure that a remote tag ref is not created
    expect(await fs.exists(`${gitdir}/refs/remotes/karma/refs/tags`)).toBe(
      false
    )
  })
  it('push with annotated tag', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-push')
    await setConfig({
      fs,
      gitdir,
      path: 'remote.karma.url',
      value: `http://${localhost}:8888/test-push-server.git`,
    })
    // Test
    const res = await push({
      fs,
      http,
      gitdir,
      remote: 'karma',
      ref: 'annotated-tag',
    })
    expect(res).toBeTruthy()
    expect(res.ok).toBe(true)
    expect(res.refs['refs/tags/annotated-tag'].ok).toBe(true)
    // See #1900: make sure that a remote tag ref is not created
    expect(await fs.exists(`${gitdir}/refs/remotes/karma/refs/tags`)).toBe(
      false
    )
  })
  it('push delete', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-push')
    await setConfig({
      fs,
      gitdir,
      path: 'remote.karma.url',
      value: `http://${localhost}:8888/test-push-server.git`,
    })
    await push({
      fs,
      http,
      gitdir,
      remote: 'karma',
      ref: 'master',
      remoteRef: 'foobar',
    })
    expect(await listBranches({ fs, gitdir, remote: 'karma' })).toContain(
      'foobar'
    )
    // Test
    const onPrePush = []
    const res = await push({
      fs,
      http,
      gitdir,
      remote: 'karma',
      remoteRef: 'foobar',
      delete: true,
      onPrePush: args => {
        onPrePush.push(args)
        return true
      },
    })
    expect(res).toBeTruthy()
    expect(res.ok).toBe(true)
    expect(res.refs['refs/heads/foobar'].ok).toBe(true)
    expect(await listBranches({ fs, gitdir, remote: 'karma' })).not.toContain(
      'foobar'
    )
    expect(onPrePush).toEqual([
      {
        localRef: {
          oid: '0000000000000000000000000000000000000000',
          ref: '(delete)',
        },
        remote: 'karma',
        remoteRef: {
          oid: '0000000000000000000000000000000000000000', // This is OK: mock server threw away information about newly created branch
          ref: 'refs/heads/foobar',
        },
        url: `http://${localhost}:8888/test-push-server.git`,
      },
    ])
  })
  it('throws UnknownTransportError if using shorter scp-like syntax', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-push')
    await setConfig({
      fs,
      gitdir,
      path: 'remote.ssh.url',
      value: `git@${localhost}:8888/test-push-server.git`,
    })
    // Test
    let err
    try {
      await push({
        fs,
        http,
        gitdir,
        remote: 'ssh',
        ref: 'master',
      })
    } catch (e) {
      err = e
    }
    expect(err).toBeDefined()
    expect(err.code).toEqual(Errors.UnknownTransportError.code)
  })

  it('push with Basic Auth', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-push')
    await setConfig({
      fs,
      gitdir,
      path: 'remote.auth.url',
      value: `http://${localhost}:8888/test-push-server-auth.git`,
    })
    // Test
    const res = await push({
      fs,
      http,
      gitdir,
      remote: 'auth',
      ref: 'master',
      onAuth: () => ({ username: 'testuser', password: 'testpassword' }),
    })
    expect(res).toBeTruthy()
    expect(res.ok).toBe(true)
    expect(res.refs['refs/heads/master'].ok).toBe(true)
  })
  it('push with Basic Auth credentials in the URL', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-push')
    await setConfig({
      fs,
      gitdir,
      path: 'remote.url.url',
      value: `http://testuser:testpassword@${localhost}:8888/test-push-server-auth.git`,
    })
    // Test
    const res = await push({
      fs,
      http,
      gitdir,
      remote: 'url',
      ref: 'master',
    })
    expect(res).toBeTruthy()
    expect(res.ok).toBe(true)
    expect(res.refs['refs/heads/master'].ok).toBe(true)
  })
  it('throws an Error if no credentials supplied', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-push')
    await setConfig({
      fs,
      gitdir,
      path: 'remote.auth.url',
      value: `http://${localhost}:8888/test-push-server-auth.git`,
    })
    // Test
    let error = null
    try {
      await push({
        fs,
        http,
        gitdir,
        remote: 'auth',
        ref: 'master',
      })
    } catch (err) {
      error = err.message
    }
    expect(error).toContain('401')
  })
  it('throws an Error if invalid credentials supplied', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-push')
    await setConfig({
      fs,
      gitdir,
      path: 'remote.auth.url',
      value: `http://${localhost}:8888/test-push-server-auth.git`,
    })
    // Test
    let error = null
    try {
      await push({
        fs,
        http,
        gitdir,
        remote: 'auth',
        ref: 'master',
        onAuth: () => ({ username: 'test', password: 'test' }),
      })
    } catch (err) {
      error = err.message
    }
    expect(error).toContain('401')
  })

  it('onAuthSuccess', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-push')
    await setConfig({
      fs,
      gitdir,
      path: 'remote.auth.url',
      value: `http://${localhost}:8888/test-push-server-auth.git`,
    })
    // Test
    const onAuthArgs = []
    const onAuthSuccessArgs = []
    const onAuthFailureArgs = []
    await push({
      fs,
      http,
      gitdir,
      remote: 'auth',
      ref: 'master',
      async onAuth(...args) {
        onAuthArgs.push(args)
        return {
          username: 'testuser',
          password: 'testpassword',
        }
      },
      async onAuthSuccess(...args) {
        onAuthSuccessArgs.push(args)
      },
      async onAuthFailure(...args) {
        onAuthFailureArgs.push(args)
      },
    })
    expect(onAuthArgs).toEqual([
      [
        `http://${localhost}:8888/test-push-server-auth.git`,
        {
          headers: {},
        },
      ],
    ])
    expect(onAuthSuccessArgs).toEqual([
      [
        `http://${localhost}:8888/test-push-server-auth.git`,
        {
          username: 'testuser',
          password: 'testpassword',
        },
      ],
    ])
    expect(onAuthFailureArgs).toEqual([])
  })

  it('onAuthFailure', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-push')
    await setConfig({
      fs,
      gitdir,
      path: 'remote.auth.url',
      value: `http://${localhost}:8888/test-push-server-auth.git`,
    })
    // Test
    let err
    const onAuthArgs = []
    const onAuthSuccessArgs = []
    const onAuthFailureArgs = []
    try {
      await push({
        fs,
        http,
        gitdir,
        remote: 'auth',
        ref: 'master',
        async onAuth(...args) {
          onAuthArgs.push(args)
          return {
            username: 'testuser',
            password: 'NoT_rIgHt',
          }
        },
        async onAuthSuccess(...args) {
          onAuthSuccessArgs.push(args)
        },
        async onAuthFailure(...args) {
          onAuthFailureArgs.push(args)
          switch (onAuthFailureArgs.length) {
            case 1:
              return {
                username: 'testuser',
                password: 'St1ll_NoT_rIgHt',
              }
            case 2:
              return {
                headers: {
                  Authorization: 'Bearer Big Bear',
                  'X-Authorization': 'supersecret',
                },
              }
          }
        },
      })
    } catch (e) {
      err = e
    }
    expect(err).toBeDefined()
    expect(err.code).toBe(Errors.HttpError.code)
    expect(err.data.response).toBeTruthy()
    expect(onAuthArgs).toEqual([
      [
        `http://${localhost}:8888/test-push-server-auth.git`,
        {
          headers: {},
        },
      ],
    ])
    expect(onAuthSuccessArgs).toEqual([])
    expect(onAuthFailureArgs).toEqual([
      [
        `http://${localhost}:8888/test-push-server-auth.git`,
        {
          headers: {
            Authorization: 'Basic dGVzdHVzZXI6Tm9UX3JJZ0h0',
          },
          username: 'testuser',
          password: 'NoT_rIgHt',
        },
      ],
      [
        `http://${localhost}:8888/test-push-server-auth.git`,
        {
          headers: {
            Authorization: 'Basic dGVzdHVzZXI6U3QxbGxfTm9UX3JJZ0h0',
          },
          username: 'testuser',
          password: 'St1ll_NoT_rIgHt',
        },
      ],
      [
        `http://${localhost}:8888/test-push-server-auth.git`,
        {
          headers: {
            Authorization: 'Bearer Big Bear',
            'X-Authorization': 'supersecret',
          },
        },
      ],
    ])
  })

  it('onAuthFailure then onAuthSuccess', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-push')
    await setConfig({
      fs,
      gitdir,
      path: 'remote.auth.url',
      value: `http://${localhost}:8888/test-push-server-auth.git`,
    })
    // Test
    const onAuthArgs = []
    const onAuthSuccessArgs = []
    const onAuthFailureArgs = []
    await push({
      fs,
      http,
      gitdir,
      remote: 'auth',
      ref: 'master',
      async onAuth(...args) {
        onAuthArgs.push(args)
        return {
          username: 'testuser',
          password: 'NoT_rIgHt',
        }
      },
      async onAuthSuccess(...args) {
        onAuthSuccessArgs.push(args)
      },
      async onAuthFailure(...args) {
        onAuthFailureArgs.push(args)
        switch (onAuthFailureArgs.length) {
          case 1:
            return {
              username: 'testuser',
              password: 'St1ll_NoT_rIgHt',
            }
          case 2:
            return {
              username: 'testuser',
              password: 'testpassword',
            }
        }
      },
    })
    expect(onAuthArgs).toEqual([
      [
        `http://${localhost}:8888/test-push-server-auth.git`,
        {
          headers: {},
        },
      ],
    ])
    expect(onAuthSuccessArgs).toEqual([
      [
        `http://${localhost}:8888/test-push-server-auth.git`,
        {
          username: 'testuser',
          password: 'testpassword',
        },
      ],
    ])
    expect(onAuthFailureArgs).toEqual([
      [
        `http://${localhost}:8888/test-push-server-auth.git`,
        {
          headers: {
            Authorization: 'Basic dGVzdHVzZXI6Tm9UX3JJZ0h0',
          },
          username: 'testuser',
          password: 'NoT_rIgHt',
        },
      ],
      [
        `http://${localhost}:8888/test-push-server-auth.git`,
        {
          headers: {
            Authorization: 'Basic dGVzdHVzZXI6U3QxbGxfTm9UX3JJZ0h0',
          },
          username: 'testuser',
          password: 'St1ll_NoT_rIgHt',
        },
      ],
    ])
  })

  it('onAuth + cancel', async () => {
    // Setup
    const { fs, gitdir } = await makeFixture('test-push')
    await setConfig({
      fs,
      gitdir,
      path: 'remote.auth.url',
      value: `http://${localhost}:8888/test-push-server-auth.git`,
    })
    // Test
    let err
    const onAuthArgs = []
    const onAuthSuccessArgs = []
    const onAuthFailureArgs = []
    try {
      await push({
        fs,
        http,
        gitdir,
        remote: 'auth',
        ref: 'master',
        async onAuth(...args) {
          onAuthArgs.push(args)
          return {
            cancel: true,
          }
        },
        async onAuthSuccess(...args) {
          onAuthSuccessArgs.push(args)
        },
        async onAuthFailure(...args) {
          onAuthFailureArgs.push(args)
        },
      })
    } catch (e) {
      err = e
    }
    expect(err).toBeDefined()
    expect(err instanceof Errors.UserCanceledError).toBe(true)
    expect(err.code).toBe('UserCanceledError')
    expect(onAuthArgs).toEqual([
      [
        `http://${localhost}:8888/test-push-server-auth.git`,
        {
          headers: {},
        },
      ],
    ])
    expect(onAuthSuccessArgs).toEqual([])
    expect(onAuthFailureArgs).toEqual([])
  })

  it('onPrePush abort', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixture('test-fetch-server')
    await clone({
      fs,
      http,
      dir,
      gitdir,
      url: `http://${localhost}:8888/test-fetch-server.git`,
    })
    // Test
    let err
    try {
      await push({
        fs,
        http,
        gitdir,
        onPrePush: args => {
          return false
        },
      })
    } catch (e) {
      err = e
    }

    expect(err).toBeDefined()
    expect(err instanceof Errors.UserCanceledError).toBe(true)
    expect(err.code).toBe('UserCanceledError')
  })
})
