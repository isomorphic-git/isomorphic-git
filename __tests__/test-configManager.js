/* eslint-env node, browser, jasmine */
const path = require('path')

const { GitConfigManager, GitConfig } = require('isomorphic-git/internal-apis')

const { makeFixture } = require('./__helpers__/FixtureFS.js')

describe('config', () => {
  let fs, gitdir, dir
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
  })

  afterAll(async () => {
    process.env.HOME = oldHome
    process.env.XDG_CONFIG_HOME = oldXDGConfigHome
  })
  it('get git global config values (symlink)', async () => {
    const config = await GitConfigManager.get({
      fs,
      gitdir,
    })

    const symlinksXDGorSystem = await config.get('core.symlinks')

    const systemConfig = GitConfig.from(
      await fs.read(process.env.GIT_CONFIG_SYSTEM, {
        encoding: 'utf8',
      })
    )

    expect(process.env.GIT_CONFIG_SYSTEM).toEqual(`${dir}/git/config`)

    expect(systemConfig.toString()).toContain('symlinks = false')
    expect(config.toString()).toContain('symlinks = false')

    expect(symlinksXDGorSystem).toEqual(false)
  })
  it('get git global config values (manual - append)', async () => {
    const ca = GitConfig.from(`[foo]
    keyaaa = valaaa
    [bar]
    keyxyz = valbar`)
    const a = await ca.get('foo.keyaaa')
    expect(a).toEqual('valaaa')

    const cb = GitConfig.from(`[foo]
    keybbb = valbbb
    [bar]
    keyxyz = valbar`)
    const b = await cb.get('foo.keybbb')
    expect(b).toEqual('valbbb')

    const cc = await ca.appendConfig(cb)
    const c1 = await cc.get('foo.keyaaa')
    const c2 = await cc.get('foo.keybbb')

    expect(c1).toEqual('valaaa')
    expect(c2).toEqual('valbbb')
  })
  it('get git global config values (manual - append - env)', async () => {
    const ca = GitConfig.from(
      await fs.read(process.env.GIT_CONFIG_SYSTEM, {
        encoding: 'utf8',
      })
    )
    const a = await ca.get('core.symlinks')
    expect(a).toEqual(false)

    const cb = GitConfig.from(
      await fs.read(process.env.GIT_CONFIG_GLOBAL, {
        encoding: 'utf8',
      })
    )
    const b = await cb.get('core.ignorecase')
    expect(b).toEqual(true)

    const cc = await ca.appendConfig(cb)
    const c1 = await cc.get('core.symlinks')
    const c2 = await cc.get('core.ignorecase')

    expect(c1).toEqual(false)
    expect(c2).toEqual(true)
  })
  it('get git global config values (symlink - single)', async () => {
    const systemConfig = GitConfig.from(
      await fs.read(process.env.GIT_CONFIG_SYSTEM, {
        encoding: 'utf8',
      })
    )

    expect(process.env.GIT_CONFIG_SYSTEM).toEqual(`${dir}/git/config`)

    expect(await systemConfig.get('core.symlinks')).toEqual(false)
  })
  it('get git global config values (ignore)', async () => {
    const config = await GitConfigManager.get({
      fs,
      gitdir,
    })

    const ignorecaseUser = await config.get('core.ignorecase')

    const globalConfig = GitConfig.from(
      await fs.read(process.env.GIT_CONFIG_GLOBAL, {
        encoding: 'utf8',
      })
    )

    expect(process.env.GIT_CONFIG_GLOBAL).toEqual(`${dir}/gitconfig`)

    expect(globalConfig.toString()).toContain('ignorecase = true')
    expect(config.toString()).toContain('ignorecase = true')

    expect(ignorecaseUser).toEqual(true)
  })
  it('get git global config values (ignore - single)', async () => {
    const systemConfig = GitConfig.from(
      await fs.read(process.env.GIT_CONFIG_GLOBAL, {
        encoding: 'utf8',
      })
    )

    expect(process.env.GIT_CONFIG_GLOBAL).toEqual(`${dir}/gitconfig`)

    expect(await systemConfig.get('core.ignorecase')).toEqual(true)
  })
  it('get git global config values (url)', async () => {
    const config = await GitConfigManager.get({
      fs,
      gitdir,
    })

    const urlLocal = await config.get('remote.origin.url')
    expect(urlLocal).toEqual('https://github.com/isomorphic-git/isomorphic-git')
  })
  it('get git global config values (bare)', async () => {
    const config = await GitConfigManager.get({
      fs,
      gitdir,
    })

    const bareGlobalLocal = await config.get('core.bare')
    expect(bareGlobalLocal).toEqual(false)
  })
  it('save does not set global config values (local)', async () => {
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
  })
})
