const { init, add, commit } = require('../dist/bundle.umd.min.js')
const test = require('tape')
const BrowserFS = require('browserfs')

test('things do not explode', t => {
  t.plan(5)
  BrowserFS.install(window)
  BrowserFS.configure({ fs: 'InMemory' }, function (err) {
    if (err) return t.fail(err)
    var fs = window.require('fs')
    t.ok(fs, 'Loaded fs')

    init({ fs: fs, dir: '.' })
      .then(function () {
        t.pass('init')

        fs.writeFileSync('a.txt', 'Hello', 'utf8')
        add({ fs: fs, dir: '.', filepath: 'a.txt' })
          .then(function () {
            t.pass('add a.txt')

            commit({
              fs: fs,
              dir: '.',
              author: {
                name: 'Mr. Test',
                email: 'mrtest@example.com',
                timestamp: 1262356920
              },
              message: 'Initial commit'
            })
              .then(function (oid) {
                t.pass('commit')

                t.equal(
                  oid,
                  '066daf8b7c79dca893d91ce0577dfab5ace80dbc',
                  "- oid is '066daf8b7c79dca893d91ce0577dfab5ace80dbc'"
                )
              })
              .catch(t.fail)
          })
          .catch(t.fail)
      })
      .catch(t.fail)
  })
})
