/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')

const { fetch, push } = require('isomorphic-git')

// this is so it works with either Node local tests or Browser WAN tests
const localhost =
  typeof window === 'undefined' ? 'localhost' : window.location.hostname

describe('Hosting Providers', () => {
  describe('AWS CodeCommit', () => {
    it('fetch', async () => {
      // These HTTPS Git credentials for AWS CodeCommit are for IAM user arn:aws:iam::260687965765:user/tester
      // which only has git access to the test repo:
      // https://git-codecommit.us-west-2.amazonaws.com/v1/repos/test.empty
      // It is stored reversed because the GitHub one is stored reversed and I like being consistant.
      const token = '=cYfZKeyeW3ig0yZrkzkd9ElDKYctLgV2WNOZ1Ctntnt'
        .split('')
        .reverse()
        .join('')
      // Setup
      const { gitdir } = await makeFixture('test-hosting-providers')
      // Test
      const res = await fetch({
        gitdir,
        corsProxy: process.browser ? `http://${localhost}:9999` : undefined,
        username: 'tester-at-260687965765',
        password: token,
        remote: 'awscc',
        ref: 'master'
      })
      expect(res).toBeTruthy()
      expect(res.defaultBranch).toBe('refs/heads/master')
      expect(res.fetchHead).toBe('c03e131196f43a78888415924bcdcbf3090f3316')
    })
    it('push', async () => {
      // These HTTPS Git credentials for AWS CodeCommit are for IAM user arn:aws:iam::260687965765:user/tester
      // which only has git access to the test repo:
      // https://git-codecommit.us-west-2.amazonaws.com/v1/repos/test.empty
      // It is stored reversed because the GitHub one is stored reversed and I like being consistant.
      const token = '=cYfZKeyeW3ig0yZrkzkd9ElDKYctLgV2WNOZ1Ctntnt'
        .split('')
        .reverse()
        .join('')
      // Setup
      const { gitdir } = await makeFixture('test-hosting-providers')
      // Test
      const res = await push({
        gitdir,
        corsProxy: process.browser ? `http://${localhost}:9999` : undefined,
        username: 'tester-at-260687965765',
        password: token,
        remote: 'awscc',
        ref: 'master',
        force: true
      })
      expect(res).toBeTruthy()
      expect(res.ok).toBeTruthy()
      expect(res.ok[0]).toBe('unpack')
      expect(res.ok[1]).toBe('refs/heads/master')
    })
  })
  describe('Azure DevOps', () => {
    it('fetch', async () => {
      // These git credentials are specific to https://isomorphic-git@dev.azure.com/isomorphic-git/isomorphic-git/_git/test.empty
      // It is stored reversed because the GitHub one is stored reversed and I like being consistant.
      const token = 'ez8dMKyRfWpzMkhg3QJb5m'
        .split('')
        .reverse()
        .join('')
      // Setup
      const { gitdir } = await makeFixture('test-hosting-providers')
      // Test
      const res = await fetch({
        noGitSuffix: true,
        gitdir,
        // corsProxy: process.browser ? `http://${localhost}:9999` : undefined,
        username: 'isomorphicgittestpush',
        password: token,
        remote: 'azure',
        ref: 'master'
      })
      expect(res).toBeTruthy()
      expect(res.defaultBranch).toBe('refs/heads/master')
      expect(res.fetchHead).toBe('c03e131196f43a78888415924bcdcbf3090f3316')
    })
    it('push', async () => {
      // These git credentials are specific to https://isomorphic-git@dev.azure.com/isomorphic-git/isomorphic-git/_git/test.empty
      // It is stored reversed because the GitHub one is stored reversed and I like being consistant.
      const token = 'ez8dMKyRfWpzMkhg3QJb5m'
        .split('')
        .reverse()
        .join('')
      // Setup
      const { gitdir } = await makeFixture('test-hosting-providers')
      // Test
      const res = await push({
        noGitSuffix: true,
        gitdir,
        // corsProxy: process.browser ? `http://${localhost}:9999` : undefined,
        username: 'isomorphicgittestpush',
        password: token,
        remote: 'azure',
        ref: 'master',
        force: true
      })
      expect(res).toBeTruthy()
      expect(res.ok).toBeTruthy()
      expect(res.ok[0]).toBe('unpack')
      expect(res.ok[1]).toBe('refs/heads/master')
    })
  })
  describe('Bitbucket', () => {
    it('push', async () => {
      // This App Password is for the test account 'isomorphic-git' user on Bitbucket,
      // with "repositories.read" and "repositories.write" access. However the only repo the account has access to is
      // https://bitbucket.org/isomorphic-git/test.empty
      // It is stored reversed because the GitHub one is stored reversed and I like being consistant.
      const token = 'TqSWhF3xLxEEXKQtZTwn'
        .split('')
        .reverse()
        .join('')
      // Setup
      const { gitdir } = await makeFixture('test-hosting-providers')
      // Test
      const res = await push({
        gitdir,
        corsProxy: process.browser ? `http://${localhost}:9999` : undefined,
        username: 'isomorphic-git',
        password: token,
        remote: 'bitbucket',
        ref: 'master',
        force: true
      })
      expect(res).toBeTruthy()
      expect(res.ok).toBeTruthy()
      expect(res.ok[0]).toBe('unpack')
      expect(res.ok[1]).toBe('refs/heads/master')
    })
    it('fetch', async () => {
      // This App Password is for the test account 'isomorphic-git' user on Bitbucket,
      // with "repositories.read" and "repositories.write" access. However the only repo the account has access to is
      // https://bitbucket.org/isomorphic-git/test.empty
      // It is stored reversed because the GitHub one is stored reversed and I like being consistant.
      const token = 'TqSWhF3xLxEEXKQtZTwn'
        .split('')
        .reverse()
        .join('')
      // Setup
      const { gitdir } = await makeFixture('test-hosting-providers')
      // Test
      const res = await fetch({
        gitdir,
        corsProxy: process.browser ? `http://${localhost}:9999` : undefined,
        username: 'isomorphic-git',
        password: token,
        remote: 'bitbucket',
        ref: 'master'
      })
      expect(res).toBeTruthy()
      expect(res.defaultBranch).toBe('refs/heads/master')
      expect(res.fetchHead).toBe('c03e131196f43a78888415924bcdcbf3090f3316')
    })
  })
  describe('GitHub', () => {
    it('fetch', async () => {
      // This Personal OAuth token is for a test account (https://github.com/isomorphic-git-test-push)
      // with "public_repo" access. The only repo it has write access to is
      // https://github.com/isomorphic-git/test.empty
      // It is stored reversed to avoid Github's auto-revoking feature.
      const token = 'e8df25b340c98b7eec57a4976bd9074b93a7dc1c'
        .split('')
        .reverse()
        .join('')
      // Setup
      const { gitdir } = await makeFixture('test-hosting-providers')
      // Test
      const res = await fetch({
        gitdir,
        corsProxy: process.browser ? `http://${localhost}:9999` : undefined,
        token: token,
        remote: 'github',
        ref: 'master'
      })
      expect(res).toBeTruthy()
      expect(res.defaultBranch).toBe('refs/heads/test')
      expect(res.fetchHead).toBe('c03e131196f43a78888415924bcdcbf3090f3316')
    })
    it('push', async () => {
      // This Personal OAuth token is for a test account (https://github.com/isomorphic-git-test-push)
      // with "public_repo" access. The only repo it has write access to is
      // https://github.com/isomorphic-git/test.empty
      // It is stored reversed to avoid Github's auto-revoking feature.
      const token = 'e8df25b340c98b7eec57a4976bd9074b93a7dc1c'
        .split('')
        .reverse()
        .join('')
      // Setup
      const { gitdir } = await makeFixture('test-hosting-providers')
      // Test
      const res = await push({
        gitdir,
        corsProxy: process.browser ? `http://${localhost}:9999` : undefined,
        token: token,
        remote: 'github',
        ref: 'master',
        force: true
      })
      expect(res).toBeTruthy()
      expect(res.ok).toBeTruthy()
      expect(res.ok[0]).toBe('unpack')
      expect(res.ok[1]).toBe('refs/heads/master')
    })
  })
  describe('GitLab', () => {
    it('fetch', async () => {
      // This Personal Access Token is for a test account (https://gitlab.com/isomorphic-git-test-push)
      // with "read_repository" and "write_repository" access. However the only repo it has write access to is
      // https://gitlab.com/isomorphic-git/test.empty
      // It is stored reversed because the GitHub one is stored reversed and I like being consistant.
      const token = 'vjNzgKP7acS6e6vb2Q6g'
        .split('')
        .reverse()
        .join('')
      // Setup
      const { gitdir } = await makeFixture('test-hosting-providers')
      // Test
      const res = await fetch({
        gitdir,
        corsProxy: process.browser ? `http://${localhost}:9999` : undefined,
        username: 'isomorphic-git-test-push',
        password: token,
        remote: 'gitlab',
        ref: 'master'
      })
      expect(res).toBeTruthy()
      expect(res.defaultBranch).toBe('refs/heads/master')
      expect(res.fetchHead).toBe('c03e131196f43a78888415924bcdcbf3090f3316')
    })
    it('push', async () => {
      // This Personal Access Token is for a test account (https://gitlab.com/isomorphic-git-test-push)
      // with "read_repository" and "write_repository" access. However the only repo it has write access to is
      // https://gitlab.com/isomorphic-git/test.empty
      // It is stored reversed because the GitHub one is stored reversed and I like being consistant.
      const token = 'vjNzgKP7acS6e6vb2Q6g'
        .split('')
        .reverse()
        .join('')
      // Setup
      const { gitdir } = await makeFixture('test-hosting-providers')
      // Test
      const res = await push({
        gitdir,
        corsProxy: process.browser ? `http://${localhost}:9999` : undefined,
        username: 'isomorphic-git-test-push',
        password: token,
        remote: 'gitlab',
        ref: 'master',
        force: true
      })
      expect(res).toBeTruthy()
      expect(res.ok).toBeTruthy()
      expect(res.ok[0]).toBe('unpack')
      expect(res.ok[1]).toBe('refs/heads/master')
    })
  })
})
