---
title: readNote
sidebar_label: readNote
id: version-1.x-readNote
original_id: readNote
---

Read the contents of a note

| param          | type [= default]          | description                                            |
| -------------- | ------------------------- | ------------------------------------------------------ |
| [**fs**](./fs) | FsClient                  | a file system client                                   |
| dir            | string                    | The [working tree](dir-vs-gitdir.md) directory path    |
| **gitdir**     | string = join(dir,'.git') | The [git directory](dir-vs-gitdir.md) path             |
| ref            | string                    | The notes ref to look under                            |
| **oid**        | string                    | The SHA-1 object id of the object to get the note for. |
| cache          | object                    | a [cache](cache.md) object                             |
| return         | Promise\<Uint8Array\>     | Resolves successfully with note contents as a Buffer.  |


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
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/api/readNote.js';
  }
})();
</script>