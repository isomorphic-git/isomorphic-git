---
title: addNote
sidebar_label: addNote
id: version-0.75.0-addNote
original_id: addNote
---

Add or update an object note

| param                 | type [= default]           | description                                                                                                                                                         |
| --------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| core                  | string = 'default'         | The plugin core identifier to use for plugin injection                                                                                                              |
| fs [deprecated]       | FileSystem                 | The filesystem containing the git repo. Overrides the fs provided by the [plugin system](./plugin_fs.md).                                                           |
| dir                   | string                     | The [working tree](dir-vs-gitdir.md) directory path                                                                                                                 |
| **gitdir**            | string = join(dir,'.git')  | The [git directory](dir-vs-gitdir.md) path                                                                                                                          |
| ref                   | string                     | The notes ref to look under                                                                                                                                         |
| oid                   | string                     | The SHA-1 object id of the object to add the note to.                                                                                                               |
| note                  | string  &#124;  Uint8Array | The note to add                                                                                                                                                     |
| force                 | boolean                    | Over-write note if it already exists.                                                                                                                               |
| author                | Object                     | The details about the author.                                                                                                                                       |
| author.name           | string                     | Default is `user.name` config.                                                                                                                                      |
| author.email          | string                     | Default is `user.email` config.                                                                                                                                     |
| author.date           | string                     | Set the author timestamp field. Default is the current date.                                                                                                        |
| author.timestamp      | string                     | Set the author timestamp field. This is an alternative to using `date` using an integer number of seconds since the Unix epoch instead of a JavaScript date object. |
| author.timezoneOffset | string                     | Set the author timezone offset field. This is the difference, in minutes, from the current timezone to UTC. Default is `(new Date()).getTimezoneOffset()`.          |
| committer             | Object = author            | The details about the note committer, in the same format as the author parameter. If not specified, the author details are used.                                    |
| signingKey            | string                     | Sign the note commit using this private PGP key.                                                                                                                    |
| return                | Promise\<string\>          | Resolves successfully with the SHA-1 object id of the commit object for the added note.                                                                             |

<script>
(function rewriteEditLink() {
  const el = document.querySelector('a.edit-page-link.button');
  if (el) {
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/commands/addNote.js';
  }
})();
</script>