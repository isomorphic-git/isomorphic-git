/* global jest test describe expect */
import path from 'path'
import fs from 'fs'
import { Git } from '..'

describe('findRoot', () => {
  test('__dirname', async () => {
    let git = new Git({ fs })
    let root = await git.findRoot(__dirname)
    expect(path.basename(root)).toBe('isomorphic-git')
  })
  test('.', async () => {
    let git = new Git({ fs })
    let root = await git.findRoot(path.resolve('.'))
    expect(path.basename(root)).toBe('isomorphic-git')
  })
  test('..', async () => {
    let git = new Git({ fs })
    let root = git.findRoot(path.resolve('..'))
    expect(root).rejects.toBeDefined
  })
})
