---
title: removeNote
sidebar_label: removeNote
id: version-1.x-removeNote
original_id: removeNote
---

Remove an object note

| param                    | type [= default]                     | description                                                                                                                                                   |
| ------------------------ | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [**fs**](./fs)           | FsClient                             | a file system client                                                                                                                                          |
| [onSign](./onSign)       | SignCallback                         | a PGP signing implementation                                                                                                                                  |
| dir                      | string                               | The [working tree](dir-vs-gitdir.md) directory path                                                                                                           |
| **gitdir**               | string = join(dir,'.git')            | The [git directory](dir-vs-gitdir.md) path                                                                                                                    |
| ref                      | string                               | The notes ref to look under                                                                                                                                   |
| **oid**                  | string                               | The SHA-1 object id of the object to remove the note from.                                                                                                    |
| author                   | Object                               | The details about the author.                                                                                                                                 |
| author.name              | string                               | Default is `user.name` config.                                                                                                                                |
| author.email             | string                               | Default is `user.email` config.                                                                                                                               |
| author.timestamp         | number = Math.floor(Date.now()/1000) | Set the author timestamp field. This is the integer number of seconds since the Unix epoch (1970-01-01 00:00:00).                                             |
| author.timezoneOffset    | number                               | Set the author timezone offset field. This is the difference, in minutes, from the current timezone to UTC. Default is `(new Date()).getTimezoneOffset()`.    |
| committer                | Object = author                      | The details about the note committer, in the same format as the author parameter. If not specified, the author details are used.                              |
| committer.name           | string                               | Default is `user.name` config.                                                                                                                                |
| committer.email          | string                               | Default is `user.email` config.                                                                                                                               |
| committer.timestamp      | number = Math.floor(Date.now()/1000) | Set the committer timestamp field. This is the integer number of seconds since the Unix epoch (1970-01-01 00:00:00).                                          |
| committer.timezoneOffset | number                               | Set the committer timezone offset field. This is the difference, in minutes, from the current timezone to UTC. Default is `(new Date()).getTimezoneOffset()`. |
| signingKey               | string                               | Sign the tag object using this private PGP key.                                                                                                               |
| cache                    | object                               | a [cache](cache.md) object                                                                                                                                    |
| return                   | Promise\<string\>                    | Resolves successfully with the SHA-1 object id of the commit object for the note removal.                                                                     |


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
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/api/removeNote.js';
  }
})();
</script>