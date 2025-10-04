---
title: pull
sidebar_label: pull
id: version-1.x-pull
original_id: pull
---

Fetch and merge commits from a remote repository

| param                            | type [= default]                     | description                                                                                                                                                                                                |
| -------------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [**fs**](./fs)                   | FsClient                             | a file system client                                                                                                                                                                                       |
| [**http**](./http)               | HttpClient                           | an HTTP client                                                                                                                                                                                             |
| [onProgress](./onProgress)       | ProgressCallback                     | optional progress event callback                                                                                                                                                                           |
| [onMessage](./onMessage)         | MessageCallback                      | optional message event callback                                                                                                                                                                            |
| [onAuth](./onAuth)               | AuthCallback                         | optional auth fill callback                                                                                                                                                                                |
| [onAuthFailure](./onAuthFailure) | AuthFailureCallback                  | optional auth rejected callback                                                                                                                                                                            |
| [onAuthSuccess](./onAuthSuccess) | AuthSuccessCallback                  | optional auth approved callback                                                                                                                                                                            |
| **dir**                          | string                               | The [working tree](dir-vs-gitdir.md) directory path                                                                                                                                                        |
| **gitdir**                       | string = join(dir,'.git')            | The [git directory](dir-vs-gitdir.md) path                                                                                                                                                                 |
| ref                              | string                               | Which branch to merge into. By default this is the currently checked out branch. In an empty repository, this specifies which local branch to create and track.                                            |
| url                              | string                               | (Added in 1.1.0) The URL of the remote repository. The default is the value set in the git config for that remote.                                                                                         |
| remote                           | string                               | (Added in 1.1.0) If URL is not specified, determines which remote to use.                                                                                                                                  |
| remoteRef                        | string                               | (Added in 1.1.0) The name of the branch on the remote to fetch. By default this is the configured remote tracking branch. In an empty repository without `ref`, determines which branch to create locally. |
| prune                            | boolean = false                      | Delete local remote-tracking branches that are not present on the remote                                                                                                                                   |
| pruneTags                        | boolean = false                      | Prune local tags that don't exist on the remote, and force-update those tags that differ                                                                                                                   |
| corsProxy                        | string                               | Optional [CORS proxy](https://www.npmjs.com/%40isomorphic-git/cors-proxy). Overrides value in repo config.                                                                                                 |
| singleBranch                     | boolean = false                      | Instead of the default behavior of fetching all the branches, only fetch a single branch.                                                                                                                  |
| fastForward                      | boolean = true                       | If false, only create merge commits.                                                                                                                                                                       |
| fastForwardOnly                  | boolean = false                      | Only perform simple fast-forward merges. (Don't create merge commits.)                                                                                                                                     |
| [headers](./headers)             | Object\<string, string\>             | Additional headers to include in HTTP requests, similar to git's `extraHeader` config                                                                                                                      |
| author                           | Object                               | The details about the author.                                                                                                                                                                              |
| author.name                      | string                               | Default is `user.name` config.                                                                                                                                                                             |
| author.email                     | string                               | Default is `user.email` config.                                                                                                                                                                            |
| author.timestamp                 | number = Math.floor(Date.now()/1000) | Set the author timestamp field. This is the integer number of seconds since the Unix epoch (1970-01-01 00:00:00).                                                                                          |
| author.timezoneOffset            | number                               | Set the author timezone offset field. This is the difference, in minutes, from the current timezone to UTC. Default is `(new Date()).getTimezoneOffset()`.                                                 |
| committer                        | Object = author                      | The details about the commit committer, in the same format as the author parameter. If not specified, the author details are used.                                                                         |
| committer.name                   | string                               | Default is `user.name` config.                                                                                                                                                                             |
| committer.email                  | string                               | Default is `user.email` config.                                                                                                                                                                            |
| committer.timestamp              | number = Math.floor(Date.now()/1000) | Set the committer timestamp field. This is the integer number of seconds since the Unix epoch (1970-01-01 00:00:00).                                                                                       |
| committer.timezoneOffset         | number                               | Set the committer timezone offset field. This is the difference, in minutes, from the current timezone to UTC. Default is `(new Date()).getTimezoneOffset()`.                                              |
| signingKey                       | string                               | passed to [commit](commit.md) when creating a merge commit                                                                                                                                                 |
| cache                            | object                               | a [cache](cache.md) object                                                                                                                                                                                 |
| return                           | Promise\<void\>                      | Resolves successfully when pull operation completes                                                                                                                                                        |

## Empty Repository Behavior

When pulling into an empty repository (one with no current branch, such as after cloning an empty remote):

- If `ref` is specified, a local branch with that name will be created tracking the remote branch
- If `ref` is not specified, the remote's default branch (from `refs/remotes/<remote>/HEAD`) will be used
- If neither `ref` nor the remote's default branch can be determined, a `MissingParameterError` is thrown
- The newly created branch automatically sets up tracking configuration (`branch.<name>.remote` and `branch.<name>.merge`)

This matches canonical Git's behavior when running `git pull` in an empty clone.

Example Code:

```js live
await git.pull({
  fs,
  http,
  dir: '/tutorial',
  ref: 'main',
  singleBranch: true,
})
console.log('done')
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
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/api/pull.js';
  }
})();
</script>
