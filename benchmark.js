/* eslint-env node, browser, jasmine */

const { performance } = require('perf_hooks')

class Timer {
  constructor(name) {
    this.total = 0
    this.lap = 0
    this.name = name
  }

  start() {
    this.startTime = performance.now()
  }

  stop() {
    this.stopTime = performance.now()
    this.lap = this.stopTime - this.startTime
    this.total += this.lap
  }

  log() {
    console.log(`${this.name}: ${this.total}`)
  }
}

/*
Misc:
7.4 seconds to "readObject" all the objects
  total size uncompressed would be ~248 MB
13.5 seconds to "readObject" + "indexDelta" all the objects
  so merely indexing the files would add 6 seconds to the time.
  and with my 100Mbit/s connection we can win at most 3 seconds. :/

Times:
20 seconds to run "packObjects"
  total size is ~62 MB (4x improvement over raw ~248 MB due to gzip)
cgit compressed packfile is only ~19MB (3.2x improvement over ~62MB due to xdelta)
savings is 43 MB
62 MB / (100 Mbit/s) = 4.96 seconds
19 MB / (100 Mbit/s) = 1.52 seconds

so at BEST we'd be doing a push in 22 seconds instead of 25 seconds
unless delta compression also improves `packObjects` speed tremendously by using less memory or something.

with 10Mbit/s speeds though...

62 MB / (100 Mbit/s) = 49.6 seconds
19 MB / (100 Mbit/s) = 15.2 seconds

we'd be doing a push in 35 seconds instead of 70 seconds
funny how that happens.
*/
const fs = require('fs')

const { readBlob, readObject, packObjects } = require('./index.cjs')
const { applyDelta, createDelta, indexDelta, listPackIndex } = require('./internal-apis.cjs')

const dir = './benchmark/test-benchmark-createDelta'
const gitdir = './benchmark/test-benchmark-createDelta.git'

const indexTime = new Timer('indexing')

;(async () => {
  console.time('listPackIndex')
  const { oids } = await listPackIndex({
    fs,
    dir,
    filepath: 'pack-993dc0e5e915d97e3d5b07e5148e6e4a9044a157.idx',
  })
  console.timeEnd('listPackIndex')
  const total = oids.length
  console.log(`total = ${total}`)
  console.time('indexAll')
  let size = 0
  let oldp = 0
  let i = 0
  for (const oid of oids) {
    i++
    const newp = Math.floor((i * 100) / total)
    if (newp > oldp) console.log(`${newp}%`)
    oldp = newp
    const { object } = await readObject({
      fs,
      dir,
      gitdir,
      oid,
      format: 'deflated',
    })
    size += object.length
    indexTime.start()
    await indexDelta(object)
    indexTime.stop()
  }
  indexTime.log()
  console.timeEnd('indexAll')
  console.log(`size = ${size}`)
  console.time('packObjects')
  const { packfile } = await packObjects({
    fs,
    gitdir,
    oids,
  })
  console.timeEnd('packObjects')
  console.log(`packfile.length = ${packfile.length}`)
})()
