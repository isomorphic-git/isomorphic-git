---
title: listBranches
sidebar_label: listBranches
id: version-0.70.7-listBranches
original_id: listBranches
---

List branches

| param           | type [= default]           | description                                                                                               |
| --------------- | -------------------------- | --------------------------------------------------------------------------------------------------------- |
| core            | string = 'default'         | The plugin core identifier to use for plugin injection                                                    |
| fs [deprecated] | FileSystem                 | The filesystem containing the git repo. Overrides the fs provided by the [plugin system](./plugin_fs.md). |
| dir             | string                     | The [working tree](dir-vs-gitdir.md) directory path                                                       |
| **gitdir**      | string = join(dir,'.git')  | The [git directory](dir-vs-gitdir.md) path                                                                |
| remote          | string                     | Instead of the branches in `refs/heads`, list the branches in `refs/remotes/${remote}`.                   |
| return          | Promise\<Array\<string\>\> | Resolves successfully with an array of branch names                                                       |

By default it lists local branches. If a 'remote' is specified, it lists the remote's branches. When listing remote branches, the HEAD branch is not filtered out, so it may be included in the list of results.

Note that specifying a remote does not actually contact the server and update the list of branches.
If you want an up-to-date list, first do a `fetch` to that remote.
(Which branch you fetch doesn't matter - the list of branches available on the remote is updated during the fetch handshake.)

Example Code:

```js live
let branches = await git.listBranches({ dir: '$input((/))' })
console.log(branches)
let remoteBranches = await git.listBranches({ dir: '$input((/))', remote: '$input((origin))' })
console.log(remoteBranches)
```

<script>
(function rewriteEditLink() {
  const el = document.querySelector('a.edit-page-link.button');
  if (el) {
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/commands/listBranches.js';
  }
})();
</script>