/* eslint-env node, browser, jasmine */
const { managers } = require('isomorphic-git/internal-apis')
const { GitRemoteConnection } = managers
const bufferToStream = require('buffer-to-stream')
const pify = require('pify')
const concat = require('simple-concat')
const stream = require('stream')

/*
A diagram might be helpful.

Git Fetch:

  Client                                           Server
  Out-of-band request /info/refs -----------------> Out of band reciever
  receiveInfoRefs <-------------------------------- sendInfoRefs
  sendUploadPackRequest --------------------------> receiveUploadPackRequest
  receiveUploadPackResponse <---------------------- sendUploadPackResponse

Git Push:

  Client                                           Server
  Out-of-band request /info/refs -----------------> Out of band reciever
  receiveInfoRefs <-------------------------------- sendInfoRefs
  sendReceivePackRequest -------------------------> receiveReceivePackRequest
  receiveReceivePackResponse <--------------------- sendReceivePackResponse
 */
describe('GitRemoteConnection', () => {
  it('sendInfoRefs', async () => {
    let res = new stream.PassThrough()
    GitRemoteConnection.sendInfoRefs('git-upload-pack', res, {
      capabilities: new Set([
        'multi_ack',
        'thin-pack',
        'side-band',
        'side-band-64k',
        'ofs-delta',
        'shallow',
        'deepen-since',
        'deepen-not',
        'deepen-relative',
        'no-progress',
        'include-tag',
        'multi_ack_detailed',
        'no-done'
      ]),
      symrefs: new Map([['HEAD', 'refs/heads/master']]),
      refs: new Map([
        ['HEAD', '9ea43b479f5fedc679e3eb37803275d727bf51b7'],
        ['refs/heads/js2', 'fb74ea1a9b6a9601df18c38d3de751c51f064bf7'],
        ['refs/heads/js3', '5faa96fe725306e060386975a70e4b6eacb576ed'],
        ['refs/heads/master', '9ea43b479f5fedc679e3eb37803275d727bf51b7'],
        ['refs/heads/master2', 'c1751a5447a7b025e5bca507af483dde7b0b956f'],
        ['refs/heads/master3', 'd85135a47c42c9c906e20c08def2fbceac4c2a4f'],
        ['refs/heads/master4', '18f4b62440abf61285fbfdcbfd990ab8434ff35c'],
        ['refs/heads/master5', 'e5c144897b64a44bd1164a0db60738452c9eaf87']
      ])
    })
    let buffer = await pify(concat)(res)
    expect(buffer.toString('utf8')).toBe(
      `001e# service=git-upload-pack
000001149ea43b479f5fedc679e3eb37803275d727bf51b7 HEAD\0multi_ack thin-pack side-band side-band-64k ofs-delta shallow deepen-since deepen-not deepen-relative no-progress include-tag multi_ack_detailed no-done symref=HEAD:refs/heads/master agent=git/isomorphic-git@0.0.0-development
003cfb74ea1a9b6a9601df18c38d3de751c51f064bf7 refs/heads/js2
003c5faa96fe725306e060386975a70e4b6eacb576ed refs/heads/js3
003f9ea43b479f5fedc679e3eb37803275d727bf51b7 refs/heads/master
0040c1751a5447a7b025e5bca507af483dde7b0b956f refs/heads/master2
0040d85135a47c42c9c906e20c08def2fbceac4c2a4f refs/heads/master3
004018f4b62440abf61285fbfdcbfd990ab8434ff35c refs/heads/master4
0040e5c144897b64a44bd1164a0db60738452c9eaf87 refs/heads/master5
0000`
    )
  })
  it('receiveInfoRefs', async () => {
    let res = bufferToStream(
      Buffer.from(`001e# service=git-upload-pack
000001149ea43b479f5fedc679e3eb37803275d727bf51b7 HEAD\0multi_ack thin-pack side-band side-band-64k ofs-delta shallow deepen-since deepen-not deepen-relative no-progress include-tag multi_ack_detailed no-done symref=HEAD:refs/heads/master agent=git/isomorphic-git@0.0.0-development
003cfb74ea1a9b6a9601df18c38d3de751c51f064bf7 refs/heads/js2
003c5faa96fe725306e060386975a70e4b6eacb576ed refs/heads/js3
003f9ea43b479f5fedc679e3eb37803275d727bf51b7 refs/heads/master
0040c1751a5447a7b025e5bca507af483dde7b0b956f refs/heads/master2
0040d85135a47c42c9c906e20c08def2fbceac4c2a4f refs/heads/master3
004018f4b62440abf61285fbfdcbfd990ab8434ff35c refs/heads/master4
0040e5c144897b64a44bd1164a0db60738452c9eaf87 refs/heads/master5
0000`)
    )
    let result = await GitRemoteConnection.receiveInfoRefs(
      'git-upload-pack',
      res
    )
    expect([...result.capabilities]).toEqual([
      'multi_ack',
      'thin-pack',
      'side-band',
      'side-band-64k',
      'ofs-delta',
      'shallow',
      'deepen-since',
      'deepen-not',
      'deepen-relative',
      'no-progress',
      'include-tag',
      'multi_ack_detailed',
      'no-done',
      'symref=HEAD:refs/heads/master',
      'agent=git/isomorphic-git@0.0.0-development'
    ])
    expect([...result.symrefs]).toEqual([['HEAD', 'refs/heads/master']])
    expect([...result.refs]).toEqual([
      ['HEAD', '9ea43b479f5fedc679e3eb37803275d727bf51b7'],
      ['refs/heads/js2', 'fb74ea1a9b6a9601df18c38d3de751c51f064bf7'],
      ['refs/heads/js3', '5faa96fe725306e060386975a70e4b6eacb576ed'],
      ['refs/heads/master', '9ea43b479f5fedc679e3eb37803275d727bf51b7'],
      ['refs/heads/master2', 'c1751a5447a7b025e5bca507af483dde7b0b956f'],
      ['refs/heads/master3', 'd85135a47c42c9c906e20c08def2fbceac4c2a4f'],
      ['refs/heads/master4', '18f4b62440abf61285fbfdcbfd990ab8434ff35c'],
      ['refs/heads/master5', 'e5c144897b64a44bd1164a0db60738452c9eaf87']
    ])
  })
  it('sendUploadPackRequest', async () => {
    let req = {
      capabilities: [
        'multi_ack_detailed',
        'no-done',
        'side-band-64k',
        'thin-pack',
        'ofs-delta',
        'agent=git/2.10.1.windows.1'
      ],
      wants: [
        'fb74ea1a9b6a9601df18c38d3de751c51f064bf7',
        '5faa96fe725306e060386975a70e4b6eacb576ed',
        '9ea43b479f5fedc679e3eb37803275d727bf51b7',
        'c1751a5447a7b025e5bca507af483dde7b0b956f',
        'd85135a47c42c9c906e20c08def2fbceac4c2a4f',
        '18f4b62440abf61285fbfdcbfd990ab8434ff35c',
        'e5c144897b64a44bd1164a0db60738452c9eaf87'
      ]
    }
    let result = await GitRemoteConnection.sendUploadPackRequest(req)
    let buffer = await pify(concat)(result)
    expect(buffer.toString('utf8'))
      .toEqual(`008awant fb74ea1a9b6a9601df18c38d3de751c51f064bf7 multi_ack_detailed no-done side-band-64k thin-pack ofs-delta agent=git/2.10.1.windows.1
0032want 5faa96fe725306e060386975a70e4b6eacb576ed
0032want 9ea43b479f5fedc679e3eb37803275d727bf51b7
0032want c1751a5447a7b025e5bca507af483dde7b0b956f
0032want d85135a47c42c9c906e20c08def2fbceac4c2a4f
0032want 18f4b62440abf61285fbfdcbfd990ab8434ff35c
0032want e5c144897b64a44bd1164a0db60738452c9eaf87
00000009done
`)
  })
  it('receiveUploadPackRequest', async () => {
    let req = bufferToStream(
      Buffer.from(`008awant fb74ea1a9b6a9601df18c38d3de751c51f064bf7 multi_ack_detailed no-done side-band-64k thin-pack ofs-delta agent=git/2.10.1.windows.1
0032want 5faa96fe725306e060386975a70e4b6eacb576ed
0032want 9ea43b479f5fedc679e3eb37803275d727bf51b7
0032want c1751a5447a7b025e5bca507af483dde7b0b956f
0032want d85135a47c42c9c906e20c08def2fbceac4c2a4f
0032want 18f4b62440abf61285fbfdcbfd990ab8434ff35c
0032want e5c144897b64a44bd1164a0db60738452c9eaf87
00000009done
`)
    )
    let result = await GitRemoteConnection.receiveUploadPackRequest(req)
    expect([...result.capabilities]).toEqual([
      'multi_ack_detailed',
      'no-done',
      'side-band-64k',
      'thin-pack',
      'ofs-delta',
      'agent=git/2.10.1.windows.1'
    ])
    expect([...result.wants]).toEqual([
      'fb74ea1a9b6a9601df18c38d3de751c51f064bf7',
      '5faa96fe725306e060386975a70e4b6eacb576ed',
      '9ea43b479f5fedc679e3eb37803275d727bf51b7',
      'c1751a5447a7b025e5bca507af483dde7b0b956f',
      'd85135a47c42c9c906e20c08def2fbceac4c2a4f',
      '18f4b62440abf61285fbfdcbfd990ab8434ff35c',
      'e5c144897b64a44bd1164a0db60738452c9eaf87'
    ])
    expect(result.done).toBe(true)
  })
  //   it('sendUploadPackResult - simple clone', async () => {
  //     let req = bufferToStream(
  //       Buffer.from(`008awant fb74ea1a9b6a9601df18c38d3de751c51f064bf7 multi_ack_detailed no-done side-band-64k thin-pack ofs-delta agent=git/2.10.1.windows.1
  // 0032want 5faa96fe725306e060386975a70e4b6eacb576ed
  // 0032want 9ea43b479f5fedc679e3eb37803275d727bf51b7
  // 0032want c1751a5447a7b025e5bca507af483dde7b0b956f
  // 0032want d85135a47c42c9c906e20c08def2fbceac4c2a4f
  // 0032want 18f4b62440abf61285fbfdcbfd990ab8434ff35c
  // 0032want e5c144897b64a44bd1164a0db60738452c9eaf87
  // 00000009done
  // `)
  //     )
  //     let result = await GitRemoteConnection.receiveUploadPackRequest(req)
  //     expect([...result.capabilities]).toEqual([
  //       'multi_ack_detailed',
  //       'no-done',
  //       'side-band-64k',
  //       'thin-pack',
  //       'ofs-delta',
  //       'agent=git/2.10.1.windows.1'
  //     ])
  //     expect([...result.wants]).toEqual([
  //       'fb74ea1a9b6a9601df18c38d3de751c51f064bf7',
  //       '5faa96fe725306e060386975a70e4b6eacb576ed',
  //       '9ea43b479f5fedc679e3eb37803275d727bf51b7',
  //       'c1751a5447a7b025e5bca507af483dde7b0b956f',
  //       'd85135a47c42c9c906e20c08def2fbceac4c2a4f',
  //       '18f4b62440abf61285fbfdcbfd990ab8434ff35c',
  //       'e5c144897b64a44bd1164a0db60738452c9eaf87'
  //     ])
  //     expect(result.done).toBe(true)
  //   })
  it('receiveUploadPackResult - simple clone', async () => {
    let res = bufferToStream(Buffer.from(`0008NAK\n`))
    let result = await GitRemoteConnection.receiveUploadPackResult(res)
    expect(result.nak).toBe(true)
  })
  it('receiveUploadPackResult - incremental update (fetch)', async () => {
    let res = bufferToStream(
      Buffer.from(`003aACK 7e47fe2bd8d01d481f44d7af0531bd93d3b21c01 continue
0031ACK 74730d410fcb6603ace96f1dc55ea6196122532d
`)
    )
    let result = await GitRemoteConnection.receiveUploadPackResult(res)
    expect(result.nak).toBe(false)
    expect(result.acks).toEqual([
      { oid: '7e47fe2bd8d01d481f44d7af0531bd93d3b21c01', status: 'continue' },
      { oid: '74730d410fcb6603ace96f1dc55ea6196122532d', status: undefined }
    ])
  })
})
