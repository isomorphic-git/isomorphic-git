const {execSync} = require('child_process')
const path = require('path')

if (!process.env.TRAVIS_PULL_REQUEST_SHA) {
  // Azure
  if (process.env.BUILD_REPOSITORY_LOCALPATH) {
    // (Trying not to rely on isomorphic-git here since that's the thing being tested.)
    let GIT_DIR = path.join(process.env.BUILD_REPOSITORY_LOCALPATH, '.git')
    console.log('Hoping GIT_DIR is', GIT_DIR)
    console.log('Alternative GIT_DIR:', path.join(process.env.BUILD_SOURCESDIRECTORY || '', '.git'))
    let parents = execSync('git log --pretty=%P -n 1', {
      env: { GIT_DIR },
      encoding: 'utf8'
    }).split(' ').map(x => x.trim())
    console.log('***PARENTS***', parents)
    // parents[0] === master branch
    // parents[1] === pr branch
    process.env.TRAVIS_PULL_REQUEST_SHA = parents[1]
  }
}
