/* global test describe expect */
import fs from 'fs'
import { log } from '..'

/** @test {log} */
describe('log', () => {
  test('HEAD', async () => {
    let gitdir = '__tests__/__fixtures__/test-log.git'
    let repo = { fs, gitdir }
    let commits = await log({ ...repo, ref: 'HEAD' })
    expect(commits.length).toBe(5)
    expect(commits).toMatchSnapshot()
  })
  test('HEAD depth', async () => {
    let gitdir = '__tests__/__fixtures__/test-log.git'
    let repo = { fs, gitdir }
    let commits = await log({ ...repo, ref: 'HEAD', depth: 1 })
    expect(commits.length).toBe(1)
  })
  test('HEAD since', async () => {
    let gitdir = '__tests__/__fixtures__/test-log.git'
    let repo = { fs, gitdir }
    let commits = await log({
      ...repo,
      ref: 'HEAD',
      since: new Date(1501462174000)
    })
    expect(commits.length).toBe(2)
  })
  test('test-branch', async () => {
    let gitdir = '__tests__/__fixtures__/test-log.git'
    let repo = { fs, gitdir }
    let commits = await log({ ...repo, ref: 'origin/test-branch' })
    expect(commits).toMatchSnapshot()
  })
})
