# Port of Isomorphic-Git to Moddable SDK
#### Updated May 1, 2020
#### Peter Hoddie

## Introduction

Porting work began April 30, 2020

At this time, the port does nothing useful. But it does build, link, and launch. So, it is a starting point.

### Building and running

- Download the latest Moddable SDK (May 1 or later)
- `cd ${isomorphic-git}/src`
- `mcconfig -d -m` to build for and run on simulator
- `mcconfig -d -m -p esp32` to build for and run on ESP32

> Note: All modules are preloaded. This saves RAM and decreases load time, both critical for embedded targets.

### Module specifiers

The original code uses relative paths to import modules. On embedded targets, the Moddable SDK does not support relative paths, only bare module specifiers. All relative path module specifiers needed to build and launch have been converted to bare specifiers. This is incompatible with web hosts. Eventually a better solution is needed


### Resolved issues

- `models/GitConfig.js` - cannot preload as-is because it creates `RegExp` instances at the top level. Worked around with lazy creation of the `RegExp` instances.
- Avoided need for `pify`  implementing promise support directly in host provided FS

### Open issues 

- `models/FileSystem.js` - assumes a global `Buffer` which is not part of standard JavaScipt
- Moddable File is flat FS only.... OK... let's fix that.
- SHA module should use Moddable SDK crypto -- smaller and faster
- Pako will be crazy slow and heavy. Is it required or optional? We have a zlib decoder for PNG but needs a script API to be used here.
