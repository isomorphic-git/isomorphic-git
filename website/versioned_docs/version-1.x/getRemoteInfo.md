---
title: getRemoteInfo
sidebar_label: getRemoteInfo
id: version-1.x-getRemoteInfo
original_id: getRemoteInfo
---

List a remote servers branches, tags, and capabilities.

| param                            | type [= default]               | description                                                                                                 |
| -------------------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| [**http**](./http)               | HttpClient                     | an HTTP client                                                                                              |
| [onAuth](./onAuth)               | AuthCallback                   | optional auth fill callback                                                                                 |
| [onAuthFailure](./onAuthFailure) | AuthFailureCallback            | optional auth rejected callback                                                                             |
| [onAuthSuccess](./onAuthSuccess) | AuthSuccessCallback            | optional auth approved callback                                                                             |
| **url**                          | string                         | The URL of the remote repository. Will be gotten from gitconfig if absent.                                  |
| corsProxy                        | string                         | Optional [CORS proxy](https://www.npmjs.com/%40isomorphic-git/cors-proxy). Overrides value in repo config.  |
| forPush                          | boolean = false                | By default, the command queries the 'fetch' capabilities. If true, it will ask for the 'push' capabilities. |
| [headers](./headers)             | Object\<string, string\>       | Additional headers to include in HTTP requests, similar to git's `extraHeader` config                       |
| return                           | Promise\<GetRemoteInfoResult\> | Resolves successfully with an object listing the branches, tags, and capabilities of the remote.            |

The object returned has the following schema:

```ts
type GetRemoteInfoResult = {
  capabilities: Array<string>; // The list of capabilities returned by the server (part of the Git protocol)
  refs: {
  };
  HEAD?: string; // The default branch of the remote
  refs.heads?: Object<string, string>; // The branches on the remote
  refs.pull?: Object<string, string>; // The special branches representing pull requests (non-standard)
  refs.tags?: Object<string, string>; // The tags on the remote
}
```

This is a rare command that doesn't require an `fs`, `dir`, or even `gitdir` argument.
It just communicates to a remote git server, using the first step of the `git-upload-pack` handshake, but stopping short of fetching the packfile.

Example Code:

```js live
let info = await git.getRemoteInfo({
  http,
  url:
    "https://cors.isomorphic-git.org/github.com/isomorphic-git/isomorphic-git.git"
});
console.log(info);
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
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/api/getRemoteInfo.js';
  }
})();
</script>