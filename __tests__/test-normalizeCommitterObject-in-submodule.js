/* eslint-env node, browser, jasmine */

const { setConfig } = require('isomorphic-git')
const { normalizeCommitterObject } = require('isomorphic-git/internal-apis')

const {
  makeFixtureAsSubmodule,
} = require('./__helpers__/FixtureFSSubmodule.js')

describe('normalizeCommitterObject', () => {
  ;(process.browser ? xit : it)(
    'return committer if all properties are populated',
    async () => {
      // Setup
      const { fs, gitdir } = await makeFixtureAsSubmodule(
        'test-normalizeAuthorObject'
      )

      await setConfig({
        fs,
        gitdir,
        path: 'user.name',
        value: `user-config`,
      })

      await setConfig({
        fs,
        gitdir,
        path: 'user.name',
        value: `user-config@example.com`,
      })

      // Test
      const author = {
        name: 'user-author',
        email: 'user-author@example.com',
        timestamp: 1720159690,
        timezoneOffset: -120,
      }

      const committer = {
        name: 'user-author',
        email: 'user-author@example.com',
        timestamp: 1720165308,
        timezoneOffset: -60,
      }

      expect(
        await normalizeCommitterObject({ fs, gitdir, author, committer })
      ).toEqual(committer)
    }
  )
  ;(process.browser ? xit : it)(
    'return author values if no committer was provided',
    async () => {
      // Setup
      const { fs, gitdir } = await makeFixtureAsSubmodule(
        'test-normalizeAuthorObject'
      )

      await setConfig({
        fs,
        gitdir,
        path: 'user.name',
        value: `user-config`,
      })

      await setConfig({
        fs,
        gitdir,
        path: 'user.email',
        value: `user-config@example.com`,
      })

      // Test
      const author = {
        name: 'user-author',
        email: 'user-author@example.com',
        timestamp: 1720159690,
        timezoneOffset: -120,
      }

      expect(await normalizeCommitterObject({ fs, gitdir, author })).toEqual(
        author
      )
    }
  )
  ;(process.browser ? xit : it)(
    'return commit committer when no author or committer was provided',
    async () => {
      // Setup
      const { fs, gitdir } = await makeFixtureAsSubmodule(
        'test-normalizeAuthorObject'
      )

      await setConfig({
        fs,
        gitdir,
        path: 'user.name',
        value: `user-config`,
      })

      await setConfig({
        fs,
        gitdir,
        path: 'user.email',
        value: `user-config@example.com`,
      })

      // Test
      const commit = {
        message: 'commit message',
        tree: '80655da8d80aaaf92ce5357e7828dc09adb00993', // Just random SHA-1
        parent: ['d8fd39d0bbdd2dcf322d8b11390a4c5825b11495'], // Just random SHA-1
        author: {
          name: 'commit-author',
          email: 'commit-author@example.com',
          timestamp: 1720169744,
          timezoneOffset: 60,
        },
        committer: {
          name: 'commit-commiter',
          email: 'commit-commiter@example.com',
          timestamp: 1720169744,
          timezoneOffset: 120,
        },
      }

      expect(await normalizeCommitterObject({ fs, gitdir, commit })).toEqual(
        commit.committer
      )
    }
  )
  ;(process.browser ? xit : it)(
    'return config values and new timestamp if no author or committer was provided',
    async () => {
      // Setup
      const { fs, gitdirsmfullpath } = await makeFixtureAsSubmodule(
        'test-normalizeAuthorObject'
      )

      await setConfig({
        fs,
        gitdir: gitdirsmfullpath,
        path: 'user.name',
        value: `user-config`,
      })

      await setConfig({
        fs,
        gitdir: gitdirsmfullpath,
        path: 'user.email',
        value: `user-config@example.com`,
      })

      // Test
      const committer = await normalizeCommitterObject({
        fs,
        gitdir: gitdirsmfullpath,
      })
      expect(committer.name).toEqual('user-config')
      expect(committer.email).toEqual('user-config@example.com')
      expect(typeof committer.timestamp).toBe('number')
      expect(typeof committer.timezoneOffset).toBe('number')
    }
  )
  ;(process.browser ? xit : it)(
    'return undefined if no value can be retrieved',
    async () => {
      // Setup
      const { fs, gitdirsmfullpath } = await makeFixtureAsSubmodule(
        'test-normalizeAuthorObject'
      )

      // Test
      expect(
        await normalizeCommitterObject({ fs, gitdir: gitdirsmfullpath })
      ).toBeUndefined()
    }
  )
})
