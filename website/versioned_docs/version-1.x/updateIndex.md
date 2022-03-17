---
title: updateIndex
sidebar_label: updateIndex
id: version-1.x-updateIndex
original_id: updateIndex
---

Register file contents in the working tree or object database to the git index (aka staging area).

| param          | type [= default]                | description                                                                                                                       |
| -------------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| [**fs**](./fs) | FsClient                        | a file system client                                                                                                              |
| **dir**        | string                          | The [working tree](dir-vs-gitdir.md) directory path                                                                               |
| **gitdir**     | string = join(dir, '.git')      | The [git directory](dir-vs-gitdir.md) path                                                                                        |
| **filepath**   | string                          | File to act upon.                                                                                                                 |
| oid            | string                          | OID of the object in the object database to add to the index with the specified filepath.                                         |
| mode           | number = 100644                 | The file mode to add the file to the index.                                                                                       |
| add            | boolean                         | Adds the specified file to the index if it does not yet exist in the index.                                                       |
| remove         | boolean                         | Remove the specified file from the index if it does not exist in the workspace anymore.                                           |
| force          | boolean                         | Remove the specified file from the index, even if it still exists in the workspace.                                               |
| cache          | object                          | a [cache](cache.md) object                                                                                                        |
| return         | Promise\<(string &#124; void)\> | Resolves successfully with the SHA-1 object id of the object written or updated in the index, or nothing if the file was removed. |

Example Code:

```js live
await git.updateIndex({
  fs,
  dir: '/tutorial',
  filepath: 'readme.md'
})
```

```js live
// Manually create a blob in the object database.
let oid = await git.writeBlob({
  fs,
  dir: '/tutorial',
  blob: new Uint8Array([])
})

// Write the object in the object database to the index.
await git.updateIndex({
  fs,
  dir: '/tutorial',
  add: true,
  filepath: 'readme.md',
  oid
})
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
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/api/updateIndex.js';
  }
})();
</script>