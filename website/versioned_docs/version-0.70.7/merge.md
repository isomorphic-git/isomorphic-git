---
title: merge
sidebar_label: merge
id: version-0.70.7-merge
original_id: merge
---

Merge two branches

| param           | type [= default]          | description                                                                                               |
| --------------- | ------------------------- | --------------------------------------------------------------------------------------------------------- |
| core            | string = 'default'        | The plugin core identifier to use for plugin injection                                                    |
| fs [deprecated] | FileSystem                | The filesystem containing the git repo. Overrides the fs provided by the [plugin system](./plugin_fs.md). |
| dir             | string                    | The [working tree](dir-vs-gitdir.md) directory path                                                       |
| **gitdir**      | string = join(dir,'.git') | The [git directory](dir-vs-gitdir.md) path                                                                |
| ours            | string                    | The branch receiving the merge. If undefined, defaults to the current branch.                             |
| **theirs**      | string                    | The branch to be merged                                                                                   |
| fastForwardOnly | boolean = false           | If true, then non-fast-forward merges will throw an Error instead of performing a merge.                  |
| dryRun          | boolean = false           | If true, simulates a merge so you can test whether it would succeed.                                      |
| noUpdateBranch  | boolean = false           | If true, does not update the branch pointer after creating the commit.                                    |
| message         | string                    | Overrides the default auto-generated merge commit message                                                 |
| author          | Object                    | passed to [commit](commit.md) when creating a merge commit                                                |
| committer       | Object                    | passed to [commit](commit.md) when creating a merge commit                                                |
| signingKey      | string                    | passed to [commit](commit.md) when creating a merge commit                                                |
| return          | Promise\<MergeReport\>    | Resolves to a description of the merge operation                                                          |

Returns an object with a schema like this:

```ts
type MergeReport = {
  oid?: string; // The SHA-1 object id that is now at the head of the branch. Absent only if `dryRun` was specified and `mergeCommit` is true.
  alreadyMerged?: boolean; // True if the branch was already merged so no changes were made
  fastForward?: boolean; // True if it was a fast-forward merge
  mergeCommit?: boolean; // True if merge resulted in a merge commit
  tree?: string; // The SHA-1 object id of the tree resulting from a merge commit
}
```

## Limitations

Currently it does not support incomplete merges. That is, if there are merge conflicts it cannot solve
with the built in diff3 algorithm it will not modify the working dir, and will throw a [`MergeNotSupportedFail`](./errors.md#mergenotsupportedfail) error.

Currently it will fail if multiple candidate merge bases are found. (It doesn't yet implement the recursive merge strategy.)

Currently it does not support selecting alternative merge strategies.

Example Code:

```js live
let m = await git.merge({ dir: '$input((/))', ours: '$input((master))', theirs: '$input((remotes/origin/master))' })
console.log(m)
```

<script>
(function rewriteEditLink() {
  const el = document.querySelector('a.edit-page-link.button');
  if (el) {
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/commands/merge.js';
  }
})();
</script>