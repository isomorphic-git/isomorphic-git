/* eslint-env node, browser, jasmine */

const { init } = require('isomorphic-git')
const { getConfig, setConfig } = require('isomorphic-git')

const {
  makeFixtureAsSubmodule,
} = require('./__helpers__/FixtureFSSubmodule.js')

describe('init', () => {
  ;(process.browser ? xit : it)('init', async () => {
    const { fs, dir, gitdirsmfullpath } = await makeFixtureAsSubmodule(
      'test-init'
    )
    await init({ fs, dir })
    expect(await fs.exists(dir)).toBe(true)
    expect(await fs.exists(`${gitdirsmfullpath}/objects`)).toBe(true)
    expect(await fs.exists(`${gitdirsmfullpath}/refs/heads`)).toBe(true)
    expect(await fs.exists(`${gitdirsmfullpath}/HEAD`)).toBe(true)
  })
  ;(process.browser ? xit : it)('init --bare', async () => {
    const { fs, dir } = await makeFixtureAsSubmodule('test-init')
    await init({ fs, dir, bare: true })
    expect(await fs.exists(dir)).toBe(true)
    expect(await fs.exists(`${dir}/objects`)).toBe(true)
    expect(await fs.exists(`${dir}/refs/heads`)).toBe(true)
    expect(await fs.exists(`${dir}/HEAD`)).toBe(true)
  })
  ;(process.browser ? xit : it)(
    'init does not overwrite existing config',
    async () => {
      // Setup
      const { fs, dir, gitdirsmfullpath } = await makeFixtureAsSubmodule(
        'test-init'
      )
      const name = 'me'
      const email = 'meme'
      await init({ fs, dir })
      expect(await fs.exists(dir)).toBe(true)
      expect(await fs.exists(`${gitdirsmfullpath}/config`)).toBe(true)
      await setConfig({ fs, dir, path: 'user.name', value: name })
      await setConfig({ fs, dir, path: 'user.email', value: email })
      // Test
      await init({ fs, dir })
      expect(await fs.exists(dir)).toBe(true)
      expect(await fs.exists(`${gitdirsmfullpath}/config`)).toBe(true)
      // check that the properties we added are still there.
      expect(await getConfig({ fs, dir, path: 'user.name' })).toEqual(name)
      expect(await getConfig({ fs, dir, path: 'user.email' })).toEqual(email)
    }
  )
})
