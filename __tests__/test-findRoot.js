/* global test describe expect */
import path from 'path'
import fs from 'fs'
import { findRoot } from '../dist/for-node/commands'

const workdir = '.'

/** @test {findRoot} */
describe('findRoot', () => {
  test('__dirname', async () => {
    let repo = { fs, workdir }
    let root = await findRoot({ ...repo, filepath: __dirname })
    expect(path.basename(root)).toBe('isomorphic-git')
  })
  test('.', async () => {
    let repo = { fs, workdir }
    let root = await findRoot({ ...repo, filepath: path.resolve('.') })
    expect(path.basename(root)).toBe('isomorphic-git')
  })
  test('..', async () => {
    let repo = { fs, workdir }
    let root = findRoot({ ...repo, filepath: path.resolve('..') })
    expect(root).rejects.toBeDefined
  })
})
