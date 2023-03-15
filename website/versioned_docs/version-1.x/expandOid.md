---
title: expandOid
sidebar_label: expandOid
id: version-1.x-expandOid
original_id: expandOid
---

Expand and resolve a short oid into a full oid

| param          | type [= default]          | description                                                                               |
| -------------- | ------------------------- | ----------------------------------------------------------------------------------------- |
| [**fs**](./fs) | FsClient                  | a file system implementation                                                              |
| dir            | string                    | The [working tree](dir-vs-gitdir.md) directory path                                       |
| **gitdir**     | string = join(dir,'.git') | The [git directory](dir-vs-gitdir.md) path                                                |
| **oid**        | string                    | The shortened oid prefix to expand (like "0414d2a")                                       |
| cache          | object                    | a [cache](cache.md) object                                                                |
| return         | Promise\<string\>         | Resolves successfully with the full oid (like "0414d2a286d7bbc7a4a326a61c1f9f888a8ab87f") |

Example Code:

```js live
let oid = await git.expandOid({ fs, dir: '/tutorial', oid: '0414d2a'})
console.log(oid)
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
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/api/expandOid.js';
  }
})();
</script>