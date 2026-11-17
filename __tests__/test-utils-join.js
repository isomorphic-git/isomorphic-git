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
      ['.', 'x/b', '..', '/b/c.js'],
      ['/.', 'x/b', '..', '/b/c.js'],
      ['/foo', '../../../bar'],
      ['foo', '../../../bar'],
      ['foo/', '../../../bar'],
      ['foo/x', '../../../bar'],
      ['./', '..', '/foo'],
      ['./', '..', '..', '/foo'],
      ['.', '..', '..', '/foo'],
      ['', '..', '..', '/foo'],
      ['/', '..'],
      ['/', '..', '..'],
    ]
    fixtures.forEach(fixture => {
      it(`"${JSON.stringify(fixture)}" should join to "${path.join(
        ...fixture
      )}"`, () => {
        expect(join(...fixture)).toEqual(path.join(...fixture))
      })
    })
  })
  describe('when given Windows paths', () => {
    const fixtures = [
      [['C:\\foo\\bar', 'baz'], 'C:/foo/bar/baz'],
      [['C:\\foo', '..'], 'C:/'],
      [['C:\\a\\b', '..\\..\\..'], 'C:/'],
      [['foo', 'C:\\bar', 'baz'], 'C:/bar/baz'],
      [['C:/repo', '.git\\worktrees\\wt'], 'C:/repo/.git/worktrees/wt'],
    ]
    fixtures.forEach(([fixture, expected]) => {
      it(`"${JSON.stringify(fixture)}" should join to "${expected}"`, () => {
        expect(join(...fixture)).toEqual(expected)
      })
    })
  })
})
