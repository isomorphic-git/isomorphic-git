/* eslint-env node, browser, jasmine */
const {
  collect,
  parseRefsAdResponse,
  parseUploadPackResponse,
  parseUploadPackRequest,
  writeRefsAdResponse,
  writeUploadPackRequest,
  Errors,
} = require('isomorphic-git/internal-apis')
// const stream = require('stream')

/*
A diagram might be helpful.

--- OVERVIEW ---

Git Fetch:

  Client                                            Server
  Out-of-band request /info/refs -----------------> Out of band reciever
  parseRefsAdResponse <----------------------------- writeRefsAdResponse
  writeUploadPackRequest --------------------------> parseUploadPackRequest
  parseUploadPackResponse <------------------------ sendUploadPackResponse

Git Push:

  Client                                            Server
  Out-of-band request /info/refs -----------------> Out of band reciever
  parseRefsAdResponse <----------------------------- writeRefsAdResponse
  writeReceivePackRequest -------------------------> parseReceivePackRequest
  parseReceivePackResponse <----------------------- writeReceivePackResponse

--- DETAILED FETCH --- TODO: REFACTOR CODE UNTIL IT LOOKS LIKE THIS

# Client
+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
|                                                                                                                                                                                                                              |
|  [fetch()..................................................................................................................................................................................................................] |
|     ↓  ↑         ↓  ↑       ↓  ↑       ↓  ↑      ↓                                                                            ↑   ↓                                                                                       ↑  |
|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|  [session()]  [option()] [option()] [option()] [list()........................ *request*...*response*......................list] [fetch({refs})..................... *request*...*response* ...............................] |
|  GitHTTP:                                               ↓  ↑                ↓  ↑                ↓  ↑                ↓  ↑                  ↓  ↑                  ↓  ↑                     ↓  ↑                 ↓  ↑           |
|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|  GitPluginAPI:                                 [createInfoRefsReq]  [writeInfoRefsReq]   [parseInfoRefsRes]  [handleInfoRefsRes] [createUploadPackReq]  [writeUploadPackReq]     [parseUploadPackRes]  [handleUploadPackRes] |
+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

# Server InfoRefs
+---------------------------------------------------------------------------------------------------------------+
|                                                                                                               |
| *request* -> auth(), [handle() ...............................................................] -> *response* |
|  GitHTTPServer:         ↓  ↑                ↓  ↑                 ↓  ↑                  ↓  ↑                   |
|---------------------------------------------------------------------------------------------------------------|
|  GitServerAPI:   [parseInfoRefsReq]  [handleInfoRefsReq]   [createInfoRefsRes]  [writeInfoRefsRes]            |
+---------------------------------------------------------------------------------------------------------------+

# Server UploadPack
+--------------------------------------------------------------------------------------------------------------------+
|                                                                                                                    |
| *request* -> auth(), [handle().....................................................................] -> *response* |
|  GitHTTPServer:          ↓  ↑                  ↓  ↑                     ↓  ↑                  ↓  ↑                 |
|--------------------------------------------------------------------------------------------------------------------|
|  GitServerAPI:   [parseUploadPackReq]  [handleUploadPackReq]   [createUploadPackRes]  [writeUploadPackRes]         |
+--------------------------------------------------------------------------------------------------------------------+

--- DETAILED PUSH --- TODO: Redraw with the level of detail of the FETCH diagram

  push                    GitRemoteHTTP                  GitLocalHTTP          serve
  createInfoRefsReq ----> writeRefsAdReq -------------> recvInfoRefsReq ----> handleInfoRefsReq
                               ↑  ↓                           ↑  ↓
                          writeInfoRefsReq               parseInfoRefsReq

  handleInfoRefsRes <---- recvInfoRefsRes <------------- writeRefsAdRes <---- createInfoRefsRes
                               ↑  ↓                           ↑  ↓
                          parseInfoRefsRes               writeInfoRefsRes

  createReceivePackReq -> sendReceivePackReq ----------> recvReceivePackReq -> handleReceivePackReq
                               ↑  ↓                           ↑  ↓
                          writeReceivePackReq            parseReceivePackReq

  handleReceivePackRes <- recvReceivePackRes <---------- sendReceivePackRes <- createReceivePackRes
                               ↑  ↓                           ↑  ↓
                          parseReceivePackRes            writeReceivePackRes
 */
