---
title: writeObject
sidebar_label: writeObject
id: version-1.x-writeObject
original_id: writeObject
---

> This command is overly complicated.
>
> If you know the type of object you are writing, use [`writeBlob`](./writeBlob.md), [`writeCommit`](./writeCommit.md), [`writeTag`](./writeTag.md), or [`writeTree`](./writeTree.md).

Write a git object directly

| param          | type [= default]                                                                        | description                                                                             |
| -------------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| [**fs**](./fs) | FsClient                                                                                | a file system client                                                                    |
| dir            | string                                                                                  | The [working tree](dir-vs-gitdir.md) directory path                                     |
| **gitdir**     | string = join(dir,'.git')                                                               | The [git directory](dir-vs-gitdir.md) path                                              |
| **object**     | string  &#124;  Uint8Array  &#124;  CommitObject  &#124;  TreeObject  &#124;  TagObject | The object to write.                                                                    |
| type           | 'blob'  &#124;  'tree'  &#124;  'commit'  &#124;  'tag'                                 | The kind of object to write.                                                            |
| format         | 'deflated'  &#124;  'wrapped'  &#124;  'content'  &#124;  'parsed' = 'parsed'           | What format the object is in. The possible choices are listed below.                    |
| oid            | string                                                                                  | If `format` is `'deflated'` then this param is required. Otherwise it is calculated.    |
| encoding       | string                                                                                  | If `type` is `'blob'` then `object` will be converted to a Uint8Array using `encoding`. |
| return         | Promise\<string\>                                                                       | Resolves successfully with the SHA-1 object id of the newly written object.             |

`format` can have the following values:

| param      | description                                                                                                                                                      |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 'deflated' | Treat `object` as the raw deflate-compressed buffer for an object, meaning can be written to `.git/objects/**` as-is.                                           |
| 'wrapped'  | Treat `object` as the inflated object buffer wrapped in the git object header. This is the raw buffer used when calculating the SHA-1 object id of a git object. |
| 'content'  | Treat `object` as the object buffer without the git header.                                                                                                      |
| 'parsed'   | Treat `object` as a parsed representation of the object.                                                                                                         |

If `format` is `'parsed'`, then `object` must match one of the schemas for `CommitObject`, `TreeObject`, `TagObject`, or a `string` (for blobs).


A git commit object.

```ts
type CommitObject = {
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
}
```



A git tree object. Trees represent a directory snapshot.

```ts
type TreeObject = Array<TreeEntry>;
```



A git annotated tag object.

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
  gpgsig?: string; // PGP signature (if present)
}
```


If `format` is `'content'`, `'wrapped'`, or `'deflated'`, `object` should be a `Uint8Array`.

Example Code:

```js live
// Manually create an annotated tag.
let sha = await git.resolveRef({ fs, dir: '/tutorial', ref: 'HEAD' })
console.log('commit', sha)

let oid = await git.writeObject({
  fs,
  dir: '/tutorial',
  type: 'tag',
  object: {
    object: sha,
    type: 'commit',
    tag: 'my-tag',
    tagger: {
      name: 'your name',
      email: 'email@example.com',
      timestamp: Math.floor(Date.now()/1000),
      timezoneOffset: new Date().getTimezoneOffset()
    },
    message: 'Optional message'
  }
})

console.log('tag', oid)
```


---

<details>
<summary><i>Tip: If you need a clean slate, expand and run this snippet to clean up the file system.</i></summary>

```js live
window.fs = new LightningFS('fs', { wipe: true })
window.pfs = window.fs.promises
console.log('done')
```
</details>

<script>
(function rewriteEditLink() {
  const el = document.querySelector('a.edit-page-link.button');
  if (el) {
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/api/writeObject.js';
  }
})();
</script>