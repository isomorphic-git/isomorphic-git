---
title: writeCommit
sidebar_label: writeCommit
id: version-1.x-writeCommit
original_id: writeCommit
---

Write a commit object directly

| param          | type [= default]          | description                                                                |
| -------------- | ------------------------- | -------------------------------------------------------------------------- |
| [**fs**](./fs) | FsClient                  | a file system client                                                       |
| dir            | string                    | The [working tree](dir-vs-gitdir.md) directory path                        |
| **gitdir**     | string = join(dir,'.git') | The [git directory](dir-vs-gitdir.md) path                                 |
| **commit**     | CommitObject              | The object to write                                                        |
| return         | Promise\<string\>         | Resolves successfully with the SHA-1 object id of the newly written object |

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
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/api/writeCommit.js';
  }
})();
</script>