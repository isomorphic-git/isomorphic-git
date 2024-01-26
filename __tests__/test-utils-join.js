/* eslint-env node, browser, jasmine */
const path = require('path').posix || require('path')

const { join } = require('isomorphic-git/internal-apis')

describe('utils/join', () => {
  describe('when "internal join" generates paths the same as "path.join"', () => {
    // Tests adapted from path-browserify
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
      [],
      ['foo/x', './bar'],
      ['foo/x/', './bar'],
      ['foo/x/', '.', 'bar'],
      ['.', '.', '.'],
      ['.', './', '.'],
      ['.', '/./', '.'],
      ['.', '/////./', '.'],
      ['.'],
      ['', '.'],
      ['foo', '/bar'],
      ['foo', ''],
      ['foo', '', '/bar'],
      ['/'],
      ['/', '.'],
      [''],
      ['', ''],
      ['', 'foo'],
      ['', '', 'foo'],
      [' /foo'],
      [' ', 'foo'],
      [' ', '.'],
      [' ', ''],
      ['/', '/foo'],
      ['/', '//foo'],
      ['/', '', '/foo'],
    ]
    fixtures.forEach(fixture => {
      it(`"${JSON.stringify(fixture)}" should join to "${path.join(
        ...fixture
      )}"`, () => {
        expect(join(...fixture)).toEqual(path.join(...fixture))
      })
    })
  })
  describe('when "internal join" generates paths differently from "path.join"', () => {
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
    disagreeFixtures.forEach(([args, result]) => {
      it(`"${JSON.stringify(args)}" should join to "${result}"`, () => {
        expect(join(...args)).toEqual(result)
        expect(join(...args)).not.toEqual(path.join(...args))
      })
    })
  })
})
