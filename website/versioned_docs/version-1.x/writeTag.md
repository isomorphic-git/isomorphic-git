---
title: writeTag
sidebar_label: writeTag
id: version-1.x-writeTag
original_id: writeTag
---

Write an annotated tag object directly

| param          | type [= default]          | description                                                                |
| -------------- | ------------------------- | -------------------------------------------------------------------------- |
| [**fs**](./fs) | FsClient                  | a file system client                                                       |
| dir            | string                    | The [working tree](dir-vs-gitdir.md) directory path                        |
| **gitdir**     | string = join(dir,'.git') | The [git directory](dir-vs-gitdir.md) path                                 |
| **tag**        | TagObject                 | The object to write                                                        |
| return         | Promise\<string\>         | Resolves successfully with the SHA-1 object id of the newly written object |

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
// Manually create an annotated tag.
let sha = await git.resolveRef({ fs, dir: '/tutorial', ref: 'HEAD' })
console.log('commit', sha)

let oid = await git.writeTag({
  fs,
  dir: '/tutorial',
  tag: {
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
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/api/writeTag.js';
  }
})();
</script>