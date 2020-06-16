---
title: expandRef
sidebar_label: expandRef
id: version-0.70.7-expandRef
original_id: expandRef
---

Expand an abbreviated ref to its full name

| param           | type [= default]          | description                                                                                               |
| --------------- | ------------------------- | --------------------------------------------------------------------------------------------------------- |
| core            | string = 'default'        | The plugin core identifier to use for plugin injection                                                    |
| fs [deprecated] | FileSystem                | The filesystem containing the git repo. Overrides the fs provided by the [plugin system](./plugin_fs.md). |
| dir             | string                    | The [working tree](dir-vs-gitdir.md) directory path                                                       |
| **gitdir**      | string = join(dir,'.git') | The [git directory](dir-vs-gitdir.md) path                                                                |
| **ref**         | string                    | The ref to expand (like "v1.0.0")                                                                         |
| return          | Promise\<string\>         | Resolves successfully with a full ref name ("refs/tags/v1.0.0")                                           |

Example Code:

```js live
let fullRef = await git.expandRef({ dir: '$input((/))', ref: '$input((master))'})
console.log(fullRef)
```

<script>
(function rewriteEditLink() {
  const el = document.querySelector('a.edit-page-link.button');
  if (el) {
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/commands/expandRef.js';
  }
})();
</script>