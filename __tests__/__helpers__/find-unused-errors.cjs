const { E } = require('../..')
const replace = require('replace-in-file')

const errors = Object.keys(E).map(name => `E.${name}`)
const bal = []

;(async () => {
  for (const error of errors) {
    let files = await replace({
      files: ['src/**/*.js'],
      from: error,
      to: 'foo',
      dry: true,
      countMatches: true,
    })
    files = files.filter(file => file.numMatches > 0).map(file => file.file)
    // console.log(`${error}: ${files.length}`)
    if (files.length > 0) {
      bal.push(`${files.length} ${error}`)
    }
  }
  bal.sort()
  console.log(bal.join('\n'))
})()
