---
title: indexPack
sidebar_label: indexPack
id: version-1.0.x-indexPack
original_id: indexPack
---

Create the .idx file for a given .pack file

| param                      | type [= default]          | description                                         |
| -------------------------- | ------------------------- | --------------------------------------------------- |
| [**fs**](./fs)             | FsClient                  | a file system client                                |
| [onProgress](./onProgress) | ProgressCallback          | optional progress event callback                    |
| **dir**                    | string                    | The [working tree](dir-vs-gitdir.md) directory path |
| **gitdir**                 | string = join(dir,'.git') | The [git directory](dir-vs-gitdir.md) path          |
| **filepath**               | string                    | The path to the .pack file to index                 |
| return                     | Promise\<void\>           | Resolves when filesystem operations are complete    |

Example Code:

```js live
let packfiles = await fs.promises.readdir('/tutorial/.git/objects/pack')
packfiles = packfiles.filter(name => name.endsWith('.pack'))
console.log('packfiles', packfiles)

await git.indexPack({
  fs,
  dir: '/tutorial',
  filepath: `.git/objects/pack/${packfiles[0]}`,
  async onProgress (evt) {
    console.log(`${evt.phase}: ${evt.loaded} / ${evt.total}`)
  }
})
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
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/master/src/api/indexPack.js';
  }
})();
</script>