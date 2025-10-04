/* eslint-env node, browser, jasmine */
import http from 'isomorphic-git/http'

const path = require('path')

const {
  setConfig,
  getConfig,
  pull,
  log,
  add,
  commit,
  init,
  currentBranch,
  listBranches,
  Errors,
} = require('isomorphic-git')

const { makeFixture } = require('./__helpers__/FixtureFS.js')

// this is so it works with either Node local tests or Browser WAN tests
const localhost =
  typeof window === 'undefined' ? 'localhost' : window.location.hostname

describe('pull', () => {
  it('pull', async () => {
    // Setup
    const { fs, gitdir, dir } = await makeFixture('test-pull')
    await setConfig({
      fs,
      gitdir,
      path: 'remote.origin.url',
      value: `http://${localhost}:8888/test-pull-server.git`,
    })
    // Test
    let logs = await log({ fs, gitdir, dir, ref: 'refs/heads/master' })
    expect(logs.map(({ commit }) => commit.message)).toEqual([
      'Initial commit\n',
    ])
    await pull({
      fs,
      http,
      gitdir,
      dir,
      remote: 'origin',
      ref: 'refs/heads/master',
      author: {
        name: 'Mr. Test',
        email: 'mrtest@example.com',
        timestamp: 1262356920,
        timezoneOffset: -0,
      },
    })
    logs = await log({ fs, gitdir, dir, ref: 'refs/heads/master' })
    expect(logs.map(({ commit }) => commit.message)).toEqual([
      'Added c.txt\n',
      'Added b.txt\n',
      'Initial commit\n',
    ])
  })

  it('pull fast-forward only', async () => {
    // Setup
    const author = {
      name: 'Mr. Test',
      email: 'mrtest@example.com',
      timestamp: 1262356920,
      timezoneOffset: -0,
    }
    const { fs, gitdir, dir } = await makeFixture('test-pull-no-ff')
    await setConfig({
      fs,
      gitdir,
      path: 'remote.origin.url',
      value: `http://${localhost}:8888/test-pull-server.git`,
    })
    // Test
    await fs.write(path.join(dir, 'z.txt'), 'Hi')
    await add({ fs, dir, gitdir, filepath: 'z.txt' })
    await commit({ fs, dir, gitdir, message: 'Added z.txt', author })
    const logs = await log({ fs, gitdir, dir, ref: 'refs/heads/master' })
    expect(logs.map(({ commit }) => commit.message)).toEqual([
      'Added z.txt\n',
      'Initial commit\n',
    ])
    let err = null
    try {
      await pull({
        fs,
        http,
        gitdir,
        dir,
        remote: 'origin',
        ref: 'refs/heads/master',
        fastForwardOnly: true,
        author: {
          name: 'Mr. Test',
          email: 'mrtest@example.com',
          timestamp: 1262356920,
          timezoneOffset: -0,
        },
      })
    } catch (e) {
      err = e
    }
    expect(err.caller).toBe('git.pull')
    expect(err.code).toBe(Errors.FastForwardError.code)
  })

  it('pull no fast-forward', async () => {
    // Setup
    const { fs, gitdir, dir } = await makeFixture('test-pull-no-ff')
    await setConfig({
      fs,
      gitdir,
      path: 'remote.origin.url',
      value: `http://${localhost}:8888/test-pull-server.git`,
    })
    // Test
    let logs = await log({ fs, gitdir, dir, ref: 'refs/heads/master' })
    expect(logs.map(({ commit }) => commit.message)).toEqual([
      'Initial commit\n',
    ])
    await pull({
      fs,
      http,
      gitdir,
      dir,
      remote: 'origin',
      ref: 'refs/heads/master',
      fastForward: false,
      author: {
        name: 'Mr. Test',
        email: 'mrtest@example.com',
        timestamp: 1262356920,
        timezoneOffset: -0,
      },
    })
    logs = await log({ fs, gitdir, dir, ref: 'refs/heads/master' })
    const formattedLogs = logs.map(
      ({ commit }) => `${commit.message} (${commit.parent.join(' ')})`
    )
    expect(formattedLogs).toEqual([
      "Merge branch 'master' of http://localhost:8888/test-pull-server.git\n (5a8905a02e181fe1821068b8c0f48cb6633d5b81 97c024f73eaab2781bf3691597bc7c833cb0e22f)",
      'Added c.txt\n (c82587c97be8f9a10088590e06c9d0f767ed5c4a)',
      'Added b.txt\n (5a8905a02e181fe1821068b8c0f48cb6633d5b81)',
      'Initial commit\n ()',
    ])
  })

  it('pull into empty clone', async () => {
    // Setup - simulate cloning an empty repository
    const { fs, gitdir, dir } = await makeFixture('test-pull-empty-clone')
    await init({ fs, gitdir, dir })
    await setConfig({
      fs,
      gitdir,
      path: 'remote.origin.url',
      value: `http://${localhost}:8888/test-pull-server.git`,
    })
    await setConfig({
      fs,
      gitdir,
      path: 'remote.origin.fetch',
      value: '+refs/heads/*:refs/remotes/origin/*',
    })
    // Delete HEAD to simulate empty clone with no branches
    await fs.rm(path.join(gitdir, 'HEAD'))
    // Test - verify no current branch exists (should throw)
    let branch = null
    try {
      branch = await currentBranch({ fs, gitdir })
    } catch (err) {
      // Expected to fail when HEAD doesn't exist
      expect(err.code).toBe(Errors.NotFoundError.code)
    }
    expect(branch).toBeNull()
    // Pull should create the branch and fast-forward
    await pull({
      fs,
      http,
      gitdir,
      dir,
      remote: 'origin',
      ref: 'master',
      author: {
        name: 'Mr. Test',
        email: 'mrtest@example.com',
        timestamp: 1262356920,
        timezoneOffset: -0,
      },
    })
    // Verify branch was created and contains commits
    branch = await currentBranch({ fs, gitdir })
    expect(branch).toBe('master')
    const logs = await log({ fs, gitdir, dir, ref: 'refs/heads/master' })
    expect(logs.map(({ commit }) => commit.message)).toEqual([
      'Added c.txt\n',
      'Added b.txt\n',
      'Initial commit\n',
    ])
  })

  it('pull into empty clone without ref parameter', async () => {
    // Setup - simulate cloning an empty repository
    const { fs, gitdir, dir } = await makeFixture(
      'test-pull-empty-clone-no-ref'
    )
    await init({ fs, gitdir, dir })
    await setConfig({
      fs,
      gitdir,
      path: 'remote.origin.url',
      value: `http://${localhost}:8888/test-pull-server.git`,
    })
    await setConfig({
      fs,
      gitdir,
      path: 'remote.origin.fetch',
      value: '+refs/heads/*:refs/remotes/origin/*',
    })
    // Delete HEAD and refs to simulate empty clone with no branches
    await fs.rm(path.join(gitdir, 'HEAD'))
    // Also need to ensure refs/heads/master doesn't exist
    try {
      await fs.rm(path.join(gitdir, 'refs', 'heads', 'master'))
    } catch (e) {
      // May not exist, that's fine
    }
    // Test - verify no current branch exists (should throw)
    let branch = null
    try {
      branch = await currentBranch({ fs, gitdir })
    } catch (err) {
      // Expected to fail when HEAD doesn't exist
      expect(err.code).toBe(Errors.NotFoundError.code)
    }
    expect(branch).toBeNull()
    // Pull without specifying ref - should fail or handle gracefully
    // Since we don't have a ref and currentBranch fails, we need to specify remoteRef
    await pull({
      fs,
      http,
      gitdir,
      dir,
      remote: 'origin',
      remoteRef: 'master',
      author: {
        name: 'Mr. Test',
        email: 'mrtest@example.com',
        timestamp: 1262356920,
        timezoneOffset: -0,
      },
    })
    // Verify default branch was created
    branch = await currentBranch({ fs, gitdir })
    expect(branch).toBeDefined()
    const logs = await log({ fs, gitdir, dir, ref: `refs/heads/${branch}` })
    expect(logs.length).toBeGreaterThan(0)
  })
  it('pull into empty clone when remote HEAD points to origin/master', async () => {
    // Setup - simulate cloning an empty repository
    const { fs, gitdir, dir } = await makeFixture('test-pull-empty-clone') // reuse existing fixture
    await init({ fs, gitdir, dir })

    // Use the existing test server fixture (test-pull-server.git)
    await setConfig({
      fs,
      gitdir,
      path: 'remote.origin.url',
      value: `http://${localhost}:8888/test-pull-server.git`,
    })
    await setConfig({
      fs,
      gitdir,
      path: 'remote.origin.fetch',
      value: '+refs/heads/*:refs/remotes/origin/*',
    })

    // Delete HEAD to simulate empty clone with no branches
    await fs.rm(path.join(gitdir, 'HEAD'))

    // Simulate remote HEAD file pointing to refs/remotes/origin/master (pre-fetch case)
    const remoteHeadPath = path.join(
      gitdir,
      'refs',
      'remotes',
      'origin',
      'HEAD'
    )
    try {
      await fs.mkdir(path.dirname(remoteHeadPath), { recursive: true })
    } catch (e) {}
    // Use test-fs API - write() in fixture fs
    await fs.write(remoteHeadPath, 'ref: refs/remotes/origin/master')

    // Pull without specifying ref - implementation should pick up 'master'
    await pull({
      fs,
      http,
      gitdir,
      dir,
      remote: 'origin',
      author: {
        name: 'Mr. Test',
        email: 'mrtest@example.com',
        timestamp: 1262356920,
        timezoneOffset: -0,
      },
    })

    // Verify branch was created and contains commits and that currentBranch is 'master'
    const branch = await currentBranch({ fs, gitdir })
    expect(branch).toBe('master')
    const logs = await log({ fs, gitdir, dir, ref: 'refs/heads/master' })
    expect(logs.length).toBeGreaterThan(0)
  })

  it('pull into empty clone honors remoteRef when provided', async () => {
    // Setup - empty clone
    const { fs, gitdir, dir } = await makeFixture('test-pull-empty-clone')
    await init({ fs, gitdir, dir })

    await setConfig({
      fs,
      gitdir,
      path: 'remote.origin.url',
      value: `http://${localhost}:8888/test-pull-server.git`,
    })
    await setConfig({
      fs,
      gitdir,
      path: 'remote.origin.fetch',
      value: '+refs/heads/*:refs/remotes/origin/*',
    })

    // Delete HEAD to simulate empty clone
    await fs.rm(path.join(gitdir, 'HEAD'))

    // Provide remoteRef explicitly as 'refs/heads/master' (simulate user input)
    await pull({
      fs,
      http,
      gitdir,
      dir,
      remote: 'origin',
      remoteRef: 'refs/heads/master',
      author: {
        name: 'Mr. Test',
        email: 'mrtest@example.com',
        timestamp: 1262356920,
        timezoneOffset: -0,
      },
    })

    // Verify branch created is master and contains commits
    const branch = await currentBranch({ fs, gitdir })
    expect(branch).toBe('master')
    const logs = await log({ fs, gitdir, dir, ref: 'refs/heads/master' })
    expect(logs.length).toBeGreaterThan(0)
  })

  it('pull into empty clone writes branch tracking config', async () => {
    // Setup - simulate empty clone
    const { fs, gitdir, dir } = await makeFixture('test-pull-empty-clone')
    await init({ fs, gitdir, dir })

    await setConfig({
      fs,
      gitdir,
      path: 'remote.origin.url',
      value: `http://${localhost}:8888/test-pull-server.git`,
    })
    await setConfig({
      fs,
      gitdir,
      path: 'remote.origin.fetch',
      value: '+refs/heads/*:refs/remotes/origin/*',
    })

    // Delete HEAD to simulate empty clone
    await fs.rm(path.join(gitdir, 'HEAD'))

    // Pull specifying master (to make assertions deterministic)
    await pull({
      fs,
      http,
      gitdir,
      dir,
      remote: 'origin',
      ref: 'master',
      author: {
        name: 'Mr. Test',
        email: 'mrtest@example.com',
        timestamp: 1262356920,
        timezoneOffset: -0,
      },
    })

    // Ensure .git/config contains branch.master.remote and branch.master.merge
    const configFile = await fs.read(path.join(gitdir, 'config'), 'utf8')
    expect(
      configFile.includes('branch "master"') ||
        configFile.includes('branch.master')
    ).toBeTruthy()
    expect(
      configFile.includes('remote = origin') ||
        configFile.includes('branch.master.remote')
    ).toBeTruthy()
    expect(
      configFile.includes('merge = refs/heads/master') ||
        configFile.includes('branch.master.merge')
    ).toBeTruthy()
  })
  // Test 1: Error when no ref/remoteRef in empty clone without remote HEAD
  it('pull into empty clone without ref should error when remote has no default branch', async () => {
    const { fs, gitdir, dir } = await makeFixture('test-pull-empty-no-default')
    await init({ fs, gitdir, dir })

    await setConfig({
      fs,
      gitdir,
      path: 'remote.origin.url',
      value: `http://${localhost}:8888/test-pull-server.git`,
    })
    await setConfig({
      fs,
      gitdir,
      path: 'remote.origin.fetch',
      value: '+refs/heads/*:refs/remotes/origin/*',
    })

    // Delete HEAD to simulate empty clone
    await fs.rm(path.join(gitdir, 'HEAD'))

    // Ensure no remote HEAD file exists
    try {
      await fs.rm(path.join(gitdir, 'refs', 'remotes', 'origin', 'HEAD'))
    } catch (e) {}

    // Pull without ref or remoteRef should fail
    let err = null
    try {
      await pull({
        fs,
        http,
        gitdir,
        dir,
        remote: 'origin',
        author: {
          name: 'Mr. Test',
          email: 'mrtest@example.com',
          timestamp: 1262356920,
          timezoneOffset: -0,
        },
      })
    } catch (e) {
      err = e
    }

    expect(err).not.toBeNull()
    expect(err.code).toBe(Errors.MissingParameterError.code)
    expect(err.message).toContain('Cannot determine which branch to pull')
  })

  // Test 2: Subsequent pull without parameters should work after initial pull
  it('subsequent pull without ref uses tracking config', async () => {
    const { fs, gitdir, dir } = await makeFixture('test-pull-subsequent')
    await init({ fs, gitdir, dir })

    await setConfig({
      fs,
      gitdir,
      path: 'remote.origin.url',
      value: `http://${localhost}:8888/test-pull-server.git`,
    })
    await setConfig({
      fs,
      gitdir,
      path: 'remote.origin.fetch',
      value: '+refs/heads/*:refs/remotes/origin/*',
    })

    await fs.rm(path.join(gitdir, 'HEAD'))

    // First pull with explicit ref
    await pull({
      fs,
      http,
      gitdir,
      dir,
      remote: 'origin',
      ref: 'master',
      author: {
        name: 'Mr. Test',
        email: 'mrtest@example.com',
        timestamp: 1262356920,
        timezoneOffset: -0,
      },
    })

    // Verify tracking config was set
    const remoteCfg = await getConfig({
      fs,
      gitdir,
      path: 'branch.master.remote',
    })
    const mergeCfg = await getConfig({
      fs,
      gitdir,
      path: 'branch.master.merge',
    })
    expect(remoteCfg).toBe('origin')
    expect(mergeCfg).toBe('refs/heads/master')

    // Second pull without ref should use tracking config
    // (In real scenario, this would pull new commits. Here we just verify it doesn't error)
    await pull({
      fs,
      http,
      gitdir,
      dir,
      author: {
        name: 'Mr. Test',
        email: 'mrtest@example.com',
        timestamp: 1262356920,
        timezoneOffset: -0,
      },
    })

    const branch = await currentBranch({ fs, gitdir })
    expect(branch).toBe('master')
  })

  // Test 3: Pull creates correct branch when remote HEAD exists
  it('pull without ref uses remote HEAD to determine default branch', async () => {
    const { fs, gitdir, dir } = await makeFixture('test-pull-remote-head')
    await init({ fs, gitdir, dir })

    await setConfig({
      fs,
      gitdir,
      path: 'remote.origin.url',
      value: `http://${localhost}:8888/test-pull-server.git`,
    })
    await setConfig({
      fs,
      gitdir,
      path: 'remote.origin.fetch',
      value: '+refs/heads/*:refs/remotes/origin/*',
    })

    await fs.rm(path.join(gitdir, 'HEAD'))

    // Simulate remote HEAD pointing to master (as would be set during fetch)
    const remoteHeadPath = path.join(
      gitdir,
      'refs',
      'remotes',
      'origin',
      'HEAD'
    )
    try {
      await fs.mkdir(path.dirname(remoteHeadPath), { recursive: true })
    } catch (e) {}
    await fs.write(remoteHeadPath, 'ref: refs/remotes/origin/master')

    // Pull without explicit ref - should use remote HEAD
    await pull({
      fs,
      http,
      gitdir,
      dir,
      remote: 'origin',
      author: {
        name: 'Mr. Test',
        email: 'mrtest@example.com',
        timestamp: 1262356920,
        timezoneOffset: -0,
      },
    })

    const branch = await currentBranch({ fs, gitdir })
    expect(branch).toBe('master')
  })

  // Test 4: Error when trying to pull non-existent branch
  it('pull errors when explicitly requesting non-existent branch', async () => {
    const { fs, gitdir, dir } = await makeFixture('test-pull-nonexistent')
    await init({ fs, gitdir, dir })

    await setConfig({
      fs,
      gitdir,
      path: 'remote.origin.url',
      value: `http://${localhost}:8888/test-pull-server.git`,
    })

    await fs.rm(path.join(gitdir, 'HEAD'))

    let err = null
    try {
      await pull({
        fs,
        http,
        gitdir,
        dir,
        remote: 'origin',
        ref: 'nonexistent-branch',
        author: {
          name: 'Mr. Test',
          email: 'mrtest@example.com',
          timestamp: 1262356920,
          timezoneOffset: -0,
        },
      })
    } catch (e) {
      err = e
    }

    expect(err).not.toBeNull()
    // Should fail during fetch with NotFoundError
    expect(err.code).toBe(Errors.NotFoundError.code)
  })

  // Test 5: Verify branch list after pull in empty clone
  it('pull in empty clone creates only the specified branch', async () => {
    const { fs, gitdir, dir } = await makeFixture('test-pull-branch-list')
    await init({ fs, gitdir, dir })

    await setConfig({
      fs,
      gitdir,
      path: 'remote.origin.url',
      value: `http://${localhost}:8888/test-pull-server.git`,
    })
    await setConfig({
      fs,
      gitdir,
      path: 'remote.origin.fetch',
      value: '+refs/heads/*:refs/remotes/origin/*',
    })

    await fs.rm(path.join(gitdir, 'HEAD'))

    await pull({
      fs,
      http,
      gitdir,
      dir,
      remote: 'origin',
      ref: 'master',
      author: {
        name: 'Mr. Test',
        email: 'mrtest@example.com',
        timestamp: 1262356920,
        timezoneOffset: -0,
      },
    })

    const branches = await listBranches({ fs, gitdir })

    // Should only have 'master' as local branch
    expect(branches).toContain('master')
    expect(branches.length).toBe(1)

    // Verify remote branches exist
    const remoteBranches = await listBranches({
      fs,
      gitdir,
      remote: 'origin',
    })
    expect(remoteBranches.length).toBeGreaterThan(0)
  })

  // Test 6: Pull with both ref and remoteRef should use ref for local branch
  it('pull with ref parameter uses it for local branch name', async () => {
    const { fs, gitdir, dir } = await makeFixture('test-pull-ref-priority')
    await init({ fs, gitdir, dir })

    await setConfig({
      fs,
      gitdir,
      path: 'remote.origin.url',
      value: `http://${localhost}:8888/test-pull-server.git`,
    })
    await setConfig({
      fs,
      gitdir,
      path: 'remote.origin.fetch',
      value: '+refs/heads/*:refs/remotes/origin/*',
    })

    await fs.rm(path.join(gitdir, 'HEAD'))

    // Explicitly provide ref
    await pull({
      fs,
      http,
      gitdir,
      dir,
      remote: 'origin',
      ref: 'master',
      remoteRef: 'master', // Both specified
      author: {
        name: 'Mr. Test',
        email: 'mrtest@example.com',
        timestamp: 1262356920,
        timezoneOffset: -0,
      },
    })

    const branch = await currentBranch({ fs, gitdir })
    expect(branch).toBe('master')

    // Verify tracking points to correct remote branch
    const mergeCfg = await getConfig({
      fs,
      gitdir,
      path: 'branch.master.merge',
    })
    expect(mergeCfg).toBe('refs/heads/master')
  })

  // Test 7: Working directory state after pull in empty clone
  it('pull in empty clone checks out files to working directory', async () => {
    const { fs, gitdir, dir } = await makeFixture('test-pull-workdir')
    await init({ fs, gitdir, dir })

    await setConfig({
      fs,
      gitdir,
      path: 'remote.origin.url',
      value: `http://${localhost}:8888/test-pull-server.git`,
    })
    await setConfig({
      fs,
      gitdir,
      path: 'remote.origin.fetch',
      value: '+refs/heads/*:refs/remotes/origin/*',
    })

    await fs.rm(path.join(gitdir, 'HEAD'))

    await pull({
      fs,
      http,
      gitdir,
      dir,
      remote: 'origin',
      ref: 'master',
      author: {
        name: 'Mr. Test',
        email: 'mrtest@example.com',
        timestamp: 1262356920,
        timezoneOffset: -0,
      },
    })

    // Verify files exist in working directory
    // (based on test-pull-server.git having these files)
    const files = await fs.readdir(dir)

    // Should have some files checked out (not just .git)
    expect(files.length).toBeGreaterThan(0)

    // .git should not be in the working directory listing
    const hasGitDir = files.some(f => f === '.git')
    expect(hasGitDir).toBe(false)
  })

  // Test 8: Verify commit history integrity after pull
  it('pull preserves complete commit history', async () => {
    const { fs, gitdir, dir } = await makeFixture('test-pull-history')
    await init({ fs, gitdir, dir })

    await setConfig({
      fs,
      gitdir,
      path: 'remote.origin.url',
      value: `http://${localhost}:8888/test-pull-server.git`,
    })
    await setConfig({
      fs,
      gitdir,
      path: 'remote.origin.fetch',
      value: '+refs/heads/*:refs/remotes/origin/*',
    })

    await fs.rm(path.join(gitdir, 'HEAD'))

    await pull({
      fs,
      http,
      gitdir,
      dir,
      remote: 'origin',
      ref: 'master',
      author: {
        name: 'Mr. Test',
        email: 'mrtest@example.com',
        timestamp: 1262356920,
        timezoneOffset: -0,
      },
    })

    const logs = await log({ fs, gitdir, dir, ref: 'refs/heads/master' })

    // Verify we have commits
    expect(logs.length).toBeGreaterThan(0)

    // Verify commit structure
    logs.forEach(({ oid, commit }) => {
      expect(oid).toMatch(/^[0-9a-f]{40}$/) // Valid SHA-1
      expect(commit.message).toBeDefined()
      expect(commit.author).toBeDefined()
      expect(commit.author.name).toBeDefined()
      expect(commit.author.email).toBeDefined()
    })

    // Verify parent relationships
    for (let i = 0; i < logs.length - 1; i++) {
      const childCommit = logs[i].commit
      const parentOid = logs[i + 1].oid

      if (childCommit.parent && childCommit.parent.length > 0) {
        // First parent should match next commit in log
        expect(childCommit.parent[0]).toBe(parentOid)
      }
    }
  })

  // Test 9: Config file format validation
  it('pull writes well-formed git config', async () => {
    const { fs, gitdir, dir } = await makeFixture('test-pull-config-format')
    await init({ fs, gitdir, dir })

    await setConfig({
      fs,
      gitdir,
      path: 'remote.origin.url',
      value: `http://${localhost}:8888/test-pull-server.git`,
    })
    await setConfig({
      fs,
      gitdir,
      path: 'remote.origin.fetch',
      value: '+refs/heads/*:refs/remotes/origin/*',
    })

    await fs.rm(path.join(gitdir, 'HEAD'))

    await pull({
      fs,
      http,
      gitdir,
      dir,
      remote: 'origin',
      ref: 'master',
      author: {
        name: 'Mr. Test',
        email: 'mrtest@example.com',
        timestamp: 1262356920,
        timezoneOffset: -0,
      },
    })

    // Read raw config file
    const configContent = await fs.read(path.join(gitdir, 'config'), 'utf8')

    // Verify config has proper INI-style format
    expect(configContent).toContain('[branch "master"]')
    expect(configContent).toMatch(/remote\s*=\s*origin/)
    expect(configContent).toMatch(/merge\s*=\s*refs\/heads\/master/)

    // Verify it's parseable by reading it back
    const remoteCfg = await getConfig({
      fs,
      gitdir,
      path: 'branch.master.remote',
    })
    const mergeCfg = await getConfig({
      fs,
      gitdir,
      path: 'branch.master.merge',
    })

    expect(remoteCfg).toBe('origin')
    expect(mergeCfg).toBe('refs/heads/master')
  })

  // Test 10: Multiple consecutive pulls should be idempotent
  it('multiple pulls without changes are idempotent', async () => {
    const { fs, gitdir, dir } = await makeFixture('test-pull-idempotent')
    await init({ fs, gitdir, dir })

    await setConfig({
      fs,
      gitdir,
      path: 'remote.origin.url',
      value: `http://${localhost}:8888/test-pull-server.git`,
    })
    await setConfig({
      fs,
      gitdir,
      path: 'remote.origin.fetch',
      value: '+refs/heads/*:refs/remotes/origin/*',
    })

    await fs.rm(path.join(gitdir, 'HEAD'))

    // First pull
    await pull({
      fs,
      http,
      gitdir,
      dir,
      remote: 'origin',
      ref: 'master',
      author: {
        name: 'Mr. Test',
        email: 'mrtest@example.com',
        timestamp: 1262356920,
        timezoneOffset: -0,
      },
    })

    const logs1 = await log({ fs, gitdir, dir, ref: 'refs/heads/master' })
    const branch1 = await currentBranch({ fs, gitdir })

    // Second pull (no changes on remote)
    await pull({
      fs,
      http,
      gitdir,
      dir,
      remote: 'origin',
      ref: 'master',
      author: {
        name: 'Mr. Test',
        email: 'mrtest@example.com',
        timestamp: 1262356920,
        timezoneOffset: -0,
      },
    })

    const logs2 = await log({ fs, gitdir, dir, ref: 'refs/heads/master' })
    const branch2 = await currentBranch({ fs, gitdir })

    // Should be identical
    expect(branch2).toBe(branch1)
    expect(logs2.length).toBe(logs1.length)
    expect(logs2[0].oid).toBe(logs1[0].oid)
  })
})
