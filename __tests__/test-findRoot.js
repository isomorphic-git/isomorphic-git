/* eslint-env node, browser, jasmine */
const path = require('path')

const { findRoot } = require('isomorphic-git')

const { makeFixture } = require('./__helpers__/FixtureFS.js')

// NOTE: Because ".git" is not allowed as a path name in git,
// we can't actually store the ".git" folders in our fixture,
// so we have to make those folders dynamically.
describe('findRoot', () => {
  it('filepath has its own .git folder', async () => {
    // Setup
    const { fs, dir } = await makeFixture('test-findRoot')
    await fs.mkdir(path.join(dir, 'foobar', '.git'))
    await fs.mkdir(path.join(dir, 'foobar/bar', '.git'))
    // Test
    const root = await findRoot({
      fs,
      filepath: path.join(dir, 'foobar'),
    })
    expect(path.basename(root)).toBe('foobar')
  })
  it('filepath has ancestor with a .git folder', async () => {
    // Setup
    const { fs, dir } = await makeFixture('test-findRoot')
    await fs.mkdir(path.join(dir, 'foobar', '.git'))
    await fs.mkdir(path.join(dir, 'foobar/bar', '.git'))
    // Test
    const root = await findRoot({
      fs,
      filepath: path.join(dir, 'foobar/bar/baz/buzz'),
    })
    expect(path.basename(root)).toBe('bar')
  })
})
