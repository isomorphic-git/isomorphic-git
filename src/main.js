import { clone } from 'api/clone'
import { File, Iterator, System } from 'file'

debugger;

const dir = "/";
class FileSystem {
	static async readFile(path, options) {
		debugger;
	}
	static async writeFile(path, content, options) {
		debugger;
	}
	static async mkdir(path) {
		debugger;
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

const http = {
	"kind": "http"
};

await clone({
  fs: {promises: FileSystem},
  http,
  dir,
  corsProxy: 'https://cors.isomorphic-git.org',
  url: 'https://github.com/isomorphic-git/isomorphic-git',
  ref: 'master',
  singleBranch: true,
  depth: 10
});
