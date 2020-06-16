---
title: branch
sidebar_label: branch
id: version-0.70.7-branch
original_id: branch
---

Create a branch

| param           | type [= default]          | description                                                                                               |
| --------------- | ------------------------- | --------------------------------------------------------------------------------------------------------- |
| core            | string = 'default'        | The plugin core identifier to use for plugin injection                                                    |
| fs [deprecated] | FileSystem                | The filesystem containing the git repo. Overrides the fs provided by the [plugin system](./plugin_fs.md). |
| dir             | string                    | The [working tree](dir-vs-gitdir.md) directory path                                                       |
| **gitdir**      | string = join(dir,'.git') | The [git directory](dir-vs-gitdir.md) path                                                                |
| **ref**         | string                    | What to name the branch                                                                                   |
| checkout        | boolean = false           | Update `HEAD` to point at the newly created branch                                                        |
| return          | Promise\<void\>           | Resolves successfully when filesystem operations are complete                                             |

Example Code:

```js live
await git.branch({ dir: '$input((/))', ref: '$input((develop))' })
console.log('done')
```

<script>
(function rewriteEditLink() {
  const el = document.querySelector('a.edit-page-link.button');
  if (el) {
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/commands/branch.js';
  }
})();
</script>