---
title: abortMerge
sidebar_label: abortMerge
id: version-1.x-abortMerge
original_id: abortMerge
---

Abort a merge in progress

| param          | type [= default]           | description                                                 |
| -------------- | -------------------------- | ----------------------------------------------------------- |
| [**fs**](./fs) | FsClient                   | a file system implementation                                |
| **dir**        | string                     | The [working tree](dir-vs-gitdir.md) directory path         |
| **gitdir**     | string = join(dir, '.git') | The [git directory](dir-vs-gitdir.md) path                  |
| commit         | string = 'HEAD'            | commit to reset the index and worktree to, defaults to HEAD |
| cache          | object                     | a [cache](cache.md) object                                  |
| return         | Promise\<void\>            | Resolves successfully once the git index has been updated   |

**WARNING:** Running git merge with non-trivial uncommitted changes is discouraged: while possible, it may leave you in a state that is hard to back out of in the case of a conflict.

If there were uncommitted changes when the merge started (and especially if those changes were further modified after the merge was started), `git.abortMerge` will in some cases be unable to reconstruct the original (pre-merge) changes.


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
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/api/abortMerge.js';
  }
})();
</script>