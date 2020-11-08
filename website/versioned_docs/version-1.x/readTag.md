---
title: readTag
sidebar_label: readTag
id: version-1.x-readTag
original_id: readTag
---

Read an annotated tag object directly

| param          | type [= default]          | description                                         |
| -------------- | ------------------------- | --------------------------------------------------- |
| [**fs**](./fs) | FsClient                  | a file system client                                |
| dir            | string                    | The [working tree](dir-vs-gitdir.md) directory path |
| **gitdir**     | string = join(dir,'.git') | The [git directory](dir-vs-gitdir.md) path          |
| **oid**        | string                    | The SHA-1 object id to get                          |
| cache          | object                    | a [cache](cache.md) object                          |
| return         | Promise\<ReadTagResult\>  | Resolves successfully with a git object description |

The object returned has the following schema:

```ts
type ReadTagResult = {
  oid: string; // SHA-1 object id of this tag
  tag: TagObject; // the parsed tag object
  payload: string; // PGP signing payload
}
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
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/api/readTag.js';
  }
})();
</script>