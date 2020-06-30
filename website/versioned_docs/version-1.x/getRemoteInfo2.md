---
title: getRemoteInfo2
sidebar_label: getRemoteInfo2
id: version-1.x-getRemoteInfo2
original_id: getRemoteInfo2
---

List a remote server's capabilities.

| param                            | type [= default]                | description                                                                                                 |
| -------------------------------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| [**http**](./http)               | HttpClient                      | an HTTP client                                                                                              |
| [onAuth](./onAuth)               | AuthCallback                    | optional auth fill callback                                                                                 |
| [onAuthFailure](./onAuthFailure) | AuthFailureCallback             | optional auth rejected callback                                                                             |
| [onAuthSuccess](./onAuthSuccess) | AuthSuccessCallback             | optional auth approved callback                                                                             |
| **url**                          | string                          | The URL of the remote repository. Will be gotten from gitconfig if absent.                                  |
| corsProxy                        | string                          | Optional [CORS proxy](https://www.npmjs.com/%40isomorphic-git/cors-proxy). Overrides value in repo config.  |
| forPush                          | boolean = false                 | By default, the command queries the 'fetch' capabilities. If true, it will ask for the 'push' capabilities. |
| [headers](./headers)             | Object\<string, string\>        | Additional headers to include in HTTP requests, similar to git's `extraHeader` config                       |
| protocolVersion                  | 1  &#124;  2 = 2                | Which version of the Git Protocol to use.                                                                   |
| return                           | Promise\<GetRemoteInfo2Result\> | Resolves successfully with an object listing the capabilities of the remote.                                |

This object has the following schema:

```ts
type GetRemoteInfo2Result = {
  protocolVersion: 1 | 2; // Git protocol version the server supports
  capabilities: Object<string, (string|true)>; // An object of capabilities represented as keys and values
  refs?: Array<ServerRef>; // Server refs (they get returned by protocol version 1 whether you want them or not)
}
```

This object has the following schema:

```ts
type ServerRef = {
  ref: string; // The name of the ref
  oid: string; // The SHA-1 object id the ref points to
  target?: string; // The target ref pointed to by a symbolic ref
  peeled?: string; // If the oid is the SHA-1 object id of an annotated tag, this is the SHA-1 object id that the annotated tag points to
}
```

This is a rare command that doesn't require an `fs`, `dir`, or even `gitdir` argument.
It just communicates to a remote git server, determining what protocol version, commands, and features it supports.

> The successor to [`getRemoteInfo`](./getRemoteInfo.md), this command supports Git Wire Protocol Version 2.
> Therefore its return type is more complicated as either:
>
> - v1 capabilities (and refs) or
> - v2 capabilities (and no refs)
>
> are returned.
> If you just care about refs, use [`listServerRefs`](./listServerRefs.md)

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