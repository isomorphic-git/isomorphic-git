---
title: indexPack
sidebar_label: indexPack
id: version-0.70.7-indexPack
original_id: indexPack
---

Create the .idx file for a given .pack file

| param                | type [= default]          | description                                                                                               |
| -------------------- | ------------------------- | --------------------------------------------------------------------------------------------------------- |
| core                 | string = 'default'        | The plugin core identifier to use for plugin injection                                                    |
| fs [deprecated]      | FileSystem                | The filesystem containing the git repo. Overrides the fs provided by the [plugin system](./plugin_fs.md). |
| **dir**              | string                    | The [working tree](dir-vs-gitdir.md) directory path                                                       |
| **gitdir**           | string = join(dir,'.git') | The [git directory](dir-vs-gitdir.md) path                                                                |
| **filepath**         | string                    | The path to the .pack file to index                                                                       |
| emitter [deprecated] | EventEmitter              | Overrides the emitter set via the ['emitter' plugin](./plugin_emitter.md).                                |
| emitterPrefix        | string = ''               | Scope emitted events by prepending `emitterPrefix` to the event name.                                     |
| return               | Promise\<void\>           | Resolves when filesystem operations are complete                                                          |

To monitor progress events, see the documentation for the [`'emitter'` plugin](./plugin_emitter.md).

Example Code:

```js live
await git.indexPack({ dir: '$input((/))', filepath: '$input((pack-9cbd243a1caa4cb4bef976062434a958d82721a9.pack))' })
console.log('done')
```

<script>
(function rewriteEditLink() {
  const el = document.querySelector('a.edit-page-link.button');
  if (el) {
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/commands/indexPack.js';
  }
})();
</script>