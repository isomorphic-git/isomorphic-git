---
title: clone
sidebar_label: clone
id: version-0.70.7-clone
original_id: clone
---

Clone a repository

| param                | type [= default]          | description                                                                                                                                     |
| -------------------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| core                 | string = 'default'        | The plugin core identifier to use for plugin injection                                                                                          |
| fs [deprecated]      | FileSystem                | The filesystem containing the git repo. Overrides the fs provided by the [plugin system](./plugin_fs.md).                                       |
| **dir**              | string                    | The [working tree](dir-vs-gitdir.md) directory path                                                                                             |
| **gitdir**           | string = join(dir,'.git') | The [git directory](dir-vs-gitdir.md) path                                                                                                      |
| **url**              | string                    | The URL of the remote repository                                                                                                                |
| corsProxy            | string                    | Optional [CORS proxy](https://www.npmjs.com/%40isomorphic-git/cors-proxy). Value is stored in the git config file for that repo.                |
| ref                  | string                    | Which branch to clone. By default this is the designated "main branch" of the repository.                                                       |
| singleBranch         | boolean = false           | Instead of the default behavior of fetching all the branches, only fetch a single branch.                                                       |
| noCheckout           | boolean = false           | If true, clone will only fetch the repo, not check out a branch. Skipping checkout can save a lot of time normally spent writing files to disk. |
| noGitSuffix          | boolean = false           | If true, clone will not auto-append a `.git` suffix to the `url`. (**AWS CodeCommit needs this option**.)                                       |
| noTags               | boolean = false           | By default clone will fetch all tags. `noTags` disables that behavior.                                                                          |
| remote               | string = 'origin'         | What to name the remote that is created.                                                                                                        |
| depth                | number                    | Integer. Determines how much of the git repository's history to retrieve                                                                        |
| since                | Date                      | Only fetch commits created after the given date. Mutually exclusive with `depth`.                                                               |
| exclude              | Array\<string\> = []      | A list of branches or tags. Instructs the remote server not to send us any commits reachable from these refs.                                   |
| relative             | boolean = false           | Changes the meaning of `depth` to be measured from the current shallow depth rather than from the branch tip.                                   |
| username             | string                    | See the [Authentication](./authentication.html) documentation                                                                                   |
| password             | string                    | See the [Authentication](./authentication.html) documentation                                                                                   |
| token                | string                    | See the [Authentication](./authentication.html) documentation                                                                                   |
| oauth2format         | string                    | See the [Authentication](./authentication.html) documentation                                                                                   |
| headers              | object = {}               | Additional headers to include in HTTP requests, similar to git's `extraHeader` config                                                           |
| emitter [deprecated] | EventEmitter              | Overrides the emitter set via the ['emitter' plugin](./plugin_emitter.md)                                                                       |
| emitterPrefix        | string = ''               | Scope emitted events by prepending `emitterPrefix` to the event name                                                                            |
| return               | Promise\<void\>           | Resolves successfully when clone completes                                                                                                      |

To monitor progress events, see the documentation for the [`'emitter'` plugin](./plugin_emitter.md).

Example Code:

```js live
await git.clone({
  dir: '$input((/))',
  corsProxy: 'https://cors.isomorphic-git.org',
  url: '$input((https://github.com/isomorphic-git/isomorphic-git))',
  $textarea((singleBranch: true,
  depth: 1))
})
console.log('done')
```

<script>
(function rewriteEditLink() {
  const el = document.querySelector('a.edit-page-link.button');
  if (el) {
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/commands/clone.js';
  }
})();
</script>