---
title: currentBranch
sidebar_label: currentBranch
id: version-1.x-currentBranch
original_id: currentBranch
---

Get the name of the branch currently pointed to by .git/HEAD

| param          | type [= default]                | description                                                                                          |
| -------------- | ------------------------------- | ---------------------------------------------------------------------------------------------------- |
| [**fs**](./fs) | FsClient                        | a file system implementation                                                                         |
| dir            | string                          | The [working tree](dir-vs-gitdir.md) directory path                                                  |
| **gitdir**     | string = join(dir,'.git')       | The [git directory](dir-vs-gitdir.md) path                                                           |
| fullname       | boolean = false                 | Return the full path (e.g. "refs/heads/main") instead of the abbreviated form.                       |
| test           | boolean = false                 | If the current branch doesn't actually exist (such as right after git init) then return `undefined`. |
| return         | Promise\<(string &#124; void)\> | The name of the current branch or undefined if the HEAD is detached.                                 |

Example Code:

```js live
// Get the current branch name
let branch = await git.currentBranch({
  fs,
  dir: '/tutorial',
  fullname: false
})
console.log(branch)
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
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/api/currentBranch.js';
  }
})();
</script>