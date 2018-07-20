const fs = require('fs')
const path = require('path')
const util = require('util')
const { walk, WORKDIR, TREE, STAGE } = require('..')

async function main () {
  const trees = [TREE('HEAD'), STAGE, WORKDIR]
  let results = await walk({fs, dir: path.resolve(__dirname, '..'), trees})
  console.table(results)
}

main()
