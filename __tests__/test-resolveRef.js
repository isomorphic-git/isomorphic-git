/* global describe it expect */
const { makeFixture } = require('./__helpers__/FixtureFS.js')
import { resolveRef } from 'isomorphic-git'

describe('resolveRef', () => {
  it('1e40fdfba1cf17f3c9f9f3d6b392b1865e5147b9', async () => {
    const { fs, gitdir } = await makeFixture('test-resolveRef')
    const ref = await resolveRef({
      fs,
      gitdir,
      ref: '1e40fdfba1cf17f3c9f9f3d6b392b1865e5147b9'
    })
    expect(ref).toMatchSnapshot()
  })
  it('test-branch', async () => {
    const { fs, gitdir } = await makeFixture('test-resolveRef')
    const ref = await resolveRef({
      fs,
      gitdir,
      ref: 'origin/test-branch'
    })
    expect(ref).toMatchSnapshot()
  })
  it('test-tag', async () => {
    const { fs, gitdir } = await makeFixture('test-resolveRef')
    const ref = await resolveRef({
      fs,
      gitdir,
      ref: 'test-tag'
    })
    expect(ref).toMatchSnapshot()
  })
  it('HEAD', async () => {
    const { fs, gitdir } = await makeFixture('test-resolveRef')
    const ref = await resolveRef({
      fs,
      gitdir,
      ref: 'HEAD'
    })
    expect(ref).toMatchSnapshot()
  })
  it('HEAD depth', async () => {
    const { fs, gitdir } = await makeFixture('test-resolveRef')
    const ref = await resolveRef({
      fs,
      gitdir,
      ref: 'HEAD',
      depth: 2
    })
    expect(ref).toMatchSnapshot()
  })
  it('packed-refs', async () => {
    const { fs, gitdir } = await makeFixture('test-resolveRef')
    const ref = await resolveRef({
      fs,
      gitdir,
      ref: 'v0.0.1'
    })
    expect(ref).toMatchSnapshot()
  })
})
