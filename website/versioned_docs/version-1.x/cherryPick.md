---
title: cherryPick
sidebar_label: cherryPick
id: version-1.x-cherryPick
original_id: cherryPick
---

Cherry-pick a commit onto the current branch

| param                    | type [= default]                     | description                                                                                                                                                   |
| ------------------------ | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [**fs**](./fs)           | FsClient                             | a file system implementation                                                                                                                                  |
| dir                      | string                               | The [working tree](dir-vs-gitdir.md) directory path                                                                                                           |
| **gitdir**               | string = join(dir, '.git')           | The [git directory](dir-vs-gitdir.md) path                                                                                                                    |
| **oid**                  | string                               | The commit to cherry-pick                                                                                                                                     |
| cache                    | object                               | a [cache](cache.md) object                                                                                                                                    |
| committer                | object                               | The details about the commit committer. If not specified, uses user.name and user.email config with current timestamp.                                        |
| committer.name           | string                               | Default is `user.name` config.                                                                                                                                |
| committer.email          | string                               | Default is `user.email` config.                                                                                                                               |
| committer.timestamp      | number = Math.floor(Date.now()/1000) | Set the committer timestamp field. This is the integer number of seconds since the Unix epoch (1970-01-01 00:00:00).                                          |
| committer.timezoneOffset | number                               | Set the committer timezone offset field. This is the difference, in minutes, from the current timezone to UTC. Default is `(new Date()).getTimezoneOffset()`. |
| dryRun                   | boolean = false                      | If true, simulates cherry-picking so you can test whether it would succeed. Implies `noUpdateBranch`.                                                         |
| noUpdateBranch           | boolean = false                      | If true, does not update the branch pointer after creating the commit.                                                                                        |
| abortOnConflict          | boolean = true                       | If true, merges with conflicts will throw a `MergeConflictError`. If false, merge conflicts will leave conflict markers in the working directory and index.   |
| mergeDriver              | MergeDriverCallback                  | A custom merge driver for handling conflicts.                                                                                                                 |
| return                   | Promise\<string\>                    | Resolves successfully with the SHA-1 object id of the newly created commit                                                                                    |

Example Code:

```js live
let oid = await git.cherryPick({
  fs,
  dir: '/tutorial',
  oid: 'e10ebb90d03eaacca84de1af0a59b444232da99e'
})
console.log(oid)
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
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/api/cherryPick.js';
  }
})();
</script>