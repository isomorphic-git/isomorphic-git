const fs = require('fs')
const path = require('path')
const util = require('util')
const { walk, WORKDIR, TREE, STAGE } = require('..')

async function main () {
  let results = await walk({
    fs,
    dir: path.resolve(__dirname, '..'),
    trees: [TREE('HEAD'), WORKDIR, STAGE],
    mapBlob: async function ([head, workdir, stage]) {
      let H, W, S = 0
      // First order approximation
      if (head !== null) H = 1
      if (workdir !== null) W = 2
      if (stage !== null) S = 3
      // Second order approximation
      if (workdir && stage) {
        await workdir.populateStat()
        if (compareStats(workdir, stage)) {
          await workdir.populateHash()
        } else {
          workdir.oid = stage.oid
        }
      }
      if (head && workdir && head.oid === workdir.oid) W = H
      if (head && stage && head.oid === stage.oid) S = H
      if (workdir && stage && workdir.oid === stage.oid) S = W
      return [H, W, S]
    }
  })
  console.table(results)
}

main()
