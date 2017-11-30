/* global test describe expect */
import { GitRefManager } from '../dist/for-node/managers'
import fs from 'fs'
import { setfs } from '../dist/for-node/utils'

setfs(fs)

describe('GitRefManager', () => {
  test('1e40fdfba1cf17f3c9f9f3d6b392b1865e5147b9', async () => {
    let ref = await GitRefManager.resolve({
      gitdir: '__tests__/__fixtures__/test-GitRefManager.git',
      ref: '1e40fdfba1cf17f3c9f9f3d6b392b1865e5147b9'
    })
    expect(ref).toMatchSnapshot()
  })
  test('test-branch', async () => {
    let ref = await GitRefManager.resolve({
      gitdir: '__tests__/__fixtures__/test-GitRefManager.git',
      ref: 'origin/test-branch'
    })
    expect(ref).toMatchSnapshot()
  })
  test('test-tag', async () => {
    let ref = await GitRefManager.resolve({
      gitdir: '__tests__/__fixtures__/test-GitRefManager.git',
      ref: 'test-tag'
    })
    expect(ref).toMatchSnapshot()
  })
  test('HEAD', async () => {
    let ref = await GitRefManager.resolve({
      gitdir: '__tests__/__fixtures__/test-GitRefManager.git',
      ref: 'HEAD'
    })
    expect(ref).toMatchSnapshot()
  })
  test('HEAD depth', async () => {
    let ref = await GitRefManager.resolve({
      gitdir: '__tests__/__fixtures__/test-GitRefManager.git',
      ref: 'HEAD',
      depth: 2
    })
    expect(ref).toMatchSnapshot()
  })
  test('packed-refs', async () => {
    let ref = await GitRefManager.resolve({
      gitdir: '__tests__/__fixtures__/test-GitRefManager.git',
      ref: 'v0.0.1'
    })
    expect(ref).toMatchSnapshot()
  })
})
