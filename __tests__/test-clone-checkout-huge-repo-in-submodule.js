/* eslint-env node, browser, jasmine */
import http from 'isomorphic-git/http'

const { clone } = require('isomorphic-git')

const {
  makeFixtureAsSubmodule,
} = require('./__helpers__/FixtureFSSubmodule.js')

const localhost =
  typeof window === 'undefined' ? 'localhost' : window.location.hostname

describe('huge repo clone and checkout', () => {
  ;(process.browser ? xit : it)(
    'clone from git-http-mock-server with non-blocking optimization for repo with 1k files',
    async () => {
      const {
        fs,
        dir,
        gitdir,
        gitdirsmfullpath,
      } = await makeFixtureAsSubmodule(`test-clone-karma-non-blocking`)
      const branchName = 'main1k'

      await clone({
        fs,
        http,
        dir,
        gitdir,
        depth: 10,
        ref: branchName,
        singleBranch: true,
        url: `https://github.com/isomorphic-git/dummy-huge-repo.git`,
        corsProxy: process.browser ? `http://${localhost}:9999` : undefined,
        nonBlocking: true,
      })

      expect(await fs.exists(`${dir}`)).toBe(true, `'dir' exists`)
      expect(await fs.exists(`${gitdirsmfullpath}/objects`)).toBe(
        true,
        `'gitdir/objects' exists`
      )
      expect(
        await fs.exists(`${gitdirsmfullpath}/refs/heads/${branchName}`)
      ).toBe(true, `'gitdir/refs/heads/${branchName}' exists`)
      expect(await fs.exists(`${dir}/package.json`)).toBe(
        true,
        `'package.json' exists`
      )
    }
  )
})
