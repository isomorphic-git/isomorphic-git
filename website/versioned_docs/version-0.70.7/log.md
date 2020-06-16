---
title: log
sidebar_label: log
id: version-0.70.7-log
original_id: log
---

Get commit descriptions from the git history

| param           | type [= default]                      | description                                                                                               |
| --------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| core            | string = 'default'                    | The plugin core identifier to use for plugin injection                                                    |
| fs [deprecated] | FileSystem                            | The filesystem containing the git repo. Overrides the fs provided by the [plugin system](./plugin_fs.md). |
| dir             | string                                | The [working tree](dir-vs-gitdir.md) directory path                                                       |
| **gitdir**      | string = join(dir,'.git')             | The [git directory](dir-vs-gitdir.md) path                                                                |
| ref             | string = 'HEAD'                       | The commit to begin walking backwards through the history from                                            |
| depth           | number                                | Limit the number of commits returned. No limit by default.                                                |
| since           | Date                                  | Return history newer than the given date. Can be combined with `depth` to get whichever is shorter.       |
| signing         | boolean = false                       | Include the PGP signing payload                                                                           |
| return          | Promise\<Array\<CommitDescription\>\> | Resolves to an array of CommitDescription objects                                                         |

Returns an array of objects with a schema like this:

```ts
type CommitDescription = {
  oid: string; // SHA-1 object id of this commit
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
  payload?: string; // PGP signing payload (if requested)
}
```

Example Code:

```js live
let commits = await git.log({ dir: '$input((/))', depth: $input((5)), ref: '$input((master))' })
console.log(commits)
```

<script>
(function rewriteEditLink() {
  const el = document.querySelector('a.edit-page-link.button');
  if (el) {
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/commands/log.js';
  }
})();
</script>