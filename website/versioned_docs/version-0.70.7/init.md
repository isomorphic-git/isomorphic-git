---
title: init
sidebar_label: init
id: version-0.70.7-init
original_id: init
---

Initialize a new repository

| param           | type [= default]          | description                                                                                               |
| --------------- | ------------------------- | --------------------------------------------------------------------------------------------------------- |
| core            | string = 'default'        | The plugin core identifier to use for plugin injection                                                    |
| fs [deprecated] | FileSystem                | The filesystem containing the git repo. Overrides the fs provided by the [plugin system](./plugin_fs.md). |
| dir             | string                    | The [working tree](dir-vs-gitdir.md) directory path                                                       |
| **gitdir**      | string = join(dir,'.git') | The [git directory](dir-vs-gitdir.md) path                                                                |
| bare            | boolean = false           | Initialize a bare repository                                                                              |
| noOverwrite     | boolean = false           | Detect if this is already a git repo and do not re-write `.git/config`                                    |
| return          | Promise\<void\>           | Resolves successfully when filesystem operations are complete                                             |

Example Code:

```js live
await git.init({ dir: '$input((/))' })
console.log('done')
```

<script>
(function rewriteEditLink() {
  const el = document.querySelector('a.edit-page-link.button');
  if (el) {
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/commands/init.js';
  }
})();
</script>