---
title: rebase
sidebar_label: rebase
id: version-1.x-rebase
original_id: rebase
---

Rebase a branch onto another commit

| param                    | type [= default]                     | description                                                                                                                                                   |
| ------------------------ | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [**fs**](./fs)           | FsClient                             | a file system client                                                                                                                                          |
| dir                      | string                               | The [working tree](dir-vs-gitdir.md) directory path                                                                                                           |
| **gitdir**               | string = join(dir,'.git')            | The [git directory](dir-vs-gitdir.md) path                                                                                                                    |
| **upstream**             | string                               | The branch or commit to rebase onto; commits already in it (or whose change it already made) are not replayed                                                 |
| [onto](./onto)           | string = upstream                    | Replay the commits onto this commit instead of `upstream`                                                                                                     |
| branch                   | string                               | The branch to rebase, or a commit to rebase on a detached HEAD. Defaults to the current branch (or the detached HEAD).                                        |
| committer                | Object                               | The committer of the replayed commits. If not specified, uses user.name and user.email config with current timestamp.                                         |
| committer.name           | string                               | Default is `user.name` config.                                                                                                                                |
| committer.email          | string                               | Default is `user.email` config.                                                                                                                               |
| committer.timestamp      | number = Math.floor(Date.now()/1000) | Set the committer timestamp field. This is the integer number of seconds since the Unix epoch (1970-01-01 00:00:00).                                          |
| committer.timezoneOffset | number                               | Set the committer timezone offset field. This is the difference, in minutes, from the current timezone to UTC. Default is `(new Date()).getTimezoneOffset()`. |
| abortOnConflict          | boolean = true                       | If true, a conflict throws and nothing is changed. If false, the rebase stops with the conflict in the working tree and index, to be continued or aborted.    |
| mergeDriver              | MergeDriverCallback                  | a [merge driver](mergeDriver.md) implementation                                                                                                               |
| cache                    | object                               | a [cache](cache.md) object                                                                                                                                    |
| return                   | Promise\<RebaseResult\>              | Resolves successfully once the branch has been rebased                                                                                                        |

Returns an object with a schema like this:

```ts
type RebaseResult = {
  oid: string; // The commit the rebased branch now points to
  alreadyUpToDate?: boolean; // True if the branch was already up to date, so no commit was replayed
}
```

Like `git rebase [--onto <onto>] <upstream> [<branch>]`, this replays the commits that are in `branch` but not in `upstream` on top of `onto` (by default `upstream`), one cherry-pick at a time and in the order git uses, keeping each commit's author and message.
As in git, merge commits are left out, a commit that ends up adding nothing is dropped, and a commit that already sits where it would be replayed is kept as it is.
Like git, a commit whose change `upstream` already made is skipped: same files and modes, and either the same versions of them or the same patch id (the diff with three lines of context, whitespace ignored), so the same edit to a version that differs elsewhere counts too.
Skipping a commit git applies would drop a real change, so a patch id is only used when diffing each file from the start and from the end agrees (a good sign that git lines the changes up the same way), when the diff keeps no line that repeats in the file between two changes (git's diff may count such a line as changed, so it is not always the shortest diff), when the diff has at most 500 edits (past about 512, git's diff also stops looking for the shortest one), and when no attributes file could mark the file as binary (a `.gitattributes` in its directory or above, in either commit, the branch, HEAD or the working tree, `.git/info/attributes`, or `core.attributesFile`; the user's global attributes file is not read).
Otherwise the commit is replayed even if git would skip it, and then ends up empty, conflicts, or brings back a change `upstream` reverted.
The branch is then moved to the result and checked out.
A branch with only linear history on top of `onto`, where it forked from `upstream`, is up to date: it is only checked out.

`branch` is a local branch, `topic` or (a convenience git does not offer: git takes it for a commit) `refs/heads/topic`. Like git, anything else that names a commit (an oid, a tag, a remote-tracking branch) is rebased on a detached HEAD and no ref is changed; so is a detached HEAD when `branch` is not given.
Without `dir`, only the branch is moved: HEAD, the index and the working tree are left alone, and a conflict always throws.

Like git, it refuses to start over local changes to tracked files: a staged change, or an unstaged edit, deletion or mode change (the executable bit only counts when `core.fileMode` is true) throws a `RebaseLocalChangesError`.
Untracked files only stop it when they are in the way of the result, and untracked files and directories that `.gitignore` ignores are replaced, as git does, but only when the ignore rules are simple enough to be sure git ignores them too (no `!`, `[`, `\` or inner `**`, printable ASCII, no symbolic link as `.gitignore`); otherwise they are kept and the rebase is refused. A tracked directory that `upstream` turned into a file, or a file it turned into a directory, is replaced too. Nothing in or above a repository nested in the working tree (a submodule's checkout, say) is ever removed: the rebase is refused instead, even where git would remove it; a submodule that becomes a directory or a file, or the reverse, throws a `RebaseNotSupportedError`, with nothing changed. (git also stops at a commit in between whose files are in the way, even if a later commit removes them again; the library only checks the result.)

## Conflicts

By default a commit that does not apply cleanly throws a `MergeConflictError` and leaves the branch, the index and the working tree untouched.
A file that one side turns into a directory (or the reverse) while the other side changes or deletes it is not merged yet: that throws a `MergeNotSupportedError`, with nothing changed, where git merges it or stops.

With `abortOnConflict: false` the rebase stops where `git rebase` would: HEAD is detached at the last commit that applied, the conflict is written to the working tree and the index (see [merge](./merge.md)), and the rebase is recorded in `.git/rebase-merge` with the files git uses.
When writing the commit's files would lose an untracked file in their way, it throws a `RebaseLocalChangesError` with nothing changed (a rebase already stopped stays as it was), where git stops before that commit with the rebase in progress.
From there, resolve the conflicts and [add](./add.md) the files, then call [continueRebase](./continueRebase.md) (or run `git rebase --continue`) to go on, or [abortRebase](./abortRebase.md) (or `git rebase --abort`) to put the branch back.
[commit](./commit.md) during a stopped rebase takes the stopped commit's message, without the list of conflicted files (as `git commit` does when it opens an editor; `git commit --no-edit` keeps it), and like `git commit` the author is whoever commits.

Example Code:

```js live
// Rebase the current branch onto main
const { oid } = await git.rebase({ fs, dir: '/tutorial', upstream: 'main' })
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
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/api/rebase.js';
  }
})();
</script>