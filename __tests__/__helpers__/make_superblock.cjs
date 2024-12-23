#! /usr/bin/env node

var fs = require('fs')
var path = require('path')

var superblocktxt = require('@isomorphic-git/lightning-fs/src/superblocktxt.js')

fs.writeFileSync(
  path.join(__dirname, '..', '__fixtures__', '.superblock.txt'),
  superblocktxt(path.join(__dirname, '..', '__fixtures__')),
  { encoding: 'utf8' }
)
