/* eslint-env node, browser, jasmine */
import { Errors } from 'isomorphic-git'
import { GitRemoteManager, GitRemoteHTTP } from 'isomorphic-git/internal-apis'

describe('GitRemoteManager', () => {
  it('getRemoteHelperFor (http)', async () => {
    // Test
    let helper = null
    let error = null
    try {
      helper = await GitRemoteManager.getRemoteHelperFor({
        url: 'http://github.com/isomorphic-git-isomorphic-git',
      })
    } catch (err) {
      error = err
    }
    expect(error).toBeNull()
    expect(helper).toBe(GitRemoteHTTP)
  })

  it('getRemoteHelperFor (http override)', async () => {
    // Test
    let helper = null
    let error = null
    try {
      helper = await GitRemoteManager.getRemoteHelperFor({
        url: 'http::https://github.com/isomorphic-git-isomorphic-git',
      })
    } catch (err) {
      error = err
    }
    expect(error).toBeNull()
    expect(helper).toBe(GitRemoteHTTP)
  })

  it('getRemoteHelperFor (https)', async () => {
    // Test
    let helper = null
    let error = null
    try {
      helper = await GitRemoteManager.getRemoteHelperFor({
        url: 'https://github.com/isomorphic-git-isomorphic-git',
      })
    } catch (err) {
      error = err
    }
    expect(error).toBeNull()
    expect(helper).toBe(GitRemoteHTTP)
  })

  it('getRemoteHelperFor (unknown)', async () => {
    // Test
    let helper = null
    let error = null
    try {
      helper = await GitRemoteManager.getRemoteHelperFor({
        url: 'hypergit://5701a1c08ae15dba17e181b1a9a28bdfb8b95200d77a25be6051bb018e25439a',
      })
    } catch (err) {
      error = err
    }
    expect(helper).toBeNull()
    expect(error.code).toBe(Errors.UnknownTransportError.code)
  })

  it('getRemoteHelperFor (unknown override)', async () => {
    // Test
    let helper = null
    let error = null
    try {
      helper = await GitRemoteManager.getRemoteHelperFor({
        url: 'oid::c3c2a92aa2bda58d667cb57493270b83bd14d1ed',
      })
    } catch (err) {
      error = err
    }
    expect(helper).toBeNull()
    expect(error.code).toBe(Errors.UnknownTransportError.code)
  })

  it('getRemoteHelperFor (unparseable)', async () => {
    // Test
    let helper = null
    let error = null
    try {
      helper = await GitRemoteManager.getRemoteHelperFor({
        url: 'oid:c3c2a92aa2bda58d667cb57493270b83bd14d1ed',
      })
    } catch (err) {
      error = err
    }
    expect(helper).toBeNull()
    expect(error.code).toBe(Errors.UrlParseError.code)
  })
  it('getRemoteHelperFor (scp-like syntax, user other than git)', async () => {
    // git-clone(1): "[user@]host.xz:path/to/repo.git/". The user is part of the
    // syntax, so a self-hosted forge handing out gitolite@ or ubuntu@ is the
    // same shape as github handing out git@.
    for (const url of [
      'git@github.com:owner/repo.git',
      'gitolite@git.example.com:team/repo.git',
      'ubuntu@10.0.0.5:repo.git',
    ]) {
      let helper = null
      let error = null
      try {
        helper = await GitRemoteManager.getRemoteHelperFor({ url })
      } catch (err) {
        error = err
      }
      expect(helper).toBeNull()
      // ssh is not a transport isomorphic-git speaks, so the useful answer is
      // the one that names the https url to use instead.
      expect(error.code).toBe(Errors.UnknownTransportError.code)
      expect(error.data.suggestion).toBe(
        url.replace(/^[^/@:]+@([^/@:]+):/, 'https://$1/')
      )
    }
  })

  it('getRemoteHelperFor (a colon that is not scp-like)', async () => {
    // No user, so this stays with the scheme parser and keeps failing the way
    // it always has.
    let helper = null
    let error = null
    try {
      helper = await GitRemoteManager.getRemoteHelperFor({
        url: 'oid:c3c2a92aa2bda58d667cb57493270b83bd14d1ed',
      })
    } catch (err) {
      error = err
    }
    expect(helper).toBeNull()
    expect(error.code).toBe(Errors.UrlParseError.code)
  })
})
