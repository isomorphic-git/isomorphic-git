#! /usr/bin/env node
// forked from https://github.com/jvilk/BrowserFS/blob/master/scripts/make_http_index.ts
var fs = require('fs')
var path = require('path')

var superblocktxt = require('@isomorphic-git/lightning-fs/src/superblocktxt.js')
var symLinks = {}

function rdSync(dpath, tree, name) {
  var files = fs.readdirSync(dpath)
  files.forEach(function(file) {
    var fpath = dpath + '/' + file
    try {
      // Avoid infinite loops.
      var lstat = fs.lstatSync(fpath)
      if (lstat.isSymbolicLink()) {
        if (!symLinks[lstat.dev]) {
          symLinks[lstat.dev] = {}
        }
        // Ignore if we've seen it before
        if (symLinks[lstat.dev][lstat.ino]) {
          return
        }
        symLinks[lstat.dev][lstat.ino] = true
      }
      var fstat = fs.statSync(fpath)
      if (fstat.isDirectory()) {
        var child = (tree[file] = {})
        rdSync(fpath, child, file)
      } else {
        tree[file] = null
      }
    } catch (e) {
      // Ignore and move on.
    }
  })
  return tree
}
var fsListing = JSON.stringify(
  rdSync(path.join(__dirname, '..', '__fixtures__'), {}, '/')
)
fs.writeFileSync(
  path.join(__dirname, '..', '__fixtures__', 'index.json'),
  fsListing,
  { encoding: 'utf8' }
)

fs.writeFileSync(
  path.join(__dirname, '..', '__fixtures__', '.superblock.txt'),
  superblocktxt(path.join(__dirname, '..', '__fixtures__')),
  { encoding: 'utf8' }
)
