/* global test describe expect */
import git from '..'

describe('log', () => {
  test('HEAD', async () => {
    let commits = await git()
      .gitdir('__tests__/__fixtures__/test-log.git')
      .log('HEAD')
    expect(commits.length).toBe(5)
    expect(commits).toMatchSnapshot()
  })
  test('HEAD depth', async () => {
    let commits = await git()
      .gitdir('__tests__/__fixtures__/test-log.git')
      .depth(1)
      .log('HEAD')
    expect(commits.length).toBe(1)
  })
  test('HEAD since', async () => {
    let commits = await git()
      .gitdir('__tests__/__fixtures__/test-log.git')
      .since(new Date(1501462174000))
      .log('HEAD')
    expect(commits.length).toBe(2)
  })
  // test('test-branch', async () => {
  //   let ref = await resolveRef({
  //     gitdir: '__tests__/__fixtures__/test-resolveRef.git',
  //     ref: 'origin/test-branch'
  //   })
  //   expect(ref).toMatchSnapshot()
  // })
  // test('test-tag', async () => {
  //   let ref = await resolveRef({
  //     gitdir: '__tests__/__fixtures__/test-resolveRef.git',
  //     ref: 'test-tag'
  //   })
  //   expect(ref).toMatchSnapshot()
  // })
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
