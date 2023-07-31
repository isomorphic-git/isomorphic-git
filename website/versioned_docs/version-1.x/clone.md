---
title: clone
sidebar_label: clone
id: version-1.x-clone
original_id: clone
---

Clone a repository

| param                              | type [= default]              | description                                                                                                                                     |
| ---------------------------------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| [**fs**](./fs)                     | FsClient                      | a file system implementation                                                                                                                    |
| [**http**](./http)                 | HttpClient                    | an HTTP client                                                                                                                                  |
| [onProgress](./onProgress)         | ProgressCallback              | optional progress event callback                                                                                                                |
| [onMessage](./onMessage)           | MessageCallback               | optional message event callback                                                                                                                 |
| [onAuth](./onAuth)                 | AuthCallback                  | optional auth fill callback                                                                                                                     |
| [onAuthFailure](./onAuthFailure)   | AuthFailureCallback           | optional auth rejected callback                                                                                                                 |
| [onAuthSuccess](./onAuthSuccess)   | AuthSuccessCallback           | optional auth approved callback                                                                                                                 |
| [onPostCheckout](./onPostCheckout) | PostCheckoutCallback          | optional post-checkout hook callback                                                                                                            |
| **dir**                            | string                        | The [working tree](dir-vs-gitdir.md) directory path                                                                                             |
| **gitdir**                         | string = join(dir,'.git')     | The [git directory](dir-vs-gitdir.md) path                                                                                                      |
| **url**                            | string                        | The URL of the remote repository                                                                                                                |
| corsProxy                          | string                        | Optional [CORS proxy](https://www.npmjs.com/%40isomorphic-git/cors-proxy). Value is stored in the git config file for that repo.                |
| ref                                | string                        | Which branch to checkout. By default this is the designated "main branch" of the repository.                                                    |
| singleBranch                       | boolean = false               | Instead of the default behavior of fetching all the branches, only fetch a single branch.                                                       |
| noCheckout                         | boolean = false               | If true, clone will only fetch the repo, not check out a branch. Skipping checkout can save a lot of time normally spent writing files to disk. |
| noTags                             | boolean = false               | By default clone will fetch all tags. `noTags` disables that behavior.                                                                          |
| remote                             | string = 'origin'             | What to name the remote that is created.                                                                                                        |
| depth                              | number                        | Integer. Determines how much of the git repository's history to retrieve                                                                        |
| since                              | Date                          | Only fetch commits created after the given date. Mutually exclusive with `depth`.                                                               |
| exclude                            | Array\<string\> = []          | A list of branches or tags. Instructs the remote server not to send us any commits reachable from these refs.                                   |
| relative                           | boolean = false               | Changes the meaning of `depth` to be measured from the current shallow depth rather than from the branch tip.                                   |
| [headers](./headers)               | Object\<string, string\> = {} | Additional headers to include in HTTP requests, similar to git's `extraHeader` config                                                           |
| cache                              | object                        | a [cache](cache.md) object                                                                                                                      |
| return                             | Promise\<void\>               | Resolves successfully when clone completes                                                                                                      |

Example Code:

```js live
await git.clone({
  fs,
  http,
  dir: '/tutorial',
  corsProxy: 'https://cors.isomorphic-git.org',
  url: 'https://github.com/isomorphic-git/isomorphic-git',
  singleBranch: true,
  depth: 1
})
console.log('done')
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
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/api/clone.js';
  }
})();
</script>