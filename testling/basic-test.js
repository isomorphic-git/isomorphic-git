const git = require('../dist/for-browserify.js')
const test = require('tape')

test('things do not explode', (t) => {
  t.plan(1)
  
  t.equal(1, 1)
})