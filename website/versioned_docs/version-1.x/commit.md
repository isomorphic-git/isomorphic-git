---
title: commit
sidebar_label: commit
id: version-1.x-commit
original_id: commit
---

Create a new commit

| param                    | type [= default]                     | description                                                                                                                                                                                          |
| ------------------------ | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [**fs**](./fs)           | FsClient                             | a file system implementation                                                                                                                                                                         |
| [onSign](./onSign)       | SignCallback                         | a PGP signing implementation                                                                                                                                                                         |
| dir                      | string                               | The [working tree](dir-vs-gitdir.md) directory path                                                                                                                                                  |
| **gitdir**               | string = join(dir,'.git')            | The [git directory](dir-vs-gitdir.md) path                                                                                                                                                           |
| message                  | string                               | The commit message to use. Required, unless `amend === true`                                                                                                                                         |
| author                   | Object                               | The details about the author.                                                                                                                                                                        |
| author.name              | string                               | Default is `user.name` config.                                                                                                                                                                       |
| author.email             | string                               | Default is `user.email` config.                                                                                                                                                                      |
| author.timestamp         | number = Math.floor(Date.now()/1000) | Set the author timestamp field. This is the integer number of seconds since the Unix epoch (1970-01-01 00:00:00).                                                                                    |
| author.timezoneOffset    | number                               | Set the author timezone offset field. This is the difference, in minutes, from the current timezone to UTC. Default is `(new Date()).getTimezoneOffset()`.                                           |
| committer                | Object = author                      | The details about the commit committer, in the same format as the author parameter. If not specified, the author details are used.                                                                   |
| committer.name           | string                               | Default is `user.name` config.                                                                                                                                                                       |
| committer.email          | string                               | Default is `user.email` config.                                                                                                                                                                      |
| committer.timestamp      | number = Math.floor(Date.now()/1000) | Set the committer timestamp field. This is the integer number of seconds since the Unix epoch (1970-01-01 00:00:00).                                                                                 |
| committer.timezoneOffset | number                               | Set the committer timezone offset field. This is the difference, in minutes, from the current timezone to UTC. Default is `(new Date()).getTimezoneOffset()`.                                        |
| signingKey               | string                               | Sign the tag object using this private PGP key.                                                                                                                                                      |
| amend                    | boolean = false                      | If true, replaces the last commit pointed to by `ref` with a new commit.                                                                                                                             |
| dryRun                   | boolean = false                      | If true, simulates making a commit so you can test whether it would succeed. Implies `noUpdateBranch`.                                                                                               |
| noUpdateBranch           | boolean = false                      | If true, does not update the branch pointer after creating the commit.                                                                                                                               |
| ref                      | string                               | The fully expanded name of the branch to commit to. Default is the current branch pointed to by HEAD. (TODO: fix it so it can expand branch names without throwing if the branch doesn't exist yet.) |
| parent                   | Array\<string\>                      | The SHA-1 object ids of the commits to use as parents. If not specified, the commit pointed to by `ref` is used.                                                                                     |
| tree                     | string                               | The SHA-1 object id of the tree to use. If not specified, a new tree object is created from the current git index.                                                                                   |
| cache                    | object                               | a [cache](cache.md) object                                                                                                                                                                           |
| return                   | Promise\<string\>                    | Resolves successfully with the SHA-1 object id of the newly created commit.                                                                                                                          |

Example Code:

```js live
let sha = await git.commit({
  fs,
  dir: '/tutorial',
  author: {
    name: 'Mr. Test',
    email: 'mrtest@example.com',
  },
  message: 'Added the a.txt file'
})
console.log(sha)
```


---

<details>
<summary><i>Tip: If you need a clean slate, expand and run this snippet to clean up the file system.</i></summary>

```js live
window.fs = new LightningFS('fs', { wipe: true })
window.pfs = window.fs.promises
console.log('done')
```
</details>

<script>
(function rewriteEditLink() {
  const el = document.querySelector('a.edit-page-link.button');
  if (el) {
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/api/commit.js';
  }
})();
</script>