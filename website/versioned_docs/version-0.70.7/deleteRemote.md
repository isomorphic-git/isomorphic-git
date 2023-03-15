---
title: deleteRemote
sidebar_label: deleteRemote
id: version-0.70.7-deleteRemote
original_id: deleteRemote
---

Removes the local config entry for a given remote

| param           | type [= default]          | description                                                                                               |
| --------------- | ------------------------- | --------------------------------------------------------------------------------------------------------- |
| core            | string = 'default'        | The plugin core identifier to use for plugin injection                                                    |
| fs [deprecated] | FileSystem                | The filesystem containing the git repo. Overrides the fs provided by the [plugin system](./plugin_fs.md). |
| dir             | string                    | The [working tree](dir-vs-gitdir.md) directory path                                                       |
| **gitdir**      | string = join(dir,'.git') | The [git directory](dir-vs-gitdir.md) path                                                                |
| **remote**      | string                    | The name of the remote to delete                                                                          |
| return          | Promise\<void\>           | Resolves successfully when filesystem operations are complete                                             |

Example Code:

```js live
await git.deleteRemote({ dir: '$input((/))', remote: '$input((upstream))' })
console.log('done')
```

<script>
(function rewriteEditLink() {
  const el = document.querySelector('a.edit-page-link.button');
  if (el) {
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/commands/deleteRemote.js';
  }
})();
</script>