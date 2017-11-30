const git = require('../dist/bundle.umd.min.js')
const test = require('tape')
const BrowserFS = require('browserfs')

test('things do not explode', t => {
  t.plan(5)
  BrowserFS.install(window)
  BrowserFS.configure({ fs: 'InMemory' }, function (err) {
    if (err) return t.fail(err)
    window.fs = window.require('fs')
    t.ok(window.fs, 'Loaded window.fs')
    git.utils.setfs(window.fs)

    git('.')
      .init()
      .then(function () {
        t.pass('init')

        window.fs.writeFileSync('a.txt', 'Hello', 'utf8')
        git('.')
          .add('a.txt')
          .then(function () {
            t.pass('add a.txt')

            git('.')
              .author('Mr. Test')
              .email('mrtest@example.com')
              .timestamp(1262356920)
              .commit('Initial commit')
              .then(function (oid) {
                t.pass('commit')

                t.equal(
                  oid,
                  'fbe80a5f33d7876603767211bd6d53d3e308894e',
                  "- oid is 'fbe80a5f33d7876603767211bd6d53d3e308894e'"
                )
              })
              .catch(t.fail)
          })
          .catch(t.fail)
      })
      .catch(t.fail)
  })
})
