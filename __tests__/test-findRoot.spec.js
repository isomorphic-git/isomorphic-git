/* global jasmine jest describe it expect */
const path = require('path')
const fs = require('fs')
const { findRoot } = require('..')

const dir = '.'

// TODO: Make a fixture and test in browser
xdescribe('findRoot', () => {
  it('__dirname', async () => {
    let root = await findRoot({
      fs,
      dir,
      filepath: __dirname
    })
    expect(path.basename(root)).toBe('isomorphic-git')
  })
  it('.', async () => {
    let root = await findRoot({
      fs,
      dir,
      filepath: path.resolve('.')
    })
    expect(path.basename(root)).toBe('isomorphic-git')
  })
  it('..', async () => {
    try {
      var root = await findRoot({
        fs,
        dir,
        filepath: path.resolve('..')
      })
    } catch (err) {}
    expect(root).not.toBeDefined()
  })
})
