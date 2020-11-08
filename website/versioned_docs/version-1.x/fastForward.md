---
title: fastForward
sidebar_label: fastForward
id: version-1.x-fastForward
original_id: fastForward
---

Like `pull`, but hard-coded with `fastForward: true` so there is no need for an `author` parameter.

| param                            | type [= default]          | description                                                                                                               |
| -------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| [**fs**](./fs)                   | FsClient                  | a file system client                                                                                                      |
| [**http**](./http)               | HttpClient                | an HTTP client                                                                                                            |
| [onProgress](./onProgress)       | ProgressCallback          | optional progress event callback                                                                                          |
| [onMessage](./onMessage)         | MessageCallback           | optional message event callback                                                                                           |
| [onAuth](./onAuth)               | AuthCallback              | optional auth fill callback                                                                                               |
| [onAuthFailure](./onAuthFailure) | AuthFailureCallback       | optional auth rejected callback                                                                                           |
| [onAuthSuccess](./onAuthSuccess) | AuthSuccessCallback       | optional auth approved callback                                                                                           |
| **dir**                          | string                    | The [working tree](dir-vs-gitdir.md) directory path                                                                       |
| **gitdir**                       | string = join(dir,'.git') | The [git directory](dir-vs-gitdir.md) path                                                                                |
| ref                              | string                    | Which branch to merge into. By default this is the currently checked out branch.                                          |
| url                              | string                    | (Added in 1.1.0) The URL of the remote repository. The default is the value set in the git config for that remote.        |
| remote                           | string                    | (Added in 1.1.0) If URL is not specified, determines which remote to use.                                                 |
| remoteRef                        | string                    | (Added in 1.1.0) The name of the branch on the remote to fetch. By default this is the configured remote tracking branch. |
| corsProxy                        | string                    | Optional [CORS proxy](https://www.npmjs.com/%40isomorphic-git/cors-proxy). Overrides value in repo config.                |
| singleBranch                     | boolean = false           | Instead of the default behavior of fetching all the branches, only fetch a single branch.                                 |
| [headers](./headers)             | Object\<string, string\>  | Additional headers to include in HTTP requests, similar to git's `extraHeader` config                                     |
| cache                            | object                    | a [cache](cache.md) object                                                                                                |
| return                           | Promise\<void\>           | Resolves successfully when pull operation completes                                                                       |

Example Code:

```js live
await git.fastForward({
  fs,
  http,
  dir: '/tutorial',
  ref: 'main',
  singleBranch: true
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
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/api/fastForward.js';
  }
})();
</script>