---
title: walk
sidebar_label: walk
id: version-1.x-walk
original_id: walk
---

A powerful recursive tree-walking utility.

| param          | type [= default]          | description                                                      |
| -------------- | ------------------------- | ---------------------------------------------------------------- |
| [**fs**](./fs) | FsClient                  | a file system client                                             |
| dir            | string                    | The [working tree](dir-vs-gitdir.md) directory path              |
| **gitdir**     | string = join(dir,'.git') | The [git directory](dir-vs-gitdir.md) path                       |
| **trees**      | Array\<Walker\>           | The trees you want to traverse                                   |
| map            | WalkerMap                 | Transform `WalkerEntry`s into a result form                      |
| reduce         | WalkerReduce              | Control how mapped entries are combined with their parent result |
| iterate        | WalkerIterate             | Fine-tune how entries within a tree are iterated over            |
| cache          | object                    | a [cache](cache.md) object                                       |
| return         | Promise\<any\>            | The finished tree-walking result                                 |

The `walk` API simplifies gathering detailed information about a tree or comparing all the filepaths in two or more trees.
Trees can be git commits, the working directory, or the or git index (staging area).
As long as a file or directory is present in at least one of the trees, it will be traversed.
Entries are traversed in alphabetical order.

The arguments to `walk` are the `trees` you want to traverse, and 3 optional transform functions:
 `map`, `reduce`, and `iterate`.

## `TREE`, `WORKDIR`, and `STAGE`

Tree walkers are represented by three separate functions that can be imported:

```js
import { TREE, WORKDIR, STAGE } from 'isomorphic-git'
```

These functions return opaque handles called `Walker`s.
The only thing that `Walker` objects are good for is passing into `walk`.
Here are the three `Walker`s passed into `walk` by the `statusMatrix` command for example:

```js
let ref = 'HEAD'

let trees = [TREE({ ref }), WORKDIR(), STAGE()]
```

For the arguments, see the doc pages for [TREE](./TREE.md), [WORKDIR](./WORKDIR.md), and [STAGE](./STAGE.md).

`map`, `reduce`, and `iterate` allow you control the recursive walk by pruning and transforming `WalkerEntry`s into the desired result.

## WalkerEntry


The `WalkerEntry` is an interface that abstracts computing many common tree / blob stats.

```ts
type WalkerEntry = {
  type: function(): Promise<'tree'|'blob'|'special'|'commit'>;
  mode: function(): Promise<number>;
  oid: function(): Promise<string>;
  content: function(): Promise<Uint8Array|void>;
  stat: function(): Promise<Stat>;
}
```


`map` receives an array of `WalkerEntry[]` as its main argument, one `WalkerEntry` for each `Walker` in the `trees` argument.
The methods are memoized per `WalkerEntry` so calling them multiple times in a `map` function does not adversely impact performance.
By only computing these values if needed, you build can build lean, mean, efficient walking machines.

### WalkerEntry#type()

Returns the kind as a string. This is normally either `tree` or `blob`.

`TREE`, `STAGE`, and `WORKDIR` walkers all return a string.

Possible values:

- `'tree'` directory
- `'blob'` file
- `'special'` used by `WORKDIR` to represent irregular files like sockets and FIFOs
- `'commit'` used by `TREE` to represent submodules

```js
await entry.type()
```

### WalkerEntry#mode()

Returns the file mode as a number. Use this to distinguish between regular files, symlinks, and executable files.

`TREE`, `STAGE`, and `WORKDIR` walkers all return a number for all `type`s of entries.

It has been normalized to one of the 4 values that are allowed in git commits:

- `0o40000` directory
- `0o100644` file
- `0o100755` file (executable)
- `0o120000` symlink

Tip: to make modes more readable, you can print them to octal using `.toString(8)`.

```js
await entry.mode()
```

### WalkerEntry#oid()

Returns the SHA-1 object id for blobs and trees.

`TREE` walkers return a string for `blob` and `tree` entries.

`STAGE` and `WORKDIR` walkers return a string for `blob` entries and `undefined` for `tree` entries.

```js
await entry.oid()
```

### WalkerEntry#content()

Returns the file contents as a Buffer.

`TREE` and `WORKDIR` walkers return a Buffer for `blob` entries and `undefined` for `tree` entries.

`STAGE` walkers always return `undefined` since the file contents are never stored in the stage.

```js
await entry.content()
```

### WalkerEntry#stat()

Returns a normalized subset of filesystem Stat data.

`WORKDIR` walkers return a `Stat` for `blob` and `tree` entries.

`STAGE` walkers return a `Stat` for `blob` entries and `undefined` for `tree` entries.

`TREE` walkers return `undefined` for all entry types.

```js
await entry.stat()
```


Normalized subset of filesystem `stat` data:

```ts
type Stat = {
  ctimeSeconds: number;
  ctimeNanoseconds: number;
  mtimeSeconds: number;
  mtimeNanoseconds: number;
  dev: number;
  ino: number;
  mode: number;
  uid: number;
  gid: number;
  size: number;
}
```


## map(string, Array<WalkerEntry|null>) => Promise<any>


```ts
type WalkerMap = (filename: string, entries: Array<(WalkerEntry|null)>) => Promise<any>;
```


This is the function that is called once per entry BEFORE visiting the children of that node.

If you return `null` for a `tree` entry, then none of the children of that `tree` entry will be walked.

This is a good place for query logic, such as examining the contents of a file.
Ultimately, compare all the entries and return any values you are interested in.
If you do not return a value (or return undefined) that entry will be filtered from the results.

Example 1: Find all the files containing the word 'foo'.
```js
async function map(filepath, [head, workdir]) {
  let content = (await workdir.content()).toString('utf8')
  if (content.contains('foo')) {
    return {
      filepath,
      content
    }
  }
}
```

Example 2: Return the difference between the working directory and the HEAD commit
```js
const map = async (filepath, [head, workdir]) => {
  return {
    filepath,
    oid: await head?.oid(),
    diff: diff(
      (await head?.content())?.toString('utf8') || '',
      (await workdir?.content())?.toString('utf8') || ''
    )
  }
}
```

Example 3:
```js
let path = require('path')
// Only examine files in the directory `cwd`
let cwd = 'src/app'
async function map (filepath, [head, workdir, stage]) {
  if (
    // don't skip the root directory
    head.fullpath !== '.' &&
    // return true for 'src' and 'src/app'
    !cwd.startsWith(filepath) &&
    // return true for 'src/app/*'
    path.dirname(filepath) !== cwd
  ) {
    return null
  } else {
    return filepath
  }
}
```

## reduce(parent, children)


```ts
type WalkerReduce = (parent: any, children: Array<any>) => Promise<any>;
```


This is the function that is called once per entry AFTER visiting the children of that node.

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


```ts
type WalkerIterate = (walk: WalkerIterateCallback, children: IterableIterator<Array<WalkerEntry>>) => Promise<Array<any>>;
```



```ts
type WalkerIterateCallback = (entries: Array<WalkerEntry>) => Promise<Array<any>>;
```


Default: `(walk, children) => Promise.all([...children].map(walk))`

The default implementation recurses all children concurrently using Promise.all.
However you could use a custom function to traverse children serially or use a global queue to throttle recursion.


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
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/api/walk.js';
  }
})();
</script>