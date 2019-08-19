import * as openpgp from 'openpgp'

openpgp.config.aead_protect = false
openpgp.config.prefer_hash_algorithm = 2 // SHA1
var hkp = new openpgp.HKP('https://pgp.mit.edu')
var hkp2 = new openpgp.HKP('http://keys.gnupg.net')
var keyring = new openpgp.Keyring()

// Print a key
function printKey () {
  const keyid = printKeyid(this.primaryKey.getKeyId())
  const userid = printUser(this.getPrimaryUser().user)
  return keyid + ' ' + userid
}
// openpgp.key.toString = printKey

function printKeyid (keyid) {
  return keyid.toHex()
}
// openpgp.Keyid.prototype.toString = openpgp.Keyid.prototype.toHex

function printUser (user) {
  return user.userId.userid
}

function getFullSignature (signature) {
  const key = keyring.getKeysForId(printKeyid(signature.keyid))[0]
  const user = key.getPrimaryUser().user
  signature.user = user
  signature.email = printUser(user).match(/<(.*)>/)[1]
  return signature
}

// Find the public key(s) for `email` on the local browser keyring.
function locallookup (email) {
  const keys = keyring.publicKeys.getForAddress(email)
  if (keys.length === 0) {
    return null
  }
  // keys[0].toString = printKey
  return keys[0]
}

export class PGP {
  // Find the public key(s) for `email` on a server (note - how can you trust the PGP server?) add them to the browser keyring.
  static async lookup (email) {
    // Has no option to do an exact email search for some reason.
    // william@example.net instead returns results for "william example net"
    // so we must work around this stupidity
    try {
      let keys = await hkp.lookup({ query: email })
      if (typeof keys === 'undefined') return null
      keys = openpgp.key.readArmored(keys).keys
      // Find keys with an exact match for the email address given
      let results = []
      for (const k of keys) {
        for (const u of k.users) {
          if (u.userId.userid.includes(`<${email}>`)) {
            results.push(k.primaryKey.keyid.toHex())
            keyring.publicKeys.push(k)
          }
        }
      }
      results = results.length > 0 ? results : null
      return results
    } catch (err) {
      console.log('err =', err)
      return null
    }
  }

  // Generate a key pair in the browser and add it to the browser keyring.
  static async keygen (name, email) {
    const { privateKeyArmored, publicKeyArmored } = await openpgp.generateKey({
      userIds: [
        {
          name: name,
          email: email
        }
      ]
    })
    keyring.publicKeys.importKey(publicKeyArmored)
    keyring.privateKeys.importKey(privateKeyArmored)
    // let key = openpgp.key.readArmored(privateKeyArmored).keys[0]
    // key.toString = printKey
    // We need to manually call this to save the keypair to localstorage
    keyring.store()
  }

  // Returns a human-readable list of all the public keys in the browser's keyring.
  static async list () {
    const print = []
    for (const key of keyring.publicKeys.keys) {
      print.push(printKey.apply(key))
    }
    return print
  }

  // Encrypt `msg` using the public key for `email`
  static async encrypt (email, msg) {
    // Load Alice's keypair from localstorage
    // let privateKey = keyring.privateKeys.keys[0]
    const publicKey = locallookup(email)
    const encrypted = await openpgp.encrypt({
      publicKeys: publicKey, // NOTE: it's plural...
      data: msg
    })
    return encrypted.data
  }

  // Decrypt `msg` using the private key for `email`
  // msg should be the full encrypted message including the -----BEGIN PGP MESSAGE----- and -----END PGP MESSAGE----- lines.
  static async decrypt (email, msg) {
    const privateKey = PGP.lookupPrivateKey(email)
    const decrypted = openpgp.decrypt({
      privateKey: privateKey,
      message: openpgp.message.readArmored(msg)
    })
    return decrypted.data
  }

  // Sign `msg` using the private key for `email'
  static async sign (email, msg) {
    // Load keypair from localstorage
    const privateKey = PGP.lookupPrivateKey(email)
    if (privateKey) {
      const signed = await openpgp.sign({
        privateKeys: privateKey,
        data: msg
      })
      return signed.data
    } else {
      throw new Error(
        'No PrivateKey in the OpenPGP keyring for the email address: ' + email
      )
    }
  }

  // Verify a signed `msg` using the public key for `email`
  static async verify (email, msg) {
    const publicKeys = locallookup(email)
    const verified = await openpgp.verify({
      publicKeys: publicKeys,
      message: openpgp.cleartext.readArmored(msg)
    })
    let signature = verified.signatures.map(getFullSignature)
    signature = signature.filter(x => x.email === email)
    if (signature.length !== 1) {
      return false
    } else {
      return signature[0].valid
    }
  }

  // Sign `plaintext` using the private key for `email'
  static async createBinaryDetachedSignature (email, plaintext) {
    // Load keypair from localstorage
    const privateKey = PGP.lookupPrivateKey(email)
    if (privateKey) {
      // Is the only difference between cleartext signatures and detached binary the text normalization?
      // If so, I could probably add that functionality to openpgpjs - I'd just need a little guidance
      // on how to encode the PacketType and add the functionality to export to armor.js
      const bytes = openpgp.util.str2Uint8Array(plaintext)
      const message = openpgp.message.fromBinary(bytes)
      const signedMessage = message.sign([privateKey])
      const signature = signedMessage.packets.filterByTag(
        openpgp.enums.packet.signature
      )
      let armoredMessage = openpgp.armor.encode(
        openpgp.enums.armor.message,
        signature.write()
      )
      // Github won't recognize the signature unless we rename the headers (Tested 2017-01-04)
      armoredMessage = armoredMessage.replace(
        '-----BEGIN PGP MESSAGE-----\r\n',
        '-----BEGIN PGP SIGNATURE-----\r\n'
      )
      armoredMessage = armoredMessage.replace(
        '-----END PGP MESSAGE-----\r\n',
        '-----END PGP SIGNATURE-----\r\n'
      )
      return armoredMessage
    } else {
      throw new Error(
        'No PrivateKey in the OpenPGP keyring for the email address: ' + email
      )
    }
  }

  // Verify `message` with detached `signature` using the public key for `email`
  static async verifyDetachedSignature (email, message, signature) {
    locallookup(email)
    console.log('email, message, signature =', email, message, signature)
    const msg = openpgp.message.readSignedContent(message, signature)
    console.log('msg =', msg)
    var result = msg.verify(keyring.publicKeys.keys)
    console.log('result[0] =', result[0])
    console.log('keyid =', printKeyid(result[0].keyid))
    return result[0].valid
  }

  // Returns true if the keyring has a private key for `email`.
  static hasPrivateKey (email) {
    const keys = keyring.privateKeys.getForAddress(email)
    return keys.length > 0
  }

  // Export public signing key
  static exportPublicKey (email) {
    return PGP.lookupPrivateKey(email)
      .toPublic()
      .armor()
      .trim()
      .replace(/\r/g, '')
  }

  // Upload the public signing key to the MIT key server
  static async publish (email) {
    const key = PGP.exportPublicKey(email)
    return Promise.all([hkp.upload(key), hkp2.upload(key)])
  }

  static lookupPrivateKey (email) {
    const keys = keyring.privateKeys.getForAddress(email)
    if (keys.length === 0) {
      return null
    }
    // keys[0].toString = printKey
    return keys[0]
  }
}
