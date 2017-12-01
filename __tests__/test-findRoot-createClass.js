/* global test describe expect */
import path from 'path'
import fs from 'fs'
import { createClass } from '../dist/for-node/utils'
import { findRoot } from '../dist/for-node/commands'

const Git = createClass({ findRoot })
const dir = '.'

describe('createClass.findRoot', () => {
  test('__dirname', async () => {
    let git = new Git({ fs, dir })
    let root = await git.findRoot({ filepath: __dirname })
    expect(path.basename(root)).toBe('isomorphic-git')
  })
  test('.', async () => {
    let git = new Git({ fs, dir })
    let root = await git.findRoot({ filepath: path.resolve('.') })
    expect(path.basename(root)).toBe('isomorphic-git')
  })
  test('..', async () => {
    let git = new Git({ fs, dir })
    let root = git.findRoot({ filepath: path.resolve('..') })
    expect(root).rejects.toBeDefined
  })
})
