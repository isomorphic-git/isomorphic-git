const { Git, clone } = require('../dist/bundle.umd.min.js')
const test = require('tape')
const BrowserFS = require('browserfs')
test('clone', t => {
  t.plan(2)
  BrowserFS.install(window)
  BrowserFS.configure({ fs: 'LocalStorage' }, async function (err) {
    if (err) return t.fail(err)
    var fs = window.require('fs')
    t.ok(fs, 'Loaded fs')
    repo = new Git({ fs: fs, dir: '.' })
    await clone(repo, {
      depth: 1,
      branch: 'master',
      url:
        'https://cors-buster-jfpactjnem.now.sh/github.com/wmhilton/isomorphic-git'
    })
    t.pass('clone')
  })
})
