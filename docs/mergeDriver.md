---
title: mergeDriver
sidebar_label: mergeDriver
---
The merge driver is a callback which is called for each conflicting file. It takes the file contents on each branch as an array and returns the merged result.

By default the [merge](./merge.md) command uses the diff3 algorithm to try to solve merge conflicts, and throw an error is the conflict cannot be resolved. This is not always ideal, so isomorphic-git implements merge drivers so that users may implement their own merging algorithm.

A merge driver implements the following API:

#### async ({ branches, contents, path }) => { cleanMerge, mergedText }
| param         | type [= default]                                  | description                                               |
| ------------- | ------------------------------------------------- | --------------------------------------------------------- |
|   branches    | Array\<string\>                                   | an array of human readable branch names                    |
|   contents    | Array\<string\>                                   | an array of the file's contents on each respective branch |
|   path        | string                                            | the file's path relative to the git repository            |
| return        | Promise\<{cleanMerge: bool, mergedText: string}\> | Wether is merge was successful, and the merged text      |


If `cleanMerge` is true, then the `mergedText` string will be written to the file. If `cleanMerge` is false, a `MergeConflictError` will be thrown, and if `merge` was called with `abortOnConflict: true`, nothing will be written to the worktree or index.

### MergeDriverParams#path
The `path` parameter refers to the path of the conflicted file, relative to the the git repository.
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
Below is a simple example of a merge driver which simply chooses the other branch's version of the file whenever it was modified by both branches.
```
const mergeDriver = ({ contents }) => {
  const baseContent = contents[0]
  const ourContent = contents[1]
  const theirContent = contents[2]
  const mergedText = theirContent || ourContent || baseContent
  return { cleanMerge: true, mergedText }
}

```

If we applied this algorithm to the file in the previous example, the resolved file would simply read:
```
modified
text
file
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
If we applied this algorithm to the file in the previous example, the resolved file would read:

```
modified
text
file
was
modified
```
