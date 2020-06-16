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
| fastForwardOnly          | boolean = false                      | If true, then non-fast-forward merges will throw an Error instead of performing a merge.                                                                      |
| dryRun                   | boolean = false                      | If true, simulates a merge so you can test whether it would succeed.                                                                                          |
| noUpdateBranch           | boolean = false                      | If true, does not update the branch pointer after creating the commit.                                                                                        |
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

## Limitations

Currently it does not support incomplete merges. That is, if there are merge conflicts it cannot solve
with the built in diff3 algorithm it will not modify the working dir, and will throw a [`MergeNotSupportedError`](./errors.md#mergenotsupportedError) error.

Currently it will fail if multiple candidate merge bases are found. (It doesn't yet implement the recursive merge strategy.)

Currently it does not support selecting alternative merge strategies.

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