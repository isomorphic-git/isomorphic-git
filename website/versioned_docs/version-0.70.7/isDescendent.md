---
title: isDescendent
sidebar_label: isDescendent
id: version-0.70.7-isDescendent
original_id: isDescendent
---

Check whether a git commit is descended from another

| param           | type [= default]          | description                                                                                               |
| --------------- | ------------------------- | --------------------------------------------------------------------------------------------------------- |
| core            | string = 'default'        | The plugin core identifier to use for plugin injection                                                    |
| fs [deprecated] | FileSystem                | The filesystem containing the git repo. Overrides the fs provided by the [plugin system](./plugin_fs.md). |
| dir             | string                    | The [working tree](dir-vs-gitdir.md) directory path                                                       |
| **gitdir**      | string = join(dir,'.git') | The [git directory](dir-vs-gitdir.md) path                                                                |
| **oid**         | string                    | The descendent commit                                                                                     |
| **ancestor**    | string                    | The (proposed) ancestor commit                                                                            |
| depth           | number = -1               | Maximum depth to search before giving up. -1 means no maximum depth.                                      |
| return          | Promise\<boolean\>        | Resolves to true if `oid` is a descendent of `ancestor`                                                   |

Example Code:

```js live
let oid = await git.resolveRef({ dir: '$input((/))', ref: '$input((master))' })
let ancestor = await git.resolveRef({ dir: '$input((/))', ref: '$input((v0.20.0))' })
console.log(oid, ancestor)
await git.isDescendent({ dir: '$input((/))', oid, ancestor, depth: $input((-1)) })
```

<script>
(function rewriteEditLink() {
  const el = document.querySelector('a.edit-page-link.button');
  if (el) {
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/commands/isDescendent.js';
  }
})();
</script>