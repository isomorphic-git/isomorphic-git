---
title: listNotes
sidebar_label: listNotes
id: version-0.75.0-listNotes
original_id: listNotes
---

List all the object notes

| param           | type [= default]                                   | description                                                                                                            |
| --------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| core            | string = 'default'                                 | The plugin core identifier to use for plugin injection                                                                 |
| fs [deprecated] | FileSystem                                         | The filesystem containing the git repo. Overrides the fs provided by the [plugin system](./plugin_fs.md).              |
| dir             | string                                             | The [working tree](dir-vs-gitdir.md) directory path                                                                    |
| **gitdir**      | string = join(dir,'.git')                          | The [git directory](dir-vs-gitdir.md) path                                                                             |
| ref             | string                                             | The notes ref to look under                                                                                            |
| return          | Promise\<Array\<{target: string, note: string}\>\> | Resolves successfully with an array of entries containing SHA-1 object ids of the note and the object the note targets |

<script>
(function rewriteEditLink() {
  const el = document.querySelector('a.edit-page-link.button');
  if (el) {
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/commands/listNotes.js';
  }
})();
</script>