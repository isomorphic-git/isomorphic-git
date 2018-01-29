/* global test describe expect */
import _fs from 'fs'
import { models } from '../dist/for-node/internal-apis'
import { resolveRef } from '..'
const { FileSystem } = models
const fs = new FileSystem(_fs)

describe('resolveRef', () => {
  test('1e40fdfba1cf17f3c9f9f3d6b392b1865e5147b9', async () => {
    let ref = await resolveRef({
      fs,
      gitdir: '__tests__/__fixtures__/test-resolveRef.git',
      ref: '1e40fdfba1cf17f3c9f9f3d6b392b1865e5147b9'
    })
    expect(ref).toMatchSnapshot()
  })
  test('test-branch', async () => {
    let ref = await resolveRef({
      fs,
      gitdir: '__tests__/__fixtures__/test-resolveRef.git',
      ref: 'origin/test-branch'
    })
    expect(ref).toMatchSnapshot()
  })
  test('test-tag', async () => {
    let ref = await resolveRef({
      fs,
      gitdir: '__tests__/__fixtures__/test-resolveRef.git',
      ref: 'test-tag'
    })
    expect(ref).toMatchSnapshot()
  })
  test('HEAD', async () => {
    let ref = await resolveRef({
      fs,
      gitdir: '__tests__/__fixtures__/test-resolveRef.git',
      ref: 'HEAD'
    })
    expect(ref).toMatchSnapshot()
  })
  test('HEAD depth', async () => {
    let ref = await resolveRef({
      fs,
      gitdir: '__tests__/__fixtures__/test-resolveRef.git',
      ref: 'HEAD',
      depth: 2
    })
    expect(ref).toMatchSnapshot()
  })
  test('packed-refs', async () => {
    let ref = await resolveRef({
      fs,
      gitdir: '__tests__/__fixtures__/test-resolveRef.git',
      ref: 'v0.0.1'
    })
    expect(ref).toMatchSnapshot()
  })
})
