/* eslint-env node, browser, jasmine */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
const path = require('path')
const pify = require('pify')

const { plugins, findRoot } = require('isomorphic-git')

// NOTE: Because ".git" is not allowed as a path name in git,
// we can't actually store the ".git" folders in our fixture,
// so we have to make those folders dynamically.
describe('findRoot', () => {
  it('filepath has its own .git folder', async () => {
    // Setup
    let { fs, dir } = await makeFixture('test-findRoot')
    plugins.set('fs', fs)
    await pify(fs.mkdir)(path.join(dir, 'foobar', '.git'))
    await pify(fs.mkdir)(path.join(dir, 'foobar/bar', '.git'))
    // Test
    let root = await findRoot({
      filepath: path.join(dir, 'foobar')
    })
    expect(path.basename(root)).toBe('foobar')
  })
  it('filepath has ancestor with a .git folder', async () => {
    // Setup
    let { fs, dir } = await makeFixture('test-findRoot')
    plugins.set('fs', fs)
    await pify(fs.mkdir)(path.join(dir, 'foobar', '.git'))
    await pify(fs.mkdir)(path.join(dir, 'foobar/bar', '.git'))
    // Test
    let root = await findRoot({
      filepath: path.join(dir, 'foobar/bar/baz/buzz')
    })
    expect(path.basename(root)).toBe('bar')
  })
})
