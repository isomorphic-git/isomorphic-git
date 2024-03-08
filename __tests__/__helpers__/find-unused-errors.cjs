const { replaceInFile } = require('replace-in-file')

const E = require('../..')

const errors = Object.keys(E).map(name => `E.${name}`)
const bal = []

;(async () => {
  for (const error of errors) {
    const files = await replaceInFile({
      files: ['src/**/*.js'],
      from: error,
      to: 'foo',
      dry: true,
      countMatches: true,
    })
    const filteredFiles = files
      .filter(file => file.numMatches !== undefined && file.numMatches > 0)
      .map(file => file.file)

    // console.log(`${error}: ${files.length}`)
    if (filteredFiles.length > 0) {
      bal.push(`${files.length} ${error}`)
    }
  }
  bal.sort()
  console.log(bal.join('\n'))
})()
