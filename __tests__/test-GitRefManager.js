/* global test describe expect */
import _fs from 'fs'
import { managers, models } from '../dist/for-node/internal-apis'
const { GitRefManager } = managers
const { FileSystem } = models
const fs = new FileSystem(_fs)

describe('GitRefManager', () => {
  test('packedRefs', async () => {
    let refs = await GitRefManager.packedRefs({
      fs,
      gitdir: '__tests__/__fixtures__/test-GitRefManager.git'
    })
    expect(refs).toMatchSnapshot()
  })
  test('listRefs', async () => {
    let refs = await GitRefManager.listRefs({
      fs,
      gitdir: '__tests__/__fixtures__/test-GitRefManager.git',
      filepath: 'refs/remotes/origin'
    })
    expect(refs).toMatchSnapshot()
    refs = await GitRefManager.listRefs({
      fs,
      gitdir: '__tests__/__fixtures__/test-GitRefManager.git',
      filepath: 'refs/tags'
    })
    expect(refs).toMatchSnapshot()
  })
  test('listBranches', async () => {
    let refs = await GitRefManager.listBranches({
      fs,
      gitdir: '__tests__/__fixtures__/test-GitRefManager.git'
    })
    expect(refs).toMatchSnapshot()
    refs = await GitRefManager.listBranches({
      fs,
      gitdir: '__tests__/__fixtures__/test-GitRefManager.git',
      remote: 'origin'
    })
    expect(refs).toMatchSnapshot()
  })
  test('listTags', async () => {
    let refs = await GitRefManager.listTags({
      fs,
      gitdir: '__tests__/__fixtures__/test-GitRefManager.git'
    })
    expect(refs).toMatchSnapshot()
  })
})
