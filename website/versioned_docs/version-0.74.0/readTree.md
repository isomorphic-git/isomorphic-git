---
title: readTree
sidebar_label: readTree
id: version-0.74.0-readTree
original_id: readTree
---

Read a tree object directly

| param           | type [= default]          | description                                                                                                              |
| --------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| core            | string = 'default'        | The plugin core identifier to use for plugin injection                                                                   |
| fs [deprecated] | FileSystem                | The filesystem containing the git repo. Overrides the fs provided by the [plugin system](./plugin_fs.md).                |
| dir             | string                    | The [working tree](dir-vs-gitdir.md) directory path                                                                      |
| **gitdir**      | string = join(dir,'.git') | The [git directory](dir-vs-gitdir.md) path                                                                               |
| **oid**         | string                    | The SHA-1 object id to get. Annotated tags and commits are peeled.                                                       |
| filepath        | string                    | Don't return the object with `oid` itself, but resolve `oid` to a tree and then return the tree object at that filepath. |
| return          | Promise\<ReadTreeResult\> | Resolves successfully with a git tree object                                                                             |

The object returned has the following schema:

```ts
type ReadTreeResult = {
  oid: string; // SHA-1 object id of this tree
  tree: TreeObject; // the parsed tree object
}
```

```ts
type TreeObject = Array<TreeEntry>;
```

```ts
type TreeEntry = {
  mode: string; // the 6 digit hexadecimal mode
  path: string; // the name of the file or directory
  oid: string; // the SHA-1 object id of the blob or tree
  type: 'commit' | 'blob' | 'tree'; // the type of object
}
```

<script>
(function rewriteEditLink() {
  const el = document.querySelector('a.edit-page-link.button');
  if (el) {
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/commands/readTree.js';
  }
})();
</script>