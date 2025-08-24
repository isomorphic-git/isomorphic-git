---
title: statusMatrix
sidebar_label: statusMatrix
id: version-1.x-statusMatrix
original_id: statusMatrix
---

Efficiently get the status of multiple files at once.

| param          | type [= default]              | description                                                                                        |
| -------------- | ----------------------------- | -------------------------------------------------------------------------------------------------- |
| [**fs**](./fs) | FsClient                      | a file system client                                                                               |
| **dir**        | string                        | The [working tree](dir-vs-gitdir.md) directory path                                                |
| **gitdir**     | string = join(dir, '.git')    | The [git directory](dir-vs-gitdir.md) path                                                         |
| ref            | string = 'HEAD'               | Optionally specify a different commit to compare against the workdir and stage instead of the HEAD |
| filepaths      | Array\<string\> = ['.']       | Limit the query to the given files and directories                                                 |
| filter         | function(string): boolean     | Filter the results to only those whose filepath matches a function.                                |
| cache          | object                        | a [cache](cache.md) object                                                                         |
| ignored        | boolean = false               | include ignored files in the result                                                                |
| return         | Promise\<Array\<StatusRow\>\> | Resolves with a status matrix, described below.                                                    |

```ts
type StatusRow = Array<(string|number)>;
```

The returned `StatusMatrix` is admittedly not the easiest format to read.
However it conveys a large amount of information in dense format that should make it easy to create reports about the current state of the repository;
without having to do multiple, time-consuming isomorphic-git calls.
My hope is that the speed and flexibility of the function will make up for the learning curve of interpreting the return value.

```js live
// get the status of all the files in 'src'
let status = await git.statusMatrix({
  fs,
  dir: '/tutorial',
  filter: f => f.startsWith('src/')
})
console.log(status)
```

```js live
// get the status of all the JSON and Markdown files
let status = await git.statusMatrix({
  fs,
  dir: '/tutorial',
  filter: f => f.endsWith('.json') || f.endsWith('.md')
})
console.log(status)
```

The result is returned as a 2D array.
The outer array represents the files and/or blobs in the repo, in alphabetical order.
The inner arrays describe the status of the file:
the first value is the filepath, and the next three are integers
representing the HEAD status, WORKDIR status, and STAGE status of the entry.

```js
// example StatusMatrix
[
  ["a.txt", 0, 2, 0], // new, untracked
  ["b.txt", 0, 2, 2], // added, staged
  ["c.txt", 0, 2, 3], // added, staged, with unstaged changes
  ["d.txt", 1, 1, 1], // unmodified
  ["e.txt", 1, 2, 1], // modified, unstaged
  ["f.txt", 1, 2, 2], // modified, staged
  ["g.txt", 1, 2, 3], // modified, staged, with unstaged changes
  ["h.txt", 1, 0, 1], // deleted, unstaged
  ["i.txt", 1, 0, 0], // deleted, staged
  ["j.txt", 1, 2, 0], // deleted, staged, with unstaged-modified changes (new file of the same name)
  ["k.txt", 1, 1, 0], // deleted, staged, with unstaged changes (new file of the same name)
]
```

- The HEAD status is either absent (0) or present (1).
- The WORKDIR status is either absent (0), identical to HEAD (1), or different from HEAD (2).
- The STAGE status is either absent (0), identical to HEAD (1), identical to WORKDIR (2), or different from WORKDIR (3).

```ts
type Filename      = string
type HeadStatus    = 0 | 1
type WorkdirStatus = 0 | 1 | 2
type StageStatus   = 0 | 1 | 2 | 3

type StatusRow     = [Filename, HeadStatus, WorkdirStatus, StageStatus]

type StatusMatrix  = StatusRow[]
```

> Think of the natural progression of file modifications as being from HEAD (previous) -> WORKDIR (current) -> STAGE (next).
> Then HEAD is "version 1", WORKDIR is "version 2", and STAGE is "version 3".
> Then, imagine a "version 0" which is before the file was created.
> Then the status value in each column corresponds to the oldest version of the file it is identical to.
> (For a file to be identical to "version 0" means the file is deleted.)

Here are some examples of queries you can answer using the result:

#### Q: What files have been deleted?
```js
const FILE = 0, WORKDIR = 2

const filenames = (await statusMatrix({ dir }))
  .filter(row => row[WORKDIR] === 0)
  .map(row => row[FILE])
```

#### Q: What files have unstaged changes?
```js
const FILE = 0, WORKDIR = 2, STAGE = 3

const filenames = (await statusMatrix({ dir }))
  .filter(row => row[WORKDIR] !== row[STAGE])
  .map(row => row[FILE])
```

#### Q: What files have been modified since the last commit?
```js
const FILE = 0, HEAD = 1, WORKDIR = 2

const filenames = (await statusMatrix({ dir }))
  .filter(row => row[HEAD] !== row[WORKDIR])
  .map(row => row[FILE])
```

#### Q: What files will NOT be changed if I commit right now?
```js
const FILE = 0, HEAD = 1, STAGE = 3

const filenames = (await statusMatrix({ dir }))
  .filter(row => row[HEAD] === row[STAGE])
  .map(row => row[FILE])
```

For reference, here are all possible combinations:

| HEAD | WORKDIR | STAGE | `git status --short` equivalent |
| ---- | ------- | ----- | ------------------------------- |
| 0    | 0       | 0     | ``                              |
| 0    | 0       | 3     | `AD`                            |
| 0    | 2       | 0     | `??`                            |
| 0    | 2       | 2     | `A `                            |
| 0    | 2       | 3     | `AM`                            |
| 1    | 0       | 0     | `D `                            |
| 1    | 0       | 1     | ` D`                            |
| 1    | 0       | 3     | `MD`                            |
| 1    | 1       | 0     | `D ` + `??`                     |
| 1    | 1       | 1     | ``                              |
| 1    | 1       | 3     | `MM`                            |
| 1    | 2       | 0     | `D ` + `??`                     |
| 1    | 2       | 1     | ` M`                            |
| 1    | 2       | 2     | `M `                            |
| 1    | 2       | 3     | `MM`                            |


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
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/api/statusMatrix.js';
  }
})();
</script>