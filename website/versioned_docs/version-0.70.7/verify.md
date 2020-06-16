---
title: verify
sidebar_label: verify
id: version-0.70.7-verify
original_id: verify
---

Verify a signed commit or tag

| param                | type [= default]                          | description                                                                                                                          |
| -------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| core                 | string = 'default'                        | The plugin core identifier to use for plugin injection                                                                               |
| fs [deprecated]      | FileSystem                                | The filesystem containing the git repo. Overrides the fs provided by the [plugin system](./plugin_fs.md).                            |
| dir                  | string                                    | The [working tree](dir-vs-gitdir.md) directory path                                                                                  |
| **gitdir**           | string = join(dir,'.git')                 | The [git directory](dir-vs-gitdir.md) path                                                                                           |
| **ref**              | string                                    | A reference to the commit or tag to verify                                                                                           |
| **publicKeys**       | string                                    | A PGP public key in ASCII armor format.                                                                                              |
| openpgp [deprecated] | OpenPGP                                   | An instance of the [OpenPGP library](https://unpkg.com/openpgp@2.6.2). Deprecated in favor of using a [PGP plugin](./plugin_pgp.md). |
| return               | Promise\<(false &#124; Array\<string\>)\> | The value `false` or the valid key ids (in hex format) used to sign the commit.                                                      |

For now, key management is beyond the scope of isomorphic-git's PGP features.
It is up to you to figure out what the commit's or tag's public key _should_ be.
I would use the "author" or "committer" name and email, and look up
that person's public key from a trusted source such as the GitHub API.

The function returns `false` if any of the signatures on a signed git commit are invalid.
Otherwise, it returns an array of the key ids that were used to sign it.

The `publicKeys` argument is a single string in ASCII armor format. However, it is plural "keys" because
you can technically have multiple public keys in a single ASCII armor string. While I haven't tested it, it
should support verifying a single commit signed with multiple keys. Hence why the returned result is an array of key ids.

Example Code:

```js live
let keyids = await git.verify({
  dir: '$input((/))',
  openpgp,
  ref: '$input((HEAD))',
  publicKeys: `$textarea((
-----BEGIN PGP PUBLIC KEY BLOCK-----
...
))`
})
console.log(keyids)
```

<script>
(function rewriteEditLink() {
  const el = document.querySelector('a.edit-page-link.button');
  if (el) {
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/commands/verify.js';
  }
})();
</script>