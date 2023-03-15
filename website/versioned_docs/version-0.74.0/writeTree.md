---
title: writeTree
sidebar_label: writeTree
id: version-0.74.0-writeTree
original_id: writeTree
---

Write a tree object directly

| param           | type [= default]          | description                                                                                               |
| --------------- | ------------------------- | --------------------------------------------------------------------------------------------------------- |
| core            | string = 'default'        | The plugin core identifier to use for plugin injection                                                    |
| fs [deprecated] | FileSystem                | The filesystem containing the git repo. Overrides the fs provided by the [plugin system](./plugin_fs.md). |
| dir             | string                    | The [working tree](dir-vs-gitdir.md) directory path                                                       |
| **gitdir**      | string = join(dir,'.git') | The [git directory](dir-vs-gitdir.md) path                                                                |
| **tree**        | TreeObject                | The object to write                                                                                       |
| return          | Promise\<string\>         | Resolves successfully with the SHA-1 object id of the newly written object.                               |

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
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/commands/writeTree.js';
  }
})();
</script>