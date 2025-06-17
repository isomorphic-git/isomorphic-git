/* eslint-env node, browser, jasmine */
import http from 'isomorphic-git/http'

const { clone } = require('isomorphic-git')

const { makeFixture } = require('./__helpers__/FixtureFS.js')

const localhost =
  typeof window === 'undefined' ? 'localhost' : window.location.hostname

describe('huge repo clone and checkout', () => {
  it('clone from git-http-mock-server with non-blocking optimization for repo with 1k files', async () => {
    await runTestAndGetTimeTaken(true, 'main1k')
  })

  // Disabled because it takes too long (> 120s). To run it, increase test timeout and use lightningfs.
  xit('clone from git-http-mock-server with non-blocking optimization for repo with 10k files', async () => {
    await runTestAndGetTimeTaken(true, 'main10k')
  })
})

/**
 * @param {boolean} nonBlocking
 * @param {string} branchName
 */
async function runTestAndGetTimeTaken(nonBlocking, branchName) {
  const { fs, dir, gitdir } = await makeFixture(`test-clone-karma-non-blocking`)
  let timer
  let timeTaken = Number.POSITIVE_INFINITY

  await clone({
    fs,
    http,
    dir,
    gitdir,
    depth: 10,
    ref: branchName,
    singleBranch: true,
    url: `https://github.com/ARBhosale/dummy-huge-repo.git`,
    corsProxy: process.browser ? `http://${localhost}:9999` : undefined,
    nonBlocking: nonBlocking,
  })

  if (timer) timeTaken = (Date.now() - timer) / 1000

  expect(await fs.exists(`${dir}`)).toBe(true, `'dir' exists`)
  expect(await fs.exists(`${gitdir}/objects`)).toBe(
    true,
    `'gitdir/objects' exists`
  )
  expect(await fs.exists(`${gitdir}/refs/heads/${branchName}`)).toBe(
    true,
    `'gitdir/refs/heads/${branchName}' exists`
  )
  expect(await fs.exists(`${dir}/package.json`)).toBe(
    true,
    `'package.json' exists`
  )
  return timeTaken
}
