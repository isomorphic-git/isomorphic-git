/* eslint-env node, browser, jasmine */
const path = require('path')

const { GitConfigManager, GitConfig } = require('isomorphic-git/internal-apis')

const { makeFixture } = require('./__helpers__/FixtureFS.js')

describe('config', () => {
  let fs, gitdir, dir, config
  let oldHome, oldXDGConfigHome

  beforeAll(async () => {
    // Setup
    const output = await makeFixture('test-config')
    fs = output.fs
    gitdir = output.gitdir
    dir = output.dir

    oldHome = process.env.HOME
    oldXDGConfigHome = process.env.XDG_CONFIG_HOME

    process.env.GIT_CONFIG_SYSTEM = path.join(dir, 'git', 'config')
    process.env.GIT_CONFIG_GLOBAL = path.join(dir, 'gitconfig')

    config = await GitConfigManager.get({
      fs,
      gitdir,
    })
  })

  afterAll(async () => {
    process.env.HOME = oldHome
    process.env.XDG_CONFIG_HOME = oldXDGConfigHome
  })
  ;(process.browser ? xit : it)('get git global config values', async () => {
    const symlinksXDGorSystem = await config.get('core.symlinks')
    expect(symlinksXDGorSystem).toEqual(false)

    const ignorecaseUser = await config.get('core.ignorecase')
    expect(ignorecaseUser).toEqual(true)

    const urlLocal = await config.get('remote.origin.url')
    expect(urlLocal).toEqual('https://github.com/isomorphic-git/isomorphic-git')

    const bareGlobalLocal = await config.get('core.bare')
    expect(bareGlobalLocal).toEqual(false)
  })
  ;(process.browser ? xit : it)(
    'save does not set global config values (local)',
    async () => {
      const config = await GitConfigManager.get({
        fs,
        gitdir,
      })

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
