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

  it('rejects NTFS 8.3 short name aliases for .git', () => {
    rejects('git~1')
    rejects('GIT~1')
    rejects('git~2')
    rejects('git~9')
    rejects('git~1.')
    rejects('git~1 ')
  })

  // NTFS Alternate Data Streams are referenced as `<name>:<stream>:<type>`, and a
  // directory's default stream `::$INDEX_ALLOCATION` lets `.git::$INDEX_ALLOCATION`
  // resolve to the `.git` directory itself. git rejects *any* ADS of `.git`
  // (CVE-2019-1352, git commit 7c3745fc), so only the portion before the first
  // colon names the actual entry.
  it('rejects NTFS Alternate Data Streams of .git', () => {
    rejects('.git::$INDEX_ALLOCATION')
    rejects('.git:$INDEX_ALLOCATION')
    rejects('.git:foo')
    rejects('.git...:alternate-stream') // git's own t1014 test case
    rejects('.GIT:$DATA') // case-insensitive
    rejects('.git.:stream') // trailing dot before the stream
    rejects('.git :stream') // trailing space before the stream
  })

  it('rejects NTFS Alternate Data Streams of the git~1 short name', () => {
    rejects('git~1::$INDEX_ALLOCATION')
    rejects('git~1:foo')
    rejects('GIT~1:$DATA')
  })

  it('accepts colon names whose leading component is not .git', () => {
    expect(GitTree.from(entry('100644', 'foo:bar')).entries()[0].path).toBe(
      'foo:bar'
    )
    expect(
      GitTree.from(entry('100644', '.gitignore:bar')).entries()[0].path
    ).toBe('.gitignore:bar')
  })

  it('rejects HFS+ ignorable Unicode variants of .git', () => {
    rejects('.g‌it') // U+200C zero width non-joiner
    rejects('.‍git') // U+200D zero width joiner
    rejects('.gi‎t') // U+200E left-to-right mark
    rejects('.git﻿') // U+FEFF zero width no-break space (BOM)
  })

  it('rejects HFS+ ignorable Unicode variants of . and ..', () => {
    rejects('.‌') // "." + zero width non-joiner
    rejects('.‌.') // ".." with zero width non-joiner between dots
  })

  it('accepts git~10 and git~0 (not valid 8.3 aliases)', () => {
    expect(GitTree.from(entry('100644', 'git~10')).entries()[0].path).toBe(
      'git~10'
    )
    expect(GitTree.from(entry('100644', 'git~0')).entries()[0].path).toBe(
      'git~0'
    )
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
