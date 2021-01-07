---
title: findMergeBase
sidebar_label: findMergeBase
id: version-1.x-findMergeBase
original_id: findMergeBase
---

Find the merge base for a set of commits

| param          | type [= default]          | description                                         |
| -------------- | ------------------------- | --------------------------------------------------- |
| [**fs**](./fs) | FsClient                  | a file system client                                |
| dir            | string                    | The [working tree](dir-vs-gitdir.md) directory path |
| **gitdir**     | string = join(dir,'.git') | The [git directory](dir-vs-gitdir.md) path          |
| **oids**       | Array\<string\>           | Which commits                                       |
| cache          | object                    | a [cache](cache.md) object                          |


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
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/api/findMergeBase.js';
  }
})();
</script>