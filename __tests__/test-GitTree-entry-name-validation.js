/* eslint-env node, browser, jasmine */
import { GitTree } from 'isomorphic-git/internal-apis'

// GitTree should reject the reserved entry names git's verify_path() rejects:
//   "." and ".."  — these resolve outside the working directory
//   ".git"         — git disallows it as a path component
// ".git" is matched case-insensitively and with trailing dots/spaces stripped, since
// those are ignored on some filesystems (so ".git." and ".git " resolve to ".git").
describe('GitTree entry-name validation', () => {
  const oid = Buffer.alloc(20, 1)
  // git tree entry on the wire: "<mode> <name>\0<20-byte oid>"
  const entry = (mode, name) =>
    Buffer.concat([Buffer.from(`${mode} ${name}`), Buffer.from([0]), oid])
  const rejects = name =>
    expect(() => GitTree.from(entry('40000', name))).toThrow(/unsafe/i)

  it('rejects ".."', () => rejects('..'))
  it('rejects "."', () => rejects('.'))
  it('rejects ".git"', () => rejects('.git'))
  it('rejects ".git" case-insensitively (".GIT")', () => rejects('.GIT'))
  it('rejects ".git." and ".git " (trailing dot/space)', () => {
    rejects('.git.')
    rejects('.git ')
  })

  it('accepts ordinary names, including .gitignore', () => {
    expect(GitTree.from(entry('100644', 'normal.txt')).entries()[0].path).toBe(
      'normal.txt'
    )
    expect(GitTree.from(entry('100644', '.gitignore')).entries()[0].path).toBe(
      '.gitignore'
    )
  })
})
