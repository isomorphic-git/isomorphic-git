import {clone} from 'api/clone'
import {File, Iterator, System} from 'file'
import {Request} from "http"
import SecureSocket from "securesocket";

const dir = "/Users/hoddie/isomorphic-git";
class FileSystem {
	static async readFile(path, options = {}) {
		if ("utf8" !== options.encoding)
			throw new Error("unrecognized encoding");

		const f = new File(path);
		const result = f.read(String)
		f.close();
		return result;
	}
	static async writeFile(path, content, options) {
		File.delete(path);
		const f = new File(path, true);
		f.write(content)
		f.close();
	}
	static async mkdir(path) {
		const parts = path.split("/");
		const dir = [parts.shift()];
		while (parts.length) {
			dir.push(parts.shift());
			File.createDirectory(dir.join("/"));
		}
	}
	static async rmdir() {
		debugger;
	}
	static async unlink() {
		debugger;
	}
	static async stat(path) {
		if (File.exists(path))
			return {};		//@@

		const e = new Error;
		e.code = 'ENOENT';
		throw e;
	}
	static async lstat() {
		debugger;
	}
	static async readdir() {
		debugger;
	}
	static async readlink() {
		debugger;
	}
	static async symlink() {
		debugger;
	}
}

class http {
	static async discover() {
		debugger;
	}
	static async request(options) {
		const method = options.method ?? "GET";
		const parts = options.url.split("/");
		if ("https:" !== parts.shift())
			throw new Error("https only");
		if (parts.shift())
			throw new Error("malformed");
		const host = parts.shift();
		const path = "/" + parts.join("/");
		const result = {
			url: options.url,
			method,
			headers: {},
		};

		let body;
		if (options.body) {
			if (1 !== options.body.length)
				throw new Error;
			body = options.body[0].buffer;
		}
		const headers = [];
		if (options.headers) {
			for (let property in options.headers)
				headers.push(property, options.headers[property]);
		}

		return new Promise((resolve, reject) => {
			const request = new Request({
					host,
					path,
					method,
					headers,
					body,
					response: ArrayBuffer,
					Socket: SecureSocket,
					secure: {
						protocolVersion: 0x303,
						trace: false
					},
					port: 443,
				});
			request.callback = function(message, value, etc) {
				if (Request.status === message)
					result.statusCode = value;		//@@ statusMessage too
				else if (Request.header === message)
					result.headers[value] = etc;
				else if (Request.responseComplete === message) {
					result.body = [new Uint8Array(value)];
					resolve(result);
				}
				else if (message < 0)
					reject(-1);
			}
		});
	}
}

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

globalThis.console = class {
	static log(msg) {
		trace(log, "\n");
	}
}

globalThis.process = Object.freeze({domain: null});

await clone({
  fs: {promises: FileSystem},
  http,
  dir,
  url: 'https://github.com/isomorphic-git/isomorphic-git.git',
  ref: 'master',
  singleBranch: true,
  depth: 10
});
