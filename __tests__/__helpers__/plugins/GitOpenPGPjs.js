const openpgp = require('openpgp/dist/openpgp.min.js')

export const GitOpenPGPjs = {
  signingHelper: {
    async sign ({ payload, secretKey }) {
      let privKeyObj = openpgp.key.readArmored(secretKey).keys
      let { signature } = await openpgp.sign({
        data: openpgp.util.str2Uint8Array(payload),
        privateKeys: privKeyObj,
        detached: true,
        armor: true
      })
      return signature
    },
    async listSigningKeys ({ payload, signature }) {
      let msg = openpgp.message.readSignedContent(payload, signature)
      return msg.getSigningKeyIds().map(keyid => keyid.toHex())
    },
    async verify ({ payload, signature, publicKey }) {
      let msg = openpgp.message.readSignedContent(payload, signature)
      let pubKeyObj = openpgp.key.readArmored(publicKey).keys
      let results = msg.verify(pubKeyObj)
      let validity = results.reduce((a, b) => a.valid && b.valid, { valid: true })
      return validity
    }
  }
}
