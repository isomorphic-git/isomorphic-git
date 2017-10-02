const git = require('../dist/for-browserify.js')
const test = require('tape')
const BrowserFS = require('browserfs')
window.git = git
test('clone', t => {
  t.plan(4)
  BrowserFS.install(window)
  BrowserFS.configure({ fs: 'LocalStorage' }, function (err) {
    if (err) return t.fail(err)
    window.fs = window.require('fs')
    t.ok(window.fs, 'Loaded window.fs')
    git('.')
      .init()
      .then(function () {
        t.pass('init')

        git('.')
          .setConfig(
            'remote.origin.url',
            'https://cors-anywhere.herokuapp.com/https://github.com/wmhilton/isomorphic-git'
          )
          .then(function () {
            t.pass('add remote')

            git('.')
              .remote('origin')
              .depth(1)
              .fetch('refs/heads/master')
              .then(function () {
                t.pass('fetch')
              })
              .catch(t.fail)
          })
          .catch(t.fail)
      })
      .catch(t.fail)
  })
})
