import http from "http/moddable"
import fs from "fs/moddable"

import { addRemote } from 'api/addRemote'
import { checkout } from 'api/checkout'
import { currentBranch } from 'api/currentBranch'
import { fetch } from 'api/fetch'
import { getRemoteInfo } from 'api/getRemoteInfo'
import { init } from 'api/init'
import { ModdableBuffer } from 'utils/ModdableBuffer'

// Buffer shim
globalThis.Buffer = ModdableBuffer

// console.log shim
globalThis.console = class {
	static log(msg) {
		trace(msg, "\n");
	}
}

// process.domain shim (used by 'async-lock'?!)
globalThis.process = Object.freeze({domain: null});

// Main code
const result = await getRemoteInfo({
	http,
	corsProxy: 'http://localhost:9998',
  url: 'https://github.com/isomorphic-git/test.empty',
});

// This should print:
// {
//   "capabilities": [
//     "multi_ack",
//     "thin-pack",
//     "side-band",
//     "side-band-64k",
//     "ofs-delta",
//     "shallow",
//     "deepen-since",
//     "deepen-not",
//     "deepen-relative",
//     "no-progress",
//     "include-tag",
//     "multi_ack_detailed",
//     "allow-tip-sha1-in-want",
//     "allow-reachable-sha1-in-want",
//     "no-done",
//     "symref=HEAD:refs/heads/test",
//     "filter",
//     "agent=git/github-g62627ee0b2fa"
//   ],
//   "HEAD": "refs/heads/test",
//   "refs": {
//     "heads": {
//       "foo": "a7a551b6710166fe65c4894a4f88f785e4fb7393",
//       "master": "c03e131196f43a78888415924bcdcbf3090f3316",
//       "new1": "5a8905a02e181fe1821068b8c0f48cb6633d5b81",
//       "test": "5a8905a02e181fe1821068b8c0f48cb6633d5b81"
//     }
//   }
// }
console.log(JSON.stringify(result, null, 2))

// This should create these files:
// /tmp/moddable-test
// └── .git
//    ├── HEAD
//    ├── config
//    ├── hooks
//    ├── info
//    ├── objects
//    |  ├── info
//    |  └── pack
//    └── refs
//       ├── heads
//       └── tags
//
// directory: 9 file: 2
await init({
	fs,
	dir: '/tmp/moddable-test',
})
let files = await fs.promises.readdir('/tmp/moddable-test/.git')
// should print:
// [
//   "config",
//   "objects",
//   "HEAD",
//   "info",
//   "hooks",
//   "refs"
// ]
console.log(JSON.stringify(files, null, 2))


await addRemote({
	fs,
	dir: '/tmp/moddable-test',
	remote: 'origin',
	url: 'https://github.com/isomorphic-git/test.empty.git',
	force: true,
})

const branch = await currentBranch({
	fs,
	dir: '/tmp/moddable-test',
})
// should print "master"
console.log(JSON.stringify(branch, null, 2))

// This should create a packfile and a packfile index in
// /tmp/moddable-test/.git/objects/pack
const fetchResult = await fetch({
	http,
	fs,
	corsProxy: 'http://localhost:9998',
	dir: '/tmp/moddable-test',
	onMessage (msg) {
		console.log(msg)
	},
})
// should print something like:
// {
//   "defaultBranch": "refs/heads/test",
//   "fetchHead": "5a8905a02e181fe1821068b8c0f48cb6633d5b81",
//   "fetchHeadDescription": "branch 'HEAD' of https://github.com/isomorphic-git/test.empty.git",
//   "headers": {
//     "access-control-allow-origin": "*",
//     "access-control-expose-headers": "accept-ranges,age,cache-control,content-length,content-language,content-type,date,etag,expires,last-modified,pragma,server,transfer-encoding,vary,x-github-request-id,x-redirected-url",
//     "cache-control": "no-cache, max-age=0, must-revalidate",
//     "content-type": "application/x-git-upload-pack-result",
//     "expires": "Fri, 01 Jan 1980 00:00:00 GMT",
//     "pragma": "no-cache",
//     "server": "GitHub Babel 2.0",
//     "transfer-encoding": "chunked",
//     "vary": "Accept-Encoding",
//     "x-github-request-id": "DF37:64AB:5FDD:C010:5EB07590",
//     "date": "Mon, 04 May 2020 20:05:37 GMT",
//     "connection": "close"
//   },
//   "packfile": "objects/pack/pack-FB367774AD41ABBFDC2F4BE55149F57987E47EEA.pack"
// }
console.log(JSON.stringify(fetchResult, null, 2))

const { defaultBranch } = fetchResult
const ref = defaultBranch.replace('refs/heads/', '')
try {
	await checkout({
		fs,
		dir: '/tmp/moddable-test',
		ref,
		onProgress (val) {
			console.log(JSON.stringify(val))
		}
	})
} catch (e) {
	console.log(e.message)
}

debugger
