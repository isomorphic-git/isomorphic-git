---
title: readNote
sidebar_label: readNote
id: version-0.75.0-readNote
original_id: readNote
---

Read the contents of a note

| param           | type [= default]          | description                                                                                               |
| --------------- | ------------------------- | --------------------------------------------------------------------------------------------------------- |
| core            | string = 'default'        | The plugin core identifier to use for plugin injection                                                    |
| fs [deprecated] | FileSystem                | The filesystem containing the git repo. Overrides the fs provided by the [plugin system](./plugin_fs.md). |
| dir             | string                    | The [working tree](dir-vs-gitdir.md) directory path                                                       |
| **gitdir**      | string = join(dir,'.git') | The [git directory](dir-vs-gitdir.md) path                                                                |
| ref             | string                    | The notes ref to look under                                                                               |
| oid             | string                    | The SHA-1 object id of the object to get the note for.                                                    |
| return          | Promise\<Buffer\>         | Resolves successfully with note contents as a Buffer.                                                     |

<script>
(function rewriteEditLink() {
  const el = document.querySelector('a.edit-page-link.button');
  if (el) {
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/commands/readNote.js';
  }
})();
</script>