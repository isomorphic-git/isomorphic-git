---
title: getRemoteInfo2
sidebar_label: getRemoteInfo2
id: version-1.x-getRemoteInfo2
original_id: getRemoteInfo2
---

List a remote server's capabilities.

| param                            | type [= default]                                              | description                                                                                                 |
| -------------------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| [**http**](./http)               | HttpClient                                                    | an HTTP client                                                                                              |
| [onAuth](./onAuth)               | AuthCallback                                                  | optional auth fill callback                                                                                 |
| [onAuthFailure](./onAuthFailure) | AuthFailureCallback                                           | optional auth rejected callback                                                                             |
| [onAuthSuccess](./onAuthSuccess) | AuthSuccessCallback                                           | optional auth approved callback                                                                             |
| **url**                          | string                                                        | The URL of the remote repository. Will be gotten from gitconfig if absent.                                  |
| corsProxy                        | string                                                        | Optional [CORS proxy](https://www.npmjs.com/%40isomorphic-git/cors-proxy). Overrides value in repo config.  |
| forPush                          | boolean = false                                               | By default, the command queries the 'fetch' capabilities. If true, it will ask for the 'push' capabilities. |
| [headers](./headers)             | Object\<string, string\>                                      | Additional headers to include in HTTP requests, similar to git's `extraHeader` config                       |
| protocolVersion                  | 1  &#124;  2 = 2                                              | Which version of the Git Protocol to use.                                                                   |
| return                           | Promise\<(GetRemoteInfoResult1 &#124; GetRemoteInfoResult2)\> | Resolves successfully with an object listing the branches, tags, and capabilities of the remote.            |

This object has the following schema:

```ts
type GetRemoteInfoResult1 = {
  protocolVersion: 1; // Git Protocol Version 1
  capabilities: Array<string>; // A list of capabilities
  refs: Object<string, string>; // An object of remote refs and corresponding SHA-1 object ids
  symrefs: Object<string, string>; // An object of remote symrefs and corresponding refs
}
```

This object has the following schema:

```ts
type GetRemoteInfoResult2 = {
  protocolVersion: 2; // Git Protocol version 2
  capabilities: Object<string, (string|null)>; // An object of capabilities represented as keys and values
}
```

> The successor to `getRemoteInfo`, this command supports Git Wire Protocol Version 2.
> Therefore its return type is more complicated, as *either* a v1 or v2 result is returned.
> Also, I've "fixed" the v1 return result so its a flat list of refs.
> The nested object thing looked nice to the human eye, but is a pain to deal with programatically.

This is a rare command that doesn't require an `fs`, `dir`, or even `gitdir` argument.
It just communicates to a remote git server, determining what protocol version, commands, and features it supports.

Example Code:

```js live
let info = await git.getRemoteInfo2({
  http,
  corsProxy: "https://cors.isomorphic-git.org",
  url: "https://github.com/isomorphic-git/isomorphic-git.git"
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
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/api/getRemoteInfo2.js';
  }
})();
</script>