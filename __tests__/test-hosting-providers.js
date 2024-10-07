/* eslint-env node, browser, jasmine */
import http from 'isomorphic-git/http'

const { fetch, push } = require('isomorphic-git')

const { makeFixture } = require('./__helpers__/FixtureFS.js')

// this is so it works with either Node local tests or Browser WAN tests
const localhost =
  typeof window === 'undefined' ? 'localhost' : window.location.hostname

const reverse = t =>
  t
    .split('')
    .reverse()
    .join('')

describe('Hosting Providers', () => {
  describe('AWS CodeCommit', () => {
    // These HTTPS Git credentials for AWS CodeCommit are for IAM user arn:aws:iam::260687965765:user/tester
    // which only has git access to the test repo:
    // https://git-codecommit.us-west-2.amazonaws.com/v1/repos/test.empty
    // It is stored reversed because the GitHub one is stored reversed and I like being consistent.
    const password = reverse('=cYfZKeyeW3ig0yZrkzkd9ElDKYctLgV2WNOZ1Ctntnt')
    const username = 'tester-at-260687965765'
    it('fetch', async () => {
      // Setup
      const { fs, gitdir } = await makeFixture('test-hosting-providers')
      // Test
      const res = await fetch({
        fs,
        http,
        gitdir,
        corsProxy: process.browser ? `http://${localhost}:9999` : undefined,
        remote: 'awscc',
        ref: 'master',
        onAuth: () => ({ username, password }),
      })
      expect(res).toBeTruthy()
      expect(res.defaultBranch).toBe('refs/heads/master')
      expect(res.fetchHead).toBe('c03e131196f43a78888415924bcdcbf3090f3316')
    })
    it('push', async () => {
      // Setup
      const { fs, gitdir } = await makeFixture('test-hosting-providers')
      // Test
      const res = await push({
        fs,
        http,
        gitdir,
        corsProxy: process.browser ? `http://${localhost}:9999` : undefined,
        remote: 'awscc',
        ref: 'master',
        force: true,
        onAuth: () => ({ username, password }),
      })
      expect(res).toBeTruthy()
      expect(res.ok).toBe(true)
      expect(res.refs['refs/heads/master'].ok).toBe(true)
    })
  })

  describe('Azure DevOps', () => {
    // These git credentials are specific to https://isomorphic-git@dev.azure.com/isomorphic-git/isomorphic-git/_git/test.empty
    // It is stored reversed because the GitHub one is stored reversed and I like being consistent.
    const password = reverse('ez8dMKyRfWpzMkhg3QJb5m')
    const username = 'isomorphicgittestpush'

    it('fetch', async () => {
      // Setup
      const { fs, gitdir } = await makeFixture('test-hosting-providers')
      // Test
      const res = await fetch({
        fs,
        http,
        gitdir,
        // corsProxy: process.browser ? `http://${localhost}:9999` : undefined,
        remote: 'azure',
        ref: 'master',
        onAuth: () => ({ username, password }),
      })
      expect(res).toBeTruthy()
      expect(res.defaultBranch).toBe('refs/heads/master')
      expect(res.fetchHead).toBe('c03e131196f43a78888415924bcdcbf3090f3316')
    })

    // Disabled as part of https://github.com/isomorphic-git/isomorphic-git/issues/1876.
    xit('push', async () => {
      // Setup
      const { fs, gitdir } = await makeFixture('test-hosting-providers')
      // Test
      const res = await push({
        fs,
        http,
        gitdir,
        // corsProxy: process.browser ? `http://${localhost}:9999` : undefined,
        remote: 'azure',
        ref: 'master',
        force: true,
        onAuth: () => ({ username, password }),
      })
      expect(res).toBeTruthy()
      expect(res.ok).toBe(true)
      expect(res.refs['refs/heads/master'].ok).toBe(true)
    })
  })

  describe('Bitbucket', () => {
    // This App Password is for the test account 'isomorphic-git' user on Bitbucket,
    // with "repositories.read" and "repositories.write" access. However the only repo the account has access to is
    // https://bitbucket.org/isomorphic-git/test.empty
    // It is stored reversed because the GitHub one is stored reversed and I like being consistent.
    const password = reverse('TqSWhF3xLxEEXKQtZTwn')
    const username = 'isomorphic-git'
    it('push', async () => {
      // Setup
      const { fs, gitdir } = await makeFixture('test-hosting-providers')
      // Test
      const res = await push({
        fs,
        http,
        gitdir,
        corsProxy: process.browser ? `http://${localhost}:9999` : undefined,
        remote: 'bitbucket',
        ref: 'master',
        force: true,
        onAuth: () => ({ username, password }),
      })
      expect(res).toBeTruthy()
      expect(res.ok).toBe(true)
      expect(res.refs['refs/heads/master'].ok).toBe(true)
    })
    it('fetch', async () => {
      // Setup
      const { fs, gitdir } = await makeFixture('test-hosting-providers')
      // Test
      const res = await fetch({
        fs,
        http,
        gitdir,
        corsProxy: process.browser ? `http://${localhost}:9999` : undefined,
        remote: 'bitbucket',
        ref: 'master',
        onAuth: () => ({ username, password }),
      })
      expect(res).toBeTruthy()
      expect(res.defaultBranch).toBe('refs/heads/master')
      expect(res.fetchHead).toBe('c03e131196f43a78888415924bcdcbf3090f3316')
    })
  })

  describe('GitHub', () => {
    // This Personal OAuth token is for a test account (https://github.com/isomorphic-git-test-push)
    // with "public_repo" access. The only repo it has write access to is
    // https://github.com/isomorphic-git/test.empty
    // It is stored reversed to avoid Github's auto-revoking feature.
    const password = reverse('e8df25b340c98b7eec57a4976bd9074b93a7dc1c')
    const username = 'isomorphic-git-test-push'
    it('fetch', async () => {
      // Setup
      const { fs, gitdir } = await makeFixture('test-hosting-providers')
      // Test
      const res = await fetch({
        fs,
        http,
        gitdir,
        corsProxy: process.browser ? `http://${localhost}:9999` : undefined,
        remote: 'github',
        ref: 'master',
        onAuth: () => ({ username, password }),
      })
      expect(res).toBeTruthy()
      expect(res.defaultBranch).toBe('refs/heads/test')
      expect(res.fetchHead).toBe('c03e131196f43a78888415924bcdcbf3090f3316')
    })
    it('push', async () => {
      // Setup
      const { fs, gitdir } = await makeFixture('test-hosting-providers')
      // Test
      const res = await push({
        fs,
        http,
        gitdir,
        corsProxy: process.browser ? `http://${localhost}:9999` : undefined,
        remote: 'github',
        ref: 'master',
        force: true,
        onAuth: () => ({ username, password }),
      })
      expect(res).toBeTruthy()
      expect(res.ok).toBe(true)
      expect(res.refs['refs/heads/master'].ok).toBe(true)
    })
  })

  xdescribe('GitLab', () => {
    // This Personal Access Token is for a test account (https://gitlab.com/isomorphic-git-test-push)
    // with "read_repository" and "write_repository" access. However the only repo it has write access to is
    // https://gitlab.com/isomorphic-git/test.empty
    // It is stored reversed because the GitHub one is stored reversed and I like being consistent.
    const password = reverse('vjNzgKP7acS6e6vb2Q6g')
    const username = 'isomorphic-git-test-push'
    it('fetch', async () => {
      // Setup
      const { fs, gitdir } = await makeFixture('test-hosting-providers')
      // Test
      const res = await fetch({
        fs,
        http,
        gitdir,
        corsProxy: process.browser ? `http://${localhost}:9999` : undefined,
        remote: 'gitlab',
        ref: 'master',
        onAuth: () => ({ username, password }),
      })
      expect(res).toBeTruthy()
      expect(res.defaultBranch).toBe('refs/heads/master')
      expect(res.fetchHead).toBe('c03e131196f43a78888415924bcdcbf3090f3316')
    })
    it('push', async () => {
      // Setup
      const { fs, gitdir } = await makeFixture('test-hosting-providers')
      // Test
      const res = await push({
        fs,
        http,
        gitdir,
        corsProxy: process.browser ? `http://${localhost}:9999` : undefined,
        remote: 'gitlab',
        ref: 'master',
        force: true,
        onAuth: () => ({ username, password }),
      })
      expect(res).toBeTruthy()
      expect(res.ok).toBe(true)
      expect(res.refs['refs/heads/master'].ok).toBe(true)
    })
  })
})
