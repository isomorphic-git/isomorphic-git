---
title: readCommit
sidebar_label: readCommit
id: version-1.x-readCommit
original_id: readCommit
---

Read a commit object directly

| param          | type [= default]            | description                                            |
| -------------- | --------------------------- | ------------------------------------------------------ |
| [**fs**](./fs) | FsClient                    | a file system client                                   |
| dir            | string                      | The [working tree](dir-vs-gitdir.md) directory path    |
| **gitdir**     | string = join(dir,'.git')   | The [git directory](dir-vs-gitdir.md) path             |
| **oid**        | string                      | The SHA-1 object id to get. Annotated tags are peeled. |
| cache          | object                      | a [cache](cache.md) object                             |
| return         | Promise\<ReadCommitResult\> | Resolves successfully with a git commit object         |

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
// Read a commit object
let sha = await git.resolveRef({ fs, dir: '/tutorial', ref: 'main' })
console.log(sha)
let commit = await git.readCommit({ fs, dir: '/tutorial', oid: sha })
console.log(commit)
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
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/api/readCommit.js';
  }
})();
</script>