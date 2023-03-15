---
title: pull
sidebar_label: pull
id: version-0.70.7-pull
original_id: pull
---

Fetch and merge commits from a remote repository *(Currently, only fast-forward merges are implemented.)*

| param                | type [= default]          | description                                                                                                |
| -------------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------- |
| core                 | string = 'default'        | The plugin core identifier to use for plugin injection                                                     |
| fs [deprecated]      | FileSystem                | The filesystem containing the git repo. Overrides the fs provided by the [plugin system](./plugin_fs.md).  |
| **dir**              | string                    | The [working tree](dir-vs-gitdir.md) directory path                                                        |
| **gitdir**           | string = join(dir,'.git') | The [git directory](dir-vs-gitdir.md) path                                                                 |
| ref                  | string                    | Which branch to fetch. By default this is the currently checked out branch.                                |
| corsProxy            | string                    | Optional [CORS proxy](https://www.npmjs.com/%40isomorphic-git/cors-proxy). Overrides value in repo config. |
| singleBranch         | boolean = false           | Instead of the default behavior of fetching all the branches, only fetch a single branch.                  |
| fastForwardOnly      | boolean = false           | Only perform simple fast-forward merges. (Don't create merge commits.)                                     |
| noGitSuffix          | boolean = false           | If true, do not auto-append a `.git` suffix to the `url`. (**AWS CodeCommit needs this option**)           |
| username             | string                    | See the [Authentication](./authentication.html) documentation                                              |
| password             | string                    | See the [Authentication](./authentication.html) documentation                                              |
| token                | string                    | See the [Authentication](./authentication.html) documentation                                              |
| oauth2format         | string                    | See the [Authentication](./authentication.html) documentation                                              |
| headers              | object                    | Additional headers to include in HTTP requests, similar to git's `extraHeader` config                      |
| emitter [deprecated] | EventEmitter              | Overrides the emitter set via the ['emitter' plugin](./plugin_emitter.md).                                 |
| emitterPrefix        | string = ''               | Scope emitted events by prepending `emitterPrefix` to the event name.                                      |
| author               | Object                    | passed to [commit](commit.md) when creating a merge commit                                                 |
| committer            | Object                    | passed to [commit](commit.md) when creating a merge commit                                                 |
| signingKey           | string                    | passed to [commit](commit.md) when creating a merge commit                                                 |
| fast                 | boolean = false           | use fastCheckout instead of regular checkout                                                               |
| return               | Promise\<void\>           | Resolves successfully when pull operation completes                                                        |

To monitor progress events, see the documentation for the [`'emitter'` plugin](./plugin_emitter.md).

Example Code:

```js live
await git.pull({
  dir: '$input((/))',
  ref: '$input((master))',
  singleBranch: $input((true))
})
console.log('done')
```

<script>
(function rewriteEditLink() {
  const el = document.querySelector('a.edit-page-link.button');
  if (el) {
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/commands/pull.js';
  }
})();
</script>