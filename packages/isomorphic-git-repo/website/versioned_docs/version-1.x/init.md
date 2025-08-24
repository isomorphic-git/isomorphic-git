---
title: init
sidebar_label: init
id: version-1.x-init
original_id: init
---

Initialize a new repository

| param          | type [= default]          | description                                                                       |
| -------------- | ------------------------- | --------------------------------------------------------------------------------- |
| [**fs**](./fs) | FsClient                  | a file system client                                                              |
| dir            | string                    | The [working tree](dir-vs-gitdir.md) directory path                               |
| **gitdir**     | string = join(dir,'.git') | The [git directory](dir-vs-gitdir.md) path                                        |
| bare           | boolean = false           | Initialize a bare repository                                                      |
| defaultBranch  | string = 'master'         | The name of the default branch (might be changed to a required argument in 2.0.0) |
| return         | Promise\<void\>           | Resolves successfully when filesystem operations are complete                     |

Example Code:

```js live
await git.init({ fs, dir: '/tutorial' })
console.log('done')
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
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/api/init.js';
  }
})();
</script>