---
title: continueRebase
sidebar_label: continueRebase
id: version-1.x-continueRebase
original_id: continueRebase
---

Continue a rebase that stopped on conflicts

| param                    | type [= default]                     | description                                                                                                                                                   |
| ------------------------ | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [**fs**](./fs)           | FsClient                             | a file system client                                                                                                                                          |
| **dir**                  | string                               | The [working tree](dir-vs-gitdir.md) directory path                                                                                                           |
| **gitdir**               | string = join(dir,'.git')            | The [git directory](dir-vs-gitdir.md) path                                                                                                                    |
| skip                     | boolean = false                      | Drop the stopped commit instead of committing its resolution                                                                                                  |
| committer                | Object                               | The committer of the replayed commits. If not specified, uses user.name and user.email config with current timestamp.                                         |
| committer.name           | string                               | Default is `user.name` config.                                                                                                                                |
| committer.email          | string                               | Default is `user.email` config.                                                                                                                               |
| committer.timestamp      | number = Math.floor(Date.now()/1000) | Set the committer timestamp field. This is the integer number of seconds since the Unix epoch (1970-01-01 00:00:00).                                          |
| committer.timezoneOffset | number                               | Set the committer timezone offset field. This is the difference, in minutes, from the current timezone to UTC. Default is `(new Date()).getTimezoneOffset()`. |
| mergeDriver              | MergeDriverCallback                  | a [merge driver](mergeDriver.md) implementation                                                                                                               |
| cache                    | object                               | a [cache](cache.md) object                                                                                                                                    |
| return                   | Promise\<RebaseResult\>              | Resolves successfully once the branch has been rebased                                                                                                        |
undefined
Like `git rebase --continue`: once the conflicts are resolved and the files are [added](./add.md), the stopped commit is created with its original author and the message in `.git/rebase-merge/message` (unless it was already committed, or nothing is left of it), and the remaining commits are replayed.
When `git rebase -i` stopped to edit a commit, staged changes amend that commit, as git does.
The next conflict stops the rebase again; when all commits are done, the branch is moved to the result and checked out.
In a rebase git started with `-i` or `--empty=stop`, a commit that becomes empty stops it too, as in git: that throws an `EmptyCommitError`, and continuing again drops the commit.

With `skip: true` the stopped commit is dropped instead, like `git rebase --skip`.

Throws an `UnmergedPathsError` while conflicts are still unresolved, a `RebaseLocalChangesError` over unstaged changes (git refuses them too), and a `NotFoundError` when no rebase is in progress.
A rebase it cannot finish throws a `RebaseNotSupportedError`, with nothing changed, so git can finish it: one whose to-do list (from `git rebase -i`) has commands other than `pick`, one started with `--autostash`, whose stashed changes git applies at the end, or one started with an option that changes how the rest is replayed (`--signoff`, `-S`, `--committer-date-is-author-date`, `--ignore-date`, `--empty=keep`, `--update-refs`, `-X`, `--strategy`, `--root`, or any other that git records in `.git/rebase-merge`).

Example Code:

```js live
await git.add({ fs, dir: '/tutorial', filepath: 'app.js' })
const { oid } = await git.continueRebase({ fs, dir: '/tutorial' })
console.log(oid)
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
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/api/continueRebase.js';
  }
})();
</script>