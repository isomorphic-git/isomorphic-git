---
title: addRemote
sidebar_label: addRemote
id: version-0.70.7-addRemote
original_id: addRemote
---

Add or update a remote

| param           | type [= default]   | description                                                                                               |
| --------------- | ------------------ | --------------------------------------------------------------------------------------------------------- |
| core            | string = 'default' | The plugin core identifier to use for plugin injection                                                    |
| fs [deprecated] | FileSystem         | The filesystem containing the git repo. Overrides the fs provided by the [plugin system](./plugin_fs.md). |
| dir             | string             | The [working tree](dir-vs-gitdir.md) directory path                                                       |
| **gitdir**      | string             | The [git directory](dir-vs-gitdir.md) path                                                                |
| **remote**      | string             | The name of the remote                                                                                    |
| **url**         | string             | The URL of the remote                                                                                     |
| force           | boolean = false    | Instead of throwing an error if a remote named `remote` already exists, overwrite the existing remote.    |
| return          | Promise\<void\>    | Resolves successfully when filesystem operations are complete                                             |

Example Code:

```js live
await git.addRemote({ dir: '$input((/))', remote: '$input((upstream))', url: '$input((https://github.com/isomorphic-git/isomorphic-git))' })
console.log('done')
```

<script>
(function rewriteEditLink() {
  const el = document.querySelector('a.edit-page-link.button');
  if (el) {
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/commands/addRemote.js';
  }
})();
</script>