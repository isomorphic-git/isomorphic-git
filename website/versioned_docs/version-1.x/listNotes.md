---
title: listNotes
sidebar_label: listNotes
id: version-1.x-listNotes
original_id: listNotes
---

List all the object notes

| param          | type [= default]                                   | description                                                                                                            |
| -------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| [**fs**](./fs) | FsClient                                           | a file system client                                                                                                   |
| dir            | string                                             | The [working tree](dir-vs-gitdir.md) directory path                                                                    |
| **gitdir**     | string = join(dir,'.git')                          | The [git directory](dir-vs-gitdir.md) path                                                                             |
| ref            | string                                             | The notes ref to look under                                                                                            |
| cache          | object                                             | a [cache](cache.md) object                                                                                             |
| return         | Promise\<Array\<{target: string, note: string}\>\> | Resolves successfully with an array of entries containing SHA-1 object ids of the note and the object the note targets |


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
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/api/listNotes.js';
  }
})();
</script>