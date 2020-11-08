---
title: readTree
sidebar_label: readTree
id: version-1.x-readTree
original_id: readTree
---

Read a tree object directly

| param          | type [= default]          | description                                                                                                              |
| -------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| [**fs**](./fs) | FsClient                  | a file system client                                                                                                     |
| dir            | string                    | The [working tree](dir-vs-gitdir.md) directory path                                                                      |
| **gitdir**     | string = join(dir,'.git') | The [git directory](dir-vs-gitdir.md) path                                                                               |
| **oid**        | string                    | The SHA-1 object id to get. Annotated tags and commits are peeled.                                                       |
| filepath       | string                    | Don't return the object with `oid` itself, but resolve `oid` to a tree and then return the tree object at that filepath. |
| cache          | object                    | a [cache](cache.md) object                                                                                               |
| return         | Promise\<ReadTreeResult\> | Resolves successfully with a git tree object                                                                             |

The object returned has the following schema:

```ts
type ReadTreeResult = {
  oid: string; // SHA-1 object id of this tree
  tree: TreeObject; // the parsed tree object
}
```

A git tree object. Trees represent a directory snapshot.

```ts
type TreeObject = Array<TreeEntry>;
```

An entry from a git tree object. Files are called 'blobs' and directories are called 'trees'.

```ts
type TreeEntry = {
  mode: string; // the 6 digit hexadecimal mode
  path: string; // the name of the file or directory
  oid: string; // the SHA-1 object id of the blob or tree
  type: 'commit' | 'blob' | 'tree'; // the type of object
}
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
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/api/readTree.js';
  }
})();
</script>