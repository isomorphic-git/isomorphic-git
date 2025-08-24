---
title: hashBlob
sidebar_label: hashBlob
id: version-1.x-hashBlob
original_id: hashBlob
---

Compute what the SHA-1 object id of a file would be

| param      | type [= default]           | description                                                                                                  |
| ---------- | -------------------------- | ------------------------------------------------------------------------------------------------------------ |
| **object** | Uint8Array  &#124;  string | The object to write. If `object` is a String then it will be converted to a Uint8Array using UTF-8 encoding. |
| return     | Promise\<HashBlobResult\>  | Resolves successfully with the SHA-1 object id and the wrapped object Uint8Array.                            |

The object returned has the following schema:

```ts
type HashBlobResult = {
  oid: string; // The SHA-1 object id
  type: 'blob'; // The type of the object
  object: Uint8Array; // The wrapped git object (the thing that is hashed)
  format: 'wrapped'; // The format of the object
}
```

Example Code:

```js live
let { oid, type, object, format } = await git.hashBlob({
  object: 'Hello world!',
})

console.log('oid', oid)
console.log('type', type)
console.log('object', object)
console.log('format', format)
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
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/api/hashBlob.js';
  }
})();
</script>