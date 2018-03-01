/* globals describe it expect */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
const pify = require('pify')
const path = require('path')

const { init, add, commit } = require('isomorphic-git')

describe('basic test', () => {
  it('does not explode', async () => {
    let { fs, dir } = await makeFixture('test-basic')
    console.log('Loaded fs')
    await init({ fs, dir })
    console.log('init')

    await pify(fs.writeFile)(path.join(dir, 'a.txt'), 'Hello')
    await add({ fs, dir, filepath: 'a.txt' })
    console.log('add a.txt')

    let oid = await commit({
      fs,
      dir,
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
