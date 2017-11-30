/* global test describe expect */
import fs from 'fs'
import { Git } from '..'

describe('log', () => {
  test('HEAD', async () => {
    let gitdir = '__tests__/__fixtures__/test-log.git'
    let repo = new Git({ fs, gitdir })
    let commits = await repo.log('HEAD')
    expect(commits.length).toBe(5)
    expect(commits).toMatchSnapshot()
  })
  test('HEAD depth', async () => {
    let gitdir = '__tests__/__fixtures__/test-log.git'
    let repo = new Git({ fs, gitdir })
    let commits = await repo.depth(1).log('HEAD')
    expect(commits.length).toBe(1)
  })
  test('HEAD since', async () => {
    let gitdir = '__tests__/__fixtures__/test-log.git'
    let repo = new Git({ fs, gitdir })
    let commits = await repo.since(new Date(1501462174000)).log('HEAD')
    expect(commits.length).toBe(2)
  })
  test('test-branch', async () => {
    let gitdir = '__tests__/__fixtures__/test-GitRefManager.git'
    let repo = new Git({ fs, gitdir })
    let commits = await repo.log('origin/test-branch')
    expect(commits).toMatchSnapshot()
  })
  // test('test-HEAD', async () => {
  //   let ref = await resolveRef({
  //     gitdir: '__tests__/__fixtures__/test-resolveRef.git',
  //     ref: 'HEAD'
  //   })
  //   expect(ref).toMatchSnapshot()
  // })
  // test('test-HEAD depth', async () => {
  //   let ref = await resolveRef({
  //     gitdir: '__tests__/__fixtures__/test-resolveRef.git',
  //     ref: 'HEAD',
  //     depth: 2
  //   })
  //   expect(ref).toMatchSnapshot()
  // })
})
