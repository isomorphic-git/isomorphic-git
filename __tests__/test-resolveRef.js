/* global test describe expect */
import { resolveRef } from '../dist/for-node/commands'

describe('resolveRef', () => {
  test('1e40fdfba1cf17f3c9f9f3d6b392b1865e5147b9', async () => {
    let ref = await resolveRef({
      gitdir: '__tests__/__fixtures__/test-resolveRef.git',
      ref: '1e40fdfba1cf17f3c9f9f3d6b392b1865e5147b9'
    })
    expect(ref).toMatchSnapshot()
  })
  test('test-branch', async () => {
    let ref = await resolveRef({
      gitdir: '__tests__/__fixtures__/test-resolveRef.git',
      ref: 'origin/test-branch'
    })
    expect(ref).toMatchSnapshot()
  })
  test('test-tag', async () => {
    let ref = await resolveRef({
      gitdir: '__tests__/__fixtures__/test-resolveRef.git',
      ref: 'test-tag'
    })
    expect(ref).toMatchSnapshot()
  })
  test('test-HEAD', async () => {
    let ref = await resolveRef({
      gitdir: '__tests__/__fixtures__/test-resolveRef.git',
      ref: 'HEAD'
    })
    expect(ref).toMatchSnapshot()
  })
  test('test-HEAD depth', async () => {
    let ref = await resolveRef({
      gitdir: '__tests__/__fixtures__/test-resolveRef.git',
      ref: 'HEAD',
      depth: 2
    })
    expect(ref).toMatchSnapshot()
  })
})
