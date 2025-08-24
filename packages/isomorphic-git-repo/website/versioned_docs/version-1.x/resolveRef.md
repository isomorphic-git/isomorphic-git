---
title: resolveRef
sidebar_label: resolveRef
id: version-1.x-resolveRef
original_id: resolveRef
---

Get the value of a symbolic ref or resolve a ref to its SHA-1 object id

| param          | type [= default]           | description                                                                 |
| -------------- | -------------------------- | --------------------------------------------------------------------------- |
| [**fs**](./fs) | FsClient                   | a file system client                                                        |
| dir            | string                     | The [working tree](dir-vs-gitdir.md) directory path                         |
| **gitdir**     | string = join(dir, '.git') | The [git directory](dir-vs-gitdir.md) path                                  |
| **ref**        | string                     | The ref to resolve                                                          |
| depth          | number                     | How many symbolic references to follow before returning                     |
| return         | Promise\<string\>          | Resolves successfully with a SHA-1 object id or the value of a symbolic ref |

Example Code:

```js live
let currentCommit = await git.resolveRef({ fs, dir: '/tutorial', ref: 'HEAD' })
console.log(currentCommit)
let currentBranch = await git.resolveRef({ fs, dir: '/tutorial', ref: 'HEAD', depth: 2 })
console.log(currentBranch)
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
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/api/resolveRef.js';
  }
})();
</script>