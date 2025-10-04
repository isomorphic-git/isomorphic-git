import replace from 'replace-in-file'

import { Errors } from '../..'

const errors = Object.keys(Errors).map(name => `E.${name}`)
const bal = []

;(async () => {
  for (const error of errors) {
    // @ts-ignore
    let files = await replace({
      files: ['src/**/*.js'],
      from: error,
      to: 'foo',
      dry: true,
      countMatches: true,
    })
    // @ts-ignore
    files = files.filter(file => file.numMatches > 0).map(file => file.file)
    // console.log(`${error}: ${files.length}`)
    if (files.length > 0) {
      bal.push(`${files.length} ${error}`)
    }
  }
  bal.sort()
  console.log(bal.join('\n'))
})()
