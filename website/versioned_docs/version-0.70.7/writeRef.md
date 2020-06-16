---
title: writeRef
sidebar_label: writeRef
id: version-0.70.7-writeRef
original_id: writeRef
---

Write a ref which refers to the specified SHA-1 object id, or a symbolic ref which refers to the specified ref.

| param           | type [= default]          | description                                                                                               |
| --------------- | ------------------------- | --------------------------------------------------------------------------------------------------------- |
| core            | string = 'default'        | The plugin core identifier to use for plugin injection                                                    |
| fs [deprecated] | FileSystem                | The filesystem containing the git repo. Overrides the fs provided by the [plugin system](./plugin_fs.md). |
| dir             | string                    | The [working tree](dir-vs-gitdir.md) directory path                                                       |
| **gitdir**      | string = join(dir,'.git') | The [git directory](dir-vs-gitdir.md) path                                                                |
| **ref**         | string                    | The name of the ref to write                                                                              |
| **value**       | string                    | When `symbolic` is false, a ref or an SHA-1 object id. When true, a ref starting with `refs/`.            |
| force           | boolean = false           | Instead of throwing an error if a ref named `ref` already exists, overwrite the existing ref.             |
| symbolic        | boolean = false           | Whether the ref is symbolic or not.                                                                       |
| return          | Promise\<void\>           | Resolves successfully when filesystem operations are complete                                             |

Example Code:

```js live
await git.writeRef({
  dir: '$input((/))',
  ref: '$input((refs/heads/another-branch))',
  value: '$input((HEAD))'
})
await git.writeRef({
  dir: '$input((/))',
  ref: '$input((HEAD))',
  value: '$input((refs/heads/another-branch))',
  force: $input((true)),
  symbolic: $input((true))
})
console.log('done')
```

<script>
(function rewriteEditLink() {
  const el = document.querySelector('a.edit-page-link.button');
  if (el) {
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/commands/writeRef.js';
  }
})();
</script>