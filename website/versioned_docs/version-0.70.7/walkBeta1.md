---
title: walkBeta1
sidebar_label: walkBeta1
id: version-0.70.7-walkBeta1
original_id: walkBeta1
---

A powerful recursive tree-walking utility.

| param     | type [= default]                                                                                         | description                                                      |
| --------- | -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| **trees** | Array\<Walker\>                                                                                          | The trees you want to traverse                                   |
| filter    | function(WalkerEntry[]): Promise\<boolean\>                                                              | Filter which `WalkerEntry`s to process                           |
| map       | function(WalkerEntry[]): Promise\<any\>                                                                  | Transform `WalkerEntry`s into a result form                      |
| reduce    | function(any, any[]): Promise\<any\>                                                                     | Control how mapped entries are combined with their parent result |
| iterate   | function(function(WalkerEntry[]): Promise\<any[]\>, IterableIterator\<WalkerEntry[]\>): Promise\<any[]\> | Fine-tune how entries within a tree are iterated over            |
| return    | Promise\<any\>                                                                                           | The finished tree-walking result                                 |

The `WalkerEntry` is an interface that abstracts computing many common tree / blob stats.

```ts
type WalkerEntry = {
  fullpath: string;
  basename: string;
  exists: boolean;
  populateStat: function;
  type?: 'tree' | 'blob' | 'special' | 'commit';
  ctimeSeconds?: number;
  ctimeNanoseconds?: number;
  mtimeSeconds?: number;
  mtimeNanoseconds?: number;
  dev?: number;
  ino?: number;
  mode?: number | string; // WORKDIR and STAGE return numbers, TREE returns a string... I'll fix this in walkBeta2
  uid?: number;
  gid?: number;
  size?: number;
  populateContent: function;
  content?: Buffer;
  populateHash: function;
  oid?: string;
}
```

The `walk` API (tentatively named `walkBeta1`) simplifies gathering detailed information about a tree or comparing all the filepaths in two or more trees.
Trees can be file directories, git commits, or git indexes (aka staging areas).
So you can compare two file directories, or 10 commits, or the stage of one repo with the working directory of another repo... etc.
As long as a file or directory is present in at least one of the trees, it will be traversed.
Entries are traversed in alphabetical order.

The arguments to `walk` are the `trees` you want to traverse, and 4 optional transform functions:
 `filter`, `map`, `reduce`, and `iterate`.

The trees are represented by three magic functions that can be imported:
```js
import { TREE, WORKDIR, STAGE } from 'isomorphic-git'
```

These functions return objects that implement the `Walker` interface.
The only thing they are good for is passing into `walkBeta1`'s `trees` argument.
Here are the three `Walker`s passed into `walkBeta1` by the `statusMatrix` command for example:

```js
let gitdir = '.git'
let dir = '.'
let ref = 'HEAD'

let trees = [
  TREE({fs, gitdir, ref}),
  WORKDIR({fs, dir, gitdir}),
  STAGE({fs, gitdir})
]
```

See the doc pages for [TREE](./TREE.md), [WORKDIR](./WORKDIR.md), and [STAGE](./STAGE.md).

`filter`, `map`, `reduce`, and `iterate` allow you control the recursive walk by pruning and transforming `WalkerTree`s into the desired result.

## WalkerEntry
The `WalkerEntry` is an interface that abstracts computing many common tree / blob stats.
`filter` and `map` each receive an array of `WalkerEntry[]` as their main argument, one `WalkerEntry` for each `Walker` in the `trees` argument.

By default, `WalkerEntry`s only have three properties:
```js
{
  fullpath: string;
  basename: string;
  exists: boolean;
}
```

Additional properties can be computed only when needed. This lets you build lean, mean, efficient walking machines.
```js
await entry.populateStat()
// populates
entry.type // 'tree', 'blob'
// and where applicable, these properties:
entry.ctimeSeconds // number;
entry.ctimeNanoseconds // number;
entry.mtimeSeconds // number;
entry.mtimeNanoseconds // number;
entry.dev // number;
entry.ino // number;
entry.mode // number;
entry.uid // number;
entry.gid // number;
entry.size // number;
```

```js
await entry.populateContent()
// populates
entry.content // Buffer
// except for STAGE which does not currently provide content
```

```js
await entry.populateHash()
// populates
entry.oid // SHA1 string
```

## filter(WalkerEntry[]) => boolean

Default: `async () => true`.

This is a good place to put limiting logic such as skipping entries with certain filenames.
If you return false for directories, then none of the children of that directory will be walked.

Example:
```js
let path = require('path')
let cwd = 'src/app'
// Only examine files in the directory `cwd`
async function filter ([head, workdir, stage]) {
  // It doesn't matter which tree (head, workdir, or stage) you use here.
  return (
    // return true for the root directory
    head.fullpath === '.' ||
    // return true for 'src' and 'src/app'
    cwd.startsWith(head.fullpath) ||
    // return true for 'src/app/*'
    path.dirname(head.fullpath) === cwd
  )
}
```

## map(WalkerEntry[]) => any

Default: `async entry => entry`

This is a good place for query logic, such as examining the contents of a file.
Ultimately, compare all the entries and return any values you are interested in.
If you do not return a value (or return undefined) that entry will be filtered from the results.

Example 1: Find all the files containing the word 'foo'.
```js
async function map([head, workdir]) {
  await workdir.populateContent()
  let content = workdir.content.toString('utf8')
  if (content.contains('foo')) {
    return {
      fullpath: workdir.fullpath,
      content
    }
  }
}

```

Example 2: Return the difference between the working directory and the HEAD commit
```js
const diff = require('diff-lines')
async function map([head, workdir]) {
  await head.populateContent()
  await head.populateHash()
  await workdir.populateContent()
  return {
    filename: head.fullpath,
    oid: head.oid,
    diff: diff(head.content.toString('utf8'), workdir.content.toString('utf8'))
  }
}
```

## reduce(parent, children)

Default: `async (parent, children) => parent === undefined ? children.flat() : [parent, children].flat()`

The default implementation of this function returns all directories and children in a giant flat array.
You can define a different accumulation method though.

Example: Return a hierarchical structure
```js
async function reduce (parent, children) {
  return Object.assign(parent, { children })
}
```

## iterate(walk, children)

Default: `(walk, children) => Promise.all([...children].map(walk))`

The default implementation recurses all children concurrently using Promise.all.
However you could use a custom function to traverse children serially or use a global queue to throttle recursion.

> Note: For a complete example, look at the implementation of `statusMatrix`.

<script>
(function rewriteEditLink() {
  const el = document.querySelector('a.edit-page-link.button');
  if (el) {
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/commands/walkBeta1.js';
  }
})();
</script>