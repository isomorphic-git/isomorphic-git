---
title: listFiles
sidebar_label: listFiles
id: version-1.x-listFiles
original_id: listFiles
---

List all the files in the git index or a commit

| param          | type [= default]           | description                                                                                                              |
| -------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| [**fs**](./fs) | FsClient                   | a file system client                                                                                                     |
| dir            | string                     | The [working tree](dir-vs-gitdir.md) directory path                                                                      |
| **gitdir**     | string = join(dir,'.git')  | The [git directory](dir-vs-gitdir.md) path                                                                               |
| ref            | string                     | Return a list of all the files in the commit at `ref` instead of the files currently in the git index (aka staging area) |
| cache          | object                     | a [cache](cache.md) object                                                                                               |
| return         | Promise\<Array\<string\>\> | Resolves successfully with an array of filepaths                                                                         |

> Note: This function is efficient for listing the files in the staging area, but listing all the files in a commit requires recursively walking through the git object store.
> If you do not require a complete list of every file, better performance can be achieved by using [walk](./walk) and ignoring subdirectories you don't care about.

Example Code:

```js live
// All the files in the previous commit
let files = await git.listFiles({ fs, dir: '/tutorial', ref: 'HEAD' })
console.log(files)
// All the files in the current staging area
files = await git.listFiles({ fs, dir: '/tutorial' })
console.log(files)
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
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/api/listFiles.js';
  }
})();
</script>