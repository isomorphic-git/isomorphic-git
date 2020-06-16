---
title: sign
sidebar_label: sign
id: version-0.70.7-sign
original_id: sign
---

> **Deprecated**
> This command will be removed in the 1.0.0 version of `isomorphic-git` as it is no longer necessary.
>
> Previously, to sign commits you needed two steps, `commit` and then `sign`.
> Now commits can be signed when they are created with the [`commit`](./commit.md) command, provided you use a [`pgp`](./plugin_pgp.md) plugin.

Create a signed commit

| param           | type [= default]           | description                                                                                               |
| --------------- | -------------------------- | --------------------------------------------------------------------------------------------------------- |
| core            | string = 'default'         | The plugin core identifier to use for plugin injection                                                    |
| fs [deprecated] | FileSystem                 | The filesystem containing the git repo. Overrides the fs provided by the [plugin system](./plugin_fs.md). |
| dir             | string                     | The [working tree](dir-vs-gitdir.md) directory path                                                       |
| **gitdir**      | string = join(dir, '.git') | The [git directory](dir-vs-gitdir.md) path                                                                |
| **openpgp**     | string                     | An instance of the [OpenPGP library](https://unpkg.com/openpgp%402.6.2)                                   |
| **privateKeys** | string                     | A PGP private key in ASCII armor format                                                                   |
| return          | Promise\<void\>            | Resolves successfully when filesystem operations are completed                                            |

<aside>
OpenPGP.js is unfortunately licensed under an incompatible license and thus cannot be included in a minified bundle with
isomorphic-git which is an MIT/BSD style library, because that would violate the "dynamically linked" stipulation.
To use this feature you include openpgp with a separate script tag and pass it in as an argument.
</aside>

It creates a signed version of whatever commit HEAD currently points to, and then updates the current branch,
leaving the original commit dangling.

The `privateKeys` argument is a single string in ASCII armor format. However, it is plural "keys" because
you can technically have multiple private keys in a single ASCII armor string. The openpgp.sign() function accepts
multiple keys, so while I haven't tested it, it should support signing a single commit with multiple keys.

Example Code:

```js live
let sha = await git.sign({
  dir: '$input((/))',
  openpgp,
  privateKeys: `$textarea((
-----BEGIN PGP PRIVATE KEY BLOCK-----
...
))`
})
console.log(sha)
```

<script>
(function rewriteEditLink() {
  const el = document.querySelector('a.edit-page-link.button');
  if (el) {
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/commands/sign.js';
  }
})();
</script>