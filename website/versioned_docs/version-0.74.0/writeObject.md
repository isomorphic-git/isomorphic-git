---
title: writeObject
sidebar_label: writeObject
id: version-0.74.0-writeObject
original_id: writeObject
---

> **Deprecated**
> This command is overly complicated.
>
> If you know the type of object you are writing, use [`writeBlob`](./writeBlob.md), [`writeCommit`](./writeCommit.md), [`writeTag`](./writeTag.md), or [`writeTree`](./writeTree.md).

Write a git object directly

| param           | type [= default]                                                              | description                                                                                                                                                                     |
| --------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| core            | string = 'default'                                                            | The plugin core identifier to use for plugin injection                                                                                                                          |
| fs [deprecated] | FileSystem                                                                    | The filesystem containing the git repo. Overrides the fs provided by the [plugin system](./plugin_fs.md).                                                                       |
| dir             | string                                                                        | The [working tree](dir-vs-gitdir.md) directory path                                                                                                                             |
| **gitdir**      | string = join(dir,'.git')                                                     | The [git directory](dir-vs-gitdir.md) path                                                                                                                                      |
| **object**      | Buffer  &#124;  string  &#124;  Object                                        | The object to write.                                                                                                                                                            |
| **type**        | 'blob'  &#124;  'tree'  &#124;  'commit'  &#124;  'tag'                       | The kind of object to write.                                                                                                                                                    |
| format          | 'deflated'  &#124;  'wrapped'  &#124;  'content'  &#124;  'parsed' = 'parsed' | What format the object is in. The possible choices are listed below.                                                                                                            |
| **oid**         | string                                                                        | If `format` is `'deflated'` then this param is required. Otherwise it is calculated.                                                                                            |
| filepath        | string                                                                        | Don't return the object with `oid` itself, but resolve `oid` to a tree and then return the object at that filepath. To return the root directory of a tree set filepath to `''` |
| encoding        | string                                                                        | If `type` is `'blob'` then `content` will be converted to a Buffer using `encoding`.                                                                                            |
| return          | Promise\<string\>                                                             | Resolves successfully with the SHA-1 object id of the newly written object.                                                                                                     |

`format` can have the following values:

| param      | description                                                                                                                                                      |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 'deflated' | Treat `object` as the raw deflate-compressed buffer for an object, meaning can be written to `.git/objects/**` as-is.                                           |
| 'wrapped'  | Treat `object` as the inflated object buffer wrapped in the git object header. This is the raw buffer used when calculating the SHA-1 object id of a git object. |
| 'content'  | Treat `object` as the object buffer without the git header.                                                                                                      |
| 'parsed'   | Treat `object` as a parsed representation of the object.                                                                                                         |

If `format` is `'parsed'`, then `object` must match one of the schemas for `CommitDescription`, `TreeDescription`, or `TagDescription` described in...
shucks I haven't written that page yet. :( Well, described in the [TypeScript definition](https://github.com/isomorphic-git/isomorphic-git/blob/master/src/index.d.ts) for now.

Example Code:

```js live
// Manually create an annotated tag.
let sha = await git.resolveRef({ dir: '$input((/))', ref: '$input((HEAD))' })
console.log('commit', sha)

let oid = await git.writeObject({
  dir: '$input((/))',
  type: 'tag',
  object: {
    object: sha,
    type: 'commit',
    tag: '$input((my-tag))',
    tagger: {
      name: '$input((your name))',
      email: '$input((email@example.com))',
      timestamp: Math.floor(Date.now()/1000),
      timezoneOffset: new Date().getTimezoneOffset()
    },
    message: '$input((Optional message))',
    signature: ''
  }
})

console.log('tag', oid)
```

<script>
(function rewriteEditLink() {
  const el = document.querySelector('a.edit-page-link.button');
  if (el) {
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/commands/writeObject.js';
  }
})();
</script>