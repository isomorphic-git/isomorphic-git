/* eslint-env node, browser, jasmine */
const path = require('path').posix || require('path')

const { join } = require('isomorphic-git/internal-apis')

describe('utils/join', () => {
  it('should join "good" paths the same as path.join', async () => {
    const fixtures = [
      ['/foo/bar', 'baz'],
      ['foo/bar', 'baz'],
      ['foo', 'bar', 'baz'],
      ['/', 'foo', 'bar', 'baz'],
      ['.', 'foo'],
      ['foo', '.'],
      ['.', '.'],
      ['.', 'foo', '.'],
      ['.', '.', '.'],
      ['/', '.'],
      ['/', '.git'],
      ['.', '.git'],
    ]
    for (const fixture of fixtures) {
      expect(join(...fixture)).toEqual(path.join(...fixture))
    }
  })
  it('should join degenerate paths the same as path.join in these cases', async () => {
    // Tests adapted from path-browserify
    const fixtures = [
      [[], '.'],
      [['foo/x', './bar'], 'foo/x/bar'],
      [['foo/x/', './bar'], 'foo/x/bar'],
      [['foo/x/', '.', 'bar'], 'foo/x/bar'],
      [['.', '.', '.'], '.'],
      [['.', './', '.'], '.'],
      [['.', '/./', '.'], '.'],
      [['.', '/////./', '.'], '.'],
      [['.'], '.'],
      [['', '.'], '.'],
      [['foo', '/bar'], 'foo/bar'],
      [['foo', ''], 'foo'],
      [['foo', '', '/bar'], 'foo/bar'],
      [['/'], '/'],
      [['/', '.'], '/'],
      [[''], '.'],
      [['', ''], '.'],
      [['', 'foo'], 'foo'],
      [['', '', 'foo'], 'foo'],
      [[' /foo'], ' /foo'],
      [[' ', 'foo'], ' /foo'],
      [[' ', '.'], ' '],
      [[' ', ''], ' '],
      [['/', '/foo'], '/foo'],
      [['/', '//foo'], '/foo'],
      [['/', '', '/foo'], '/foo'],
    ]
    for (const [args, result] of fixtures) {
      expect(join(...args)).toEqual(result)
      expect(join(...args)).toEqual(path.join(...args))
    }
  })
  it('should join degenerate paths differently from path.join in these cases', async () => {
    // Tests adapted from path-browserify
    const disagreeFixtures = [
      [['./'], '.'],
      [['.', './'], '.'],
      [['', '/foo'], 'foo'],
      [['', '', '/foo'], 'foo'],
      [['foo/', ''], 'foo'],
      [['', '/', 'foo'], 'foo'],
      [['', '/', '/foo'], 'foo'],
    ]
    for (const [args, result] of disagreeFixtures) {
      expect(join(...args)).toEqual(result)
      expect(join(...args)).not.toEqual(path.join(...args))
    }
  })
})
