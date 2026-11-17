/* eslint-env node, browser, jasmine */
import * as path from 'path/posix'

import { join } from 'isomorphic-git/internal-apis'

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

  // path-browserify is the POSIX part of `path` only, so these are handled by
  // the wrapper added in #2302 rather than by the imported algorithm, and
  // `path.posix.join` is not the reference for them. Separators always come
  // back as '/', which is what the rest of the codebase expects.
  describe('Windows paths', () => {
    const fixtures = [
      [['C:\\foo', 'bar'], 'C:/foo/bar'],
      [['C:/foo', 'bar'], 'C:/foo/bar'],
      [['C:\\', 'foo'], 'C:/foo'],
      [['C:/', 'foo'], 'C:/foo'],
      [['c:\\a', 'b'], 'c:/a/b'],
      [['Z:\\a\\b', 'c'], 'Z:/a/b/c'],
      [['C:\\foo\\bar', '..\\baz'], 'C:/foo/baz'],
      [['C:\\Users\\me\\repo', '.git'], 'C:/Users/me/repo/.git'],
      [['C:\\Users\\me\\repo\\', '.git'], 'C:/Users/me/repo/.git'],
      // a drive-letter argument resets the accumulated path
      [['foo', 'C:\\bar'], 'C:/bar'],
      [['C:\\a', 'C:\\b'], 'C:/b'],
      // a Unix-absolute argument does not: that is resolve() semantics
      [['C:\\a', '/b'], 'C:/a/b'],
      [['\\foo', 'bar'], '/foo/bar'],
      [['foo\\bar', 'baz'], 'foo/bar/baz'],
      [['a\\b\\', 'c'], 'a/b/c'],
    ]
    fixtures.forEach(([fixture, expected]) => {
      it(`"${JSON.stringify(fixture)}" should join to "${expected}"`, () => {
        expect(join(...fixture)).toEqual(expected)
      })
    })
  })

  describe('rejects a path that is not a string', () => {
    // path-browserify's assertPath. The old implementation also threw a
    // TypeError here, from `.replace` on a non-string.
    ;[undefined, null, 1, {}].forEach(value => {
      it(`${JSON.stringify(value) ?? 'undefined'} throws a TypeError`, () => {
        expect(() => join('a', value)).toThrow(TypeError)
      })
    })
  })
})
