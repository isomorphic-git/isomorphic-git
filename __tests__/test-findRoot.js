import path from 'path'
import git from '..'

describe('findRoot', () => {
  test('__dirname', async () => {
    let root = await git().findRoot(__dirname)
    expect(path.basename(root)).toBe('isomorphic-git')
  })
  test('.', async () => {
    let root = await git().findRoot(path.resolve('.'))
    expect(path.basename(root)).toBe('isomorphic-git')
  })
  test('..', async () => {
    let root = git().findRoot(path.resolve('..'))
    expect(root).rejects.toBeDefined
  })
})
