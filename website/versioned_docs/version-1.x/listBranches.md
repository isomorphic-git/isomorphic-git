---
title: listBranches
sidebar_label: listBranches
id: version-1.x-listBranches
original_id: listBranches
---

List branches

| param          | type [= default]           | description                                                                             |
| -------------- | -------------------------- | --------------------------------------------------------------------------------------- |
| [**fs**](./fs) | FsClient                   | a file system client                                                                    |
| dir            | string                     | The [working tree](dir-vs-gitdir.md) directory path                                     |
| **gitdir**     | string = join(dir,'.git')  | The [git directory](dir-vs-gitdir.md) path                                              |
| remote         | string                     | Instead of the branches in `refs/heads`, list the branches in `refs/remotes/${remote}`. |
| return         | Promise\<Array\<string\>\> | Resolves successfully with an array of branch names                                     |

By default it lists local branches. If a 'remote' is specified, it lists the remote's branches. When listing remote branches, the HEAD branch is not filtered out, so it may be included in the list of results.

Note that specifying a remote does not actually contact the server and update the list of branches.
If you want an up-to-date list, first do a `fetch` to that remote.
(Which branch you fetch doesn't matter - the list of branches available on the remote is updated during the fetch handshake.)

Also note, that a branch is a reference to a commit. If you initialize a new repository it has no commits, so the
`listBranches` function will return an empty list, until you create the first commit.

Example Code:

```js live
let branches = await git.listBranches({ fs, dir: '/tutorial' })
console.log(branches)
let remoteBranches = await git.listBranches({ fs, dir: '/tutorial', remote: 'origin' })
console.log(remoteBranches)
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
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/api/listBranches.js';
  }
})();
</script>