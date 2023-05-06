---
title: branch
sidebar_label: branch
id: version-1.x-branch
original_id: branch
---

Create a branch

| param          | type [= default]          | description                                                                                           |
| -------------- | ------------------------- | ----------------------------------------------------------------------------------------------------- |
| [**fs**](./fs) | FsClient                  | a file system implementation                                                                          |
| dir            | string                    | The [working tree](dir-vs-gitdir.md) directory path                                                   |
| **gitdir**     | string = join(dir,'.git') | The [git directory](dir-vs-gitdir.md) path                                                            |
| **ref**        | string                    | What to name the branch                                                                               |
| object         | string = 'HEAD'           | What oid to use as the start point. Accepts a symbolic ref.                                           |
| checkout       | boolean = false           | Update `HEAD` to point at the newly created branch                                                    |
| force          | boolean = false           | Instead of throwing an error if a branched named `ref` already exists, overwrite the existing branch. |
| return         | Promise\<void\>           | Resolves successfully when filesystem operations are complete                                         |

Example Code:

```js live
await git.branch({ fs, dir: '/tutorial', ref: 'develop' })
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
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/api/branch.js';
  }
})();
</script>