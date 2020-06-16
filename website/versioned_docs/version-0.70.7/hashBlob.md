---
title: hashBlob
sidebar_label: hashBlob
id: version-0.70.7-hashBlob
original_id: hashBlob
---

Compute what the SHA-1 object id of a file would be

| param      | type [= default]            | description                                                                                              |
| ---------- | --------------------------- | -------------------------------------------------------------------------------------------------------- |
| core       | string = 'default'          | The plugin core identifier to use for plugin injection                                                   |
| **object** | Buffer  &#124;  string      | The object to write. If `object` is a String then it will be converted to a Buffer using UTF-8 encoding. |
| return     | Promise\<{HashBlobResult}\> | Resolves successfully with the SHA-1 object id and the wrapped object Buffer.                            |

The object returned has the following schema:

```ts
type HashBlobResult = {
  oid: string; // The SHA-1 object id
  type: 'blob'; // The type of the object
  object: Buffer; // The wrapped git object (the thing that is hashed)
  format: 'wrapped'; // The format of the object
}
```

Example Code:

```js live
let { oid, type, object, format } = await git.hashBlob({
  object: '$input((Hello world!))',
})

console.log('oid', oid)
console.log('type', type)
console.log('object', object)
console.log('format', format)
```

<script>
(function rewriteEditLink() {
  const el = document.querySelector('a.edit-page-link.button');
  if (el) {
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/commands/hashBlob.js';
  }
})();
</script>