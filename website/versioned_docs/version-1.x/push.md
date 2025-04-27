---
title: push
sidebar_label: push
id: version-1.x-push
original_id: push
---

Push a branch or tag

| param                            | type [= default]          | description                                                                                                |
| -------------------------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------- |
| [**fs**](./fs)                   | FsClient                  | a file system client                                                                                       |
| [**http**](./http)               | HttpClient                | an HTTP client                                                                                             |
| [onProgress](./onProgress)       | ProgressCallback          | optional progress event callback                                                                           |
| [onMessage](./onMessage)         | MessageCallback           | optional message event callback                                                                            |
| [onAuth](./onAuth)               | AuthCallback              | optional auth fill callback                                                                                |
| [onAuthFailure](./onAuthFailure) | AuthFailureCallback       | optional auth rejected callback                                                                            |
| [onAuthSuccess](./onAuthSuccess) | AuthSuccessCallback       | optional auth approved callback                                                                            |
| [onPrePush](./onPrePush)         | PrePushCallback           | optional pre-push hook callback                                                                            |
| dir                              | string                    | The [working tree](dir-vs-gitdir.md) directory path                                                        |
| **gitdir**                       | string = join(dir,'.git') | The [git directory](dir-vs-gitdir.md) path                                                                 |
| ref                              | string                    | Which branch or tag to push. By default this is the currently checked out branch.                          |
| url                              | string                    | The URL of the remote repository. The default is the value set in the git config for that remote.          |
| remote                           | string                    | If URL is not specified, determines which remote to use.                                                   |
| remoteRef                        | string                    | The name of the receiving branch on the remote. By default this is the configured remote tracking branch.  |
| force                            | boolean = false           | If true, behaves the same as `git push --force`                                                            |
| delete                           | boolean = false           | If true, delete the remote ref                                                                             |
| corsProxy                        | string                    | Optional [CORS proxy](https://www.npmjs.com/%40isomorphic-git/cors-proxy). Overrides value in repo config. |
| [headers](./headers)             | Object\<string, string\>  | Additional headers to include in HTTP requests, similar to git's `extraHeader` config                      |
| cache                            | object                    | a [cache](cache.md) object                                                                                 |
| return                           | Promise\<PushResult\>     | Resolves successfully when push completes with a detailed description of the operation from the server.    |

```ts
type PushResult = {
  ok: boolean;
  error: string;
  refs: Object<string, RefUpdateStatus>;
  headers?: Object<string, string>;
}
```

```ts
type RefUpdateStatus = {
  ok: boolean;
  error: string;
}
```

The push command returns an object that describes the result of the attempted push operation.
*Notes:* If there were no errors, then there will be no `errors` property. There can be a mix of `ok` messages and `errors` messages.

| param  | type [= default] | description                                                                                                                                                                                                      |
| ------ | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ok     | Array\<string\>  | The first item is "unpack" if the overall operation was successful. The remaining items are the names of refs that were updated successfully.                                                                    |
| errors | Array\<string\>  | If the overall operation threw and error, the first item will be "unpack {Overall error message}". The remaining items are individual refs that failed to be updated in the format "{ref name} {error message}". |

Example Code:

```js live
let pushResult = await git.push({
  fs,
  http,
  dir: '/tutorial',
  remote: 'origin',
  ref: 'main',
  onAuth: () => ({ username: process.env.GITHUB_TOKEN }),
})
console.log(pushResult)
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
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/api/push.js';
  }
})();
</script>