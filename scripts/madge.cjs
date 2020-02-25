const path = require('path')

const madge = require('madge')

;(async () => {
  const res = await madge(path.join(__dirname, '..', 'src', 'index.js'))
  if (res.circular().length > 0) {
    console.log('circular dependencies, aborting...')
    console.log(res.circular())
    return
  }
  const graph = res.obj()

  const entrypoints = Object.keys(graph).filter(entry =>
    entry.startsWith('api/')
  )

  for (const entrypoint of entrypoints) {
    const queue = new Set()
    queue.add(entrypoint)
    for (const key of queue) {
      const deps = graph[key]
      for (const dep of deps) {
        if (!queue.has(dep)) {
          queue.add(dep)
        }
      }
    }
    const visited = [...queue]
      .filter(
        entry => entry.startsWith('errors/') && entry !== 'errors/BaseError.js'
      )
      .map(entry => entry.replace(/^errors\/(.*)\.js$/, '$1'))
    visited.sort()

    console.log(`${entrypoint} -> ${visited.join(', ')}`)
  }
})()
