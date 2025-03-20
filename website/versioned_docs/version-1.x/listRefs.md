---
title: listRefs
sidebar_label: listRefs
id: version-1.x-listRefs
original_id: listRefs
---

List refs

| param          | type [= default]           | description                                                                    |
| -------------- | -------------------------- | ------------------------------------------------------------------------------ |
| [**fs**](./fs) | FsClient                   | a file system client                                                           |
| dir            | string                     | The [working tree](dir-vs-gitdir.md) directory path                            |
| **gitdir**     | string = join(dir,'.git')  | The [git directory](dir-vs-gitdir.md) path                                     |
| **filepath**   | string                     | The refs path to list                                                          |
| return         | Promise\<Array\<string\>\> | Resolves successfully with an array of ref names below the supplied `filepath` |

Example Code:

```js live
let refs = await git.listRefs({ fs, dir: '/tutorial', filepath: 'refs/heads' })
console.log(refs)
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
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/api/listRefs.js';
  }
})();
</script>