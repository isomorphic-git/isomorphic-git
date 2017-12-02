/* global test describe expect */
import path from 'path'
import fs from 'fs'
import { Git } from '..'
import { findRoot } from '../dist/for-node/commands'

const dir = '.'

describe('createClass.findRoot', () => {
  test('__dirname', async () => {
    let repo = new Git({ fs, dir })
    let root = await findRoot(repo, { filepath: __dirname })
    expect(path.basename(root)).toBe('isomorphic-git')
  })
  test('.', async () => {
    let repo = new Git({ fs, dir })
    let root = await findRoot(repo, { filepath: path.resolve('.') })
    expect(path.basename(root)).toBe('isomorphic-git')
  })
  test('..', async () => {
    let repo = new Git({ fs, dir })
    let root = findRoot(repo, { filepath: path.resolve('..') })
    expect(root).rejects.toBeDefined
  })
})
