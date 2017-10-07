const git = require('../dist/for-browserify')
const test = require('tape')
const BrowserFS = require('browserfs')
window.git = git
test('clone', t => {
  t.plan(1)
  BrowserFS.install(window)
  BrowserFS.configure({ fs: 'LocalStorage' }, function (err) {
    if (err) return t.fail(err)
    window.fs = window.require('fs')
    t.ok(window.fs, 'Loaded window.fs')
    git('.')
      .depth(1)
      .branch('master')
      .clone(
        'https://cors-buster-jfpactjnem.now.sh/github.com/wmhilton/isomorphic-git'
      )
      .then(function () {
        t.pass('clone')
      })
      .catch(t.fail)
  })
})
