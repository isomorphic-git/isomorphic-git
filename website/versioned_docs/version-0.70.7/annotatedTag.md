---
title: annotatedTag
sidebar_label: annotatedTag
id: version-0.70.7-annotatedTag
original_id: annotatedTag
---

Create an annotated tag.

| param                 | type [= default]          | description                                                                                                                                                                  |
| --------------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| core                  | string = 'default'        | The plugin core identifier to use for plugin injection                                                                                                                       |
| fs [deprecated]       | FileSystem                | The filesystem containing the git repo. Overrides the fs provided by the [plugin system](./plugin_fs.md).                                                                    |
| dir                   | string                    | The [working tree](dir-vs-gitdir.md) directory path                                                                                                                          |
| **gitdir**            | string = join(dir,'.git') | The [git directory](dir-vs-gitdir.md) path                                                                                                                                   |
| **ref**               | string                    | What to name the tag                                                                                                                                                         |
| message               | string = ''               | The tag message to use.                                                                                                                                                      |
| object                | string = 'HEAD'           | The SHA-1 object id the tag points to. (Will resolve to a SHA-1 object id if value is a ref.) By default, the commit object which is referred by the current `HEAD` is used. |
| tagger                | object                    | The details about the tagger.                                                                                                                                                |
| tagger.name           | string                    | Default is `user.name` config.                                                                                                                                               |
| tagger.email          | string                    | Default is `user.email` config.                                                                                                                                              |
| tagger.date           | string                    | Set the tagger timestamp field. Default is the current date.                                                                                                                 |
| tagger.timestamp      | string                    | Set the tagger timestamp field. This is an alternative to using `date` using an integer number of seconds since the Unix epoch instead of a JavaScript date object.          |
| tagger.timezoneOffset | string                    | Set the tagger timezone offset field. This is the difference, in minutes, from the current timezone to UTC. Default is `(new Date()).getTimezoneOffset()`.                   |
| signature             | string                    | The signature attached to the tag object. (Mutually exclusive with the `signingKey` option.)                                                                                |
| signingKey            | string                    | Sign the tag object using this private PGP key. (Mutually exclusive with the `signature` option.)                                                                            |
| force                 | boolean = false           | Instead of throwing an error if a tag named `ref` already exists, overwrite the existing tag. Note that this option does not modify the original tag object itself.          |
| return                | Promise\<void\>           | Resolves successfully when filesystem operations are complete                                                                                                                |

Example Code:

```js live
await git.annotatedTag({
  dir: '$input((/))',
  ref: '$input((test-tag))',
  message: '$input((This commit is awesome))',
  tagger: {
    name: '$input((Mr. Test))',
    email: '$input((mrtest@example.com))'
  }
})
console.log('done')
```

<script>
(function rewriteEditLink() {
  const el = document.querySelector('a.edit-page-link.button');
  if (el) {
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/commands/annotatedTag.js';
  }
})();
</script>