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

### About `protocolVersion`

There's a rather fun trade-off between Git Protocol Version 1 and Git Protocol Version 2.
Version 2 actually requires 2 HTTP requests instead of 1, making it similar to fetch or push in that regard.
However, version 2 supports server-side filtering by prefix, whereas that filtering is done client-side in version 1.
Which protocol is most efficient therefore depends on the number of refs on the remote, the latency of the server, and speed of the network connection.
For an small repos (or fast Internet connections), the requirement to make two trips to the server makes protocol 2 slower.
But for large repos (or slow Internet connections), the decreased payload size of the second request makes up for the additional request.

Hard numbers vary by situation, but here's some numbers from my machine:

Using isomorphic-git in a browser, with a CORS proxy, listing only the branches (refs/heads) of https://github.com/isomorphic-git/isomorphic-git
- Protocol Version 1 took ~300ms and transferred 84 KB.
- Protocol Version 2 took ~500ms and transferred 4.1 KB.

Using isomorphic-git in a browser, with a CORS proxy, listing only the branches (refs/heads) of https://gitlab.com/gitlab-org/gitlab
- Protocol Version 1 took ~4900ms and transferred 9.41 MB.
- Protocol Version 2 took ~1280ms and transferred 433 KB.

Finally, there is a fun quirk regarding the `symrefs` parameter.
Protocol Version 1 will generally only return the `HEAD` symref and not others.
Historically, this meant that servers don't use symbolic refs except for `HEAD`, which is used to point at the "default branch".
However Protocol Version 2 can return *all* the symbolic refs on the server.
So if you are running your own git server, you could take advantage of that I guess.

#### TL;DR
If you are _not_ taking advantage of `prefix` I would recommend `protocolVersion: 1`.
Otherwise, I recommend to use the default which is `protocolVersion: 2`.

Example Code:

```js live
// List all the branches on a repo
let refs = await git.listServerRefs({
  http,
  corsProxy: "https://cors.isomorphic-git.org",
  url: "https://github.com/isomorphic-git/isomorphic-git.git",
  prefix: "refs/heads/",
});
console.log(refs);
```

```js live
// Get the default branch on a repo
let refs = await git.listServerRefs({
  http,
  corsProxy: "https://cors.isomorphic-git.org",
  url: "https://github.com/isomorphic-git/isomorphic-git.git",
  prefix: "HEAD",
  symrefs: true,
});
console.log(refs);
```

```js live
// List all the tags on a repo
let refs = await git.listServerRefs({
  http,
  corsProxy: "https://cors.isomorphic-git.org",
  url: "https://github.com/isomorphic-git/isomorphic-git.git",
  prefix: "refs/tags/",
  peelTags: true,
});
console.log(refs);
```

```js live
// List all the pull requests on a repo
let refs = await git.listServerRefs({
  http,
  corsProxy: "https://cors.isomorphic-git.org",
  url: "https://github.com/isomorphic-git/isomorphic-git.git",
  prefix: "refs/pull/",
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