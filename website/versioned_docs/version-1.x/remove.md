---
title: remove
sidebar_label: remove
id: version-1.x-remove
original_id: remove
---

Remove a file from the git index (aka staging area)

| param          | type [= default]           | description                                               |
| -------------- | -------------------------- | --------------------------------------------------------- |
| [**fs**](./fs) | FsClient                   | a file system client                                      |
| dir            | string                     | The [working tree](dir-vs-gitdir.md) directory path       |
| **gitdir**     | string = join(dir, '.git') | The [git directory](dir-vs-gitdir.md) path                |
| **filepath**   | string                     | The path to the file to remove from the index             |
| cache          | object                     | a [cache](cache.md) object                                |
| return         | Promise\<void\>            | Resolves successfully once the git index has been updated |

Note that this does NOT delete the file in the working directory.

Example Code:

```js live
await git.remove({ fs, dir: '/tutorial', filepath: 'README.md' })
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
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/api/remove.js';
  }
})();
</script>