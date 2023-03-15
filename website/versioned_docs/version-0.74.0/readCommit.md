---
title: readCommit
sidebar_label: readCommit
id: version-0.74.0-readCommit
original_id: readCommit
---

Read a commit object directly

| param           | type [= default]            | description                                                                                               |
| --------------- | --------------------------- | --------------------------------------------------------------------------------------------------------- |
| core            | string = 'default'          | The plugin core identifier to use for plugin injection                                                    |
| fs [deprecated] | FileSystem                  | The filesystem containing the git repo. Overrides the fs provided by the [plugin system](./plugin_fs.md). |
| dir             | string                      | The [working tree](dir-vs-gitdir.md) directory path                                                       |
| **gitdir**      | string = join(dir,'.git')   | The [git directory](dir-vs-gitdir.md) path                                                                |
| **oid**         | string                      | The SHA-1 object id to get. Annotated tags are peeled.                                                    |
| return          | Promise\<ReadCommitResult\> | Resolves successfully with a git commit object                                                            |

The object returned has the following schema:

```ts
type ReadCommitResult = {
  oid: string; // SHA-1 object id of this commit
  commit: CommitObject; // the parsed commit object
  payload: string; // PGP signing payload
}
```

```ts
type CommitObject = {
  message: string; // Commit message
  tree: string; // SHA-1 object id of corresponding file tree
  parent: Array<string>; // an array of zero or more SHA-1 object ids
  author: {
    name: string; // The author's name
    email: string; // The author's email
    timestamp: number; // UTC Unix timestamp in seconds
    timezoneOffset: number; // Timezone difference from UTC in minutes
  };
  committer: {
    name: string; // The committer's name
    email: string; // The committer's email
    timestamp: number; // UTC Unix timestamp in seconds
    timezoneOffset: number; // Timezone difference from UTC in minutes
  };
  gpgsig?: string; // PGP signature (if present)
}
```

Example Code:

```js live
// Read a commit object
let sha = await git.resolveRef({ dir: '$input((/))', ref: '$input((master))' })
console.log(sha)
let commit = await git.readCommit({ dir: '$input((/))', oid: sha })
console.log(commit)
```

<script>
(function rewriteEditLink() {
  const el = document.querySelector('a.edit-page-link.button');
  if (el) {
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/commands/readCommit.js';
  }
})();
</script>