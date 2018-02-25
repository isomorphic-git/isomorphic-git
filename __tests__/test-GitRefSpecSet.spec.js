/* global describe it expect */
const { models } = process.browser
  ? require('../dist/internal.umd.min.js')
  : require('../dist/for-node/internal-apis')
const { GitRefSpecSet } = models

describe('GitRefSpecSet', () => {
  it('fetch = +refs/heads/*:refs/remotes/origin/*', async () => {
    const refspec = GitRefSpecSet.from(['+refs/heads/*:refs/remotes/origin/*'])
    const result = refspec.translate([
      'refs/heads/master',
      'refs/heads/develop'
    ])
    expect(result).toEqual([
      ['refs/heads/master', 'refs/remotes/origin/master'],
      ['refs/heads/develop', 'refs/remotes/origin/develop']
    ])
  })

  it('fetch = refs/heads/master:refs/foo/master', async () => {
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
