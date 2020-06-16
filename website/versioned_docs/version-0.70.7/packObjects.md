---
title: packObjects
sidebar_label: packObjects
id: version-0.70.7-packObjects
original_id: packObjects
---

Create a packfile from an array of SHA-1 object ids

| param           | type [= default]               | description                                                                                               |
| --------------- | ------------------------------ | --------------------------------------------------------------------------------------------------------- |
| core            | string = 'default'             | The plugin core identifier to use for plugin injection                                                    |
| fs [deprecated] | FileSystem                     | The filesystem containing the git repo. Overrides the fs provided by the [plugin system](./plugin_fs.md). |
| dir             | string                         | The [working tree](dir-vs-gitdir.md) directory path                                                       |
| **gitdir**      | string = join(dir, '.git')     | The [git directory](dir-vs-gitdir.md) path                                                                |
| **oids**        | Array\<string\>                | An array of SHA-1 object ids to be included in the packfile                                               |
| write           | boolean = false                | Whether to save the packfile to disk or not                                                               |
| return          | Promise\<PackObjectsResponse\> | Resolves successfully when the packfile is ready with the filename and buffer                             |

The packObjects command returns an object with two properties:

```ts
type PackObjectsResponse = {
  filename: string; // The suggested filename for the packfile if you want to save it to disk somewhere. It includes the packfile SHA.
  packfile?: Buffer; // The packfile contents. Not present if `write` parameter was true, in which case the packfile was written straight to disk.
}
```

Example Code:

```js live
// Create a packfile containing only an empty tree
let { packfile } = await git.packObjects({
  dir: '$input((/))',
  oids: [$input(('4b825dc642cb6eb9a060e54bf8d69288fbee4904'))]
})
console.log(packfile)
```

<script>
(function rewriteEditLink() {
  const el = document.querySelector('a.edit-page-link.button');
  if (el) {
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/commands/packObjects.js';
  }
})();
</script>