---
title: push
sidebar_label: push
id: version-0.74.0-push
original_id: push
---

Push a branch or tag

| param                | type [= default]          | description                                                                                                |
| -------------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------- |
| core                 | string = 'default'        | The plugin core identifier to use for plugin injection                                                     |
| fs [deprecated]      | FileSystem                | The filesystem containing the git repo. Overrides the fs provided by the [plugin system](./plugin_fs.md).  |
| dir                  | string                    | The [working tree](dir-vs-gitdir.md) directory path                                                        |
| **gitdir**           | string = join(dir,'.git') | The [git directory](dir-vs-gitdir.md) path                                                                 |
| ref                  | string                    | Which branch to push. By default this is the currently checked out branch.                                 |
| remoteRef            | string                    | The name of the receiving branch on the remote. By default this is the same as `ref`. (See note below)     |
| remote               | string                    | If URL is not specified, determines which remote to use.                                                   |
| force                | boolean = false           | If true, behaves the same as `git push --force`                                                            |
| noGitSuffix          | boolean = false           | If true, do not auto-append a `.git` suffix to the `url`. (**AWS CodeCommit needs this option**)           |
| url                  | string                    | The URL of the remote git server. The default is the value set in the git config for that remote.          |
| corsProxy            | string                    | Optional [CORS proxy](https://www.npmjs.com/%40isomorphic-git/cors-proxy). Overrides value in repo config. |
| username             | string                    | See the [Authentication](./authentication.html) documentation                                              |
| password             | string                    | See the [Authentication](./authentication.html) documentation                                              |
| token                | string                    | See the [Authentication](./authentication.html) documentation                                              |
| oauth2format         | string                    | See the [Authentication](./authentication.html) documentation                                              |
| headers              | object                    | Additional headers to include in HTTP requests, similar to git's `extraHeader` config                      |
| autoTranslateSSH     | boolean                   | Attempt to automatically translate SSH remotes into HTTP equivalents                                       |
| emitter [deprecated] | EventEmitter              | Overrides the emitter set via the ['emitter' plugin](./plugin_emitter.md).                                 |
| emitterPrefix        | string = ''               | Scope emitted events by prepending `emitterPrefix` to the event name.                                      |
| return               | Promise\<PushResponse\>   | Resolves successfully when push completes with a detailed description of the operation from the server.    |

Returns an object with a schema like this:

```ts
type PushResponse = {
  ok?: Array<string>;
  errors?: Array<string>;
  headers?: object;
}
```

> *Note:* The behavior of `remoteRef` is reasonable but not the _correct_ behavior. It _should_ be using the configured remote tracking branch! TODO: I need to fix this

The push command returns an object that describes the result of the attempted push operation.
*Notes:* If there were no errors, then there will be no `errors` property. There can be a mix of `ok` messages and `errors` messages.

| param  | type [= default] | description                                                                                                                                                                                                      |
| ------ | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ok     | Array\<string\>  | The first item is "unpack" if the overall operation was successful. The remaining items are the names of refs that were updated successfully.                                                                    |
| errors | Array\<string\>  | If the overall operation threw and error, the first item will be "unpack {Overall error message}". The remaining items are individual refs that failed to be updated in the format "{ref name} {error message}". |

To monitor progress events, see the documentation for the [`'emitter'` plugin](./plugin_emitter.md).

Example Code:

```js live
let pushResponse = await git.push({
  dir: '$input((/))',
  remote: '$input((origin))',
  ref: '$input((master))',
  token: $input((process.env.GITHUB_TOKEN)),
})
console.log(pushResponse)
```

<script>
(function rewriteEditLink() {
  const el = document.querySelector('a.edit-page-link.button');
  if (el) {
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/commands/push.js';
  }
})();
</script>