---
title: merge
sidebar_label: merge
id: version-1.x-merge
original_id: merge
---

Merge two branches

| param                    | type [= default]                     | description                                                                                                                                                   |
| ------------------------ | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [**fs**](./fs)           | FsClient                             | a file system client                                                                                                                                          |
| [onSign](./onSign)       | SignCallback                         | a PGP signing implementation                                                                                                                                  |
| dir                      | string                               | The [working tree](dir-vs-gitdir.md) directory path                                                                                                           |
| **gitdir**               | string = join(dir,'.git')            | The [git directory](dir-vs-gitdir.md) path                                                                                                                    |
| ours                     | string                               | The branch receiving the merge. If undefined, defaults to the current branch.                                                                                 |
| **theirs**               | string                               | The branch to be merged                                                                                                                                       |
| fastForward              | boolean = true                       | If false, create a merge commit in all cases.                                                                                                                 |
| fastForwardOnly          | boolean = false                      | If true, then non-fast-forward merges will throw an Error instead of performing a merge.                                                                      |
| dryRun                   | boolean = false                      | If true, simulates a merge so you can test whether it would succeed.                                                                                          |
| noUpdateBranch           | boolean = false                      | If true, does not update the branch pointer after creating the commit.                                                                                        |
| abortOnConflict          | boolean = true                       | If true, merges with conflicts will not update the worktree or index.                                                                                         |
| message                  | string                               | Overrides the default auto-generated merge commit message                                                                                                     |
| author                   | Object                               | passed to [commit](commit.md) when creating a merge commit                                                                                                    |
| author.name              | string                               | Default is `user.name` config.                                                                                                                                |
| author.email             | string                               | Default is `user.email` config.                                                                                                                               |
| author.timestamp         | number = Math.floor(Date.now()/1000) | Set the author timestamp field. This is the integer number of seconds since the Unix epoch (1970-01-01 00:00:00).                                             |
| author.timezoneOffset    | number                               | Set the author timezone offset field. This is the difference, in minutes, from the current timezone to UTC. Default is `(new Date()).getTimezoneOffset()`.    |
| committer                | Object                               | passed to [commit](commit.md) when creating a merge commit                                                                                                    |
| committer.name           | string                               | Default is `user.name` config.                                                                                                                                |
| committer.email          | string                               | Default is `user.email` config.                                                                                                                               |
| committer.timestamp      | number = Math.floor(Date.now()/1000) | Set the committer timestamp field. This is the integer number of seconds since the Unix epoch (1970-01-01 00:00:00).                                          |
| committer.timezoneOffset | number                               | Set the committer timezone offset field. This is the difference, in minutes, from the current timezone to UTC. Default is `(new Date()).getTimezoneOffset()`. |
| signingKey               | string                               | passed to [commit](commit.md) when creating a merge commit                                                                                                    |
| cache                    | object                               | a [cache](cache.md) object                                                                                                                                    |
| mergeDriver              | MergeDriverCallback                  | a [merge driver](mergeDriver.md) implementation                                                                                                               |
| return                   | Promise\<MergeResult\>               | Resolves to a description of the merge operation                                                                                                              |

Returns an object with a schema like this:

```ts
type MergeResult = {
  oid?: string; // The SHA-1 object id that is now at the head of the branch. Absent only if `dryRun` was specified and `mergeCommit` is true.
  alreadyMerged?: boolean; // True if the branch was already merged so no changes were made
  fastForward?: boolean; // True if it was a fast-forward merge
  mergeCommit?: boolean; // True if merge resulted in a merge commit
  tree?: string; // The SHA-1 object id of the tree resulting from a merge commit
}
```

Currently it will fail if multiple candidate merge bases are found. (It doesn't yet implement the recursive merge strategy.)

Currently it does not support selecting alternative merge strategies.

Currently it is not possible to abort an incomplete merge. To restore the worktree to a clean state, you will need to checkout an earlier commit.

Currently it does not directly support the behavior of `git merge --continue`. To complete a merge after manual conflict resolution, you will need to add and commit the files manually, and specify the appropriate parent commits.

## Manually resolving merge conflicts
By default, if isomorphic-git encounters a merge conflict it cannot resolve using the builtin diff3 algorithm or provided merge driver, it will abort and throw a `MergeNotSupportedError`.
This leaves the index and working tree untouched.

When `abortOnConflict` is set to `false`, and a merge conflict cannot be automatically resolved, a `MergeConflictError` is thrown and the results of the incomplete merge will be written to the working directory.
This includes conflict markers in files with unresolved merge conflicts.

To complete the merge, edit the conflicting files as you see fit, and then add and commit the resolved merge.

For a proper merge commit, be sure to specify the branches or commits you are merging in the `parent` argument to `git.commit`.
For example, say we are merging the branch `feature` into the branch `main` and there is a conflict we want to resolve manually.
The flow would look like this:

```
await git.merge({
  fs,
  dir,
  ours: 'main',
  theirs: 'feature',
  abortOnConflict: false,
}).catch(e => {
  if (e instanceof Errors.MergeConflictError) {
    console.log(
      'Automatic merge failed for the following files: '
      + `${e.data}. `
      + 'Resolve these conflicts and then commit your changes.'
    )
  } else throw e
})

// This is the where we manually edit the files that have been written to the working directory
// ...
// Files have been edited and we are ready to commit

await git.add({
  fs,
  dir,
  filepath: '.',
})

await git.commit({
  fs,
  dir,
  ref: 'main',
  message: "Merge branch 'feature' into main",
  parent: ['main', 'feature'], // Be sure to specify the parents when creating a merge commit
})
```

Example Code:

```js live
let m = await git.merge({
  fs,
  dir: '/tutorial',
  ours: 'main',
  theirs: 'remotes/origin/main'
})
console.log(m)
```


---

<details>
<summary><i>Tip: If you need a clean slate, expand and run this snippet to clean up the file system.</i></summary>

```js live
window.fs = new LightningFS('fs', { wipe: true })
window.pfs = window.fs.promises
console.log('done')
```
</details>

<script>
(function rewriteEditLink() {
  const el = document.querySelector('a.edit-page-link.button');
  if (el) {
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/api/merge.js';
  }
})();
</script>