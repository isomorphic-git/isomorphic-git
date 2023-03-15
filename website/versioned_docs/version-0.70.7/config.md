---
title: config
sidebar_label: config
id: version-0.70.7-config
original_id: config
---

Read and/or write to the git config files.

| param           | type [= default]          | description                                                                                               |
| --------------- | ------------------------- | --------------------------------------------------------------------------------------------------------- |
| core            | string = 'default'        | The plugin core identifier to use for plugin injection                                                    |
| fs [deprecated] | FileSystem                | The filesystem containing the git repo. Overrides the fs provided by the [plugin system](./plugin_fs.md). |
| dir             | string                    | The [working tree](dir-vs-gitdir.md) directory path                                                       |
| **gitdir**      | string = join(dir,'.git') | The [git directory](dir-vs-gitdir.md) path                                                                |
| **path**        | string                    | The key of the git config entry                                                                           |
| value           | string                    | (Optional) A value to store at that path                                                                  |
| all             | boolean = false           | If the config file contains multiple values, return them all as an array.                                 |
| append          | boolean = false           | If true, will append rather than replace when setting (use with multi-valued config options).             |
| return          | Promise\<any\>            | Resolves with the config value                                                                            |

*Caveats:*
- Currently only the local `$GIT_DIR/config` file can be read or written. However support for the global `~/.gitconfig` and system `$(prefix)/etc/gitconfig` will be added in the future.
- The current parser does not support the more exotic features of the git-config file format such as `[include]` and `[includeIf]`.

Example Code:

```js live
// Write config value
await git.config({
  dir: '$input((/))',
  path: '$input((user.name))',
  value: '$input((Mr. Test))'
})

// Read config value
let value = await git.config({
  dir: '$input((/))',
  path: '$input((user.name))'
})
console.log(value)
```

<script>
(function rewriteEditLink() {
  const el = document.querySelector('a.edit-page-link.button');
  if (el) {
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/commands/config.js';
  }
})();
</script>