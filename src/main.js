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
		const parts = options.url.split("/");
		if ("https:" !== parts.shift())
			throw new Error("https only");
		if (parts.shift())
			throw new Error("malformed");
		const host = parts.shift();
		const path = "/" + parts.join("/");

		return new Promise((resolve, reject) => {
			const request = new Request({host, path, response: String,
					port: 443, Socket: SecureSocket, secure: {protocolVersion: 0x303}});
			request.callback = function(message, value) {
			//@@ form eexpect reseponse
				if (Request.responseComplete === message)
					resolve(value);
				else if (message < 0)
					reject(-1);
			}
		});
	}
}

await clone({
  fs: {promises: FileSystem},
  http,
  dir,
  url: 'https://github.com/isomorphic-git/isomorphic-git',
  ref: 'master',
  singleBranch: true,
  depth: 10
});
