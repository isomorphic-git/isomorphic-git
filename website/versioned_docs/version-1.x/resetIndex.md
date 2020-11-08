---
title: resetIndex
sidebar_label: resetIndex
id: version-1.x-resetIndex
original_id: resetIndex
---

Reset a file in the git index (aka staging area)

| param          | type [= default]           | description                                               |
| -------------- | -------------------------- | --------------------------------------------------------- |
| [**fs**](./fs) | FsClient                   | a file system client                                      |
| dir            | string                     | The [working tree](dir-vs-gitdir.md) directory path       |
| **gitdir**     | string = join(dir, '.git') | The [git directory](dir-vs-gitdir.md) path                |
| **filepath**   | string                     | The path to the file to reset in the index                |
| ref            | string = 'HEAD'            | A ref to the commit to use                                |
| cache          | object                     | a [cache](cache.md) object                                |
| return         | Promise\<void\>            | Resolves successfully once the git index has been updated |

Note that this does NOT modify the file in the working directory.

Example Code:

```js live
await git.resetIndex({ fs, dir: '/tutorial', filepath: 'README.md' })
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
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/api/resetIndex.js';
  }
})();
</script>