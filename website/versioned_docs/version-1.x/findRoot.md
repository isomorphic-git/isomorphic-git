---
title: findRoot
sidebar_label: findRoot
id: version-1.x-findRoot
original_id: findRoot
---

Find the root git directory

| param          | type [= default]  | description                                          |
| -------------- | ----------------- | ---------------------------------------------------- |
| [**fs**](./fs) | FsClient          | a file system client                                 |
| **filepath**   | string            | The file directory to start searching in.            |
| return         | Promise\<string\> | Resolves successfully with a root git directory path |
| throws         | Error             | [NotFoundError](./errors.md#notfounderror)           |

Starting at `filepath`, walks upward until it finds a directory that contains a subdirectory called '.git'.

Example Code:

```js live
let gitroot = await git.findRoot({
  fs,
  filepath: '/tutorial/src/utils'
})
console.log(gitroot)
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
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/api/findRoot.js';
  }
})();
</script>