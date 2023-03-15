---
title: fetch
sidebar_label: fetch
id: version-0.70.7-fetch
original_id: fetch
---

Fetch commits from a remote repository

| param                | type [= default]          | description                                                                                                   |
| -------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------- |
| core                 | string = 'default'        | The plugin core identifier to use for plugin injection                                                        |
| fs [deprecated]      | FileSystem                | The filesystem containing the git repo. Overrides the fs provided by the [plugin system](./plugin_fs.md).     |
| dir                  | string                    | The [working tree](dir-vs-gitdir.md) directory path                                                           |
| **gitdir**           | string = join(dir,'.git') | The [git directory](dir-vs-gitdir.md) path                                                                    |
| url                  | string                    | The URL of the remote repository. Will be gotten from gitconfig if absent.                                    |
| corsProxy            | string                    | Optional [CORS proxy](https://www.npmjs.com/%40isomorphic-git/cors-proxy). Overrides value in repo config.    |
| ref                  | string = 'HEAD'           | Which branch to fetch. By default this is the currently checked out branch.                                   |
| singleBranch         | boolean = false           | Instead of the default behavior of fetching all the branches, only fetch a single branch.                     |
| noGitSuffix          | boolean = false           | If true, clone will not auto-append a `.git` suffix to the `url`. (**AWS CodeCommit needs this option**)      |
| tags                 | boolean = false           | Also fetch tags                                                                                               |
| remote               | string                    | What to name the remote that is created.                                                                      |
| depth                | number                    | Integer. Determines how much of the git repository's history to retrieve                                      |
| since                | Date                      | Only fetch commits created after the given date. Mutually exclusive with `depth`.                             |
| exclude              | Array\<string\> = []      | A list of branches or tags. Instructs the remote server not to send us any commits reachable from these refs. |
| relative             | boolean = false           | Changes the meaning of `depth` to be measured from the current shallow depth rather than from the branch tip. |
| username             | string                    | See the [Authentication](./authentication.html) documentation                                                 |
| password             | string                    | See the [Authentication](./authentication.html) documentation                                                 |
| token                | string                    | See the [Authentication](./authentication.html) documentation                                                 |
| oauth2format         | string                    | See the [Authentication](./authentication.html) documentation                                                 |
| headers              | object                    | Additional headers to include in HTTP requests, similar to git's `extraHeader` config                         |
| prune                | boolean                   | Delete local remote-tracking branches that are not present on the remote                                      |
| pruneTags            | boolean                   | Prune local tags that don’t exist on the remote, and force-update those tags that differ                      |
| emitter [deprecated] | EventEmitter              | Overrides the emitter set via the ['emitter' plugin](./plugin_emitter.md).                                    |
| emitterPrefix        | string = ''               | Scope emitted events by prepending `emitterPrefix` to the event name.                                         |
| return               | Promise\<FetchResponse\>  | Resolves successfully when fetch completes                                                                    |

The object returned has the following schema:

```ts
type FetchResponse = {
  defaultBranch: string | null; // The branch that is cloned if no branch is specified (typically "master")
  fetchHead: string | null; // The SHA-1 object id of the fetched head commit
  fetchHeadDescription: string | null; // a textual description of the branch that was fetched
  headers?: object; // The HTTP response headers returned by the git server
  pruned?: Array<string>; // A list of branches that were pruned, if you provided the `prune` parameter
}
```

Future versions of isomorphic-git might return additional metadata.

To monitor progress events, see the documentation for the [`'emitter'` plugin](./plugin_emitter.md).

Example Code:

```js live
await git.fetch({
  dir: '$input((/))',
  corsProxy: 'https://cors.isomorphic-git.org',
  url: '$input((https://github.com/isomorphic-git/isomorphic-git))',
  ref: '$input((master))',
  depth: $input((1)),
  singleBranch: $input((true)),
  tags: $input((false))
})
console.log('done')
```

<script>
(function rewriteEditLink() {
  const el = document.querySelector('a.edit-page-link.button');
  if (el) {
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/commands/fetch.js';
  }
})();
</script>