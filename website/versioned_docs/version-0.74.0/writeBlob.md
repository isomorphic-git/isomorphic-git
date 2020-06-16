---
title: writeBlob
sidebar_label: writeBlob
id: version-0.74.0-writeBlob
original_id: writeBlob
---

Write a blob object directly

| param           | type [= default]          | description                                                                                               |
| --------------- | ------------------------- | --------------------------------------------------------------------------------------------------------- |
| core            | string = 'default'        | The plugin core identifier to use for plugin injection                                                    |
| fs [deprecated] | FileSystem                | The filesystem containing the git repo. Overrides the fs provided by the [plugin system](./plugin_fs.md). |
| dir             | string                    | The [working tree](dir-vs-gitdir.md) directory path                                                       |
| **gitdir**      | string = join(dir,'.git') | The [git directory](dir-vs-gitdir.md) path                                                                |
| **blob**        | Uint8Array                | The blob object to write                                                                                  |
| return          | Promise\<string\>         | Resolves successfully with the SHA-1 object id of the newly written object                                |

Example Code:

```js live
// Manually create a blob.
let oid = await git.writeBlob({
  dir: '$input((/))',
  blob: $input((new Uint8Array([])))
})

console.log('oid', oid) // should be 'e69de29bb2d1d6434b8b29ae775ad8c2e48c5391'
```

<script>
(function rewriteEditLink() {
  const el = document.querySelector('a.edit-page-link.button');
  if (el) {
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/commands/writeBlob.js';
  }
})();
</script>