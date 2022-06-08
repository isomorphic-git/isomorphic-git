---
title: mergeDriver
sidebar_label: mergeDriver
---
The merge driver is a callback which is called for each conflicting file. It takes the file contents on each branch as an array and returns the merged result.

By default the [merge](./merge.md) command uses the diff3 algorithm to try to solve merge conflicts, and throw an error is the conflict cannot be resolved. This is not always ideal, so isomorphic-git implements merge drivers so that users may implement their own merging algorithm.

A merge driver implements the following API:

#### async ({ branches, contents, path, markerSize }) => { cleanMerge, mergedText }
| param         | type [= default]                                  | description                                               |
| ------------- | ------------------------------------------------- | --------------------------------------------------------- |
| branches      | Array\<string\>                                   | an array of human readable branch names                   |
| contents      | Array\<string\>                                   | an array of the file's contents on each respective branch |
| path          | string                                            | the file's path relative to the git repository            |
| markerSize    | number                                            | how many characters wide conflict markers should be       |
| return        | Promise\<{cleanMerge: bool, mergedText: string}\> | whether merge was successful, and the merged text         |


If `cleanMerge` is true, then the `mergedText` string will be written to the file. If `cleanMerge` is false, a `MergeConflictError` will be thrown, and if `merge` was called with `abortOnConflict: true`, nothing will be written to the worktree or index.

### MergeDriverParams#path
The `path` parameter refers to the path of the conflicted file, relative to the the git repository.
### MergeDriverParams#markerSize
The `markerSize` parameter allows the user to configure the size of the markers used to display unresolved merge conflicts to the user. For example, a merge conflict with size 7 conflict markers might look like this:
```
<<<<<<< HEAD
our text
======= main
their text
>>>>>>>
```
While a merge conflict with size 18 markers might look like this:
```
<<<<<<<<<<<<<<<<<< HEAD
our text
================== main
their text
>>>>>>>>>>>>>>>>>>
```
### MergeDriverParams#branches
The `branches` array contains the human-readable names of the branches we are merging. The first index refers to the merge base, the second refers to the branch being merged into, and any subsequent indexes refer to the branches we are merging. For example, say we have a git history that looks like this:
```
	  A topic
	 /
    D---E main
```
If we were to merge `topic` into `main`, the `branches` array would look like: `['base', 'main', 'topic']`. In this case, the name `base` refers to commit `D` which is the common ancestor of our two branches. `base` will always be the name at the first index.

### MergeDriverParams#contents
The `contents` array contains the file contents respective of each branch. Like the `branches` array, the first index refers to the merge base, the second, to the branch being merged into, and subsequent indexes refer to the branches we are merging. For example, say we have a file `text.txt` which contains:
```
original
text
file
```

On the `main` branch, we modify the text file to read:
```
text
file
was
modified
```

However, on the `topic` branch, we modify the text file to read:
```
modified
text
file
```

In this case, when our merge driver is called on `text.txt`, the `contents` array will look like this:
```js
[
  'original\ntext\nfile',
  'text\n\file\nwas\nmodified',
  'modified\ntext\nfile',
]
```

## Examples
Below is an example of a very simple merge driver which always chooses the other branch's version of the file whenever it was modified by both branches.
```
const mergeDriver = ({ contents }) => {
  const mergedText = contents[2]
  return { cleanMerge: true, mergedText }
}
```

If we applied this algorithm to the file in the previous example, the resolved file would simply read:
```
modified
text
file
```

and if instead we wanted to chose *our* branch's version of the file, whenever it was modified by both branches,we simply change the line:
```
const mergedText = contents[2]
```
to read:
```
const mergedText = contents[1]
```
which results in the resolved file reading:
```
text
file
was
modified
```

As a more complex example, we use the default diff3 algorithm, but choose the other branch's changes whenever lines of the file conflict.
```
const diff3Merge = require('diff3')
const mergeDriver = ({ contents }) => {
  const baseContent = contents[0]
  const ourContent = contents[1]
  const theirContent = contents[2]

  const LINEBREAKS = /^.*(\r?\n|$)/gm
  const ours = ourContent.match(LINEBREAKS)
  const base = baseContent.match(LINEBREAKS)
  const theirs = theirContent.match(LINEBREAKS)
  const result = diff3Merge(ours, base, theirs)
  let mergedText = ''
  for (const item of result) {
    if (item.ok) {
      mergedText += item.ok.join('')
    }
    if (item.conflict) {
      mergedText += item.conflict.b.join('')
    }
  }
  return { cleanMerge: true, mergedText }
}
```

If we apply this algorithm to the file in the previous example, the resolved file reads:
```
modified
text
file
was
modified
```
and if we wanted to choose *our* branch's changes when lines of the file conflict, we simply change the above line:
```
mergedText += item.conflict.b.join('')
```
to read:
```
mergedText += item.conflict.a.join('')
```
which results in a resolved file that reads:
```
text
file
was
modified
```
