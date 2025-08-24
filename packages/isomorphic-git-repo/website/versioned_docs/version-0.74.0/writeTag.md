---
title: writeTag
sidebar_label: writeTag
id: version-0.74.0-writeTag
original_id: writeTag
---

Write an annotated tag object directly

| param           | type [= default]          | description                                                                                               |
| --------------- | ------------------------- | --------------------------------------------------------------------------------------------------------- |
| core            | string = 'default'        | The plugin core identifier to use for plugin injection                                                    |
| fs [deprecated] | FileSystem                | The filesystem containing the git repo. Overrides the fs provided by the [plugin system](./plugin_fs.md). |
| dir             | string                    | The [working tree](dir-vs-gitdir.md) directory path                                                       |
| **gitdir**      | string = join(dir,'.git') | The [git directory](dir-vs-gitdir.md) path                                                                |
| **tag**         | TagObject                 | The object to write                                                                                       |
| return          | Promise\<string\>         | Resolves successfully with the SHA-1 object id of the newly written object                                |

```ts
type TagObject = {
  object: string; // SHA-1 object id of object being tagged
  type: 'blob' | 'tree' | 'commit' | 'tag'; // the type of the object being tagged
  tag: string; // the tag name
  tagger: {
    name: string; // the tagger's name
    email: string; // the tagger's email
    timestamp: number; // UTC Unix timestamp in seconds
    timezoneOffset: number; // timezone difference from UTC in minutes
  };
  message: string; // tag message
  signature?: string; // PGP signature (if present)
}
```

Example Code:

```js live
// Manually create an annotated tag.
let sha = await git.resolveRef({ dir: '$input((/))', ref: '$input((HEAD))' })
console.log('commit', sha)

let oid = await git.writeTag({
  dir: '$input((/))',
  tag: {
    object: sha,
    type: 'commit',
    tag: '$input((my-tag))',
    tagger: {
      name: '$input((your name))',
      email: '$input((email@example.com))',
      timestamp: Math.floor(Date.now()/1000),
      timezoneOffset: new Date().getTimezoneOffset()
    },
    message: '$input((Optional message))'
  }
})

console.log('tag', oid)
```

<script>
(function rewriteEditLink() {
  const el = document.querySelector('a.edit-page-link.button');
  if (el) {
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/commands/writeTag.js';
  }
})();
</script>