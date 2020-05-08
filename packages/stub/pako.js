import Inflate from "mod/inflate"

const pako = Object.freeze({
	Inflate,
	inflate
});

function inflate(buffer, options = {}) {
	if (ArrayBuffer.isView(buffer))
		buffer = buffer.buffer;

	const i = new Inflate(options);
	i.push(buffer, true);
	if (i.err)
		throw new Error;
	return ("string" === options.to) ? String.fromArrayBuffer(i.result) : i.result;
}

export default pako;
