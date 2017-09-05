"use strict"
import test from 'ava'
import PGP from '../lib/models/PGP'

test('lookup', async t => {
  let keys = await PGP.lookup('wmhilton@gmail.com')
  t.true(keys.includes('9609b8a5928ba6b9'))
})

test('lookup (email misspelled)', async t => {
  let keys = await PGP.lookup('wmhilton@gmailcom')
  t.is(keys, null)
})

test('keygen, sign and verify', async t => {
  let key = await PGP.keygen('Alice', 'alice@example.com')
  let signedmsg = await PGP.sign('alice@example.com', 'Hello World')
  t.true(signedmsg.trim().startsWith('-----BEGIN PGP SIGNED MESSAGE-----'))
  let verify = await PGP.verify('alice@example.com', signedmsg)
  t.true(verify)
})

// module.exports =  {
//   lookup,
//   keygen,
//   list,
//   encrypt,
//   decrypt,
//   sign,
//   verify
// }
