/* global test describe expect */
import fs from 'fs'
import { createClass } from '../dist/for-node/utils'
import { log } from '../dist/for-node/commands'

const Git = createClass({ log })

describe('log', () => {
  test('HEAD', async () => {
    let gitdir = '__tests__/__fixtures__/test-log.git'
    let repo = new Git({ fs, gitdir })
    let commits = await repo.log({ ref: 'HEAD' })
    expect(commits.length).toBe(5)
    expect(commits).toMatchSnapshot()
  })
  test('HEAD depth', async () => {
    let gitdir = '__tests__/__fixtures__/test-log.git'
    let repo = new Git({ fs, gitdir })
    let commits = await repo.log({ ref: 'HEAD', depth: 1 })
    expect(commits.length).toBe(1)
  })
  test('HEAD since', async () => {
    let gitdir = '__tests__/__fixtures__/test-log.git'
    let repo = new Git({ fs, gitdir })
    let commits = await repo.log({
      ref: 'HEAD',
      since: new Date(1501462174000)
    })
    expect(commits.length).toBe(2)
  })
  test('test-branch', async () => {
    let gitdir = '__tests__/__fixtures__/test-GitRefManager.git'
    let repo = new Git({ fs, gitdir })
    let commits = await repo.log({ ref: 'origin/test-branch' })
    expect(commits).toMatchSnapshot()
  })
})
