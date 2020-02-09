---
title: 'credentialManager' plugin
sidebar_label: credentialManager
id: version-0.70.7-plugin_credentialManager
original_id: plugin_credentialManager
---

You can always use the [`username`, `password`, `token`, and `oauth2format`](./authentication.md) parameters to authenticate to remote git servers.

But sometimes this is not ideal:

- You might not know whether a git repo requires authentication before you attempt to clone it, in the case of private repos.
- In order to support submodules (it doesn't yet, but that feature is planned) we have to recursively clone multiple repos,
  but those repos might not all use the same username/password. We won't even know what those submodule repo URLs are until
  we've cloned the first repo, so providing the username and password at the beginning of the clone command is not ideal.

Therefore there is a `credentialManager` plugin system that allows isomorphic-git to _dynamically_ request credentials on demand.

Here is how to initialize a `credentialManager` plugin:

```js
// Using require() in Node.js
const git = require('isomorphic-git')
git.plugins.set('credentialManager', credentialManager)

// using ES6 modules
import { plugins } from 'isomorphic-git'
plugins.set('credentialManager', credentialManager)
```

> Note: only one `credentialManager` plugin can be registered at a time.

This also leads to a better experience for the user. For instance, instead of entering their username/password every time,
it can be stored and remembered in a keyring. The username/password combo can be stored for an entire domain name,
such as one username/password for `gitlab.com` and another for `github.com` so users almost never need to re-enter
their credentials once saved. But, if for some reason the saved password doesn't work (such as when they changed their
password), instead of failing `isomorphic-git` could interactively prompt the user for the new password.

### Implementing your own `credentialManager` plugin

A `credentialManager` plugin must implement the following API:

```ts
interface IAuthJSON {
  username?: string;
  password?: string;
  token?: string;
  oauth2format?: string;
  [x: string]: JSON;
}

interface GitCredentialManagerPlugin {
  fill ({ url: string }): Promise<IAuthJSON>;
  approved ({ url: string, auth: IAuthJSON }): Promise<void>;
  rejected ({ url: string, auth: IAuthJSON }): Promise<void>;
}
```

This API is modeled after the canonical [git-credential](https://git-scm.com/docs/git-credential) API, 
although I've modified the `fill|approve|reject` to be `fill|approved|rejected` because it took me forever to
figure out that "approve" is not _asking_ for approval, but _informing_ the backend that these credentials were
successful. (Similarly 'reject' is not telling the backend to reject the credentials, but informing the backend
that those credentials were rejected by the server.)

Here `auth` can be any combination of `username`, `password`, `token`, and `oauth2format`.
(See [authentication](https://isomorphic-git.org/docs/en/authentication) for details.)
You can also include additional properties that may only be understood by certain **remote providers** that understand
them, such as an `ssh_keyfile` for the hypothetical SSH remote provider. The only requirement is it be a
JSON-serializable value.

If during `fill`, the credential helper does not have (or chooses not to provide) any auth information for that url,
it should return an empty JSON object.

_Note: whether the path is should be considered when searching for matching credentials _will be left to credentialManager implementations_
but to match `git`'s behavior implementations should respect the config value `useHttpPath`. But let's be honest -
that's not the most important detail.

Take a look at the examples below for inspiration:
- [credential-manager-node-cli](https://github.com/isomorphic-git/credential-manager-node-cli)
- [credential-manager-web](https://github.com/isomorphic-git/credential-manager-web)
- [GIT Web Terminal](https://github.com/jcubic/git)
