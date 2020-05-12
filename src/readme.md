# Port of Isomorphic-Git to Moddable SDK
#### Updated May 2, 2020
#### Peter Hoddie

## Introduction

Porting work began April 30, 2020

At this time, the port does nothing useful. But it does build, link, and launch. So, it is a starting point.

### Building and running

- Download the latest Moddable SDK (May 1 or later)
- `cd ${isomorphic-git}/src`
- `./node_modules/.bin/cors-proxy start -p 9998` to launch the CORS proxy (not technically needed, but eliminates TLS as a possible source of error)
- `mcconfig -d -m` to build for and run on simulator
- `mcconfig -d -m -p esp32` to build for and run on ESP32

> Note: All modules are preloaded. This saves RAM and decreases load time, both critical for embedded targets.

### Module specifiers

The original code uses relative paths to import modules. On embedded targets, the Moddable SDK does not support relative paths, only bare module specifiers. All relative path module specifiers needed to build and launch have been converted to bare specifiers. This is incompatible with web hosts. Eventually a better solution is needed

### Resolved issues

- `models/GitConfig.js` - cannot preload as-is because it creates `RegExp` instances at the top level. Worked around with lazy creation of the `RegExp` instances.
- Avoided need for `pify`  implementing promise support directly in host provided FS
- asyncLock relies on `process.domain`. Providing a stub works.
- Code uses `Buffer`, a subclass of Uint8Array Implemented a few needed methods.
- Implemented http object
- Added `console.log` that maps to `trace` for XS
- `BaseError` implements getter/setter to allow error objects to be preloaded (works around "override mistake")
- XS does not support nulls in strings. The `splitAndAssert` code depends on those. Workaround implemented. It looks like this may appear in other places (`readObject`)

### Open issues 

- Moddable File is flat FS only.... OK... let's fix that. (`createDirectory` implemented for macOS simulator for development)
- SHA module should use Moddable SDK crypto -- smaller and faster
- Pako will be crazy slow and heavy. Is it required or optional? We have a zlib decoder for PNG but needs a script API to be used here.

### Patches

The `createDirectory` function is needed. For macOS hosts, patch it in as follows:

- In `file.js` add this to the `File` class:

```
	static createDirectory(path) @ "xs_file_createeDirectory";
```
- In `mac/modFile.c` add this:

```
void xs_file_createeDirectory(xsMachine *the)
{
	char *path = xsmcToString(xsArg(0));
	int result = mkdir(path, 0755);
	if (result) {
		switch (errno) {
			case EEXIST:
				break;
			default:
				xsUnknownError("failed");
				break;
		}
	}
	xsResult = xsArg(0);
}
```

The same should work for Linux. It should also work for Windows by replacing the call to `mkdir` with:

```
	int result = _mkdir(path);
```

There's no patch yet for ESP32 so for now put this in `esp32/modFile.c`:

```
void xs_file_createeDirectory(xsMachine *the)
{
  xsDebugger();
	xsResult = xsArg(0);
}
```