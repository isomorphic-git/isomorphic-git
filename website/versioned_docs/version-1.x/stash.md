---
title: stash
sidebar_label: stash
id: version-1.x-stash
original_id: stash
---

stash api, supports  {'push' | 'pop' | 'apply' | 'drop' | 'list' | 'clear'} StashOp

| param              | type [= default]                                                                                 | description                                                                                                                                                 |
| ------------------ | ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [****fs****](./fs) | FsClient                                                                                         | a file system client                                                                                                                                        |
| **dir**            | string                                                                                           | The [working tree](dir-vs-gitdir.md) directory path                                                                                                         |
| gitdir             | string = join(dir,'.git')                                                                        | [optional] The [git directory](dir-vs-gitdir.md) path                                                                                                       |
| op                 | 'push'  &#124;  'pop'  &#124;  'apply'  &#124;  'drop'  &#124;  'list'  &#124;  'clear' = 'push' | [optional] name of stash operation, default to 'push'                                                                                                       |
| message            | string = ''                                                                                      | [optional] message to be used for the stash entry, only applicable when op === 'push'                                                                       |
| refIdx             | number = 0                                                                                       | [optional - Number] stash ref index of entry, only applicable when op === ['apply'  &#124;  'drop'  &#124;  'pop'], refIdx \>= 0 and \< num of stash pushed |
| return             | Promise\<(string &#124; void)\>                                                                  | Resolves successfully when stash operations are complete                                                                                                    |

_note_,
- all stash operations are done on tracked files only with loose objects, no packed objects
- when op === 'push', both working directory and index (staged) changes will be stashed, tracked files only
- when op === 'push', message is optional, and only applicable when op === 'push'
- when op === 'apply | pop', the stashed changes will overwrite the working directory, no abort when conflicts

Example Code:

```js live
// stash changes in the working directory and index
let dir = '/tutorial'
await fs.promises.writeFile(`${dir}/a.txt`, 'original content - a')
await fs.promises.writeFile(`${dir}/b.js`, 'original content - b')
await git.add({ fs, dir, filepath: [`a.txt`,`b.txt`] })
let sha = await git.commit({
  fs,
  dir,
  author: {
    name: 'Mr. Stash',
    email: 'mstasher@stash.com',
  },
  message: 'add a.txt and b.txt to test stash'
})
console.log(sha)

await fs.promises.writeFile(`${dir}/a.txt`, 'stashed chang- a')
await git.add({ fs, dir, filepath: `${dir}/a.txt` })
await fs.promises.writeFile(`${dir}/b.js`, 'work dir change. not stashed - b')

await git.stash({ fs, dir }) // default gitdir and op

console.log(await git.status({ fs, dir, filepath: 'a.txt' })) // 'unmodified'
console.log(await git.status({ fs, dir, filepath: 'b.txt' })) // 'unmodified'

const refLog = await git.stash({ fs, dir, op: 'list' })
console.log(refLog) // [{stash{#} message}]

await git.stash({ fs, dir, op: 'apply' }) // apply the stash

console.log(await git.status({ fs, dir, filepath: 'a.txt' })) // 'modified'
console.log(await git.status({ fs, dir, filepath: 'b.txt' })) // '*modified'
```


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
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/api/stash.js';
  }
})();
</script>