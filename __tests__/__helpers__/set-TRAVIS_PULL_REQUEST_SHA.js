const { execSync } = require('child_process')

if (!process.env.TRAVIS_PULL_REQUEST_SHA) {
  // I'm trying not to rely on isomorphic-git here since that's the thing being tested.
  const log = execSync('git log --pretty=%P -n 1', { encoding: 'utf8' })
  console.log(`git log --pretty=%P -n 1: '${log}'`)
  const parents = log.split(' ').map(x => x.trim())
  // parents[0] === master branch
  // parents[1] === pr branch
  console.log(`parents[1] = ${parents[1]}`)
  process.env.TRAVIS_PULL_REQUEST_SHA = parents[1]
}
