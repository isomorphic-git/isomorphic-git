---
title: resetIndex
sidebar_label: resetIndex
id: version-0.70.7-resetIndex
original_id: resetIndex
---

Reset a file in the git index (aka staging area)

| param           | type [= default]           | description                                                                                               |
| --------------- | -------------------------- | --------------------------------------------------------------------------------------------------------- |
| core            | string = 'default'         | The plugin core identifier to use for plugin injection                                                    |
| fs [deprecated] | FileSystem                 | The filesystem containing the git repo. Overrides the fs provided by the [plugin system](./plugin_fs.md). |
| dir             | string                     | The [working tree](dir-vs-gitdir.md) directory path                                                       |
| **gitdir**      | string = join(dir, '.git') | The [git directory](dir-vs-gitdir.md) path                                                                |
| **filepath**    | string                     | The path to the file to reset in the index                                                                |
| ref             | string = 'HEAD'            | A ref to the commit to use                                                                                |
| return          | Promise\<void\>            | Resolves successfully once the git index has been updated                                                 |

Note that this does NOT modify the file in the working directory.

Example Code:

```js live
await git.resetIndex({ dir: '$input((/))', filepath: '$input((README.md))' })
console.log('done')
```

<script>
(function rewriteEditLink() {
  const el = document.querySelector('a.edit-page-link.button');
  if (el) {
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/master/src/commands/resetIndex.js';
  }
})();
</script>