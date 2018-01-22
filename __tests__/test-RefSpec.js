/* global test describe expect */
import { RefSpec, RefSpecSet } from '../dist/for-node/models'

describe('RefSpec', () => {
  test('fetch = +refs/heads/*:refs/remotes/origin/*', async () => {
    const refspec = new RefSpecSet()
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
    const refspec = new RefSpecSet()
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
