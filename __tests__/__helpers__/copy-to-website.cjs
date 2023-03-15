const join = require('path').join

const decompress = require('decompress')
const rmrf = require('rimraf')

const dest = 'website/static/js/isomorphic-git'

rmrf(join(__dirname, '..', '..', dest), async () => {
  await decompress(
    join(__dirname, '..', '..', 'isomorphic-git-0.0.0-development.tgz'),
    join(__dirname, '..', '..', dest),
    {
      strip: 1,
    }
  )
  console.log(`extracted tarball to ${dest}`)
})
