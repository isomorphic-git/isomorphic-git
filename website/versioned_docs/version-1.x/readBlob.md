---
title: readBlob
sidebar_label: readBlob
id: version-1.x-readBlob
original_id: readBlob
---

Read a blob object directly

| param          | type [= default]          | description                                                                                                              |
| -------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| [**fs**](./fs) | FsClient                  | a file system client                                                                                                     |
| dir            | string                    | The [working tree](dir-vs-gitdir.md) directory path                                                                      |
| **gitdir**     | string = join(dir,'.git') | The [git directory](dir-vs-gitdir.md) path                                                                               |
| **oid**        | string                    | The SHA-1 object id to get. Annotated tags, commits, and trees are peeled.                                               |
| filepath       | string                    | Don't return the object with `oid` itself, but resolve `oid` to a tree and then return the blob object at that filepath. |
| cache          | object                    | a [cache](cache.md) object                                                                                               |
| return         | Promise\<ReadBlobResult\> | Resolves successfully with a blob object description                                                                     |

The object returned has the following schema:

```ts
type ReadBlobResult = {
  oid: string;
  blob: Uint8Array;
}
```

Example Code:

```js live
// Get the contents of 'README.md' in the main branch.
let commitOid = await git.resolveRef({ fs, dir: '/tutorial', ref: 'main' })
console.log(commitOid)
let { blob } = await git.readBlob({
  fs,
  dir: '/tutorial',
  oid: commitOid,
  filepath: 'README.md'
})
console.log(Buffer.from(blob).toString('utf8'))
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
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/api/readBlob.js';
  }
})();
</script>