import http from "http/moddable"
import fs from "fs/moddable"

import { fetch } from 'api/fetch'
import { getRemoteInfo } from 'api/getRemoteInfo'
import { init } from 'api/init'

// Buffer shim
globalThis.Buffer = class extends Uint8Array {		// The Buffer class is a subclass of the Uint8Array class...
    toString(format) {
		if ('utf8' === format)
			return String.fromArrayBuffer(this.buffer);		//@@ incorrect if view is not entire buffer

		if ('hex' === format)
			debugger;


		throw new Error("unsupported");
    }

	static concat(buffers, totalLength) {
		if (undefined === totalLength) {
			totalLength = 0;
			for (let i = 0; i < buffers.length; i++)
				totalLength += buffers[i].length;
		}
		const result = new Uint8Array(totalLength);
		for (let i = 0, position = 0; i < buffers.length; position += buffers[i].length, i++)
			result.set(buffers[i], position);

		return result;
	}
	static from(iterable, format) {
		if (!format)
			return super.from(iterable);

		if ("utf8" === format)
			return new Buffer(ArrayBuffer.fromString(iterable));

		if ("hex" === format)
			debugger;

		throw new Error;

	}
	static isBuffer(buffer) {
		debugger;
	}
	static alloc(length) {
		debugger;
	}
}

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
  url: 'https://github.com/isomorphic-git/test.empty.git',
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

// This should create a packfile and a packfile index in
// /tmp/moddable-test/.git/objects/pack
const fetchResult = await fetch({
	http,
	fs,
	dir: '/tmp/moddable-test',
	onMessage (msg) {
		console.log(msg)
	}
})

console.log(JSON.stringify(fetchResult, null, 2))
