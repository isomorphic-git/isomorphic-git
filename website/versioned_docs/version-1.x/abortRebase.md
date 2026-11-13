---
title: abortRebase
sidebar_label: abortRebase
id: version-1.x-abortRebase
original_id: abortRebase
---

Abort a rebase that stopped on conflicts

| param          | type [= default]          | description                                                |
| -------------- | ------------------------- | ---------------------------------------------------------- |
| [**fs**](./fs) | FsClient                  | a file system client                                       |
| **dir**        | string                    | The [working tree](dir-vs-gitdir.md) directory path        |
| **gitdir**     | string = join(dir,'.git') | The [git directory](dir-vs-gitdir.md) path                 |
| cache          | object                    | a [cache](cache.md) object                                 |
| return         | Promise\<void\>           | Resolves successfully once the branch is back where it was |

Like `git rebase --abort`: puts the branch back where it was before the rebase and checks it out (or detaches HEAD there, for a rebase of a detached HEAD), which discards the conflict and any other change to tracked files, and forgets the rebase.
It refuses, with nothing changed, when an untracked file is where the branch has a file, or would have to go with a directory: that throws a `RebaseLocalChangesError`. git refuses too, but replaces ignored files and directories; the library refuses for those as well, so nothing is lost.

Throws a `NotFoundError` when no rebase is in progress, and a `RebaseNotSupportedError`, with nothing changed, for a rebase started with `--autostash`: git applies the stashed changes again on abort, so use `git rebase --abort`.

Example Code:

```js live
await git.abortRebase({ fs, dir: '/tutorial' })
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
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/api/abortRebase.js';
  }
})();
</script>