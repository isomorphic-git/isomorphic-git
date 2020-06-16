---
title: getRemoteInfo
sidebar_label: getRemoteInfo
id: version-0.70.7-getRemoteInfo
original_id: getRemoteInfo
---

List a remote servers branches, tags, and capabilities.

| param        | type [= default]             | description                                                                                                 |
| ------------ | ---------------------------- | ----------------------------------------------------------------------------------------------------------- |
| core         | string = 'default'           | The plugin core identifier to use for plugin injection                                                      |
| **url**      | string                       | The URL of the remote repository. Will be gotten from gitconfig if absent.                                  |
| corsProxy    | string                       | Optional [CORS proxy](https://www.npmjs.com/%40isomorphic-git/cors-proxy). Overrides value in repo config.  |
| forPush      | boolean = false              | By default, the command queries the 'fetch' capabilities. If true, it will ask for the 'push' capabilities. |
| noGitSuffix  | boolean = false              | If true, clone will not auto-append a `.git` suffix to the `url`. (**AWS CodeCommit needs this option**)    |
| username     | string                       | See the [Authentication](./authentication.html) documentation                                               |
| password     | string                       | See the [Authentication](./authentication.html) documentation                                               |
| token        | string                       | See the [Authentication](./authentication.html) documentation                                               |
| oauth2format | string                       | See the [Authentication](./authentication.html) documentation                                               |
| headers      | object                       | Additional headers to include in HTTP requests, similar to git's `extraHeader` config                       |
| return       | Promise\<RemoteDescription\> | Resolves successfully with an object listing the branches, tags, and capabilities of the remote.            |

The object returned has the following schema:

```ts
type RemoteDescription = {
  capabilities: Array<string>; // The list of capabilities returned by the server (part of the Git protocol)
  refs: {
    heads: Object<string, string>; // The branches on the remote
    pull: Object<string, string>; // The special branches representing pull requests (non-standard)
    tags: Object<string, string>; // The tags on the remote
  };
}
```

This is a rare command that doesn't require an `fs`, `dir`, or even `gitdir` argument.
It just communicates to a remote git server, using the first step of the `git-upload-pack` handshake, but stopping short of fetching the packfile.

Example Code:

```js live
let info = await git.getRemoteInfo({
  url:
    "$input((https://cors.isomorphic-git.org/github.com/isomorphic-git/isomorphic-git.git))"
});
console.log(info);
```

<script>
(function rewriteEditLink() {
  const el = document.querySelector('a.edit-page-link.button');
  if (el) {
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/commands/getRemoteInfo.js';
  }
})();
</script>