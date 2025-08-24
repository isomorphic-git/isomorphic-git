---
title: commit
sidebar_label: commit
id: version-0.70.7-commit
original_id: commit
---

Create a new commit

| param                 | type [= default]          | description                                                                                                                                                                                          |
| --------------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| core                  | string = 'default'        | The plugin core identifier to use for plugin injection                                                                                                                                               |
| fs [deprecated]       | FileSystem                | The filesystem containing the git repo. Overrides the fs provided by the [plugin system](./plugin_fs.md).                                                                                            |
| dir                   | string                    | The [working tree](dir-vs-gitdir.md) directory path                                                                                                                                                  |
| **gitdir**            | string = join(dir,'.git') | The [git directory](dir-vs-gitdir.md) path                                                                                                                                                           |
| **message**           | string                    | The commit message to use.                                                                                                                                                                           |
| author                | Object                    | The details about the author.                                                                                                                                                                        |
| author.name           | string                    | Default is `user.name` config.                                                                                                                                                                       |
| author.email          | string                    | Default is `user.email` config.                                                                                                                                                                      |
| author.date           | string                    | Set the author timestamp field. Default is the current date.                                                                                                                                         |
| author.timestamp      | string                    | Set the author timestamp field. This is an alternative to using `date` using an integer number of seconds since the Unix epoch instead of a JavaScript date object.                                  |
| author.timezoneOffset | string                    | Set the author timezone offset field. This is the difference, in minutes, from the current timezone to UTC. Default is `(new Date()).getTimezoneOffset()`.                                           |
| committer             | Object = author           | The details about the commit committer, in the same format as the author parameter. If not specified, the author details are used.                                                                   |
| signingKey            | string                    | Sign the tag object using this private PGP key.                                                                                                                                                      |
| dryRun                | boolean = false           | If true, simulates making a commit so you can test whether it would succeed. Implies `noUpdateBranch`.                                                                                               |
| noUpdateBranch        | boolean = false           | If true, does not update the branch pointer after creating the commit.                                                                                                                               |
| ref                   | string                    | The fully expanded name of the branch to commit to. Default is the current branch pointed to by HEAD. (TODO: fix it so it can expand branch names without throwing if the branch doesn't exist yet.) |
| parent                | Array\<string\>           | The SHA-1 object ids of the commits to use as parents. If not specified, the commit pointed to by `ref` is used.                                                                                     |
| tree                  | string                    | The SHA-1 object id of the tree to use. If not specified, a new tree object is created from the current git index.                                                                                   |
| return                | Promise\<string\>         | Resolves successfully with the SHA-1 object id of the newly created commit.                                                                                                                          |

Example Code:

```js live
let sha = await git.commit({
  dir: '$input((/))',
  author: {
    name: '$input((Mr. Test))',
    email: '$input((mrtest@example.com))'
  },
  message: '$input((Added the a.txt file))'
})
console.log(sha)
```

<script>
(function rewriteEditLink() {
  const el = document.querySelector('a.edit-page-link.button');
  if (el) {
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/commands/commit.js';
  }
})();
</script>