/* globals describe it expect */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
const pify = require('pify')

const { init, add, commit } = require('..')

describe('basic test', () => {
  it('does not explode', async () => {
    let { fs, dir, gitdir } = await makeFixture('test-basic')
    console.log('Loaded fs')
    await init({ fs: fs, dir: '.' })
    console.log('init')

    fs.writeFileSync('a.txt', 'Hello', 'utf8')
    await add({ fs: fs, dir: '.', filepath: 'a.txt' })
    console.log('add a.txt')

    let oid = await commit({
      fs: fs,
      dir: '.',
      author: {
        name: 'Mr. Test',
        email: 'mrtest@example.com',
        timestamp: 1262356920
      },
      message: 'Initial commit'
    })
    console.log('commit')

    expect(oid).toEqual('066daf8b7c79dca893d91ce0577dfab5ace80dbc')
    console.log('checked oid')
  })
})
