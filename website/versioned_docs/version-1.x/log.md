---
title: log
sidebar_label: log
id: version-1.x-log
original_id: log
---

Get commit descriptions from the git history

| param          | type [= default]                     | description                                                                                             |
| -------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| [**fs**](./fs) | FsClient                             | a file system client                                                                                    |
| dir            | string                               | The [working tree](dir-vs-gitdir.md) directory path                                                     |
| **gitdir**     | string = join(dir,'.git')            | The [git directory](dir-vs-gitdir.md) path                                                              |
| filepath       | string                               | optional get the commit for the filepath only                                                           |
| ref            | string = 'HEAD'                      | The commit to begin walking backwards through the history from                                          |
| depth          | number                               | Limit the number of commits returned. No limit by default.                                              |
| since          | Date                                 | Return history newer than the given date. Can be combined with `depth` to get whichever is shorter.     |
| force          | boolean = false                      | do not throw error if filepath is not exist (works only for a single file). defaults to false           |
| follow         | boolean = false                      | Continue listing the history of a file beyond renames (works only for a single file). defaults to false |
| cache          | object                               | a [cache](cache.md) object                                                                              |
| return         | Promise\<Array\<ReadCommitResult\>\> | Resolves to an array of ReadCommitResult objects                                                        |

```ts
type ReadCommitResult = {
  oid: string; // SHA-1 object id of this commit
  commit: CommitObject; // the parsed commit object
  payload: string; // PGP signing payload
}
```

A git commit object.

```ts
type CommitObject = {
  message: string; // Commit message
  tree: string; // SHA-1 object id of corresponding file tree
  parent: Array<string>; // an array of zero or more SHA-1 object ids
  author: {
    name: string; // The author's name
    email: string; // The author's email
    timestamp: number; // UTC Unix timestamp in seconds
    timezoneOffset: number; // Timezone difference from UTC in minutes
  };
  committer: {
    name: string; // The committer's name
    email: string; // The committer's email
    timestamp: number; // UTC Unix timestamp in seconds
    timezoneOffset: number; // Timezone difference from UTC in minutes
  };
  gpgsig?: string; // PGP signature (if present)
}
```

Example Code:

```js live
let commits = await git.log({
  fs,
  dir: '/tutorial',
  depth: 5,
  ref: 'main'
})
console.log(commits)
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
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/api/log.js';
  }
})();
</script>