---
title: readTag
sidebar_label: readTag
id: version-0.74.0-readTag
original_id: readTag
---

Read an annotated tag object directly

| param           | type [= default]          | description                                                                                               |
| --------------- | ------------------------- | --------------------------------------------------------------------------------------------------------- |
| core            | string = 'default'        | The plugin core identifier to use for plugin injection                                                    |
| fs [deprecated] | FileSystem                | The filesystem containing the git repo. Overrides the fs provided by the [plugin system](./plugin_fs.md). |
| dir             | string                    | The [working tree](dir-vs-gitdir.md) directory path                                                       |
| **gitdir**      | string = join(dir,'.git') | The [git directory](dir-vs-gitdir.md) path                                                                |
| **oid**         | string                    | The SHA-1 object id to get                                                                                |
| return          | Promise\<ReadTagResult\>  | Resolves successfully with a git object description                                                       |

The object returned has the following schema:

```ts
type ReadTagResult = {
  oid: string; // SHA-1 object id of this tag
  tag: TagObject; // the parsed tag object
  payload: string; // PGP signing payload
}
```

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
  signature?: string; // PGP signature (if present)
}
```

<script>
(function rewriteEditLink() {
  const el = document.querySelector('a.edit-page-link.button');
  if (el) {
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/commands/readTag.js';
  }
})();
</script>