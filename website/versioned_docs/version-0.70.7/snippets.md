---
title: Useful Code Snippets
sidebar_label: Useful Snippets
id: version-0.70.7-snippets
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
            // isomorphic-git may report a changed file as unmodified, so always add if not removing
            worktreeStatus ? git.add({ ...repo, filepath }) : git.remove({ ...repo, filepath })
        );
    );
);
```

## Use native git credential manager

Adapted from the [Antora docs](https://gitlab.com/antora/antora/blob/master/docs/modules/playbook/pages/private-repository-auth.adoc):

```js
const git = require('isomorphic-git')
const { spawn } = require('child_process')
const { URL } = require('url')

const systemGitCredentialManager = {
  async fill ({ url }) {
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
  },
  async approved ({ url }) {},
  async rejected ({ url, auth }) {
    const data = { statusCode: 401, statusMessage: 'HTTP Basic: Access Denied' }
    const err = new Error(`HTTP Error: ${data.statusCode} ${data.statusMessage}`)
    err.name = err.code = 'HTTPError'
    err.data = data
    err.rejected = !!auth
    throw err
  },
}

git.plugins.set('credentialManager', systemGitCredentialManager)
```

## GitHub Pages deploy script
```js
// website/scripts/deploy-gh-pages.js
const path = require('path')
const fs = require('fs')
const git = require('isomorphic-git')
git.plugins.set('fs', fs)

// PARAMETERS - CHANGE THESE FOR YOUR CODE
let url = 'https://github.com/isomorphic-git/isomorphic-git.github.io'
let sourceDir = path.join(__dirname, '../..')
let buildDir = path.join(sourceDir, 'website/build/isomorphic-git.github.io')

;(async () => {
  dir = sourceDir
  let commit = await git.log({ dir, depth: 1 })
  commit = commit[0]
  let message = commit.message

  dir = buildDir
  await git.init({ dir })
  await git.addRemote({ dir, url, remote: 'origin' })
  await git.fetch({ dir, ref: 'master', depth: 1 })
  await git.checkout({ dir, ref: 'master', noCheckout: true })
  await git.add({ dir, filepath: '.' })
  await git.commit({ dir, author: commit.author, message: commit.message })
  await git.push({ dir, oauth2format: 'github', token: process.env.GITHUB_TOKEN })
})()
```

## git log -- path/to/file
```js
const git = require('.')
git.plugins.set('fs', require('fs'))

// PARAMETERS - CHANGE THESE FOR YOUR CODE
const dir = '.'
const filepath = 'path/to/file'

;(async () => {
  let commits = await git.log({dir: '.'})
  let lastSHA = null
  let lastCommit = null
  let commitsThatMatter = []
  for (let commit of commits) {
    try {
      let o = await git.readObject({ dir, oid: commit.oid, filepath })
      if (o.oid !== lastSHA) {
        if (lastSHA !== null) commitsThatMatter.push(lastCommit)
        lastSHA = o.oid
      }
    } catch (err) {
      // file no longer there
      commitsThatMatter.push(lastCommit)
      break;
    }
    lastCommit = commit
  }
  console.log(commitsThatMatter)
})()
```

## git diff --name-status \<commitHash1\> \<commitHash2\>
Adapted from [GitViz](https://github.com/kpj/GitViz/blob/83dfc65624f5dae41ffb9e8a97d2ee61512c1365/src/git-handler.js) by @kpj
```js
async function getFileStateChanges (commitHash1, commitHash2, dir) {
  return git.walkBeta1({
    trees: [
      git.TREE({ dir: dir, ref: commitHash1 }),
      git.TREE({ dir: dir, ref: commitHash2 })
    ],
    map: async function ([A, B]) {
      // ignore directories
      if (A.fullpath === '.') {
        return
      }
      await A.populateStat()
      if (A.type === 'tree') {
        return
      }
      await B.populateStat()
      if (B.type === 'tree') {
        return
      }

      // generate ids
      await A.populateHash()
      await B.populateHash()

      // determine modification type
      let type = 'equal'
      if (A.oid !== B.oid) {
        type = 'modify'
      }
      if (A.oid === undefined) {
        type = 'add'
      }
      if (B.oid === undefined) {
        type = 'remove'
      }
      if (A.oid === undefined && B.oid === undefined) {
        console.log('Something weird happened:')
        console.log(A)
        console.log(B)
      }

      return {
        path: `/${A.fullpath}`,
        type: type
      }
    }
  })
}
```
