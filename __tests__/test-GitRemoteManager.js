/* eslint-env node, browser, jasmine */
const { Errors } = require('isomorphic-git')
const {
  GitRemoteManager,
  GitRemoteHTTP,
} = require('isomorphic-git/internal-apis')

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
        url:
          'hypergit://5701a1c08ae15dba17e181b1a9a28bdfb8b95200d77a25be6051bb018e25439a',
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
})