describe('git wire protocol', () => {
  it('writeRefsAd', async () => {
    const res = await writeRefsAdResponse({
      service: 'git-upload-pack',
      capabilities: [
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
      ],
      symrefs: { HEAD: 'refs/heads/master' },
      refs: {
        HEAD: '9ea43b479f5fedc679e3eb37803275d727bf51b7',
        'refs/heads/js2': 'fb74ea1a9b6a9601df18c38d3de751c51f064bf7',
        'refs/heads/js3': '5faa96fe725306e060386975a70e4b6eacb576ed',
        'refs/heads/master': '9ea43b479f5fedc679e3eb37803275d727bf51b7',
        'refs/heads/master2': 'c1751a5447a7b025e5bca507af483dde7b0b956f',
        'refs/heads/master3': 'd85135a47c42c9c906e20c08def2fbceac4c2a4f',
        'refs/heads/master4': '18f4b62440abf61285fbfdcbfd990ab8434ff35c',
        'refs/heads/master5': 'e5c144897b64a44bd1164a0db60738452c9eaf87',
      },
    })
    const buffer = Buffer.from(await collect(res))
    expect(buffer.toString('utf8')).toBe(
      `01149ea43b479f5fedc679e3eb37803275d727bf51b7 HEAD\0multi_ack thin-pack side-band side-band-64k ofs-delta shallow deepen-since deepen-not deepen-relative no-progress include-tag multi_ack_detailed no-done symref=HEAD:refs/heads/master agent=git/isomorphic-git@0.0.0-development
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
  it('parseRefsAdResponse', async () => {
    const res = [
      Buffer.from(`001e# service=git-upload-pack
000001149ea43b479f5fedc679e3eb37803275d727bf51b7 HEAD\0multi_ack thin-pack side-band side-band-64k ofs-delta shallow deepen-since deepen-not deepen-relative no-progress include-tag multi_ack_detailed no-done symref=HEAD:refs/heads/master agent=git/isomorphic-git@0.0.0-development
003cfb74ea1a9b6a9601df18c38d3de751c51f064bf7 refs/heads/js2
003c5faa96fe725306e060386975a70e4b6eacb576ed refs/heads/js3
003f9ea43b479f5fedc679e3eb37803275d727bf51b7 refs/heads/master
0040c1751a5447a7b025e5bca507af483dde7b0b956f refs/heads/master2
0040d85135a47c42c9c906e20c08def2fbceac4c2a4f refs/heads/master3
004018f4b62440abf61285fbfdcbfd990ab8434ff35c refs/heads/master4
0040e5c144897b64a44bd1164a0db60738452c9eaf87 refs/heads/master5
0000`),
    ]
    const result = await parseRefsAdResponse(res, {
      service: 'git-upload-pack',
    })
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
      'agent=git/isomorphic-git@0.0.0-development',
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
      ['refs/heads/master5', 'e5c144897b64a44bd1164a0db60738452c9eaf87'],
    ])
  })
  it('parseRefsAdResponse empty repo with capabilities', async () => {
    const res = [
      Buffer.from(`001e# service=git-upload-pack
000000fa0000000000000000000000000000000000000000 capabilities^{}\0multi_ack thin-pack side-band side-band-64k ofs-delta shallow deepen-since deepen-not deepen-relative no-progress include-tag multi_ack_detailed no-done object-format=sha1 agent=git/2.43.0
0000`),
    ]
    const result = await parseRefsAdResponse(res, {
      service: 'git-upload-pack',
    })
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
      'object-format=sha1',
      'agent=git/2.43.0',
    ])
    expect([...result.symrefs]).toEqual([])
    expect([...result.refs]).toEqual([])
  })
  it('parseRefsAdResponse bad service', async () => {
    const res = [
      Buffer.from(`001e# noservice=git-upload-pack
000001149ea43b479f5fedc679e3eb37803275d727bf51b7 HEAD\0multi_ack thin-pack side-band side-band-64k ofs-delta shallow deepen-since deepen-not deepen-relative no-progress include-tag multi_ack_detailed no-done symref=HEAD:refs/heads/master agent=git/isomorphic-git@0.0.0-development
003cfb74ea1a9b6a9601df18c38d3de751c51f064bf7 refs/heads/js2
003c5faa96fe725306e060386975a70e4b6eacb576ed refs/heads/js3
003f9ea43b479f5fedc679e3eb37803275d727bf51b7 refs/heads/master
0040c1751a5447a7b025e5bca507af483dde7b0b956f refs/heads/master2
0040d85135a47c42c9c906e20c08def2fbceac4c2a4f refs/heads/master3
004018f4b62440abf61285fbfdcbfd990ab8434ff35c refs/heads/master4
0040e5c144897b64a44bd1164a0db60738452c9eaf87 refs/heads/master5
0000`),
    ]
    try {
      await parseRefsAdResponse(res, {
        service: 'git-upload-pack',
      })
      fail('expected an error')
    } catch (error) {
      expect(error instanceof Errors.ParseError).toBe(true)
      expect(error.data).toEqual({
        expected: '# service=git-upload-pack\\n',
        actual: '# noservice=git-upload-pac',
      })
    }
  })
  it('parseRefsAdResponse bad null separated', async () => {
    const res = [
      Buffer.from(`001e# service=git-upload-pack
0072ERR Repository not found
The requested repository does not exist, or you do not have permission to
access it.
`),
    ]
    try {
      await parseRefsAdResponse(res, {
        service: 'git-upload-pack',
      })
      fail('expected an error')
    } catch (error) {
      expect(error instanceof Errors.ParseError).toBe(true)
      expect(error.data).toEqual({
        expected: `Two strings separated by '\\x00'`,
        actual: `ERR Repository not found
The requested repository does not exist, or you do not have permission to
access it.
`,
      })
    }
  })
  it('parseRefsAdResponse HEAD bad space separated', async () => {
    // two spaces instead of one
    const res = [
      Buffer.from(`001e# service=git-upload-pack
000001149ea43b479f5fedc679e3eb37803275d727bf51b7  HEAD\0multi_ack thin-pack side-band side-band-64k ofs-delta shallow deepen-since deepen-not deepen-relative no-progress include-tag multi_ack_detailed no-done symref=HEAD:refs/heads/master agent=git/isomorphic-git@0.0.0-development
003cfb74ea1a9b6a9601df18c38d3de751c51f064bf7 refs/heads/js2
003c5faa96fe725306e060386975a70e4b6eacb576ed refs/heads/js3
003f9ea43b479f5fedc679e3eb37803275d727bf51b7 refs/heads/master
0040c1751a5447a7b025e5bca507af483dde7b0b956f refs/heads/master2
0040d85135a47c42c9c906e20c08def2fbceac4c2a4f refs/heads/master3
004018f4b62440abf61285fbfdcbfd990ab8434ff35c refs/heads/master4
0040e5c144897b64a44bd1164a0db60738452c9eaf87 refs/heads/master5
0000`),
    ]
    try {
      await parseRefsAdResponse(res, {
        service: 'git-upload-pack',
      })
      fail('expected an error')
    } catch (error) {
      expect(error instanceof Errors.ParseError).toBe(true)
      expect(error.data).toEqual({
        expected: `Two strings separated by ' '`,
        actual: '9ea43b479f5fedc679e3eb37803275d727bf51b7  HEAD',
      })
    }
  })
  it('parseRefsAdResponse refs bad space separated', async () => {
    const res = [
      Buffer.from(`001e# service=git-upload-pack
000001149ea43b479f5fedc679e3eb37803275d727bf51b7 HEAD\0multi_ack thin-pack side-band side-band-64k ofs-delta shallow deepen-since deepen-not deepen-relative no-progress include-tag multi_ack_detailed no-done symref=HEAD:refs/heads/master agent=git/isomorphic-git@0.0.0-development
003cfb74ea1a9b6a9601df18c38d3de751c51f064bf7refs/heads/js2
003c5faa96fe725306e060386975a70e4b6eacb576ed refs/heads/js3
003f9ea43b479f5fedc679e3eb37803275d727bf51b7 refs/heads/master
0040c1751a5447a7b025e5bca507af483dde7b0b956f refs/heads/master2
0040d85135a47c42c9c906e20c08def2fbceac4c2a4f refs/heads/master3
004018f4b62440abf61285fbfdcbfd990ab8434ff35c refs/heads/master4
0040e5c144897b64a44bd1164a0db60738452c9eaf87 refs/heads/master5
0000`),
    ]
    try {
      await parseRefsAdResponse(res, {
        service: 'git-upload-pack',
      })
      fail('expected an error')
    } catch (error) {
      expect(error instanceof Errors.ParseError).toBe(true)
      expect(error.data).toEqual({
        expected: `Two strings separated by ' '`,
        actual: 'fb74ea1a9b6a9601df18c38d3de751c51f064bf7refs/heads/js2\n0',
      })
    }
  })
  it('writeUploadPackRequest', async () => {
    const req = {
      capabilities: [
        'multi_ack_detailed',
        'no-done',
        'side-band-64k',
        'thin-pack',
        'ofs-delta',
        'agent=git/2.10.1.windows.1',
      ],
      wants: [
        'fb74ea1a9b6a9601df18c38d3de751c51f064bf7',
        '5faa96fe725306e060386975a70e4b6eacb576ed',
        '9ea43b479f5fedc679e3eb37803275d727bf51b7',
        'c1751a5447a7b025e5bca507af483dde7b0b956f',
        'd85135a47c42c9c906e20c08def2fbceac4c2a4f',
        '18f4b62440abf61285fbfdcbfd990ab8434ff35c',
        'e5c144897b64a44bd1164a0db60738452c9eaf87',
      ],
    }
    const result = writeUploadPackRequest(req)
    const buffer = Buffer.from(await collect(result))
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
  it('parseUploadPackRequest', async () => {
    const req = [
      Buffer.from(`008awant fb74ea1a9b6a9601df18c38d3de751c51f064bf7 multi_ack_detailed no-done side-band-64k thin-pack ofs-delta agent=git/2.10.1.windows.1
0032want 5faa96fe725306e060386975a70e4b6eacb576ed
0032want 9ea43b479f5fedc679e3eb37803275d727bf51b7
0032want c1751a5447a7b025e5bca507af483dde7b0b956f
0032want d85135a47c42c9c906e20c08def2fbceac4c2a4f
0032want 18f4b62440abf61285fbfdcbfd990ab8434ff35c
0032want e5c144897b64a44bd1164a0db60738452c9eaf87
00000009done
`),
    ]
    const result = await parseUploadPackRequest(req)
    expect([...result.capabilities]).toEqual([
      'multi_ack_detailed',
      'no-done',
      'side-band-64k',
      'thin-pack',
      'ofs-delta',
      'agent=git/2.10.1.windows.1',
    ])
    expect([...result.wants]).toEqual([
      'fb74ea1a9b6a9601df18c38d3de751c51f064bf7',
      '5faa96fe725306e060386975a70e4b6eacb576ed',
      '9ea43b479f5fedc679e3eb37803275d727bf51b7',
      'c1751a5447a7b025e5bca507af483dde7b0b956f',
      'd85135a47c42c9c906e20c08def2fbceac4c2a4f',
      '18f4b62440abf61285fbfdcbfd990ab8434ff35c',
      'e5c144897b64a44bd1164a0db60738452c9eaf87',
    ])
    expect(result.done).toBe(true)
  })
  //   xit('writeUploadPackResponse - simple clone', async () => {
  //     const packetlines = new stream.PassThrough()
  //     const packfile = new stream.PassThrough()
  //     const progress = new stream.PassThrough()
  //     const error = new stream.PassThrough()
  //     let result = await writeUploadPackResponse({
  //       packetlines,
  //       packfile,
  //       progress,
  //       error
  //     })
  //     packetlines.end()
  //     packfile.end()
  //     progress.end()
  //     error.end()
  //     let buffer = await pify(concat)(result)
  //     expect(buffer.toString('utf8')).toEqual(`0008NAK\n`)
  //   })
  //   xit('writeUploadPackResponse - incremental update (fetch)', async () => {
  //     const packetlines = new stream.PassThrough()
  //     const packfile = new stream.PassThrough()
  //     const progress = new stream.PassThrough()
  //     const error = new stream.PassThrough()
  //     let result = await writeUploadPackResponse({
  //       packetlines,
  //       packfile,
  //       progress,
  //       error,
  //       acks: [
  //         { oid: '7e47fe2bd8d01d481f44d7af0531bd93d3b21c01', status: 'continue' },
  //         { oid: '74730d410fcb6603ace96f1dc55ea6196122532d', status: undefined }
  //       ],
  //       nak: false
  //     })
  //     packetlines.end()
  //     packfile.end()
  //     progress.end()
  //     error.end()
  //     let buffer = await pify(concat)(result)
  //     expect(buffer.toString('utf8'))
  //       .toEqual(`003aACK 7e47fe2bd8d01d481f44d7af0531bd93d3b21c01 continue
  // 0031ACK 74730d410fcb6603ace96f1dc55ea6196122532d\n`)
  //   })
  it('parseUploadPackResponse - simple clone', async () => {
    const res = [Buffer.from(`0008NAK\n`)]
    const result = await parseUploadPackResponse(res)
    expect(result.nak).toBe(true)
  })
  it('parseUploadPackResponse - no packetlines', async () => {
    const res = [Buffer.from(`0000`)]
    const result = await parseUploadPackResponse(res)
    expect(result.nak).toBe(false)
  })
  it('parseUploadPackResponse - incremental update (fetch)', async () => {
    const res = [
      Buffer.from(`003aACK 7e47fe2bd8d01d481f44d7af0531bd93d3b21c01 continue
0031ACK 74730d410fcb6603ace96f1dc55ea6196122532d
`),
    ]
    const result = await parseUploadPackResponse(res)
    expect(result.nak).toBe(false)
    expect(result.acks).toEqual([
      { oid: '7e47fe2bd8d01d481f44d7af0531bd93d3b21c01', status: 'continue' },
      { oid: '74730d410fcb6603ace96f1dc55ea6196122532d', status: undefined },
    ])
  })
})
