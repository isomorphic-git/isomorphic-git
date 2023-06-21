/* eslint-env node, browser, jasmine */
const { GitConfigManager, GitConfig } = require('isomorphic-git/internal-apis')

const { makeFixture } = require('./__helpers__/FixtureFS.js')

describe('config', () => {
  let fs, gitdir
  let oldHome, oldXDGConfigHome
  let config

  beforeAll(async () => {
    // Setup
    const output = await makeFixture('test-config')
    fs = output.fs
    gitdir = output.gitdir

    oldHome = process.env.HOME
    oldXDGConfigHome = process.env.XDG_CONFIG_HOME
    process.env.HOME = gitdir
    process.env.XDG_CONFIG_HOME = gitdir

    config = await GitConfigManager.get({
      fs,
      gitdir,
    })
  })

  afterAll(async () => {
    process.env.HOME = oldHome
    process.env.XDG_CONFIG_HOME = oldXDGConfigHome
  })
  ;(process.browser ? xit : it)(
    'get git XDG and user config values',
    async () => {
      const symlinksXDG = await config.get('core.symlinks')
      const ignorecaseUser = await config.get('core.ignorecase')
      const urlLocal = await config.get('remote.origin.url')
      const bareGlobalLocal = await config.get('core.bare')

      expect(bareGlobalLocal).toBe(false)
      expect(symlinksXDG).toBe(false)
      expect(ignorecaseUser).toBe(true)
      expect(urlLocal).toBe('https://github.com/isomorphic-git/isomorphic-git')
    }
  )
  ;(process.browser ? xit : it)(
    'save does not set git XDG and user config values',
    async () => {
      await GitConfigManager.save({
        fs,
        gitdir,
        config,
      })

      const localConfig = GitConfig.from(
        await fs.read(`${gitdir}/config`, {
          encoding: 'utf8',
        })
      )

      const symlinksXDG = await localConfig.get('core.symlinks')
      const ignorecaseUser = await localConfig.get('core.ignorecase')
      const urlLocal = await localConfig.get('remote.origin.url')
      expect(symlinksXDG).toBeUndefined()
      expect(ignorecaseUser).toBeUndefined()
      expect(urlLocal).toBe('https://github.com/isomorphic-git/isomorphic-git')
    }
  )
})
