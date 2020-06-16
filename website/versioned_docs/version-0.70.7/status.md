---
title: status
sidebar_label: status
id: version-0.70.7-status
original_id: status
---

Tell whether a file has been changed

| param           | type [= default]           | description                                                                                               |
| --------------- | -------------------------- | --------------------------------------------------------------------------------------------------------- |
| core            | string = 'default'         | The plugin core identifier to use for plugin injection                                                    |
| fs [deprecated] | FileSystem                 | The filesystem containing the git repo. Overrides the fs provided by the [plugin system](./plugin_fs.md). |
| **dir**         | string                     | The [working tree](dir-vs-gitdir.md) directory path                                                       |
| **gitdir**      | string = join(dir, '.git') | The [git directory](dir-vs-gitdir.md) path                                                                |
| **filepath**    | string                     | The path to the file to query                                                                             |
| return          | Promise\<string\>          | Resolves successfully with the file's git status                                                          |

The possible resolve values are:

| status          | description                                                              |
| --------------- | ------------------------------------------------------------------------ |
| `"ignored"`     | file ignored by a .gitignore rule                                        |
| `"unmodified"`  | file unchanged from HEAD commit                                          |
| `"*modified"`   | file has modifications, not yet staged                                   |
| `"*deleted"`    | file has been removed, but the removal is not yet staged                 |
| `"*added"`      | file is untracked, not yet staged                                        |
| `"absent"`      | file not present in HEAD commit, staging area, or working dir            |
| `"modified"`    | file has modifications, staged                                           |
| `"deleted"`     | file has been removed, staged                                            |
| `"added"`       | previously untracked file, staged                                        |
| `"*unmodified"` | working dir and HEAD commit match, but index differs                     |
| `"*absent"`     | file not present in working dir or HEAD commit, but present in the index |

Example Code:

```js live
let status = await git.status({ dir: '$input((/))', filepath: '$input((README.md))' })
console.log(status)
```

<script>
(function rewriteEditLink() {
  const el = document.querySelector('a.edit-page-link.button');
  if (el) {
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/commands/status.js';
  }
})();
</script>