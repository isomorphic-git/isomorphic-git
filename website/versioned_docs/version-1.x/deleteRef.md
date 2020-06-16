---
title: deleteRef
sidebar_label: deleteRef
id: version-1.x-deleteRef
original_id: deleteRef
---

Delete a local ref

| param          | type [= default]          | description                                                   |
| -------------- | ------------------------- | ------------------------------------------------------------- |
| [**fs**](./fs) | FsClient                  | a file system implementation                                  |
| dir            | string                    | The [working tree](dir-vs-gitdir.md) directory path           |
| **gitdir**     | string = join(dir,'.git') | The [git directory](dir-vs-gitdir.md) path                    |
| **ref**        | string                    | The ref to delete                                             |
| return         | Promise\<void\>           | Resolves successfully when filesystem operations are complete |

Example Code:

```js live
await git.deleteRef({ fs, dir: '/tutorial', ref: 'refs/tags/test-tag' })
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
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/api/deleteRef.js';
  }
})();
</script>