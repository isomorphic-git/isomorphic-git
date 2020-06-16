---
title: add
sidebar_label: add
id: version-0.70.7-add
original_id: add
---

Add a file to the git index (aka staging area)

| param           | type [= default]           | description                                                                                               |
| --------------- | -------------------------- | --------------------------------------------------------------------------------------------------------- |
| core            | string = 'default'         | The plugin core identifier to use for plugin injection                                                    |
| fs [deprecated] | FileSystem                 | The filesystem containing the git repo. Overrides the fs provided by the [plugin system](./plugin_fs.md). |
| **dir**         | string                     | The [working tree](dir-vs-gitdir.md) directory path                                                       |
| **gitdir**      | string = join(dir, '.git') | The [git directory](dir-vs-gitdir.md) path                                                                |
| **filepath**    | string                     | The path to the file to add to the index                                                                  |
| return          | Promise\<void\>            | Resolves successfully once the git index has been updated                                                 |

Example Code:

```js live
await new Promise((resolve, reject) => fs.writeFile(
  '$input((/README.md))',
  `$textarea((# TEST))`,
  (err) => err ? reject(err) : resolve()
))
await git.add({ dir: '$input((/))', filepath: '$input((README.md))' })
console.log('done')
```

<script>
(function rewriteEditLink() {
  const el = document.querySelector('a.edit-page-link.button');
  if (el) {
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/commands/add.js';
  }
})();
</script>