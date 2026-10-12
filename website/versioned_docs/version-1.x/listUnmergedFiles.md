---
title: listUnmergedFiles
sidebar_label: listUnmergedFiles
id: version-1.x-listUnmergedFiles
original_id: listUnmergedFiles
---

List the files left unmerged by a merge or cherry-pick, with the versions the index holds for each

| param          | type [= default]                 | description                                                  |
| -------------- | -------------------------------- | ------------------------------------------------------------ |
| [**fs**](./fs) | FsClient                         | a file system client                                         |
| dir            | string                           | The [working tree](dir-vs-gitdir.md) directory path          |
| **gitdir**     | string = join(dir,'.git')        | The [git directory](dir-vs-gitdir.md) path                   |
| cache          | object                           | a [cache](cache.md) object                                   |
| return         | Promise\<Array\<UnmergedFile\>\> | Resolves successfully with the unmerged files, in path order |

A file the last merge or cherry-pick could not resolve

```ts
type UnmergedFile = {
  filepath: string; // The file's path relative to the repository root
  base?: UnmergedVersion; // The version in the merge base, if the file existed there
  ours?: UnmergedVersion; // Our version, if we did not delete the file
  theirs?: UnmergedVersion; // Their version, if they did not delete the file
}
```

This is the information `git ls-files -u` and `git status` use: a conflicted file keeps up to three entries in the index, the merge base (stage 1), ours (stage 2) and theirs (stage 3).
A side that deleted the file has no entry. Each version can be read with [readBlob](./readBlob.md).
Staging the file with [add](./add.md) or [remove](./remove.md) marks it resolved and takes it off this list.

Example Code:

```js live
try {
  await git.merge({ fs, dir: '/tutorial', theirs: 'feature', abortOnConflict: false })
} catch (e) {
  if (!(e instanceof Errors.MergeConflictError)) throw e
}
const unmerged = await git.listUnmergedFiles({ fs, dir: '/tutorial' })
console.log(unmerged)
// [{ filepath: 'app.js', base: { oid, mode }, ours: { oid, mode }, theirs: { oid, mode } }]
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
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/api/listUnmergedFiles.js';
  }
})();
</script>