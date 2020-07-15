---
title: getRemoteTrackingBranch
sidebar_label: getRemoteTrackingBranch
id: version-1.x-getRemoteTrackingBranch
original_id: getRemoteTrackingBranch
---

Find the tracked branch associated with a local branch

| param          | type [= default]          | description                                         |
| -------------- | ------------------------- | --------------------------------------------------- |
| [**fs**](./fs) | FsClient                  | a file system implementation                        |
| dir            | string                    | The [working tree](dir-vs-gitdir.md) directory path |
| **gitdir**     | string = join(dir,'.git') | The [git directory](dir-vs-gitdir.md) path          |
| **ref**        | string                    | The branch ref to find the tracking branch of       |
| return         | Promise\<string\>         | Resolves with the ref to the remote                 |

Example Code:

```js live
await git.getRemoteTrackingBranch({ fs, dir: '/tutorial', ref: 'refs/head/main' })
console.log('done')
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
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/api/getRemoteTrackingBranch.js';
  }
})();
</script>