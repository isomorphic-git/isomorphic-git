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

class FixedSizeWindow {
  constructor(limit) {
    this.items = []
    this.sizes = []
    this.size = 0
    this.limit = limit
  }

  push(item, size) {
    while (this.items.length > 0 && this.size + size > this.limit) {
      this.items.shift()
      this.size -= this.sizes.shift()
    }

    this.items.push(item)
    this.sizes.push(size)
    this.size += size
  }

  [Symbol.iterator]() {
    return this.items[Symbol.iterator]()
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

const { readObject, packObjects } = require('./index.cjs')
const {
  FileSystem,
  createDelta,
  indexDelta,
  listPackIndex,
  listObjects,
} = require('./internal-apis.cjs')

const _fs = new FileSystem(fs)

const dir = './benchmark/test-benchmark-createDelta'
const gitdir = './benchmark/test-benchmark-createDelta.git'

const indexTimer = new Timer('indexing')
const searchTimer = new Timer('searching')

;(async () => {
  // console.time('listPackIndex')
  // const { oids } = await listPackIndex({
  //   fs,
  //   dir,
  //   filepath: 'pack-993dc0e5e915d97e3d5b07e5148e6e4a9044a157.idx',
  // })
  // console.timeEnd('listPackIndex')
  // const total = oids.length
  // console.log(`total = ${total}`)

  console.time('listObjects')
  const oids = [
    ...(await listObjects({
      fs: _fs,
      gitdir,
      oids: ['55f2ade6fb738e512a404fe05e437295016d2a24'],
    })),
  ]
  console.timeEnd('listObjects')
  const total = oids.length
  console.log(`total = ${total}`)
  console.time('indexAll')
  let size = 0
  let oldp = 0
  let i = 0
  let prev = null
  let wins = 0
  let loss = 0
  let saved = 0
  const window = new FixedSizeWindow(8819095)
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
    searchTimer.start()
    let best = object
    console.log(object.length)
    for (const { prev, index } of window) {
      const delta = createDelta(object, prev, index)
      if (delta.length < best.length) {
        best = delta
      }
    }
    if (best.length < object.length) {
      wins++
      saved += object.length - best.length
    } else {
      loss++
    }
    searchTimer.stop()
    prev = object
    indexTimer.start()
    const index = indexDelta(prev)
    window.push({ index, prev }, prev.length)
    console.log(`window.items.length = ${window.items.length}`)
    indexTimer.stop()
  }
  searchTimer.log()
  indexTimer.log()
  console.timeEnd('indexAll')
  console.log(`size = ${size}`)
  console.log(`wins = ${wins} loss = ${loss}`)
  console.log(`saved = ${saved}`)
  console.time('packObjects')
  const { packfile } = await packObjects({
    fs,
    gitdir,
    oids,
  })
  console.timeEnd('packObjects')
  console.log(`packfile.length = ${packfile.length}`)
})()
