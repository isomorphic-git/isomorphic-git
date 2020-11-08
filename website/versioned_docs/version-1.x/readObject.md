---
title: readObject
sidebar_label: readObject
id: version-1.x-readObject
original_id: readObject
---

> This command is overly complicated.
>
> If you know the type of object you are reading, use [`readBlob`](./readBlob.md), [`readCommit`](./readCommit.md), [`readTag`](./readTag.md), or [`readTree`](./readTree.md).

Read a git object directly by its SHA-1 object id

| param          | type [= default]                                                              | description                                                                                                                                                                     |
| -------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [**fs**](./fs) | FsClient                                                                      | a file system client                                                                                                                                                            |
| dir            | string                                                                        | The [working tree](dir-vs-gitdir.md) directory path                                                                                                                             |
| **gitdir**     | string = join(dir,'.git')                                                     | The [git directory](dir-vs-gitdir.md) path                                                                                                                                      |
| **oid**        | string                                                                        | The SHA-1 object id to get                                                                                                                                                      |
| format         | 'deflated'  &#124;  'wrapped'  &#124;  'content'  &#124;  'parsed' = 'parsed' | What format to return the object in. The choices are described in more detail below.                                                                                            |
| filepath       | string                                                                        | Don't return the object with `oid` itself, but resolve `oid` to a tree and then return the object at that filepath. To return the root directory of a tree set filepath to `''` |
| encoding       | string                                                                        | A convenience argument that only affects blobs. Instead of returning `object` as a buffer, it returns a string parsed using the given encoding.                                 |
| cache          | object                                                                        | a [cache](cache.md) object                                                                                                                                                      |
| return         | Promise\<ReadObjectResult\>                                                   | Resolves successfully with a git object description                                                                                                                             |

```ts
type ReadObjectResult = DeflatedObject;
```

Regarding `ReadObjectResult`:

- `oid` will be the same as the `oid` argument unless the `filepath` argument is provided, in which case it will be the oid of the tree or blob being returned.
- `type` of deflated objects is `'deflated'`, and `type` of wrapped objects is `'wrapped'`
- `format` is usually, but not always, the format you requested. Packfiles do not store each object individually compressed so if you end up reading the object from a packfile it will be returned in format 'content' even if you requested 'deflated' or 'wrapped'.
- `object` will be an actual Object if format is 'parsed' and the object is a commit, tree, or annotated tag. Blobs are still formatted as Buffers unless an encoding is provided in which case they'll be strings. If format is anything other than 'parsed', object will be a Buffer.
- `source` is the name of the packfile or loose object file where the object was found.

The `format` parameter can have the following values:

| param      | description                                                                                                                                                                                               |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 'deflated' | Return the raw deflate-compressed buffer for an object if possible. Useful for efficiently shuffling around loose objects when you don't care about the contents and can save time by not inflating them. |
| 'wrapped'  | Return the inflated object buffer wrapped in the git object header if possible. This is the raw data used when calculating the SHA-1 object id of a git object.                                           |
| 'content'  | Return the object buffer without the git header.                                                                                                                                                          |
| 'parsed'   | Returns a parsed representation of the object.                                                                                                                                                            |

The result will be in one of the following schemas:

## `'deflated'` format


```ts
type DeflatedObject = {
  oid: string;
  type: 'deflated';
  format: 'deflated';
  object: Uint8Array;
  source?: string;
}
```


## `'wrapped'` format


```ts
type WrappedObject = {
  oid: string;
  type: 'wrapped';
  format: 'wrapped';
  object: Uint8Array;
  source?: string;
}
```


## `'content'` format


```ts
type RawObject = {
  oid: string;
  type: 'blob' | 'commit' | 'tree' | 'tag';
  format: 'content';
  object: Uint8Array;
  source?: string;
}
```


## `'parsed'` format

### parsed `'blob'` type


```ts
type ParsedBlobObject = {
  oid: string;
  type: 'blob';
  format: 'parsed';
  object: string;
  source?: string;
}
```


### parsed `'commit'` type


```ts
type ParsedCommitObject = {
  oid: string;
  type: 'commit';
  format: 'parsed';
  object: CommitObject;
  source?: string;
}
```


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


### parsed `'tree'` type


```ts
type ParsedTreeObject = {
  oid: string;
  type: 'tree';
  format: 'parsed';
  object: TreeObject;
  source?: string;
}
```


A git tree object. Trees represent a directory snapshot.

```ts
type TreeObject = Array<TreeEntry>;
```


An entry from a git tree object. Files are called 'blobs' and directories are called 'trees'.

```ts
type TreeEntry = {
  mode: string; // the 6 digit hexadecimal mode
  path: string; // the name of the file or directory
  oid: string; // the SHA-1 object id of the blob or tree
  type: 'commit' | 'blob' | 'tree'; // the type of object
}
```


### parsed `'tag'` type


```ts
type ParsedTagObject = {
  oid: string;
  type: 'tag';
  format: 'parsed';
  object: TagObject;
  source?: string;
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


Example Code:

```js live
// Given a ransom SHA-1 object id, figure out what it is
let { type, object } = await git.readObject({
  fs,
  dir: '/tutorial',
  oid: '0698a781a02264a6f37ba3ff41d78067eaf0f075'
})
switch (type) {
  case 'commit': {
    console.log(object)
    break
  }
  case 'tree': {
    console.log(object)
    break
  }
  case 'blob': {
    console.log(object)
    break
  }
  case 'tag': {
    console.log(object)
    break
  }
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
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/api/readObject.js';
  }
})();
</script>