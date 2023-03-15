---
title: isDescendent
sidebar_label: isDescendent
id: version-1.x-isDescendent
original_id: isDescendent
---

Check whether a git commit is descended from another

| param          | type [= default]          | description                                                          |
| -------------- | ------------------------- | -------------------------------------------------------------------- |
| [**fs**](./fs) | FsClient                  | a file system client                                                 |
| dir            | string                    | The [working tree](dir-vs-gitdir.md) directory path                  |
| **gitdir**     | string = join(dir,'.git') | The [git directory](dir-vs-gitdir.md) path                           |
| **oid**        | string                    | The descendent commit                                                |
| **ancestor**   | string                    | The (proposed) ancestor commit                                       |
| depth          | number = -1               | Maximum depth to search before giving up. -1 means no maximum depth. |
| cache          | object                    | a [cache](cache.md) object                                           |
| return         | Promise\<boolean\>        | Resolves to true if `oid` is a descendent of `ancestor`              |

Example Code:

```js live
let oid = await git.resolveRef({ fs, dir: '/tutorial', ref: 'main' })
let ancestor = await git.resolveRef({ fs, dir: '/tutorial', ref: 'v0.20.0' })
console.log(oid, ancestor)
await git.isDescendent({ fs, dir: '/tutorial', oid, ancestor, depth: -1 })
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
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/api/isDescendent.js';
  }
})();
</script>