---
title: Useful Code Snippets
sidebar_label: Useful Snippets
id: version-1.x-snippets
original_id: snippets
---

Looking for useful code snippets? Look right here! Have a useful code snippet? Add it to the collection! (Click the Edit button in the top right of the page.)

All snippets are published under the MIT License.

- [git add --no-all .](#git-add---no-all)
- [git add -A .](#git-add--a)
- [Use native git credential manager](#use-native-git-credential-manager)
- [GitHub Pages deploy script](#github-pages-deploy-script)
- [git log -- path/to/file](#git-log----pathtofile)
- [git diff --name-status \<commitHash1\> \<commitHash2\>](#git-diff---name-status-commithash1-commithash2)

## git add --no-all .

```js
const globby = require('globby');
const paths = await globby(['./**', './**/.*'], { gitignore: true });
for (const filepath of paths) {
  await git.add({ fs, dir, filepath });
}
```

## git add -A .

```js
await git.statusMatrix(repo).then((status) =>
  Promise.all(
    status.map(([filepath, , worktreeStatus]) =>
      worktreeStatus ? git.add({ ...repo, filepath }) : git.remove({ ...repo, filepath })
    )
  )
)
```

## Use native git credential manager

Adapted from the [Antora docs](https://gitlab.com/antora/antora/blob/master/docs/modules/playbook/pages/private-repository-auth.adoc):

```js
const { spawn } = require('child_process')
const { URL } = require('url')

async function onAuth (url) {
  const { protocol, host } = new URL(url)
  return new Promise((resolve, reject) => {
    const output = []
    const process = spawn('git', ['credential', 'fill'])
    process.on('close', (code) => {
      if (code) return reject(code)
      const { username, password } = output.join('\n').split('\n').reduce((acc, line) => {
        if (line.startsWith('username') || line.startsWith('password')) {
          const [ key, val ] = line.split('=')
          acc[key] = val
        }
        return acc
      }, {})
      resolve({ username, password })
    })
    process.stdout.on('data', (data) => output.push(data.toString().trim()))
    process.stdin.write(`protocol=${protocol.slice(0, -1)}\nhost=${host}\n\n`)
  })
}

await git.clone({ ...repo, onAuth })
```

## GitHub Pages deploy script
```js
// website/scripts/deploy-gh-pages.js
const path = require('path')
const fs = require('fs')
const git = require('isomorphic-git')
const http = require('isomorphic-git/http/node')

// PARAMETERS - CHANGE THESE FOR YOUR CODE
const url = 'https://github.com/isomorphic-git/isomorphic-git.github.io'
const sourceDir = path.join(__dirname, '../..')
const buildDir = path.join(sourceDir, 'website/build/isomorphic-git.github.io')

;(async () => {
  let dir = sourceDir
  const commits = await git.log({ fs, dir, depth: 1 })
  const commit = commits[0].commit

  dir = buildDir
  await git.init({ fs, dir })
  await git.addRemote({ fs, dir, url, remote: 'origin' })
  await git.fetch({ http, fs, dir, ref: 'master', depth: 1 })
  await git.checkout({ fs, dir, ref: 'master', noCheckout: true })
  await git.add({ fs, dir, filepath: '.' })
  await git.commit({ fs, dir, author: commit.author, message: commit.message })
  await git.push({
    http,
    fs,
    dir,
    onAuth: () => ({
      oauth2format: 'github',
      token: process.env.GITHUB_TOKEN,
    }),
  })
})()
```

## git log -- path/to/file
```js
const fs = require('fs')
const git = require('.')

// PARAMETERS - CHANGE THESE FOR YOUR CODE
const dir = '.'
const filepath = 'path/to/file'

;(async () => {
  const commits = await git.log({ fs, dir })
  let lastSHA = null
  let lastCommit = null
  const commitsThatMatter = []
  for (const commit of commits) {
    try {
      const o = await git.readObject({ fs, dir, oid: commit.oid, filepath })
      if (o.oid !== lastSHA) {
        if (lastSHA !== null) commitsThatMatter.push(lastCommit)
        lastSHA = o.oid
      }
    } catch (err) {
      // file no longer there
      commitsThatMatter.push(lastCommit)
      break
    }
    lastCommit = commit
  }
  console.log(commitsThatMatter)
})()
```

## git diff --name-status \<commitHash1\> \<commitHash2\>
Adapted from [GitViz](https://github.com/kpj/GitViz/blob/83dfc65624f5dae41ffb9e8a97d2ee61512c1365/src/git-handler.js) by @kpj
```js
async function getFileStateChanges(commitHash1, commitHash2, dir) {
  return git.walk({
    fs,
    dir,
    trees: [git.TREE({ ref: commitHash1 }), git.TREE({ ref: commitHash2 })],
    map: async function(filepath, [A, B]) {
      // ignore directories
      if (filepath === '.') {
        return
      }
      if ((await A.type()) === 'tree' || (await B.type()) === 'tree') {
        return
      }

      // generate ids
      const Aoid = await A.oid()
      const Boid = await B.oid()

      // determine modification type
      let type = 'equal'
      if (Aoid !== Boid) {
        type = 'modify'
      }
      if (Aoid === undefined) {
        type = 'add'
      }
      if (Boid === undefined) {
        type = 'remove'
      }
      if (Aoid === undefined && Boid === undefined) {
        console.log('Something weird happened:')
        console.log(A)
        console.log(B)
      }

      return {
        path: `/${filepath}`,
        type: type,
      }
    },
  })
}
```
