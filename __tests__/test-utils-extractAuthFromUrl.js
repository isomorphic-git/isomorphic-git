/* eslint-env node, browser, jasmine */
import { extractAuthFromUrl } from 'isomorphic-git/internal-apis'

describe('utils/extractAuthFromUrl', () => {
  it('returns the url untouched when there are no credentials', () => {
    const { url, auth } = extractAuthFromUrl(
      'https://github.com/isomorphic-git/isomorphic-git.git'
    )
    expect(url).toEqual('https://github.com/isomorphic-git/isomorphic-git.git')
    expect(auth).toEqual({})
  })

  it('splits a username and password', () => {
    const { url, auth } = extractAuthFromUrl(
      'https://user:pass@github.com/owner/repo.git'
    )
    expect(url).toEqual('https://github.com/owner/repo.git')
    expect(auth).toEqual({ username: 'user', password: 'pass' })
  })

  it('keeps a colon that belongs to the password', () => {
    const { url, auth } = extractAuthFromUrl(
      'https://user:pa:ss:word@github.com/owner/repo.git'
    )
    expect(url).toEqual('https://github.com/owner/repo.git')
    expect(auth).toEqual({ username: 'user', password: 'pa:ss:word' })
  })

  it('reads a username with no password', () => {
    const { url, auth } = extractAuthFromUrl(
      'https://token@github.com/owner/repo.git'
    )
    expect(url).toEqual('https://github.com/owner/repo.git')
    expect(auth).toEqual({ username: 'token', password: undefined })
  })

  it('reads an empty password', () => {
    const { auth } = extractAuthFromUrl(
      'https://user:@github.com/owner/repo.git'
    )
    expect(auth).toEqual({ username: 'user', password: '' })
  })

  it('reads credentials from an uppercase scheme', () => {
    const { url, auth } = extractAuthFromUrl(
      'HTTPS://user:pass@github.com/owner/repo.git'
    )
    expect(url).toEqual('HTTPS://github.com/owner/repo.git')
    expect(auth).toEqual({ username: 'user', password: 'pass' })
  })

  it('percent-decodes the credentials', () => {
    const { auth } = extractAuthFromUrl(
      'https://us%40er:100%25@github.com/owner/repo.git'
    )
    expect(auth).toEqual({ username: 'us@er', password: '100%' })
  })

  it('keeps a lone percent sign that cannot be decoded', () => {
    const { auth } = extractAuthFromUrl(
      'https://user:100%@github.com/owner/repo.git'
    )
    expect(auth).toEqual({ username: 'user', password: '100%' })
  })

  it('leaves the rest of the url exactly as written', () => {
    for (const [given, expected] of [
      [
        'https://user:pass@github.com:443/owner/repo.git',
        'https://github.com:443/owner/repo.git',
      ],
      [
        'https://user:pass@GitHub.com/owner/repo.git',
        'https://GitHub.com/owner/repo.git',
      ],
      ['https://user:pass@github.com', 'https://github.com'],
      [
        'https://user:pass@github.com/owner/repo.git?a=b#c',
        'https://github.com/owner/repo.git?a=b#c',
      ],
    ]) {
      expect(extractAuthFromUrl(given).url).toEqual(expected)
    }
  })

  it('matches what the WHATWG URL parser reads', () => {
    for (const url of [
      'https://user:pass@github.com/owner/repo.git',
      'https://user:pa:ss@github.com/owner/repo.git',
      'https://user:@github.com/owner/repo.git',
    ]) {
      const { auth } = extractAuthFromUrl(url)
      const parsed = new URL(url)
      expect(auth.username).toEqual(parsed.username)
      // The URL parser percent-encodes a colon on the way out.
      expect(auth.password).toEqual(decodeURIComponent(parsed.password))
    }
  })
})
