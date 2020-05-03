import http from "http/moddable"
import fs from "fs/moddable"

import {getRemoteInfo} from 'api/getRemoteInfo'

const dir = "/Users/hoddie/isomorphic-git";

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
debugger;
const result = await getRemoteInfo({
  http,
  url: 'https://github.com/isomorphic-git/test.empty.git',
});

console.log(JSON.stringify(result, null, 2))
