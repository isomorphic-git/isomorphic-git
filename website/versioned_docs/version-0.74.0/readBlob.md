---
title: readBlob
sidebar_label: readBlob
id: version-0.74.0-readBlob
original_id: readBlob
---

Read a blob object directly

| param           | type [= default]          | description                                                                                                              |
| --------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| core            | string = 'default'        | The plugin core identifier to use for plugin injection                                                                   |
| fs [deprecated] | FileSystem                | The filesystem containing the git repo. Overrides the fs provided by the [plugin system](./plugin_fs.md).                |
| dir             | string                    | The [working tree](dir-vs-gitdir.md) directory path                                                                      |
| **gitdir**      | string = join(dir,'.git') | The [git directory](dir-vs-gitdir.md) path                                                                               |
| **oid**         | string                    | The SHA-1 object id to get. Annotated tags, commits, and trees are peeled.                                               |
| filepath        | string                    | Don't return the object with `oid` itself, but resolve `oid` to a tree and then return the blob object at that filepath. |
| return          | Promise\<ReadBlobResult\> | Resolves successfully with a blob object description                                                                     |

The object returned has the following schema:

```ts
type ReadBlobResult = {
  oid: string;
  blob: Buffer;
}
```

Example Code:

```js live
// Get the contents of 'README.md' in the master branch.
let commitOid = await git.resolveRef({ dir: '$input((/))', ref: '$input((master))' })
console.log(commitOid)
let { object: blob } = await git.readBlob({
  dir: '$input((/))',
  oid: $input((commitOid)),
  $textarea((filepath: 'README.md'
})
console.log(blob.toString('utf8'))
```

<script>
(function rewriteEditLink() {
  const el = document.querySelector('a.edit-page-link.button');
  if (el) {
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/commands/readBlob.js';
  }
})();
</script>