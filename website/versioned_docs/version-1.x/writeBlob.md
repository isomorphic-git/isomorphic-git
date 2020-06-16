---
title: writeBlob
sidebar_label: writeBlob
id: version-1.x-writeBlob
original_id: writeBlob
---

Write a blob object directly

| param          | type [= default]          | description                                                                |
| -------------- | ------------------------- | -------------------------------------------------------------------------- |
| [**fs**](./fs) | FsClient                  | a file system client                                                       |
| dir            | string                    | The [working tree](dir-vs-gitdir.md) directory path                        |
| **gitdir**     | string = join(dir,'.git') | The [git directory](dir-vs-gitdir.md) path                                 |
| **blob**       | Uint8Array                | The blob object to write                                                   |
| return         | Promise\<string\>         | Resolves successfully with the SHA-1 object id of the newly written object |

Example Code:

```js live
// Manually create a blob.
let oid = await git.writeBlob({
  fs,
  dir: '/tutorial',
  blob: new Uint8Array([])
})

console.log('oid', oid) // should be 'e69de29bb2d1d6434b8b29ae775ad8c2e48c5391'
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
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/api/writeBlob.js';
  }
})();
</script>