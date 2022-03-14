const path = require('path')
const fs = require('fs')
const git = require('isomorphic-git')
git.plugins.set('fs', fs)

let dir = path.join(__dirname, '../..')

;(async () => {
  let commit = await git.log({ dir, depth: 1 })
  commit = commit[0]
  let message = commit.message

  dir = path.join(dir, 'website/build/isomorphic-git.github.io')

  await git.init({ dir })
  await git.addRemote({
    dir,
    remote: 'origin',
    url: 'https://github.com/isomorphic-git/isomorphic-git.github.io'
  })
  await git.fetch({
    dir,
    depth: 1,
    ref: 'main'
  })
  await git.checkout({
    dir,
    ref: 'main',
    noCheckout: true
  })
  await git.add({
    dir,
    filepath: '.'
  })
  await git.commit({
    dir,
    author: commit.author,
    message: commit.message,
    committer: {
      name: 'isomorphic-git-bot',
      email: 'wmhilton+isomorphic-git-bot@gmail.com',
    }
  })
  await git.push({
    dir,
    oauth2format: 'github',
    token: process.env.GITHUB_TOKEN
  })
})()
