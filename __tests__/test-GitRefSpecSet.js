/* eslint-env node, browser, jasmine */
import { GitRefSpecSet } from 'isomorphic-git/internal-apis'

describe('GitRefSpecSet', () => {
  it('fetch = +refs/heads/*:refs/remotes/origin/*', async () => {
    const refspec = GitRefSpecSet.from(['+refs/heads/*:refs/remotes/origin/*'])
    const result = refspec.translate([
      'refs/heads/master',
      'refs/heads/develop',
    ])
    expect(result).toEqual([
      ['refs/heads/master', 'refs/remotes/origin/master'],
      ['refs/heads/develop', 'refs/remotes/origin/develop'],
    ])
  })

  it('fetch = refs/heads/master:refs/foo/master', async () => {
    const refspec = new GitRefSpecSet()
    refspec.add('+refs/heads/*:refs/remotes/origin/*')
    refspec.add('refs/heads/master:refs/foo/master')
    const result = refspec.translate([
      'refs/heads/master',
      'refs/heads/develop',
    ])
    expect(result).toEqual([
      ['refs/heads/master', 'refs/remotes/origin/master'],
      ['refs/heads/develop', 'refs/remotes/origin/develop'],
      ['refs/heads/master', 'refs/foo/master'],
    ])
  })

  it('fetch = ^refs/heads/tmp/* (negative refspec)', async () => {
    const refspec = GitRefSpecSet.from([
      '+refs/heads/*:refs/remotes/origin/*',
      '^refs/heads/tmp/*',
      '^refs/heads/develop',
    ])
    const result = refspec.translate([
      'refs/heads/master',
      'refs/heads/develop',
      'refs/heads/tmp/foo',
    ])
    expect(result).toEqual([
      ['refs/heads/master', 'refs/remotes/origin/master'],
    ])
    expect(refspec.translateOne('refs/heads/tmp/foo')).toBeNull()
    expect(refspec.localNamespaces()).toEqual(['refs/remotes/origin'])
  })

  it('fetch = refs/heads/master (no destination)', async () => {
    const refspec = GitRefSpecSet.from([
      '+refs/heads/*:refs/remotes/origin/*',
      'refs/heads/master',
    ])
    const result = refspec.translate(['refs/heads/master'])
    expect(result).toEqual([
      ['refs/heads/master', 'refs/remotes/origin/master'],
    ])
  })

  it('weird HEAD implicit rule', async () => {
    const refspec = new GitRefSpecSet()
    refspec.add('+HEAD:refs/remotes/origin/HEAD')
    const result = refspec.translate(['HEAD'])
    expect(result).toEqual([['HEAD', 'refs/remotes/origin/HEAD']])
  })
})
