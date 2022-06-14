---
title: mergeDriver
sidebar_label: mergeDriver
---
The merge driver is a callback which is called for each conflicting file during a merge. It takes the file contents on each branch as an array and returns the merged result.

By default the [merge](./merge.md) command uses the diff3 algorithm to try to solve merge conflicts, and throws an error if the conflict cannot be resolved. This is not always ideal, so isomorphic-git implements merge drivers so that users may implement their own merging algorithm.

A merge driver implements the following API:

#### async ({ branches, contents, path }) => { cleanMerge, mergedText }
| param         | type [= default]                                  | description                                               |
| ------------- | ------------------------------------------------- | --------------------------------------------------------- |
| branches      | Array\<string\>                                   | an array of human readable branch names                   |
| contents      | Array\<string\>                                   | an array of the file's contents on each respective branch |
| path          | string                                            | the file's path relative to the git repository            |
| return        | Promise\<{cleanMerge: bool, mergedText: string}\> | Whether merge was successful, and the merged text         |


If `cleanMerge` is true, then the `mergedText` string will be written to the file. If `cleanMerge` is false, a `MergeConflictError` will be thrown and no merge commit will be created.

If `merge` was called with `abortOnConflict: false`, the mergedText string will be written to the file even if there is a merge conflict. Otherwise, in the event of a merge conflict, no changes will be written to the worktree or index.

### MergeDriverParams#path
The `path` parameter refers to the path of the conflicted file, relative to the root of the git repository.
### MergeDriverParams#branches
The `branches` array contains the human-readable names of the branches we are merging. The first index refers to the merge base, the second refers to the branch being merged into, and any subsequent indexes refer to the branches we are merging. For example, say we have a git history that looks like this:
```
	  A topic
	 /
    D---E main
```
If we were to merge `topic` into `main`, the `branches` array would look like: `['base', 'main', 'topic']`. In this case, the name `base` refers to commit `D` which is the common ancestor of our two branches. `base` will always be the name at the first index.

### MergeDriverParams#contents
The `contents` array contains the file contents respective of each branch. Like the `branches` array, the first index always refers to the merge base. The second index always refers to the branch we are merging into, i.e. 'ours'. Subsequent indexes refer to the branches we are merging, i.e. 'theirs'.

For example, say we have a file `text.txt` which contains:
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

If we applied this algorithm to the conflict in the previous example, the resolved file would simply read:
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

As a more complex example, we use the default diff3 algorithm, but choose the other branch's changes whenever specific lines of the file conflict.
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

If we apply this algorithm to the conflict in the previous example, the resolved file reads:
```
modified
text
file
was
modified
```
and if we wanted to choose *our* branch's changes whenever specific lines of the file conflict, we simply change the above line:
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

Finally, what if we wanted to make a slight modification to the behavior of the default merge driver, like changing the size of conflict markers? The code for the default merge driver is located in `src/utils/mergeFile.js`. We can copy the code into our merge driver like so:
```
const diff3Merge = require('diff3')
const mergeDriver = ({ contents, branches }) => {
  const ourName = branches[1]
  const theirName = branches[2]

  const baseContent = contents[0]
  const ourContent = contents[1]
  const theirContent = contents[2]

  const ours = ourContent.match(LINEBREAKS)
  const base = baseContent.match(LINEBREAKS)
  const theirs = theirContent.match(LINEBREAKS)

  const result = diff3Merge(ours, base, theirs)

  const markerSize = 7

  let mergedText = ''
  let cleanMerge = true

  for (const item of result) {
    if (item.ok) {
      mergedText += item.ok.join('')
    }
    if (item.conflict) {
      cleanMerge = false
      mergedText += `${'<'.repeat(markerSize)} ${ourName}\n`
      mergedText += item.conflict.a.join('')

      mergedText += `${'='.repeat(markerSize)}\n`
      mergedText += item.conflict.b.join('')
      mergedText += `${'>'.repeat(markerSize)} ${theirName}\n`
    }
  }
  return { cleanMerge, mergedText }
}
```

If we want larger conflict markers, we can simply change the line
```
const markerSize = 7
```
to
```
const markerSize = 14
```
Which will give us conflict markers that are 14 characters wide instead of the default 7.

Now if we use this merge driver when merging the branch 'topic' into 'main', and if we have `abortOnConflict` set to `false`, the worktree will be updated with a `text.txt` file that looks like this:
```
<<<<<<<<<<<<<< main
modified
==============
>>>>>>>>>>>>>> topic
text
file
was
modified
```
