---
title: readObject
sidebar_label: readObject
id: version-0.74.0-readObject
original_id: readObject
---

> **Deprecated**
> This command is overly complicated.
>
> If you know the type of object you are reading, use [`readBlob`](./readBlob.md), [`readCommit`](./readCommit.md), [`readTag`](./readTag.md), or [`readTree`](./readTree.md).

Read a git object directly by its SHA-1 object id

| param           | type [= default]                                                              | description                                                                                                                                                                     |
| --------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| core            | string = 'default'                                                            | The plugin core identifier to use for plugin injection                                                                                                                          |
| fs [deprecated] | FileSystem                                                                    | The filesystem containing the git repo. Overrides the fs provided by the [plugin system](./plugin_fs.md).                                                                       |
| dir             | string                                                                        | The [working tree](dir-vs-gitdir.md) directory path                                                                                                                             |
| **gitdir**      | string = join(dir,'.git')                                                     | The [git directory](dir-vs-gitdir.md) path                                                                                                                                      |
| **oid**         | string                                                                        | The SHA-1 object id to get                                                                                                                                                      |
| format          | 'deflated'  &#124;  'wrapped'  &#124;  'content'  &#124;  'parsed' = 'parsed' | What format to return the object in. The choices are described in more detail below.                                                                                            |
| filepath        | string                                                                        | Don't return the object with `oid` itself, but resolve `oid` to a tree and then return the object at that filepath. To return the root directory of a tree set filepath to `''` |
| encoding        | string                                                                        | A convenience argument that only affects blobs. Instead of returning `object` as a buffer, it returns a string parsed using the given encoding.                                 |
| return          | Promise\<GitObjectDescription\>                                               | Resolves successfully with a git object description                                                                                                                             |

The object returned has the following schema:

```ts
type GitObjectDescription = {
  oid: string;
  type?: 'blob' | 'tree' | 'commit' | 'tag';
  format: 'deflated' | 'wrapped' | 'content' | 'parsed';
  object: Buffer | String | CommitDescription | TreeDescription;
  source?: string;
}
```

Regarding `GitObjectDescription`:

- `oid` will be the same as the `oid` argument unless the `filepath` argument is provided, in which case it will be the oid of the tree or blob being returned.
- `type` is not included for 'deflated' and 'wrapped' formatted objects because you likely don't care or plan to decode that information yourself.
- `format` is usually, but not always, the format you requested. Packfiles do not store each object individually compressed so if you end up reading the object from a packfile it will be returned in format 'content' even if you requested 'deflated' or 'wrapped'.
- `object` will be an actual Object if format is 'parsed' and the object is a commit, tree, or annotated tag. Blobs are still formatted as Buffers unless an encoding is provided in which case they'll be strings. If format is anything other than 'parsed', object will be a Buffer.
- `source` is the name of the packfile or loose object file where the object was found.

The `format` parameter can have the following values:

| param      | description                                                                                                                                                                                               |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 'deflated' | Return the raw deflate-compressed buffer for an object if possible. Useful for efficiently shuffling around loose objects when you don't care about the contents and can save time by not inflating them. |
| 'wrapped'  | Return the inflated object buffer wrapped in the git object header if possible. This is the raw data used when calculating the SHA-1 object id of a git object.                                           |
| 'content'  | Return the object buffer without the git header.                                                                                                                                                          |
| 'parsed'   | Returns a parsed representation of the object.                                                                                                                                                            |

Example Code:

```js live
// Get the contents of 'README.md' in the master branch.
let sha = await git.resolveRef({ dir: '$input((/))', ref: '$input((master))' })
console.log(sha)
let { object: blob } = await git.readObject({
  dir: '$input((/))',
  oid: $input((sha)),
  $textarea((filepath: 'README.md',
  encoding: 'utf8'))
})
console.log(blob)
```

```js live
// Find all the .js files in the current master branch containing the word 'commit'
let sha = await git.resolveRef({ dir: '$input((/))', ref: '$input((master))' })
console.log(sha)
let { object: commit } = await git.readObject({ dir: '$input((/))', oid: sha })
console.log(commit)

const searchTree = async ({oid, prefix = ''}) => {
  let { object: tree } = await git.readObject({ dir: '$input((/))', oid })
  for (let entry of tree.entries) {
    if (entry.type === 'tree') {
      await searchTree({oid: entry.oid, prefix: `${prefix}/${entry.path}`})
    } else if (entry.type === 'blob') {
      if ($input((entry.path.endsWith('.js')))) {
        let { object: blob } = await git.readObject({ dir: '$input((/))', oid: entry.oid })
        if ($input((blob.toString('utf8').includes('commit')))) {
          console.log(`${prefix}/${entry.path}`)
        }
      }
    }
  }
}

await searchTree({oid: commit.tree})
console.log('done')
```

<script>
(function rewriteEditLink() {
  const el = document.querySelector('a.edit-page-link.button');
  if (el) {
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/commands/readObject.js';
  }
})();
</script>