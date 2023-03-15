---
title: listRemotes
sidebar_label: listRemotes
id: version-0.70.7-listRemotes
original_id: listRemotes
---

List remotes

| param           | type [= default]                                  | description                                                                                               |
| --------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| core            | string = 'default'                                | The plugin core identifier to use for plugin injection                                                    |
| fs [deprecated] | FileSystem                                        | The filesystem containing the git repo. Overrides the fs provided by the [plugin system](./plugin_fs.md). |
| dir             | string                                            | The [working tree](dir-vs-gitdir.md) directory path                                                       |
| **gitdir**      | string = join(dir,'.git')                         | The [git directory](dir-vs-gitdir.md) path                                                                |
| return          | Promise\<Array\<{remote: string, url: string}\>\> | Resolves successfully with an array of `{remote, url}` objects                                            |

Example Code:

```js live
let remotes = await git.listRemotes({ dir: '$input((/))' })
console.log(remotes)
```

<script>
(function rewriteEditLink() {
  const el = document.querySelector('a.edit-page-link.button');
  if (el) {
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/commands/listRemotes.js';
  }
})();
</script>