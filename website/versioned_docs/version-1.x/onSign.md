---
title: onSign
sidebar_label: onSign
id: version-1.x-onSign
original_id: onSign
---

In order to use the PGP signing feature of [commit](./commit), you have to provide a PGP signing callback like so:

```js
import { pgp } from '@isomorphic-git/pgp-plugin'
git.commit({ ..., onSign: pgp.sign })
```

You can choose between an [OpenPGP.js implementation](https://github.com/isomorphic-git/openpgp-plugin) and an [isomorphic-pgp implementation](https://github.com/isomorphic-git/pgp-plugin)!

OpenPGP (recommended for node apps)
- much wider support for different keys
- LGPL (which probably means you can't bundle it into your application)
- ~164kb gzipped

isomorphic-pgp (recommended for browser apps)
- limited types of keys supported
- MIT
- ~21k gzipped

### Implementing your own `onSign` callback

The PGP signing function must implement the following API:

#### async ({ payload, secretKey }) => { signature }

| param         | type [= default]               | description                                                                         |
| ------------- | ------------------------------ | ----------------------------------------------------------------------------------- |
| **payload**   | string                         | a plaintext message                                                                 |
| **secretKey** | string                         | an 'ASCII armor' encoded PGP key (technically can actually contain _multiple_ keys) |
| return        | Promise\<{signature: string}\> | an 'ASCII armor' encoded "detached" signature                                       |

## Verifying Signatures

To verify signed commits and signed annotated tag objects, you use the signature (`.gpgsig`) and the signing payload (`payload`) as returned from `log`, `readCommit`, or `readTag`.

```js
// Verify a whole bunch of commits
import { pgp } from '@isomorphic-git/pgp-plugin'

let commits = await git.log({ fs, dir, ref: 'master' })
for (const { commit, payload } of commits) {
  let { valid, invalid } = await pgp.verify({ payload, publicKey, signature: commit.gpgsig })
  // valid is a string[] of the valid key ids
  // invalid is a string[] of the invalid key ids. Ideally this is empty.
}
```

```js
// Verify a commit object
import { pgp } from '@isomorphic-git/pgp-plugin'

let oid = await git.resolveRef({ fs, dir, ref: 'master' })
let { commit, payload } = await git.readCommit({ fs, dir, oid })
let { valid, invalid } = await pgp.verify({ payload, publicKey, signature: commit.gpgsig })
// valid is a string[] of the valid key ids
// invalid is a string[] of the invalid key ids
```

```js
// Verify an annotated tag object
import { pgp } from '@isomorphic-git/pgp-plugin'
import { resolveRef, readCommit } from 'isomorphic-git'

let oid = await resolveRef({ fs, dir, ref: 'v1.0.0' })
let { tag, payload } = await readTag({ fs, dir, oid })
let { valid, invalid } = await pgp.verify({ payload, publicKey, signature: tag.signature })
// valid is a string[] of the valid key ids
// invalid is a string[] of the invalid key ids
```

### A valid signature isn't enough!

Note that simply verifying the signatures are valid is not sufficient to establish _trust_.
You must also have reason to believe that the `publicKey` really does belong to the person who wrote the commit.
You must also have a way to find the `publicKey` in the first place!

So how _do_ you get the `publicKey`? Here are two ways, each with serious drawbacks. (Spoiler: there's no standard solution yet.)

One thing you could do would be to use `commit.author.email` and `commit.committer.email`, match those to GitHub usernames (not a trivial task because their emails might be private), and then lookup the PGP key on GitHub. See [`ghkeys`](https://www.npmjs.com/package/ghkeys) for an implementation of username -> PGP key lookup. The downside to this is, it only works for commits, signed by users, who have public emails on GitHub, who have uploaded their PGP keys on GitHub. But on the positive side, you can be pretty sure the PGP key really does belong to that user, because GitHub is acting as the authority. To be extra careful, I think GitHub's API lets you check whether the email address is a verified email address or not.

Another thing you could try is parse the PGP signature, extract the public key ID, and use the key ID to lookup the
public key on a PGP keyserver like mit.pgp.edu. (Some code to do just that follows this paragraph.) One downside to this is it only works if people bother to upload their key to a PGP keyserver. Another downside to this is there is absolutely no security. Anybody can upload a key claiming to be `johnsmith@aol.com` or whatever. If you look up the PGP key from the signature, you also need to make sure that the email address associated with the publicKey is the same one used in `commit.author.email` (or `commit.committer.email`). If you rely on a public keyserver where anyone can claim to be `johnsmith@aol.com`, then you'll need to exploit the Web-of-Trust (where keys are signed by other keys, which are signed by other keys, and so on until you reach a "trusted key") or use some other way to decide keys are trustworthy.

```js
const extractKey = (gpgsig) => {
  const m = Message.parse(gpgsig);
  for (const p of m.packets) {
    if (p.tag === 2 /* Signature Packet */) {
      for (const s of p.packet.unhashed.subpackets) {
        if (s.type === 16 /* Issuer */) {
          return s.subpacket.issuer_s
        }
      }
    }
  }
}

const lookupKey = async (keyid) => {
  let text = await (await fetch(`http://pgp.mit.edu/pks/lookup?op=get&search=0x${keyid}`)).text()
  let matches = text.match(/-----BEGIN PGP PUBLIC KEY BLOCK-----(.|\n)*-----END PGP PUBLIC KEY BLOCK-----/)
  if (matches) return matches[0]
}
```

You could do a "trust on first use" strategy where the first time you see a signed commit by `johnsmith@aol.com` you lookup the public key and save it, and then in the future if a signed commit by `johnsmith@aol.com` uses a different key, show a warning to the user that the key has changed. (This is very similar to the strategy used by SSH - maybe you've seen the famous message `The authenticity of host <IP ADDRESS> can't be established. RSA key fingerprint is <FINGERPRINT>. Are you sure you want to continue connecting (yes/no)?`)

If you're making a more enterprisey, application, you could send the user an email and verify the email that way. You could store the PGP keys that you've verified in a centralized database.

Sadly, these two questions:

- Where do I find the public key?
- Can I trust that the public key really belongs to this email address?

have no simple answers. However, if you're building a decentralized system where you auto-generate PGP keys for users, I'd recommend saving the public PGP keys in the git repo itself. That seems like an obvious place.
