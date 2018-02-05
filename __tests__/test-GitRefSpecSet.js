/* global test describe expect */
import { models } from 'isomorphic-git/internal-apis'
const { GitRefSpecSet } = models

describe('GitRefSpecSet', () => {
  test('fetch = +refs/heads/*:refs/remotes/origin/*', async () => {
    const refspec = new GitRefSpecSet()
    refspec.add('+refs/heads/*:refs/remotes/origin/*')
    const result = refspec.translate([
      'refs/heads/master',
      'refs/heads/develop'
    ])
    expect(result).toEqual([
      ['refs/heads/master', 'refs/remotes/origin/master'],
      ['refs/heads/develop', 'refs/remotes/origin/develop']
    ])
  })

  test('fetch = refs/heads/master:refs/foo/master', async () => {
    const refspec = new GitRefSpecSet()
    refspec.add('+refs/heads/*:refs/remotes/origin/*')
    refspec.add('refs/heads/master:refs/foo/master')
    const result = refspec.translate([
      'refs/heads/master',
      'refs/heads/develop'
    ])
    expect(result).toEqual([
      ['refs/heads/master', 'refs/remotes/origin/master'],
      ['refs/heads/develop', 'refs/remotes/origin/develop'],
      ['refs/heads/master', 'refs/foo/master']
    ])
  })
})
