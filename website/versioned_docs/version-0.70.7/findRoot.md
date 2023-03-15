---
title: findRoot
sidebar_label: findRoot
id: version-0.70.7-findRoot
original_id: findRoot
---

Find the root git directory

| param           | type [= default]   | description                                                                                               |
| --------------- | ------------------ | --------------------------------------------------------------------------------------------------------- |
| core            | string = 'default' | The plugin core identifier to use for plugin injection                                                    |
| fs [deprecated] | FileSystem         | The filesystem containing the git repo. Overrides the fs provided by the [plugin system](./plugin_fs.md). |
| **filepath**    | string             | The file directory to start searching in.                                                                 |
| return          | Promise\<string\>  | Resolves successfully with a root git directory path                                                      |
| throws          | Error              | [GitRootNotFoundError](./errors.md#gitrootnotfounderror)                                                  |

Starting at `filepath`, walks upward until it finds a directory that contains a subdirectory called '.git'.

Example Code:

```js live
let gitroot = await git.findRoot({
  filepath: '$input((/path/to/some/gitrepo/path/to/some/file.txt))'
})
console.log(gitroot) // '/path/to/some/gitrepo'
```

<script>
(function rewriteEditLink() {
  const el = document.querySelector('a.edit-page-link.button');
  if (el) {
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/commands/findRoot.js';
  }
})();
</script>