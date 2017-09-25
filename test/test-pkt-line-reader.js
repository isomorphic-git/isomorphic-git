import test from 'ava'
import PktLineReader from '../lib/managers/models/utils/pkt-line-reader.js'

test('pkt-line-reader string', async t => {
  let read = PktLineReader(Buffer.from('0010hello world\n'))
  t.true(typeof read === 'function')
  t.true(read().toString('utf8') === 'hello world\n')
  t.true(read())
})

test('pkt-line-reader response', async t => {
  let buffer = Buffer.from(`001e# service=git-upload-pack
000001059ea43b479f5fedc679e3eb37803275d727bf51b7 HEAD\0multi_ack thin-pack side-band side-band-64k ofs-delta shallow deepen-since deepen-not deepen-relative no-progress include-tag multi_ack_detailed no-done symref=HEAD:refs/heads/master agent=git/github-g91c094cac
003cfb74ea1a9b6a9601df18c38d3de751c51f064bf7 refs/heads/js2
003c5faa96fe725306e060386975a70e4b6eacb576ed refs/heads/js3
003f9ea43b479f5fedc679e3eb37803275d727bf51b7 refs/heads/master
0040c1751a5447a7b025e5bca507af483dde7b0b956f refs/heads/master2
0040d85135a47c42c9c906e20c08def2fbceac4c2a4f refs/heads/master3
004018f4b62440abf61285fbfdcbfd990ab8434ff35c refs/heads/master4
0040e5c144897b64a44bd1164a0db60738452c9eaf87 refs/heads/master5
0000`)
  let read = PktLineReader(buffer)
  t.true(read().toString('utf8') === '# service=git-upload-pack\n')
  t.true(read() === null)
  t.true(
    read().toString('utf8') ===
      '9ea43b479f5fedc679e3eb37803275d727bf51b7 HEAD\0multi_ack thin-pack side-band side-band-64k ofs-delta shallow deepen-since deepen-not deepen-relative no-progress include-tag multi_ack_detailed no-done symref=HEAD:refs/heads/master agent=git/github-g91c094cac\n'
  )
  t.true(
    read().toString('utf8') ===
      'fb74ea1a9b6a9601df18c38d3de751c51f064bf7 refs/heads/js2\n'
  )
  t.true(
    read().toString('utf8') ===
      '5faa96fe725306e060386975a70e4b6eacb576ed refs/heads/js3\n'
  )
  t.true(
    read().toString('utf8') ===
      '9ea43b479f5fedc679e3eb37803275d727bf51b7 refs/heads/master\n'
  )
  t.true(
    read().toString('utf8') ===
      'c1751a5447a7b025e5bca507af483dde7b0b956f refs/heads/master2\n'
  )
  t.true(
    read().toString('utf8') ===
      'd85135a47c42c9c906e20c08def2fbceac4c2a4f refs/heads/master3\n'
  )
  t.true(
    read().toString('utf8') ===
      '18f4b62440abf61285fbfdcbfd990ab8434ff35c refs/heads/master4\n'
  )
  t.true(
    read().toString('utf8') ===
      'e5c144897b64a44bd1164a0db60738452c9eaf87 refs/heads/master5\n'
  )
  t.true(read() === null)
  t.true(read())
})
