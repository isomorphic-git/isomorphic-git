---
title: listServerRefs
sidebar_label: listServerRefs
id: version-1.x-listServerRefs
original_id: listServerRefs
---

Fetch a list of refs (branches, tags, etc) from a server.

| param                            | type [= default]              | description                                                                                                 |
| -------------------------------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------- |
| [**http**](./http)               | HttpClient                    | an HTTP client                                                                                              |
| [onAuth](./onAuth)               | AuthCallback                  | optional auth fill callback                                                                                 |
| [onAuthFailure](./onAuthFailure) | AuthFailureCallback           | optional auth rejected callback                                                                             |
| [onAuthSuccess](./onAuthSuccess) | AuthSuccessCallback           | optional auth approved callback                                                                             |
| **url**                          | string                        | The URL of the remote repository. Will be gotten from gitconfig if absent.                                  |
| corsProxy                        | string                        | Optional [CORS proxy](https://www.npmjs.com/%40isomorphic-git/cors-proxy). Overrides value in repo config.  |
| forPush                          | boolean = false               | By default, the command queries the 'fetch' capabilities. If true, it will ask for the 'push' capabilities. |
| [headers](./headers)             | Object\<string, string\>      | Additional headers to include in HTTP requests, similar to git's `extraHeader` config                       |
| protocolVersion                  | 1  &#124;  2 = 2              | Which version of the Git Protocol to use.                                                                   |
| prefix                           | string                        | Only list refs that start with this prefix                                                                  |
| symrefs                          | boolean = false               | Include symbolic ref targets                                                                                |
| peelTags                         | boolean = false               | Include annotated tag peeled targets                                                                        |
| return                           | Promise\<Array\<ServerRef\>\> | Resolves successfully with an array of ServerRef objects                                                    |

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
It just requires an `http` argument.

Example Code:

```js live
let refs = await git.listServerRefs({
  http,
  corsProxy: "https://cors.isomorphic-git.org",
  url: "https://github.com/isomorphic-git/isomorphic-git.git"
});
console.log(refs);
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
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/api/listServerRefs.js';
  }
})();
</script>