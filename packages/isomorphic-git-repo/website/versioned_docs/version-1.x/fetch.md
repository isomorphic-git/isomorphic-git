---
title: fetch
sidebar_label: fetch
id: version-1.x-fetch
original_id: fetch
---

Fetch commits from a remote repository

| param                            | type [= default]          | description                                                                                                                        |
| -------------------------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| [**fs**](./fs)                   | FsClient                  | a file system client                                                                                                               |
| [**http**](./http)               | HttpClient                | an HTTP client                                                                                                                     |
| [onProgress](./onProgress)       | ProgressCallback          | optional progress event callback                                                                                                   |
| [onMessage](./onMessage)         | MessageCallback           | optional message event callback                                                                                                    |
| [onAuth](./onAuth)               | AuthCallback              | optional auth fill callback                                                                                                        |
| [onAuthFailure](./onAuthFailure) | AuthFailureCallback       | optional auth rejected callback                                                                                                    |
| [onAuthSuccess](./onAuthSuccess) | AuthSuccessCallback       | optional auth approved callback                                                                                                    |
| dir                              | string                    | The [working tree](dir-vs-gitdir.md) directory path                                                                                |
| **gitdir**                       | string = join(dir,'.git') | The [git directory](dir-vs-gitdir.md) path                                                                                         |
| url                              | string                    | The URL of the remote repository. The default is the value set in the git config for that remote.                                  |
| remote                           | string                    | If URL is not specified, determines which remote to use.                                                                           |
| singleBranch                     | boolean = false           | Instead of the default behavior of fetching all the branches, only fetch a single branch.                                          |
| ref                              | string                    | Which branch to fetch if `singleBranch` is true. By default this is the current branch or the remote's default branch.             |
| remoteRef                        | string                    | The name of the branch on the remote to fetch if `singleBranch` is true. By default this is the configured remote tracking branch. |
| tags                             | boolean = false           | Also fetch tags                                                                                                                    |
| depth                            | number                    | Integer. Determines how much of the git repository's history to retrieve                                                           |
| relative                         | boolean = false           | Changes the meaning of `depth` to be measured from the current shallow depth rather than from the branch tip.                      |
| since                            | Date                      | Only fetch commits created after the given date. Mutually exclusive with `depth`.                                                  |
| exclude                          | Array\<string\> = []      | A list of branches or tags. Instructs the remote server not to send us any commits reachable from these refs.                      |
| prune                            | boolean = false           | Delete local remote-tracking branches that are not present on the remote                                                           |
| pruneTags                        | boolean = false           | Prune local tags that don’t exist on the remote, and force-update those tags that differ                                           |
| corsProxy                        | string                    | Optional [CORS proxy](https://www.npmjs.com/%40isomorphic-git/cors-proxy). Overrides value in repo config.                         |
| [headers](./headers)             | Object\<string, string\>  | Additional headers to include in HTTP requests, similar to git's `extraHeader` config                                              |
| cache                            | object                    | a [cache](cache.md) object                                                                                                         |
| return                           | Promise\<FetchResult\>    | Resolves successfully when fetch completes                                                                                         |

The object returned has the following schema:

```ts
type FetchResult = {
  defaultBranch: string | null; // The branch that is cloned if no branch is specified
  fetchHead: string | null; // The SHA-1 object id of the fetched head commit
  fetchHeadDescription: string | null; // a textual description of the branch that was fetched
  headers?: Object<string, string>; // The HTTP response headers returned by the git server
  pruned?: Array<string>; // A list of branches that were pruned, if you provided the `prune` parameter
}
```

Example Code:

```js live
let result = await git.fetch({
  fs,
  http,
  dir: '/tutorial',
  corsProxy: 'https://cors.isomorphic-git.org',
  url: 'https://github.com/isomorphic-git/isomorphic-git',
  ref: 'main',
  depth: 1,
  singleBranch: true,
  tags: false
})
console.log(result)
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
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/api/fetch.js';
  }
})();
</script>