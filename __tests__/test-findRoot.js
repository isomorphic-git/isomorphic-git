/* global test describe expect */
import path from 'path'
import fs from 'fs'
import { findRoot } from 'isomorphic-git'

const dir = '.'

/** @test {findRoot} */
describe('findRoot', () => {
  it('__dirname', async () => {
    let repo = { fs, dir }
    let root = await findRoot({ ...repo, filepath: __dirname })
    expect(path.basename(root)).toBe('isomorphic-git')
  })
  it('.', async () => {
    let repo = { fs, dir }
    let root = await findRoot({ ...repo, filepath: path.resolve('.') })
    expect(path.basename(root)).toBe('isomorphic-git')
  })
  it('..', async () => {
    let repo = { fs, dir }
    try {
      var root = await findRoot({ ...repo, filepath: path.resolve('..') })
    } catch (err) {}
    expect(root).not.toBeDefined()
  })
})
