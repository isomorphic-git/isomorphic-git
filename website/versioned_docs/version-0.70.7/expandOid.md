---
title: expandOid
sidebar_label: expandOid
id: version-0.70.7-expandOid
original_id: expandOid
---

Expand and resolve a short oid into a full oid

| param           | type [= default]          | description                                                                                               |
| --------------- | ------------------------- | --------------------------------------------------------------------------------------------------------- |
| core            | string = 'default'        | The plugin core identifier to use for plugin injection                                                    |
| fs [deprecated] | FileSystem                | The filesystem containing the git repo. Overrides the fs provided by the [plugin system](./plugin_fs.md). |
| dir             | string                    | The [working tree](dir-vs-gitdir.md) directory path                                                       |
| **gitdir**      | string = join(dir,'.git') | The [git directory](dir-vs-gitdir.md) path                                                                |
| **oid**         | string                    | The shortened oid prefix to expand (like "0414d2a")                                                       |
| return          | Promise\<string\>         | Resolves successfully with the full oid (like "0414d2a286d7bbc7a4a326a61c1f9f888a8ab87f")                 |

Example Code:

```js live
let oid = await git.expandOid({ dir: '$input((/))', oid: '$input((0414d2a))'})
console.log(oid)
```

<script>
(function rewriteEditLink() {
  const el = document.querySelector('a.edit-page-link.button');
  if (el) {
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/commands/expandOid.js';
  }
})();
</script>