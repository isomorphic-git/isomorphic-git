(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["BrowserFS"] = factory();
	else
		root["BrowserFS"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer, global, module, process) {'use strict';
	
	Object.defineProperty(exports, '__esModule', { value: true });
	
	var buffer = __webpack_require__(2);
	var path = __webpack_require__(9);
	
	/**
	 * Standard libc error codes. Add more to this enum and ErrorStrings as they are
	 * needed.
	 * @url http://www.gnu.org/software/libc/manual/html_node/Error-Codes.html
	 */
	/**
	 * Standard libc error codes. Add more to this enum and ErrorStrings as they are
	 * needed.
	 * @url http://www.gnu.org/software/libc/manual/html_node/Error-Codes.html
	 */ var ErrorCode;
	(function (ErrorCode) {
	    ErrorCode[ErrorCode["EPERM"] = 1] = "EPERM";
	    ErrorCode[ErrorCode["ENOENT"] = 2] = "ENOENT";
	    ErrorCode[ErrorCode["EIO"] = 5] = "EIO";
	    ErrorCode[ErrorCode["EBADF"] = 9] = "EBADF";
	    ErrorCode[ErrorCode["EACCES"] = 13] = "EACCES";
	    ErrorCode[ErrorCode["EBUSY"] = 16] = "EBUSY";
	    ErrorCode[ErrorCode["EEXIST"] = 17] = "EEXIST";
	    ErrorCode[ErrorCode["ENOTDIR"] = 20] = "ENOTDIR";
	    ErrorCode[ErrorCode["EISDIR"] = 21] = "EISDIR";
	    ErrorCode[ErrorCode["EINVAL"] = 22] = "EINVAL";
	    ErrorCode[ErrorCode["EFBIG"] = 27] = "EFBIG";
	    ErrorCode[ErrorCode["ENOSPC"] = 28] = "ENOSPC";
	    ErrorCode[ErrorCode["EROFS"] = 30] = "EROFS";
	    ErrorCode[ErrorCode["ENOTEMPTY"] = 39] = "ENOTEMPTY";
	    ErrorCode[ErrorCode["ENOTSUP"] = 95] = "ENOTSUP";
	})(ErrorCode || (ErrorCode = {}));
	/* tslint:disable:variable-name */
	/**
	 * Strings associated with each error code.
	 * @hidden
	 */
	var ErrorStrings = {};
	ErrorStrings[ErrorCode.EPERM] = 'Operation not permitted.';
	ErrorStrings[ErrorCode.ENOENT] = 'No such file or directory.';
	ErrorStrings[ErrorCode.EIO] = 'Input/output error.';
	ErrorStrings[ErrorCode.EBADF] = 'Bad file descriptor.';
	ErrorStrings[ErrorCode.EACCES] = 'Permission denied.';
	ErrorStrings[ErrorCode.EBUSY] = 'Resource busy or locked.';
	ErrorStrings[ErrorCode.EEXIST] = 'File exists.';
	ErrorStrings[ErrorCode.ENOTDIR] = 'File is not a directory.';
	ErrorStrings[ErrorCode.EISDIR] = 'File is a directory.';
	ErrorStrings[ErrorCode.EINVAL] = 'Invalid argument.';
	ErrorStrings[ErrorCode.EFBIG] = 'File is too big.';
	ErrorStrings[ErrorCode.ENOSPC] = 'No space left on disk.';
	ErrorStrings[ErrorCode.EROFS] = 'Cannot modify a read-only file system.';
	ErrorStrings[ErrorCode.ENOTEMPTY] = 'Directory is not empty.';
	ErrorStrings[ErrorCode.ENOTSUP] = 'Operation is not supported.';
	/* tslint:enable:variable-name */
	/**
	 * Represents a BrowserFS error. Passed back to applications after a failed
	 * call to the BrowserFS API.
	 */
	var ApiError = (function (Error) {
	     function ApiError(type, message, path$$1) {
	        if ( message === void 0 ) message = ErrorStrings[type];
	
	        Error.call(this, message);
	        // Unsupported.
	        this.syscall = "";
	        this.errno = type;
	        this.code = ErrorCode[type];
	        this.path = path$$1;
	        this.stack = new Error().stack;
	        this.message = "Error: " + (this.code) + ": " + message + (this.path ? (", '" + (this.path) + "'") : '');
	    }
	
	     if ( Error ) ApiError.__proto__ = Error;
	     ApiError.prototype = Object.create( Error && Error.prototype );
	     ApiError.prototype.constructor = ApiError;
	    ApiError.fromJSON = function fromJSON (json) {
	        var err = new ApiError(0);
	        err.errno = json.errno;
	        err.code = json.code;
	        err.path = json.path;
	        err.stack = json.stack;
	        err.message = json.message;
	        return err;
	    };
	    /**
	     * Creates an ApiError object from a buffer.
	     */
	    ApiError.fromBuffer = function fromBuffer (buffer$$1, i) {
	        if ( i === void 0 ) i = 0;
	
	        return ApiError.fromJSON(JSON.parse(buffer$$1.toString('utf8', i + 4, i + 4 + buffer$$1.readUInt32LE(i))));
	    };
	    ApiError.FileError = function FileError (code, p) {
	        return new ApiError(code, ErrorStrings[code], p);
	    };
	    ApiError.ENOENT = function ENOENT (path$$1) {
	        return this.FileError(ErrorCode.ENOENT, path$$1);
	    };
	    ApiError.EEXIST = function EEXIST (path$$1) {
	        return this.FileError(ErrorCode.EEXIST, path$$1);
	    };
	    ApiError.EISDIR = function EISDIR (path$$1) {
	        return this.FileError(ErrorCode.EISDIR, path$$1);
	    };
	    ApiError.ENOTDIR = function ENOTDIR (path$$1) {
	        return this.FileError(ErrorCode.ENOTDIR, path$$1);
	    };
	    ApiError.EPERM = function EPERM (path$$1) {
	        return this.FileError(ErrorCode.EPERM, path$$1);
	    };
	    ApiError.ENOTEMPTY = function ENOTEMPTY (path$$1) {
	        return this.FileError(ErrorCode.ENOTEMPTY, path$$1);
	    };
	    /**
	     * @return A friendly error message.
	     */
	    ApiError.prototype.toString = function toString () {
	        return this.message;
	    };
	    ApiError.prototype.toJSON = function toJSON () {
	        return {
	            errno: this.errno,
	            code: this.code,
	            path: this.path,
	            stack: this.stack,
	            message: this.message
	        };
	    };
	    /**
	     * Writes the API error into a buffer.
	     */
	    ApiError.prototype.writeToBuffer = function writeToBuffer (buffer$$1, i) {
	        if ( buffer$$1 === void 0 ) buffer$$1 = Buffer.alloc(this.bufferSize());
	        if ( i === void 0 ) i = 0;
	
	        var bytesWritten = buffer$$1.write(JSON.stringify(this.toJSON()), i + 4);
	        buffer$$1.writeUInt32LE(bytesWritten, i);
	        return buffer$$1;
	    };
	    /**
	     * The size of the API error in buffer-form in bytes.
	     */
	    ApiError.prototype.bufferSize = function bufferSize () {
	        // 4 bytes for string length.
	        return 4 + Buffer.byteLength(JSON.stringify(this.toJSON()));
	    };
	
	     return ApiError;
	 }(Error));
	
	
	var api_error = Object.freeze({
		get ErrorCode () { return ErrorCode; },
		ErrorStrings: ErrorStrings,
		ApiError: ApiError
	});
	
	var ActionType;
	(function (ActionType) {
	    // Indicates that the code should not do anything.
	    ActionType[ActionType["NOP"] = 0] = "NOP";
	    // Indicates that the code should throw an exception.
	    ActionType[ActionType["THROW_EXCEPTION"] = 1] = "THROW_EXCEPTION";
	    // Indicates that the code should truncate the file, but only if it is a file.
	    ActionType[ActionType["TRUNCATE_FILE"] = 2] = "TRUNCATE_FILE";
	    // Indicates that the code should create the file.
	    ActionType[ActionType["CREATE_FILE"] = 3] = "CREATE_FILE";
	})(ActionType || (ActionType = {}));
	/**
	 * Represents one of the following file flags. A convenience object.
	 *
	 * * `'r'` - Open file for reading. An exception occurs if the file does not exist.
	 * * `'r+'` - Open file for reading and writing. An exception occurs if the file does not exist.
	 * * `'rs'` - Open file for reading in synchronous mode. Instructs the filesystem to not cache writes.
	 * * `'rs+'` - Open file for reading and writing, and opens the file in synchronous mode.
	 * * `'w'` - Open file for writing. The file is created (if it does not exist) or truncated (if it exists).
	 * * `'wx'` - Like 'w' but opens the file in exclusive mode.
	 * * `'w+'` - Open file for reading and writing. The file is created (if it does not exist) or truncated (if it exists).
	 * * `'wx+'` - Like 'w+' but opens the file in exclusive mode.
	 * * `'a'` - Open file for appending. The file is created if it does not exist.
	 * * `'ax'` - Like 'a' but opens the file in exclusive mode.
	 * * `'a+'` - Open file for reading and appending. The file is created if it does not exist.
	 * * `'ax+'` - Like 'a+' but opens the file in exclusive mode.
	 *
	 * Exclusive mode ensures that the file path is newly created.
	 */
	var FileFlag = function FileFlag(flagStr) {
	    this.flagStr = flagStr;
	    if (FileFlag.validFlagStrs.indexOf(flagStr) < 0) {
	        throw new ApiError(ErrorCode.EINVAL, "Invalid flag: " + flagStr);
	    }
	};
	/**
	 * Get an object representing the given file flag.
	 * @param modeStr The string representing the flag
	 * @return The FileFlag object representing the flag
	 * @throw when the flag string is invalid
	 */
	FileFlag.getFileFlag = function getFileFlag (flagStr) {
	    // Check cache first.
	    if (FileFlag.flagCache.hasOwnProperty(flagStr)) {
	        return FileFlag.flagCache[flagStr];
	    }
	    return FileFlag.flagCache[flagStr] = new FileFlag(flagStr);
	};
	/**
	 * Get the underlying flag string for this flag.
	 */
	FileFlag.prototype.getFlagString = function getFlagString () {
	    return this.flagStr;
	};
	/**
	 * Returns true if the file is readable.
	 */
	FileFlag.prototype.isReadable = function isReadable () {
	    return this.flagStr.indexOf('r') !== -1 || this.flagStr.indexOf('+') !== -1;
	};
	/**
	 * Returns true if the file is writeable.
	 */
	FileFlag.prototype.isWriteable = function isWriteable () {
	    return this.flagStr.indexOf('w') !== -1 || this.flagStr.indexOf('a') !== -1 || this.flagStr.indexOf('+') !== -1;
	};
	/**
	 * Returns true if the file mode should truncate.
	 */
	FileFlag.prototype.isTruncating = function isTruncating () {
	    return this.flagStr.indexOf('w') !== -1;
	};
	/**
	 * Returns true if the file is appendable.
	 */
	FileFlag.prototype.isAppendable = function isAppendable () {
	    return this.flagStr.indexOf('a') !== -1;
	};
	/**
	 * Returns true if the file is open in synchronous mode.
	 */
	FileFlag.prototype.isSynchronous = function isSynchronous () {
	    return this.flagStr.indexOf('s') !== -1;
	};
	/**
	 * Returns true if the file is open in exclusive mode.
	 */
	FileFlag.prototype.isExclusive = function isExclusive () {
	    return this.flagStr.indexOf('x') !== -1;
	};
	/**
	 * Returns one of the static fields on this object that indicates the
	 * appropriate response to the path existing.
	 */
	FileFlag.prototype.pathExistsAction = function pathExistsAction () {
	    if (this.isExclusive()) {
	        return ActionType.THROW_EXCEPTION;
	    }
	    else if (this.isTruncating()) {
	        return ActionType.TRUNCATE_FILE;
	    }
	    else {
	        return ActionType.NOP;
	    }
	};
	/**
	 * Returns one of the static fields on this object that indicates the
	 * appropriate response to the path not existing.
	 */
	FileFlag.prototype.pathNotExistsAction = function pathNotExistsAction () {
	    if ((this.isWriteable() || this.isAppendable()) && this.flagStr !== 'r+') {
	        return ActionType.CREATE_FILE;
	    }
	    else {
	        return ActionType.THROW_EXCEPTION;
	    }
	};
	// Contains cached FileMode instances.
	FileFlag.flagCache = {};
	// Array of valid mode strings.
	FileFlag.validFlagStrs = ['r', 'r+', 'rs', 'rs+', 'w', 'wx', 'w+', 'wx+', 'a', 'ax', 'a+', 'ax+'];
	
	/**
	 * Indicates the type of the given file. Applied to 'mode'.
	 */
	var FileType;
	(function (FileType) {
	    FileType[FileType["FILE"] = 32768] = "FILE";
	    FileType[FileType["DIRECTORY"] = 16384] = "DIRECTORY";
	    FileType[FileType["SYMLINK"] = 40960] = "SYMLINK";
	})(FileType || (FileType = {}));
	/**
	 * Emulation of Node's `fs.Stats` object.
	 *
	 * Attribute descriptions are from `man 2 stat'
	 * @see http://nodejs.org/api/fs.html#fs_class_fs_stats
	 * @see http://man7.org/linux/man-pages/man2/stat.2.html
	 */
	var Stats = function Stats(itemType, size, mode, atime, mtime, ctime) {
	    if ( atime === void 0 ) atime = new Date();
	    if ( mtime === void 0 ) mtime = new Date();
	    if ( ctime === void 0 ) ctime = new Date();
	
	    this.size = size;
	    this.atime = atime;
	    this.mtime = mtime;
	    this.ctime = ctime;
	    /**
	     * UNSUPPORTED ATTRIBUTES
	     * I assume no one is going to need these details, although we could fake
	     * appropriate values if need be.
	     */
	    // ID of device containing file
	    this.dev = 0;
	    // inode number
	    this.ino = 0;
	    // device ID (if special file)
	    this.rdev = 0;
	    // number of hard links
	    this.nlink = 1;
	    // blocksize for file system I/O
	    this.blksize = 4096;
	    // @todo Maybe support these? atm, it's a one-user filesystem.
	    // user ID of owner
	    this.uid = 0;
	    // group ID of owner
	    this.gid = 0;
	    // time file was created (currently unsupported)
	    this.birthtime = new Date(0);
	    // XXX: Some file systems stash data on stats objects.
	    this.fileData = null;
	    if (!mode) {
	        switch (itemType) {
	            case FileType.FILE:
	                this.mode = 0x1a4;
	                break;
	            case FileType.DIRECTORY:
	            default:
	                this.mode = 0x1ff;
	        }
	    }
	    else {
	        this.mode = mode;
	    }
	    // number of 512B blocks allocated
	    this.blocks = Math.ceil(size / 512);
	    // Check if mode also includes top-most bits, which indicate the file's
	    // type.
	    if (this.mode < 0x1000) {
	        this.mode |= itemType;
	    }
	};
	Stats.fromBuffer = function fromBuffer (buffer$$1) {
	    var size = buffer$$1.readUInt32LE(0), mode = buffer$$1.readUInt32LE(4), atime = buffer$$1.readDoubleLE(8), mtime = buffer$$1.readDoubleLE(16), ctime = buffer$$1.readDoubleLE(24);
	    return new Stats(mode & 0xF000, size, mode & 0xFFF, new Date(atime), new Date(mtime), new Date(ctime));
	};
	Stats.prototype.toBuffer = function toBuffer () {
	    var buffer$$1 = Buffer.alloc(32);
	    buffer$$1.writeUInt32LE(this.size, 0);
	    buffer$$1.writeUInt32LE(this.mode, 4);
	    buffer$$1.writeDoubleLE(this.atime.getTime(), 8);
	    buffer$$1.writeDoubleLE(this.mtime.getTime(), 16);
	    buffer$$1.writeDoubleLE(this.ctime.getTime(), 24);
	    return buffer$$1;
	};
	/**
	 * **Nonstandard**: Clone the stats object.
	 * @return [BrowserFS.node.fs.Stats]
	 */
	Stats.prototype.clone = function clone () {
	    return new Stats(this.mode & 0xF000, this.size, this.mode & 0xFFF, this.atime, this.mtime, this.ctime);
	};
	/**
	 * @return [Boolean] True if this item is a file.
	 */
	Stats.prototype.isFile = function isFile () {
	    return (this.mode & 0xF000) === FileType.FILE;
	};
	/**
	 * @return [Boolean] True if this item is a directory.
	 */
	Stats.prototype.isDirectory = function isDirectory () {
	    return (this.mode & 0xF000) === FileType.DIRECTORY;
	};
	/**
	 * @return [Boolean] True if this item is a symbolic link (only valid through lstat)
	 */
	Stats.prototype.isSymbolicLink = function isSymbolicLink () {
	    return (this.mode & 0xF000) === FileType.SYMLINK;
	};
	/**
	 * Change the mode of the file. We use this helper function to prevent messing
	 * up the type of the file, which is encoded in mode.
	 */
	Stats.prototype.chmod = function chmod (mode) {
	    this.mode = (this.mode & 0xF000) | mode;
	};
	// We don't support the following types of files.
	Stats.prototype.isSocket = function isSocket () {
	    return false;
	};
	Stats.prototype.isBlockDevice = function isBlockDevice () {
	    return false;
	};
	Stats.prototype.isCharacterDevice = function isCharacterDevice () {
	    return false;
	};
	Stats.prototype.isFIFO = function isFIFO () {
	    return false;
	};
	
	/**
	 * Wraps a callback function. Used for unit testing. Defaults to a NOP.
	 * @hidden
	 */
	var wrapCb = function (cb, numArgs) {
	    return cb;
	};
	/**
	 * @hidden
	 */
	function assertRoot(fs) {
	    if (fs) {
	        return fs;
	    }
	    throw new ApiError(ErrorCode.EIO, "Initialize BrowserFS with a file system using BrowserFS.initialize(filesystem)");
	}
	/**
	 * @hidden
	 */
	function normalizeMode(mode, def) {
	    switch (typeof mode) {
	        case 'number':
	            // (path, flag, mode, cb?)
	            return mode;
	        case 'string':
	            // (path, flag, modeString, cb?)
	            var trueMode = parseInt(mode, 8);
	            if (!isNaN(trueMode)) {
	                return trueMode;
	            }
	            // Invalid string.
	            return def;
	        default:
	            return def;
	    }
	}
	/**
	 * @hidden
	 */
	function normalizeTime(time) {
	    if (time instanceof Date) {
	        return time;
	    }
	    else if (typeof time === 'number') {
	        return new Date(time * 1000);
	    }
	    else {
	        throw new ApiError(ErrorCode.EINVAL, "Invalid time.");
	    }
	}
	/**
	 * @hidden
	 */
	function normalizePath(p) {
	    // Node doesn't allow null characters in paths.
	    if (p.indexOf('\u0000') >= 0) {
	        throw new ApiError(ErrorCode.EINVAL, 'Path must be a string without null bytes.');
	    }
	    else if (p === '') {
	        throw new ApiError(ErrorCode.EINVAL, 'Path must not be empty.');
	    }
	    return path.resolve(p);
	}
	/**
	 * @hidden
	 */
	function normalizeOptions(options, defEnc, defFlag, defMode) {
	    switch (typeof options) {
	        case 'object':
	            return {
	                encoding: typeof options['encoding'] !== 'undefined' ? options['encoding'] : defEnc,
	                flag: typeof options['flag'] !== 'undefined' ? options['flag'] : defFlag,
	                mode: normalizeMode(options['mode'], defMode)
	            };
	        case 'string':
	            return {
	                encoding: options,
	                flag: defFlag,
	                mode: defMode
	            };
	        default:
	            return {
	                encoding: defEnc,
	                flag: defFlag,
	                mode: defMode
	            };
	    }
	}
	/**
	 * The default callback is a NOP.
	 * @hidden
	 * @private
	 */
	function nopCb() {
	    // NOP.
	}
	/**
	 * The node frontend to all filesystems.
	 * This layer handles:
	 *
	 * * Sanity checking inputs.
	 * * Normalizing paths.
	 * * Resetting stack depth for asynchronous operations which may not go through
	 *   the browser by wrapping all input callbacks using `setImmediate`.
	 * * Performing the requested operation through the filesystem or the file
	 *   descriptor, as appropriate.
	 * * Handling optional arguments and setting default arguments.
	 * @see http://nodejs.org/api/fs.html
	 */
	var FS = function FS() {
	    /* tslint:enable:variable-name */
	    this.F_OK = 0;
	    this.R_OK = 4;
	    this.W_OK = 2;
	    this.X_OK = 1;
	    this.root = null;
	    this.fdMap = {};
	    this.nextFd = 100;
	};
	FS.prototype.initialize = function initialize (rootFS) {
	    if (!rootFS.constructor.isAvailable()) {
	        throw new ApiError(ErrorCode.EINVAL, 'Tried to instantiate BrowserFS with an unavailable file system.');
	    }
	    return this.root = rootFS;
	};
	/**
	 * converts Date or number to a fractional UNIX timestamp
	 * Grabbed from NodeJS sources (lib/fs.js)
	 */
	FS.prototype._toUnixTimestamp = function _toUnixTimestamp (time) {
	    if (typeof time === 'number') {
	        return time;
	    }
	    else if (time instanceof Date) {
	        return time.getTime() / 1000;
	    }
	    throw new Error("Cannot parse time: " + time);
	};
	/**
	 * **NONSTANDARD**: Grab the FileSystem instance that backs this API.
	 * @return [BrowserFS.FileSystem | null] Returns null if the file system has
	 *   not been initialized.
	 */
	FS.prototype.getRootFS = function getRootFS () {
	    if (this.root) {
	        return this.root;
	    }
	    else {
	        return null;
	    }
	};
	// FILE OR DIRECTORY METHODS
	/**
	 * Asynchronous rename. No arguments other than a possible exception are given
	 * to the completion callback.
	 * @param oldPath
	 * @param newPath
	 * @param callback
	 */
	FS.prototype.rename = function rename (oldPath, newPath, cb) {
	        if ( cb === void 0 ) cb = nopCb;
	
	    var newCb = wrapCb(cb, 1);
	    try {
	        assertRoot(this.root).rename(normalizePath(oldPath), normalizePath(newPath), newCb);
	    }
	    catch (e) {
	        newCb(e);
	    }
	};
	/**
	 * Synchronous rename.
	 * @param oldPath
	 * @param newPath
	 */
	FS.prototype.renameSync = function renameSync (oldPath, newPath) {
	    assertRoot(this.root).renameSync(normalizePath(oldPath), normalizePath(newPath));
	};
	/**
	 * Test whether or not the given path exists by checking with the file system.
	 * Then call the callback argument with either true or false.
	 * @example Sample invocation
	 *   fs.exists('/etc/passwd', function (exists) {
	 * util.debug(exists ? "it's there" : "no passwd!");
	 *   });
	 * @param path
	 * @param callback
	 */
	FS.prototype.exists = function exists (path$$1, cb) {
	        if ( cb === void 0 ) cb = nopCb;
	
	    var newCb = wrapCb(cb, 1);
	    try {
	        return assertRoot(this.root).exists(normalizePath(path$$1), newCb);
	    }
	    catch (e) {
	        // Doesn't return an error. If something bad happens, we assume it just
	        // doesn't exist.
	        return newCb(false);
	    }
	};
	/**
	 * Test whether or not the given path exists by checking with the file system.
	 * @param path
	 * @return [boolean]
	 */
	FS.prototype.existsSync = function existsSync (path$$1) {
	    try {
	        return assertRoot(this.root).existsSync(normalizePath(path$$1));
	    }
	    catch (e) {
	        // Doesn't return an error. If something bad happens, we assume it just
	        // doesn't exist.
	        return false;
	    }
	};
	/**
	 * Asynchronous `stat`.
	 * @param path
	 * @param callback
	 */
	FS.prototype.stat = function stat (path$$1, cb) {
	        if ( cb === void 0 ) cb = nopCb;
	
	    var newCb = wrapCb(cb, 2);
	    try {
	        return assertRoot(this.root).stat(normalizePath(path$$1), false, newCb);
	    }
	    catch (e) {
	        return newCb(e);
	    }
	};
	/**
	 * Synchronous `stat`.
	 * @param path
	 * @return [BrowserFS.node.fs.Stats]
	 */
	FS.prototype.statSync = function statSync (path$$1) {
	    return assertRoot(this.root).statSync(normalizePath(path$$1), false);
	};
	/**
	 * Asynchronous `lstat`.
	 * `lstat()` is identical to `stat()`, except that if path is a symbolic link,
	 * then the link itself is stat-ed, not the file that it refers to.
	 * @param path
	 * @param callback
	 */
	FS.prototype.lstat = function lstat (path$$1, cb) {
	        if ( cb === void 0 ) cb = nopCb;
	
	    var newCb = wrapCb(cb, 2);
	    try {
	        return assertRoot(this.root).stat(normalizePath(path$$1), true, newCb);
	    }
	    catch (e) {
	        return newCb(e);
	    }
	};
	/**
	 * Synchronous `lstat`.
	 * `lstat()` is identical to `stat()`, except that if path is a symbolic link,
	 * then the link itself is stat-ed, not the file that it refers to.
	 * @param path
	 * @return [BrowserFS.node.fs.Stats]
	 */
	FS.prototype.lstatSync = function lstatSync (path$$1) {
	    return assertRoot(this.root).statSync(normalizePath(path$$1), true);
	};
	FS.prototype.truncate = function truncate (path$$1, arg2, cb) {
	        if ( arg2 === void 0 ) arg2 = 0;
	        if ( cb === void 0 ) cb = nopCb;
	
	    var len = 0;
	    if (typeof arg2 === 'function') {
	        cb = arg2;
	    }
	    else if (typeof arg2 === 'number') {
	        len = arg2;
	    }
	    var newCb = wrapCb(cb, 1);
	    try {
	        if (len < 0) {
	            throw new ApiError(ErrorCode.EINVAL);
	        }
	        return assertRoot(this.root).truncate(normalizePath(path$$1), len, newCb);
	    }
	    catch (e) {
	        return newCb(e);
	    }
	};
	/**
	 * Synchronous `truncate`.
	 * @param path
	 * @param len
	 */
	FS.prototype.truncateSync = function truncateSync (path$$1, len) {
	        if ( len === void 0 ) len = 0;
	
	    if (len < 0) {
	        throw new ApiError(ErrorCode.EINVAL);
	    }
	    return assertRoot(this.root).truncateSync(normalizePath(path$$1), len);
	};
	/**
	 * Asynchronous `unlink`.
	 * @param path
	 * @param callback
	 */
	FS.prototype.unlink = function unlink (path$$1, cb) {
	        if ( cb === void 0 ) cb = nopCb;
	
	    var newCb = wrapCb(cb, 1);
	    try {
	        return assertRoot(this.root).unlink(normalizePath(path$$1), newCb);
	    }
	    catch (e) {
	        return newCb(e);
	    }
	};
	/**
	 * Synchronous `unlink`.
	 * @param path
	 */
	FS.prototype.unlinkSync = function unlinkSync (path$$1) {
	    return assertRoot(this.root).unlinkSync(normalizePath(path$$1));
	};
	FS.prototype.open = function open (path$$1, flag, arg2, cb) {
	        var this$1 = this;
	        if ( cb === void 0 ) cb = nopCb;
	
	    var mode = normalizeMode(arg2, 0x1a4);
	    cb = typeof arg2 === 'function' ? arg2 : cb;
	    var newCb = wrapCb(cb, 2);
	    try {
	        assertRoot(this.root).open(normalizePath(path$$1), FileFlag.getFileFlag(flag), mode, function (e, file) {
	            if (file) {
	                newCb(e, this$1.getFdForFile(file));
	            }
	            else {
	                newCb(e);
	            }
	        });
	    }
	    catch (e) {
	        newCb(e);
	    }
	};
	/**
	 * Synchronous file open.
	 * @see http://www.manpagez.com/man/2/open/
	 * @param path
	 * @param flags
	 * @param mode defaults to `0644`
	 * @return [BrowserFS.File]
	 */
	FS.prototype.openSync = function openSync (path$$1, flag, mode) {
	        if ( mode === void 0 ) mode = 0x1a4;
	
	    return this.getFdForFile(assertRoot(this.root).openSync(normalizePath(path$$1), FileFlag.getFileFlag(flag), normalizeMode(mode, 0x1a4)));
	};
	FS.prototype.readFile = function readFile (filename, arg2, cb) {
	        if ( arg2 === void 0 ) arg2 = {};
	        if ( cb === void 0 ) cb = nopCb;
	
	    var options = normalizeOptions(arg2, null, 'r', null);
	    cb = typeof arg2 === 'function' ? arg2 : cb;
	    var newCb = wrapCb(cb, 2);
	    try {
	        var flag = FileFlag.getFileFlag(options['flag']);
	        if (!flag.isReadable()) {
	            return newCb(new ApiError(ErrorCode.EINVAL, 'Flag passed to readFile must allow for reading.'));
	        }
	        return assertRoot(this.root).readFile(normalizePath(filename), options.encoding, flag, newCb);
	    }
	    catch (e) {
	        return newCb(e);
	    }
	};
	FS.prototype.readFileSync = function readFileSync (filename, arg2) {
	        if ( arg2 === void 0 ) arg2 = {};
	
	    var options = normalizeOptions(arg2, null, 'r', null);
	    var flag = FileFlag.getFileFlag(options.flag);
	    if (!flag.isReadable()) {
	        throw new ApiError(ErrorCode.EINVAL, 'Flag passed to readFile must allow for reading.');
	    }
	    return assertRoot(this.root).readFileSync(normalizePath(filename), options.encoding, flag);
	};
	FS.prototype.writeFile = function writeFile (filename, data, arg3, cb) {
	        if ( arg3 === void 0 ) arg3 = {};
	        if ( cb === void 0 ) cb = nopCb;
	
	    var options = normalizeOptions(arg3, 'utf8', 'w', 0x1a4);
	    cb = typeof arg3 === 'function' ? arg3 : cb;
	    var newCb = wrapCb(cb, 1);
	    try {
	        var flag = FileFlag.getFileFlag(options.flag);
	        if (!flag.isWriteable()) {
	            return newCb(new ApiError(ErrorCode.EINVAL, 'Flag passed to writeFile must allow for writing.'));
	        }
	        return assertRoot(this.root).writeFile(normalizePath(filename), data, options.encoding, flag, options.mode, newCb);
	    }
	    catch (e) {
	        return newCb(e);
	    }
	};
	FS.prototype.writeFileSync = function writeFileSync (filename, data, arg3) {
	    var options = normalizeOptions(arg3, 'utf8', 'w', 0x1a4);
	    var flag = FileFlag.getFileFlag(options.flag);
	    if (!flag.isWriteable()) {
	        throw new ApiError(ErrorCode.EINVAL, 'Flag passed to writeFile must allow for writing.');
	    }
	    return assertRoot(this.root).writeFileSync(normalizePath(filename), data, options.encoding, flag, options.mode);
	};
	FS.prototype.appendFile = function appendFile (filename, data, arg3, cb) {
	        if ( cb === void 0 ) cb = nopCb;
	
	    var options = normalizeOptions(arg3, 'utf8', 'a', 0x1a4);
	    cb = typeof arg3 === 'function' ? arg3 : cb;
	    var newCb = wrapCb(cb, 1);
	    try {
	        var flag = FileFlag.getFileFlag(options.flag);
	        if (!flag.isAppendable()) {
	            return newCb(new ApiError(ErrorCode.EINVAL, 'Flag passed to appendFile must allow for appending.'));
	        }
	        assertRoot(this.root).appendFile(normalizePath(filename), data, options.encoding, flag, options.mode, newCb);
	    }
	    catch (e) {
	        newCb(e);
	    }
	};
	FS.prototype.appendFileSync = function appendFileSync (filename, data, arg3) {
	    var options = normalizeOptions(arg3, 'utf8', 'a', 0x1a4);
	    var flag = FileFlag.getFileFlag(options.flag);
	    if (!flag.isAppendable()) {
	        throw new ApiError(ErrorCode.EINVAL, 'Flag passed to appendFile must allow for appending.');
	    }
	    return assertRoot(this.root).appendFileSync(normalizePath(filename), data, options.encoding, flag, options.mode);
	};
	// FILE DESCRIPTOR METHODS
	/**
	 * Asynchronous `fstat`.
	 * `fstat()` is identical to `stat()`, except that the file to be stat-ed is
	 * specified by the file descriptor `fd`.
	 * @param fd
	 * @param callback
	 */
	FS.prototype.fstat = function fstat (fd, cb) {
	        if ( cb === void 0 ) cb = nopCb;
	
	    var newCb = wrapCb(cb, 2);
	    try {
	        var file = this.fd2file(fd);
	        file.stat(newCb);
	    }
	    catch (e) {
	        newCb(e);
	    }
	};
	/**
	 * Synchronous `fstat`.
	 * `fstat()` is identical to `stat()`, except that the file to be stat-ed is
	 * specified by the file descriptor `fd`.
	 * @param fd
	 * @return [BrowserFS.node.fs.Stats]
	 */
	FS.prototype.fstatSync = function fstatSync (fd) {
	    return this.fd2file(fd).statSync();
	};
	/**
	 * Asynchronous close.
	 * @param fd
	 * @param callback
	 */
	FS.prototype.close = function close (fd, cb) {
	        var this$1 = this;
	        if ( cb === void 0 ) cb = nopCb;
	
	    var newCb = wrapCb(cb, 1);
	    try {
	        this.fd2file(fd).close(function (e) {
	            if (!e) {
	                this$1.closeFd(fd);
	            }
	            newCb(e);
	        });
	    }
	    catch (e) {
	        newCb(e);
	    }
	};
	/**
	 * Synchronous close.
	 * @param fd
	 */
	FS.prototype.closeSync = function closeSync (fd) {
	    this.fd2file(fd).closeSync();
	    this.closeFd(fd);
	};
	FS.prototype.ftruncate = function ftruncate (fd, arg2, cb) {
	        if ( cb === void 0 ) cb = nopCb;
	
	    var length = typeof arg2 === 'number' ? arg2 : 0;
	    cb = typeof arg2 === 'function' ? arg2 : cb;
	    var newCb = wrapCb(cb, 1);
	    try {
	        var file = this.fd2file(fd);
	        if (length < 0) {
	            throw new ApiError(ErrorCode.EINVAL);
	        }
	        file.truncate(length, newCb);
	    }
	    catch (e) {
	        newCb(e);
	    }
	};
	/**
	 * Synchronous ftruncate.
	 * @param fd
	 * @param len
	 */
	FS.prototype.ftruncateSync = function ftruncateSync (fd, len) {
	        if ( len === void 0 ) len = 0;
	
	    var file = this.fd2file(fd);
	    if (len < 0) {
	        throw new ApiError(ErrorCode.EINVAL);
	    }
	    file.truncateSync(len);
	};
	/**
	 * Asynchronous fsync.
	 * @param fd
	 * @param callback
	 */
	FS.prototype.fsync = function fsync (fd, cb) {
	        if ( cb === void 0 ) cb = nopCb;
	
	    var newCb = wrapCb(cb, 1);
	    try {
	        this.fd2file(fd).sync(newCb);
	    }
	    catch (e) {
	        newCb(e);
	    }
	};
	/**
	 * Synchronous fsync.
	 * @param fd
	 */
	FS.prototype.fsyncSync = function fsyncSync (fd) {
	    this.fd2file(fd).syncSync();
	};
	/**
	 * Asynchronous fdatasync.
	 * @param fd
	 * @param callback
	 */
	FS.prototype.fdatasync = function fdatasync (fd, cb) {
	        if ( cb === void 0 ) cb = nopCb;
	
	    var newCb = wrapCb(cb, 1);
	    try {
	        this.fd2file(fd).datasync(newCb);
	    }
	    catch (e) {
	        newCb(e);
	    }
	};
	/**
	 * Synchronous fdatasync.
	 * @param fd
	 */
	FS.prototype.fdatasyncSync = function fdatasyncSync (fd) {
	    this.fd2file(fd).datasyncSync();
	};
	FS.prototype.write = function write (fd, arg2, arg3, arg4, arg5, cb) {
	        if ( cb === void 0 ) cb = nopCb;
	
	    var buffer$$1, offset, length, position = null;
	    if (typeof arg2 === 'string') {
	        // Signature 1: (fd, string, [position?, [encoding?]], cb?)
	        var encoding = 'utf8';
	        switch (typeof arg3) {
	            case 'function':
	                // (fd, string, cb)
	                cb = arg3;
	                break;
	            case 'number':
	                // (fd, string, position, encoding?, cb?)
	                position = arg3;
	                encoding = typeof arg4 === 'string' ? arg4 : 'utf8';
	                cb = typeof arg5 === 'function' ? arg5 : cb;
	                break;
	            default:
	                // ...try to find the callback and get out of here!
	                cb = typeof arg4 === 'function' ? arg4 : typeof arg5 === 'function' ? arg5 : cb;
	                return cb(new ApiError(ErrorCode.EINVAL, 'Invalid arguments.'));
	        }
	        buffer$$1 = Buffer.from(arg2, encoding);
	        offset = 0;
	        length = buffer$$1.length;
	    }
	    else {
	        // Signature 2: (fd, buffer, offset, length, position?, cb?)
	        buffer$$1 = arg2;
	        offset = arg3;
	        length = arg4;
	        position = typeof arg5 === 'number' ? arg5 : null;
	        cb = typeof arg5 === 'function' ? arg5 : cb;
	    }
	    var newCb = wrapCb(cb, 3);
	    try {
	        var file = this.fd2file(fd);
	        if (position === undefined || position === null) {
	            position = file.getPos();
	        }
	        file.write(buffer$$1, offset, length, position, newCb);
	    }
	    catch (e) {
	        newCb(e);
	    }
	};
	FS.prototype.writeSync = function writeSync (fd, arg2, arg3, arg4, arg5) {
	    var buffer$$1, offset = 0, length, position;
	    if (typeof arg2 === 'string') {
	        // Signature 1: (fd, string, [position?, [encoding?]])
	        position = typeof arg3 === 'number' ? arg3 : null;
	        var encoding = typeof arg4 === 'string' ? arg4 : 'utf8';
	        offset = 0;
	        buffer$$1 = Buffer.from(arg2, encoding);
	        length = buffer$$1.length;
	    }
	    else {
	        // Signature 2: (fd, buffer, offset, length, position?)
	        buffer$$1 = arg2;
	        offset = arg3;
	        length = arg4;
	        position = typeof arg5 === 'number' ? arg5 : null;
	    }
	    var file = this.fd2file(fd);
	    if (position === undefined || position === null) {
	        position = file.getPos();
	    }
	    return file.writeSync(buffer$$1, offset, length, position);
	};
	FS.prototype.read = function read (fd, arg2, arg3, arg4, arg5, cb) {
	        if ( cb === void 0 ) cb = nopCb;
	
	    var position, offset, length, buffer$$1, newCb;
	    if (typeof arg2 === 'number') {
	        // legacy interface
	        // (fd, length, position, encoding, callback)
	        length = arg2;
	        position = arg3;
	        var encoding = arg4;
	        cb = typeof arg5 === 'function' ? arg5 : cb;
	        offset = 0;
	        buffer$$1 = Buffer.alloc(length);
	        // XXX: Inefficient.
	        // Wrap the cb so we shelter upper layers of the API from these
	        // shenanigans.
	        newCb = wrapCb(function (err, bytesRead, buf) {
	            if (err) {
	                return cb(err);
	            }
	            cb(err, buf.toString(encoding), bytesRead);
	        }, 3);
	    }
	    else {
	        buffer$$1 = arg2;
	        offset = arg3;
	        length = arg4;
	        position = arg5;
	        newCb = wrapCb(cb, 3);
	    }
	    try {
	        var file = this.fd2file(fd);
	        if (position === undefined || position === null) {
	            position = file.getPos();
	        }
	        file.read(buffer$$1, offset, length, position, newCb);
	    }
	    catch (e) {
	        newCb(e);
	    }
	};
	FS.prototype.readSync = function readSync (fd, arg2, arg3, arg4, arg5) {
	    var shenanigans = false;
	    var buffer$$1, offset, length, position, encoding = 'utf8';
	    if (typeof arg2 === 'number') {
	        length = arg2;
	        position = arg3;
	        encoding = arg4;
	        offset = 0;
	        buffer$$1 = Buffer.alloc(length);
	        shenanigans = true;
	    }
	    else {
	        buffer$$1 = arg2;
	        offset = arg3;
	        length = arg4;
	        position = arg5;
	    }
	    var file = this.fd2file(fd);
	    if (position === undefined || position === null) {
	        position = file.getPos();
	    }
	    var rv = file.readSync(buffer$$1, offset, length, position);
	    if (!shenanigans) {
	        return rv;
	    }
	    else {
	        return [buffer$$1.toString(encoding), rv];
	    }
	};
	/**
	 * Asynchronous `fchown`.
	 * @param fd
	 * @param uid
	 * @param gid
	 * @param callback
	 */
	FS.prototype.fchown = function fchown (fd, uid, gid, callback) {
	        if ( callback === void 0 ) callback = nopCb;
	
	    var newCb = wrapCb(callback, 1);
	    try {
	        this.fd2file(fd).chown(uid, gid, newCb);
	    }
	    catch (e) {
	        newCb(e);
	    }
	};
	/**
	 * Synchronous `fchown`.
	 * @param fd
	 * @param uid
	 * @param gid
	 */
	FS.prototype.fchownSync = function fchownSync (fd, uid, gid) {
	    this.fd2file(fd).chownSync(uid, gid);
	};
	/**
	 * Asynchronous `fchmod`.
	 * @param fd
	 * @param mode
	 * @param callback
	 */
	FS.prototype.fchmod = function fchmod (fd, mode, cb) {
	    var newCb = wrapCb(cb, 1);
	    try {
	        var numMode = typeof mode === 'string' ? parseInt(mode, 8) : mode;
	        this.fd2file(fd).chmod(numMode, newCb);
	    }
	    catch (e) {
	        newCb(e);
	    }
	};
	/**
	 * Synchronous `fchmod`.
	 * @param fd
	 * @param mode
	 */
	FS.prototype.fchmodSync = function fchmodSync (fd, mode) {
	    var numMode = typeof mode === 'string' ? parseInt(mode, 8) : mode;
	    this.fd2file(fd).chmodSync(numMode);
	};
	/**
	 * Change the file timestamps of a file referenced by the supplied file
	 * descriptor.
	 * @param fd
	 * @param atime
	 * @param mtime
	 * @param callback
	 */
	FS.prototype.futimes = function futimes (fd, atime, mtime, cb) {
	        if ( cb === void 0 ) cb = nopCb;
	
	    var newCb = wrapCb(cb, 1);
	    try {
	        var file = this.fd2file(fd);
	        if (typeof atime === 'number') {
	            atime = new Date(atime * 1000);
	        }
	        if (typeof mtime === 'number') {
	            mtime = new Date(mtime * 1000);
	        }
	        file.utimes(atime, mtime, newCb);
	    }
	    catch (e) {
	        newCb(e);
	    }
	};
	/**
	 * Change the file timestamps of a file referenced by the supplied file
	 * descriptor.
	 * @param fd
	 * @param atime
	 * @param mtime
	 */
	FS.prototype.futimesSync = function futimesSync (fd, atime, mtime) {
	    this.fd2file(fd).utimesSync(normalizeTime(atime), normalizeTime(mtime));
	};
	// DIRECTORY-ONLY METHODS
	/**
	 * Asynchronous `rmdir`.
	 * @param path
	 * @param callback
	 */
	FS.prototype.rmdir = function rmdir (path$$1, cb) {
	        if ( cb === void 0 ) cb = nopCb;
	
	    var newCb = wrapCb(cb, 1);
	    try {
	        path$$1 = normalizePath(path$$1);
	        assertRoot(this.root).rmdir(path$$1, newCb);
	    }
	    catch (e) {
	        newCb(e);
	    }
	};
	/**
	 * Synchronous `rmdir`.
	 * @param path
	 */
	FS.prototype.rmdirSync = function rmdirSync (path$$1) {
	    path$$1 = normalizePath(path$$1);
	    return assertRoot(this.root).rmdirSync(path$$1);
	};
	/**
	 * Asynchronous `mkdir`.
	 * @param path
	 * @param mode defaults to `0777`
	 * @param callback
	 */
	FS.prototype.mkdir = function mkdir (path$$1, mode, cb) {
	        if ( cb === void 0 ) cb = nopCb;
	
	    if (typeof mode === 'function') {
	        cb = mode;
	        mode = 0x1ff;
	    }
	    var newCb = wrapCb(cb, 1);
	    try {
	        path$$1 = normalizePath(path$$1);
	        assertRoot(this.root).mkdir(path$$1, mode, newCb);
	    }
	    catch (e) {
	        newCb(e);
	    }
	};
	/**
	 * Synchronous `mkdir`.
	 * @param path
	 * @param mode defaults to `0777`
	 */
	FS.prototype.mkdirSync = function mkdirSync (path$$1, mode) {
	    assertRoot(this.root).mkdirSync(normalizePath(path$$1), normalizeMode(mode, 0x1ff));
	};
	/**
	 * Asynchronous `readdir`. Reads the contents of a directory.
	 * The callback gets two arguments `(err, files)` where `files` is an array of
	 * the names of the files in the directory excluding `'.'` and `'..'`.
	 * @param path
	 * @param callback
	 */
	FS.prototype.readdir = function readdir (path$$1, cb) {
	        if ( cb === void 0 ) cb = nopCb;
	
	    var newCb = wrapCb(cb, 2);
	    try {
	        path$$1 = normalizePath(path$$1);
	        assertRoot(this.root).readdir(path$$1, newCb);
	    }
	    catch (e) {
	        newCb(e);
	    }
	};
	/**
	 * Synchronous `readdir`. Reads the contents of a directory.
	 * @param path
	 * @return [String[]]
	 */
	FS.prototype.readdirSync = function readdirSync (path$$1) {
	    path$$1 = normalizePath(path$$1);
	    return assertRoot(this.root).readdirSync(path$$1);
	};
	// SYMLINK METHODS
	/**
	 * Asynchronous `link`.
	 * @param srcpath
	 * @param dstpath
	 * @param callback
	 */
	FS.prototype.link = function link (srcpath, dstpath, cb) {
	        if ( cb === void 0 ) cb = nopCb;
	
	    var newCb = wrapCb(cb, 1);
	    try {
	        srcpath = normalizePath(srcpath);
	        dstpath = normalizePath(dstpath);
	        assertRoot(this.root).link(srcpath, dstpath, newCb);
	    }
	    catch (e) {
	        newCb(e);
	    }
	};
	/**
	 * Synchronous `link`.
	 * @param srcpath
	 * @param dstpath
	 */
	FS.prototype.linkSync = function linkSync (srcpath, dstpath) {
	    srcpath = normalizePath(srcpath);
	    dstpath = normalizePath(dstpath);
	    return assertRoot(this.root).linkSync(srcpath, dstpath);
	};
	FS.prototype.symlink = function symlink (srcpath, dstpath, arg3, cb) {
	        if ( cb === void 0 ) cb = nopCb;
	
	    var type = typeof arg3 === 'string' ? arg3 : 'file';
	    cb = typeof arg3 === 'function' ? arg3 : cb;
	    var newCb = wrapCb(cb, 1);
	    try {
	        if (type !== 'file' && type !== 'dir') {
	            return newCb(new ApiError(ErrorCode.EINVAL, "Invalid type: " + type));
	        }
	        srcpath = normalizePath(srcpath);
	        dstpath = normalizePath(dstpath);
	        assertRoot(this.root).symlink(srcpath, dstpath, type, newCb);
	    }
	    catch (e) {
	        newCb(e);
	    }
	};
	/**
	 * Synchronous `symlink`.
	 * @param srcpath
	 * @param dstpath
	 * @param type can be either `'dir'` or `'file'` (default is `'file'`)
	 */
	FS.prototype.symlinkSync = function symlinkSync (srcpath, dstpath, type) {
	    if (!type) {
	        type = 'file';
	    }
	    else if (type !== 'file' && type !== 'dir') {
	        throw new ApiError(ErrorCode.EINVAL, "Invalid type: " + type);
	    }
	    srcpath = normalizePath(srcpath);
	    dstpath = normalizePath(dstpath);
	    return assertRoot(this.root).symlinkSync(srcpath, dstpath, type);
	};
	/**
	 * Asynchronous readlink.
	 * @param path
	 * @param callback
	 */
	FS.prototype.readlink = function readlink (path$$1, cb) {
	        if ( cb === void 0 ) cb = nopCb;
	
	    var newCb = wrapCb(cb, 2);
	    try {
	        path$$1 = normalizePath(path$$1);
	        assertRoot(this.root).readlink(path$$1, newCb);
	    }
	    catch (e) {
	        newCb(e);
	    }
	};
	/**
	 * Synchronous readlink.
	 * @param path
	 * @return [String]
	 */
	FS.prototype.readlinkSync = function readlinkSync (path$$1) {
	    path$$1 = normalizePath(path$$1);
	    return assertRoot(this.root).readlinkSync(path$$1);
	};
	// PROPERTY OPERATIONS
	/**
	 * Asynchronous `chown`.
	 * @param path
	 * @param uid
	 * @param gid
	 * @param callback
	 */
	FS.prototype.chown = function chown (path$$1, uid, gid, cb) {
	        if ( cb === void 0 ) cb = nopCb;
	
	    var newCb = wrapCb(cb, 1);
	    try {
	        path$$1 = normalizePath(path$$1);
	        assertRoot(this.root).chown(path$$1, false, uid, gid, newCb);
	    }
	    catch (e) {
	        newCb(e);
	    }
	};
	/**
	 * Synchronous `chown`.
	 * @param path
	 * @param uid
	 * @param gid
	 */
	FS.prototype.chownSync = function chownSync (path$$1, uid, gid) {
	    path$$1 = normalizePath(path$$1);
	    assertRoot(this.root).chownSync(path$$1, false, uid, gid);
	};
	/**
	 * Asynchronous `lchown`.
	 * @param path
	 * @param uid
	 * @param gid
	 * @param callback
	 */
	FS.prototype.lchown = function lchown (path$$1, uid, gid, cb) {
	        if ( cb === void 0 ) cb = nopCb;
	
	    var newCb = wrapCb(cb, 1);
	    try {
	        path$$1 = normalizePath(path$$1);
	        assertRoot(this.root).chown(path$$1, true, uid, gid, newCb);
	    }
	    catch (e) {
	        newCb(e);
	    }
	};
	/**
	 * Synchronous `lchown`.
	 * @param path
	 * @param uid
	 * @param gid
	 */
	FS.prototype.lchownSync = function lchownSync (path$$1, uid, gid) {
	    path$$1 = normalizePath(path$$1);
	    assertRoot(this.root).chownSync(path$$1, true, uid, gid);
	};
	/**
	 * Asynchronous `chmod`.
	 * @param path
	 * @param mode
	 * @param callback
	 */
	FS.prototype.chmod = function chmod (path$$1, mode, cb) {
	        if ( cb === void 0 ) cb = nopCb;
	
	    var newCb = wrapCb(cb, 1);
	    try {
	        var numMode = normalizeMode(mode, -1);
	        if (numMode < 0) {
	            throw new ApiError(ErrorCode.EINVAL, "Invalid mode.");
	        }
	        assertRoot(this.root).chmod(normalizePath(path$$1), false, numMode, newCb);
	    }
	    catch (e) {
	        newCb(e);
	    }
	};
	/**
	 * Synchronous `chmod`.
	 * @param path
	 * @param mode
	 */
	FS.prototype.chmodSync = function chmodSync (path$$1, mode) {
	    var numMode = normalizeMode(mode, -1);
	    if (numMode < 0) {
	        throw new ApiError(ErrorCode.EINVAL, "Invalid mode.");
	    }
	    path$$1 = normalizePath(path$$1);
	    assertRoot(this.root).chmodSync(path$$1, false, numMode);
	};
	/**
	 * Asynchronous `lchmod`.
	 * @param path
	 * @param mode
	 * @param callback
	 */
	FS.prototype.lchmod = function lchmod (path$$1, mode, cb) {
	        if ( cb === void 0 ) cb = nopCb;
	
	    var newCb = wrapCb(cb, 1);
	    try {
	        var numMode = normalizeMode(mode, -1);
	        if (numMode < 0) {
	            throw new ApiError(ErrorCode.EINVAL, "Invalid mode.");
	        }
	        assertRoot(this.root).chmod(normalizePath(path$$1), true, numMode, newCb);
	    }
	    catch (e) {
	        newCb(e);
	    }
	};
	/**
	 * Synchronous `lchmod`.
	 * @param path
	 * @param mode
	 */
	FS.prototype.lchmodSync = function lchmodSync (path$$1, mode) {
	    var numMode = normalizeMode(mode, -1);
	    if (numMode < 1) {
	        throw new ApiError(ErrorCode.EINVAL, "Invalid mode.");
	    }
	    assertRoot(this.root).chmodSync(normalizePath(path$$1), true, numMode);
	};
	/**
	 * Change file timestamps of the file referenced by the supplied path.
	 * @param path
	 * @param atime
	 * @param mtime
	 * @param callback
	 */
	FS.prototype.utimes = function utimes (path$$1, atime, mtime, cb) {
	        if ( cb === void 0 ) cb = nopCb;
	
	    var newCb = wrapCb(cb, 1);
	    try {
	        assertRoot(this.root).utimes(normalizePath(path$$1), normalizeTime(atime), normalizeTime(mtime), newCb);
	    }
	    catch (e) {
	        newCb(e);
	    }
	};
	/**
	 * Change file timestamps of the file referenced by the supplied path.
	 * @param path
	 * @param atime
	 * @param mtime
	 */
	FS.prototype.utimesSync = function utimesSync (path$$1, atime, mtime) {
	    assertRoot(this.root).utimesSync(normalizePath(path$$1), normalizeTime(atime), normalizeTime(mtime));
	};
	FS.prototype.realpath = function realpath (path$$1, arg2, cb) {
	        if ( cb === void 0 ) cb = nopCb;
	
	    var cache = typeof (arg2) === 'object' ? arg2 : {};
	    cb = typeof (arg2) === 'function' ? arg2 : nopCb;
	    var newCb = wrapCb(cb, 2);
	    try {
	        path$$1 = normalizePath(path$$1);
	        assertRoot(this.root).realpath(path$$1, cache, newCb);
	    }
	    catch (e) {
	        newCb(e);
	    }
	};
	/**
	 * Synchronous `realpath`.
	 * @param path
	 * @param cache An object literal of mapped paths that can be used to
	 *   force a specific path resolution or avoid additional `fs.stat` calls for
	 *   known real paths.
	 * @return [String]
	 */
	FS.prototype.realpathSync = function realpathSync (path$$1, cache) {
	        if ( cache === void 0 ) cache = {};
	
	    path$$1 = normalizePath(path$$1);
	    return assertRoot(this.root).realpathSync(path$$1, cache);
	};
	FS.prototype.watchFile = function watchFile (filename, arg2, listener) {
	        if ( listener === void 0 ) listener = nopCb;
	
	    throw new ApiError(ErrorCode.ENOTSUP);
	};
	FS.prototype.unwatchFile = function unwatchFile (filename, listener) {
	        if ( listener === void 0 ) listener = nopCb;
	
	    throw new ApiError(ErrorCode.ENOTSUP);
	};
	FS.prototype.watch = function watch (filename, arg2, listener) {
	        if ( listener === void 0 ) listener = nopCb;
	
	    throw new ApiError(ErrorCode.ENOTSUP);
	};
	FS.prototype.access = function access (path$$1, arg2, cb) {
	        if ( cb === void 0 ) cb = nopCb;
	
	    throw new ApiError(ErrorCode.ENOTSUP);
	};
	FS.prototype.accessSync = function accessSync (path$$1, mode) {
	    throw new ApiError(ErrorCode.ENOTSUP);
	};
	FS.prototype.createReadStream = function createReadStream (path$$1, options) {
	    throw new ApiError(ErrorCode.ENOTSUP);
	};
	FS.prototype.createWriteStream = function createWriteStream (path$$1, options) {
	    throw new ApiError(ErrorCode.ENOTSUP);
	};
	/**
	 * For unit testing. Passes all incoming callbacks to cbWrapper for wrapping.
	 */
	FS.prototype.wrapCallbacks = function wrapCallbacks (cbWrapper) {
	    wrapCb = cbWrapper;
	};
	FS.prototype.getFdForFile = function getFdForFile (file) {
	    var fd = this.nextFd++;
	    this.fdMap[fd] = file;
	    return fd;
	};
	FS.prototype.fd2file = function fd2file (fd) {
	    var rv = this.fdMap[fd];
	    if (rv) {
	        return rv;
	    }
	    else {
	        throw new ApiError(ErrorCode.EBADF, 'Invalid file descriptor.');
	    }
	};
	FS.prototype.closeFd = function closeFd (fd) {
	    delete this.fdMap[fd];
	};
	
	/* tslint:disable:variable-name */
	// Exported fs.Stats.
	FS.Stats = Stats;
	
	// Manually export the individual public functions of fs.
	// Required because some code will invoke functions off of the module.
	// e.g.:
	// let writeFile = fs.writeFile;
	// writeFile(...)
	/**
	 * @hidden
	 */
	var fs = new FS();
	/**
	 * @hidden
	 */
	var _fsMock = {};
	/**
	 * @hidden
	 */
	var fsProto = FS.prototype;
	Object.keys(fsProto).forEach(function (key) {
	    if (typeof fs[key] === 'function') {
	        _fsMock[key] = function () {
	            return fs[key].apply(fs, arguments);
	        };
	    }
	    else {
	        _fsMock[key] = fs[key];
	    }
	});
	_fsMock['changeFSModule'] = function (newFs) {
	    fs = newFs;
	};
	_fsMock['getFSModule'] = function () {
	    return fs;
	};
	_fsMock['FS'] = FS;
	
	/*
	 * Levenshtein distance, from the `js-levenshtein` NPM module.
	 * Copied here to avoid complexity of adding another CommonJS module dependency.
	 */
	function _min(d0, d1, d2, bx, ay) {
	    return d0 < d1 || d2 < d1
	        ? d0 > d2
	            ? d2 + 1
	            : d0 + 1
	        : bx === ay
	            ? d1
	            : d1 + 1;
	}
	/**
	 * Calculates levenshtein distance.
	 * @param a
	 * @param b
	 */
	function levenshtein(a, b) {
	    if (a === b) {
	        return 0;
	    }
	    if (a.length > b.length) {
	        var tmp = a;
	        a = b;
	        b = tmp;
	    }
	    var la = a.length;
	    var lb = b.length;
	    while (la > 0 && (a.charCodeAt(la - 1) === b.charCodeAt(lb - 1))) {
	        la--;
	        lb--;
	    }
	    var offset = 0;
	    while (offset < la && (a.charCodeAt(offset) === b.charCodeAt(offset))) {
	        offset++;
	    }
	    la -= offset;
	    lb -= offset;
	    if (la === 0 || lb === 1) {
	        return lb;
	    }
	    var vector = new Array(la << 1);
	    for (var y = 0; y < la;) {
	        vector[la + y] = a.charCodeAt(offset + y);
	        vector[y] = ++y;
	    }
	    var x;
	    var d0;
	    var d1;
	    var d2;
	    var d3;
	    for (x = 0; (x + 3) < lb;) {
	        var bx0 = b.charCodeAt(offset + (d0 = x));
	        var bx1 = b.charCodeAt(offset + (d1 = x + 1));
	        var bx2 = b.charCodeAt(offset + (d2 = x + 2));
	        var bx3 = b.charCodeAt(offset + (d3 = x + 3));
	        var dd$1 = (x += 4);
	        for (var y$1 = 0; y$1 < la;) {
	            var ay = vector[la + y$1];
	            var dy = vector[y$1];
	            d0 = _min(dy, d0, d1, bx0, ay);
	            d1 = _min(d0, d1, d2, bx1, ay);
	            d2 = _min(d1, d2, d3, bx2, ay);
	            dd$1 = _min(d2, d3, dd$1, bx3, ay);
	            vector[y$1++] = dd$1;
	            d3 = d2;
	            d2 = d1;
	            d1 = d0;
	            d0 = dy;
	        }
	    }
	    var dd = 0;
	    for (; x < lb;) {
	        var bx0$1 = b.charCodeAt(offset + (d0 = x));
	        dd = ++x;
	        for (var y$2 = 0; y$2 < la; y$2++) {
	            var dy$1 = vector[y$2];
	            vector[y$2] = dd = dy$1 < d0 || dd < d0
	                ? dy$1 > dd ? dd + 1 : dy$1 + 1
	                : bx0$1 === vector[la + y$2]
	                    ? d0
	                    : d0 + 1;
	            d0 = dy$1;
	        }
	    }
	    return dd;
	}
	
	function deprecationMessage(print, fsName, opts) {
	    if (print) {
	        console.warn(("[" + fsName + "] Direct file system constructor usage is deprecated for this file system, and will be removed in the next major version. Please use the '" + fsName + ".Create(" + (JSON.stringify(opts)) + ", callback)' method instead. See https://github.com/jvilk/BrowserFS/issues/176 for more details."));
	    }
	}
	/**
	 * Checks for any IE version, including IE11 which removed MSIE from the
	 * userAgent string.
	 * @hidden
	 */
	var isIE = typeof navigator !== "undefined" && !!(/(msie) ([\w.]+)/.exec(navigator.userAgent.toLowerCase()) || navigator.userAgent.indexOf('Trident') !== -1);
	/**
	 * Check if we're in a web worker.
	 * @hidden
	 */
	var isWebWorker = typeof window === "undefined";
	/**
	 * Throws an exception. Called on code paths that should be impossible.
	 * @hidden
	 */
	function fail() {
	    throw new Error("BFS has reached an impossible code path; please file a bug.");
	}
	/**
	 * Synchronous recursive makedir.
	 * @hidden
	 */
	function mkdirpSync(p, mode, fs) {
	    if (!fs.existsSync(p)) {
	        mkdirpSync(path.dirname(p), mode, fs);
	        fs.mkdirSync(p, mode);
	    }
	}
	/**
	 * Converts a buffer into an array buffer. Attempts to do so in a
	 * zero-copy manner, e.g. the array references the same memory.
	 * @hidden
	 */
	function buffer2ArrayBuffer(buff) {
	    var u8 = buffer2Uint8array(buff), u8offset = u8.byteOffset, u8Len = u8.byteLength;
	    if (u8offset === 0 && u8Len === u8.buffer.byteLength) {
	        return u8.buffer;
	    }
	    else {
	        return u8.buffer.slice(u8offset, u8offset + u8Len);
	    }
	}
	/**
	 * Converts a buffer into a Uint8Array. Attempts to do so in a
	 * zero-copy manner, e.g. the array references the same memory.
	 * @hidden
	 */
	function buffer2Uint8array(buff) {
	    if (buff instanceof Uint8Array) {
	        // BFS & Node v4.0 buffers *are* Uint8Arrays.
	        return buff;
	    }
	    else {
	        // Uint8Arrays can be constructed from arrayish numbers.
	        // At this point, we assume this isn't a BFS array.
	        return new Uint8Array(buff);
	    }
	}
	/**
	 * Converts the given arrayish object into a Buffer. Attempts to
	 * be zero-copy.
	 * @hidden
	 */
	function arrayish2Buffer(arr) {
	    if (arr instanceof Buffer) {
	        return arr;
	    }
	    else if (arr instanceof Uint8Array) {
	        return uint8Array2Buffer(arr);
	    }
	    else {
	        return Buffer.from(arr);
	    }
	}
	/**
	 * Converts the given Uint8Array into a Buffer. Attempts to be zero-copy.
	 * @hidden
	 */
	function uint8Array2Buffer(u8) {
	    if (u8 instanceof Buffer) {
	        return u8;
	    }
	    else if (u8.byteOffset === 0 && u8.byteLength === u8.buffer.byteLength) {
	        return arrayBuffer2Buffer(u8.buffer);
	    }
	    else {
	        return Buffer.from(u8.buffer, u8.byteOffset, u8.byteLength);
	    }
	}
	/**
	 * Converts the given array buffer into a Buffer. Attempts to be
	 * zero-copy.
	 * @hidden
	 */
	function arrayBuffer2Buffer(ab) {
	    return Buffer.from(ab);
	}
	/**
	 * Copies a slice of the given buffer
	 * @hidden
	 */
	function copyingSlice(buff, start, end) {
	    if ( start === void 0 ) start = 0;
	    if ( end === void 0 ) end = buff.length;
	
	    if (start < 0 || end < 0 || end > buff.length || start > end) {
	        throw new TypeError(("Invalid slice bounds on buffer of length " + (buff.length) + ": [" + start + ", " + end + "]"));
	    }
	    if (buff.length === 0) {
	        // Avoid s0 corner case in ArrayBuffer case.
	        return emptyBuffer();
	    }
	    else {
	        var u8 = buffer2Uint8array(buff), s0 = buff[0], newS0 = (s0 + 1) % 0xFF;
	        buff[0] = newS0;
	        if (u8[0] === newS0) {
	            // Same memory. Revert & copy.
	            u8[0] = s0;
	            return uint8Array2Buffer(u8.slice(start, end));
	        }
	        else {
	            // Revert.
	            buff[0] = s0;
	            return uint8Array2Buffer(u8.subarray(start, end));
	        }
	    }
	}
	/**
	 * @hidden
	 */
	var emptyBuff = null;
	/**
	 * Returns an empty buffer.
	 * @hidden
	 */
	function emptyBuffer() {
	    if (emptyBuff) {
	        return emptyBuff;
	    }
	    return emptyBuff = Buffer.alloc(0);
	}
	/**
	 * Option validator for a Buffer file system option.
	 * @hidden
	 */
	function bufferValidator(v, cb) {
	    if (Buffer.isBuffer(v)) {
	        cb();
	    }
	    else {
	        cb(new ApiError(ErrorCode.EINVAL, "option must be a Buffer."));
	    }
	}
	/**
	 * Checks that the given options object is valid for the file system options.
	 * @hidden
	 */
	function checkOptions(fsType, opts, cb) {
	    var optsInfo = fsType.Options;
	    var fsName = fsType.Name;
	    var pendingValidators = 0;
	    var callbackCalled = false;
	    var loopEnded = false;
	    function validatorCallback(e) {
	        if (!callbackCalled) {
	            if (e) {
	                callbackCalled = true;
	                cb(e);
	            }
	            pendingValidators--;
	            if (pendingValidators === 0 && loopEnded) {
	                cb();
	            }
	        }
	    }
	    // Check for required options.
	    var loop = function ( optName ) {
	        if (optsInfo.hasOwnProperty(optName)) {
	            var opt = optsInfo[optName];
	            var providedValue = opts[optName];
	            if (providedValue === undefined || providedValue === null) {
	                if (!opt.optional) {
	                    // Required option, not provided.
	                    // Any incorrect options provided? Which ones are close to the provided one?
	                    // (edit distance 5 === close)
	                    var incorrectOptions = Object.keys(opts).filter(function (o) { return !(o in optsInfo); }).map(function (a) {
	                        return { str: a, distance: levenshtein(optName, a) };
	                    }).filter(function (o) { return o.distance < 5; }).sort(function (a, b) { return a.distance - b.distance; });
	                    // Validators may be synchronous.
	                    if (callbackCalled) {
	                        return {};
	                    }
	                    callbackCalled = true;
	                    return { v: cb(new ApiError(ErrorCode.EINVAL, ("[" + fsName + "] Required option '" + optName + "' not provided." + (incorrectOptions.length > 0 ? (" You provided unrecognized option '" + (incorrectOptions[0].str) + "'; perhaps you meant to type '" + optName + "'.") : '') + "\nOption description: " + (opt.description)))) };
	                }
	                // Else: Optional option, not provided. That is OK.
	            }
	            else {
	                // Option provided! Check type.
	                var typeMatches = false;
	                if (Array.isArray(opt.type)) {
	                    typeMatches = opt.type.indexOf(typeof (providedValue)) !== -1;
	                }
	                else {
	                    typeMatches = typeof (providedValue) === opt.type;
	                }
	                if (!typeMatches) {
	                    // Validators may be synchronous.
	                    if (callbackCalled) {
	                        return {};
	                    }
	                    callbackCalled = true;
	                    return { v: cb(new ApiError(ErrorCode.EINVAL, ("[" + fsName + "] Value provided for option " + optName + " is not the proper type. Expected " + (Array.isArray(opt.type) ? ("one of {" + (opt.type.join(", ")) + "}") : opt.type) + ", but received " + (typeof (providedValue)) + "\nOption description: " + (opt.description)))) };
	                }
	                else if (opt.validator) {
	                    pendingValidators++;
	                    opt.validator(providedValue, validatorCallback);
	                }
	                // Otherwise: All good!
	            }
	        }
	    };
	
	    for (var optName in optsInfo) {
	        var returned = loop( optName );
	
	        if ( returned ) return returned.v;
	    }
	    loopEnded = true;
	    if (pendingValidators === 0 && !callbackCalled) {
	        cb();
	    }
	}
	
	
	var BFSUtils = Object.freeze({
		deprecationMessage: deprecationMessage,
		isIE: isIE,
		isWebWorker: isWebWorker,
		fail: fail,
		mkdirpSync: mkdirpSync,
		buffer2ArrayBuffer: buffer2ArrayBuffer,
		buffer2Uint8array: buffer2Uint8array,
		arrayish2Buffer: arrayish2Buffer,
		uint8Array2Buffer: uint8Array2Buffer,
		arrayBuffer2Buffer: arrayBuffer2Buffer,
		copyingSlice: copyingSlice,
		emptyBuffer: emptyBuffer,
		bufferValidator: bufferValidator,
		checkOptions: checkOptions
	});
	
	var BFSEmscriptenStreamOps = function BFSEmscriptenStreamOps(fs) {
	    this.fs = fs;
	    this.nodefs = fs.getNodeFS();
	    this.FS = fs.getFS();
	    this.PATH = fs.getPATH();
	    this.ERRNO_CODES = fs.getERRNO_CODES();
	};
	BFSEmscriptenStreamOps.prototype.open = function open (stream) {
	    var path$$1 = this.fs.realPath(stream.node);
	    var FS = this.FS;
	    try {
	        if (FS.isFile(stream.node.mode)) {
	            stream.nfd = this.nodefs.openSync(path$$1, this.fs.flagsToPermissionString(stream.flags));
	        }
	    }
	    catch (e) {
	        if (!e.code) {
	            throw e;
	        }
	        throw new FS.ErrnoError(this.ERRNO_CODES[e.code]);
	    }
	};
	BFSEmscriptenStreamOps.prototype.close = function close (stream) {
	    var FS = this.FS;
	    try {
	        if (FS.isFile(stream.node.mode) && stream.nfd) {
	            this.nodefs.closeSync(stream.nfd);
	        }
	    }
	    catch (e) {
	        if (!e.code) {
	            throw e;
	        }
	        throw new FS.ErrnoError(this.ERRNO_CODES[e.code]);
	    }
	};
	BFSEmscriptenStreamOps.prototype.read = function read (stream, buffer$$1, offset, length, position) {
	    // Avoid copying overhead by reading directly into buffer.
	    try {
	        return this.nodefs.readSync(stream.nfd, uint8Array2Buffer(buffer$$1), offset, length, position);
	    }
	    catch (e) {
	        throw new this.FS.ErrnoError(this.ERRNO_CODES[e.code]);
	    }
	};
	BFSEmscriptenStreamOps.prototype.write = function write (stream, buffer$$1, offset, length, position) {
	    // Avoid copying overhead.
	    try {
	        return this.nodefs.writeSync(stream.nfd, uint8Array2Buffer(buffer$$1), offset, length, position);
	    }
	    catch (e) {
	        throw new this.FS.ErrnoError(this.ERRNO_CODES[e.code]);
	    }
	};
	BFSEmscriptenStreamOps.prototype.llseek = function llseek (stream, offset, whence) {
	    var position = offset;
	    if (whence === 1) {
	        position += stream.position;
	    }
	    else if (whence === 2) {
	        if (this.FS.isFile(stream.node.mode)) {
	            try {
	                var stat = this.nodefs.fstatSync(stream.nfd);
	                position += stat.size;
	            }
	            catch (e) {
	                throw new this.FS.ErrnoError(this.ERRNO_CODES[e.code]);
	            }
	        }
	    }
	    if (position < 0) {
	        throw new this.FS.ErrnoError(this.ERRNO_CODES.EINVAL);
	    }
	    stream.position = position;
	    return position;
	};
	var BFSEmscriptenNodeOps = function BFSEmscriptenNodeOps(fs) {
	    this.fs = fs;
	    this.nodefs = fs.getNodeFS();
	    this.FS = fs.getFS();
	    this.PATH = fs.getPATH();
	    this.ERRNO_CODES = fs.getERRNO_CODES();
	};
	BFSEmscriptenNodeOps.prototype.getattr = function getattr (node) {
	    var path$$1 = this.fs.realPath(node);
	    var stat;
	    try {
	        stat = this.nodefs.lstatSync(path$$1);
	    }
	    catch (e) {
	        if (!e.code) {
	            throw e;
	        }
	        throw new this.FS.ErrnoError(this.ERRNO_CODES[e.code]);
	    }
	    return {
	        dev: stat.dev,
	        ino: stat.ino,
	        mode: stat.mode,
	        nlink: stat.nlink,
	        uid: stat.uid,
	        gid: stat.gid,
	        rdev: stat.rdev,
	        size: stat.size,
	        atime: stat.atime,
	        mtime: stat.mtime,
	        ctime: stat.ctime,
	        blksize: stat.blksize,
	        blocks: stat.blocks
	    };
	};
	BFSEmscriptenNodeOps.prototype.setattr = function setattr (node, attr) {
	    var path$$1 = this.fs.realPath(node);
	    try {
	        if (attr.mode !== undefined) {
	            this.nodefs.chmodSync(path$$1, attr.mode);
	            // update the common node structure mode as well
	            node.mode = attr.mode;
	        }
	        if (attr.timestamp !== undefined) {
	            var date = new Date(attr.timestamp);
	            this.nodefs.utimesSync(path$$1, date, date);
	        }
	    }
	    catch (e) {
	        if (!e.code) {
	            throw e;
	        }
	        // Ignore not supported errors. Emscripten does utimesSync when it
	        // writes files, but never really requires the value to be set.
	        if (e.code !== "ENOTSUP") {
	            throw new this.FS.ErrnoError(this.ERRNO_CODES[e.code]);
	        }
	    }
	    if (attr.size !== undefined) {
	        try {
	            this.nodefs.truncateSync(path$$1, attr.size);
	        }
	        catch (e) {
	            if (!e.code) {
	                throw e;
	            }
	            throw new this.FS.ErrnoError(this.ERRNO_CODES[e.code]);
	        }
	    }
	};
	BFSEmscriptenNodeOps.prototype.lookup = function lookup (parent, name) {
	    var path$$1 = this.PATH.join2(this.fs.realPath(parent), name);
	    var mode = this.fs.getMode(path$$1);
	    return this.fs.createNode(parent, name, mode);
	};
	BFSEmscriptenNodeOps.prototype.mknod = function mknod (parent, name, mode, dev) {
	    var node = this.fs.createNode(parent, name, mode, dev);
	    // create the backing node for this in the fs root as well
	    var path$$1 = this.fs.realPath(node);
	    try {
	        if (this.FS.isDir(node.mode)) {
	            this.nodefs.mkdirSync(path$$1, node.mode);
	        }
	        else {
	            this.nodefs.writeFileSync(path$$1, '', { mode: node.mode });
	        }
	    }
	    catch (e) {
	        if (!e.code) {
	            throw e;
	        }
	        throw new this.FS.ErrnoError(this.ERRNO_CODES[e.code]);
	    }
	    return node;
	};
	BFSEmscriptenNodeOps.prototype.rename = function rename (oldNode, newDir, newName) {
	    var oldPath = this.fs.realPath(oldNode);
	    var newPath = this.PATH.join2(this.fs.realPath(newDir), newName);
	    try {
	        this.nodefs.renameSync(oldPath, newPath);
	        // This logic is missing from the original NodeFS,
	        // causing Emscripten's filesystem to think that the old file still exists.
	        oldNode.name = newName;
	        oldNode.parent = newDir;
	    }
	    catch (e) {
	        if (!e.code) {
	            throw e;
	        }
	        throw new this.FS.ErrnoError(this.ERRNO_CODES[e.code]);
	    }
	};
	BFSEmscriptenNodeOps.prototype.unlink = function unlink (parent, name) {
	    var path$$1 = this.PATH.join2(this.fs.realPath(parent), name);
	    try {
	        this.nodefs.unlinkSync(path$$1);
	    }
	    catch (e) {
	        if (!e.code) {
	            throw e;
	        }
	        throw new this.FS.ErrnoError(this.ERRNO_CODES[e.code]);
	    }
	};
	BFSEmscriptenNodeOps.prototype.rmdir = function rmdir (parent, name) {
	    var path$$1 = this.PATH.join2(this.fs.realPath(parent), name);
	    try {
	        this.nodefs.rmdirSync(path$$1);
	    }
	    catch (e) {
	        if (!e.code) {
	            throw e;
	        }
	        throw new this.FS.ErrnoError(this.ERRNO_CODES[e.code]);
	    }
	};
	BFSEmscriptenNodeOps.prototype.readdir = function readdir (node) {
	    var path$$1 = this.fs.realPath(node);
	    try {
	        // Node does not list . and .. in directory listings,
	        // but Emscripten expects it.
	        var contents = this.nodefs.readdirSync(path$$1);
	        contents.push('.', '..');
	        return contents;
	    }
	    catch (e) {
	        if (!e.code) {
	            throw e;
	        }
	        throw new this.FS.ErrnoError(this.ERRNO_CODES[e.code]);
	    }
	};
	BFSEmscriptenNodeOps.prototype.symlink = function symlink (parent, newName, oldPath) {
	    var newPath = this.PATH.join2(this.fs.realPath(parent), newName);
	    try {
	        this.nodefs.symlinkSync(oldPath, newPath);
	    }
	    catch (e) {
	        if (!e.code) {
	            throw e;
	        }
	        throw new this.FS.ErrnoError(this.ERRNO_CODES[e.code]);
	    }
	};
	BFSEmscriptenNodeOps.prototype.readlink = function readlink (node) {
	    var path$$1 = this.fs.realPath(node);
	    try {
	        return this.nodefs.readlinkSync(path$$1);
	    }
	    catch (e) {
	        if (!e.code) {
	            throw e;
	        }
	        throw new this.FS.ErrnoError(this.ERRNO_CODES[e.code]);
	    }
	};
	var BFSEmscriptenFS = function BFSEmscriptenFS(_FS, _PATH, _ERRNO_CODES, nodefs) {
	    if ( _FS === void 0 ) _FS = self['FS'];
	    if ( _PATH === void 0 ) _PATH = self['PATH'];
	    if ( _ERRNO_CODES === void 0 ) _ERRNO_CODES = self['ERRNO_CODES'];
	    if ( nodefs === void 0 ) nodefs = _fsMock;
	
	    // This maps the integer permission modes from http://linux.die.net/man/3/open
	    // to node.js-specific file open permission strings at http://nodejs.org/api/fs.html#fs_fs_open_path_flags_mode_callback
	    this.flagsToPermissionStringMap = {
	        0 /*O_RDONLY*/: 'r',
	        1 /*O_WRONLY*/: 'r+',
	        2 /*O_RDWR*/: 'r+',
	        64 /*O_CREAT*/: 'r',
	        65 /*O_WRONLY|O_CREAT*/: 'r+',
	        66 /*O_RDWR|O_CREAT*/: 'r+',
	        129 /*O_WRONLY|O_EXCL*/: 'rx+',
	        193 /*O_WRONLY|O_CREAT|O_EXCL*/: 'rx+',
	        514 /*O_RDWR|O_TRUNC*/: 'w+',
	        577 /*O_WRONLY|O_CREAT|O_TRUNC*/: 'w',
	        578 /*O_CREAT|O_RDWR|O_TRUNC*/: 'w+',
	        705 /*O_WRONLY|O_CREAT|O_EXCL|O_TRUNC*/: 'wx',
	        706 /*O_RDWR|O_CREAT|O_EXCL|O_TRUNC*/: 'wx+',
	        1024 /*O_APPEND*/: 'a',
	        1025 /*O_WRONLY|O_APPEND*/: 'a',
	        1026 /*O_RDWR|O_APPEND*/: 'a+',
	        1089 /*O_WRONLY|O_CREAT|O_APPEND*/: 'a',
	        1090 /*O_RDWR|O_CREAT|O_APPEND*/: 'a+',
	        1153 /*O_WRONLY|O_EXCL|O_APPEND*/: 'ax',
	        1154 /*O_RDWR|O_EXCL|O_APPEND*/: 'ax+',
	        1217 /*O_WRONLY|O_CREAT|O_EXCL|O_APPEND*/: 'ax',
	        1218 /*O_RDWR|O_CREAT|O_EXCL|O_APPEND*/: 'ax+',
	        4096 /*O_RDONLY|O_DSYNC*/: 'rs',
	        4098 /*O_RDWR|O_DSYNC*/: 'rs+'
	    };
	    this.nodefs = nodefs;
	    this.FS = _FS;
	    this.PATH = _PATH;
	    this.ERRNO_CODES = _ERRNO_CODES;
	    this.node_ops = new BFSEmscriptenNodeOps(this);
	    this.stream_ops = new BFSEmscriptenStreamOps(this);
	};
	BFSEmscriptenFS.prototype.mount = function mount (m) {
	    return this.createNode(null, '/', this.getMode(m.opts.root), 0);
	};
	BFSEmscriptenFS.prototype.createNode = function createNode (parent, name, mode, dev) {
	    var FS = this.FS;
	    if (!FS.isDir(mode) && !FS.isFile(mode) && !FS.isLink(mode)) {
	        throw new FS.ErrnoError(this.ERRNO_CODES.EINVAL);
	    }
	    var node = FS.createNode(parent, name, mode);
	    node.node_ops = this.node_ops;
	    node.stream_ops = this.stream_ops;
	    return node;
	};
	BFSEmscriptenFS.prototype.getMode = function getMode (path$$1) {
	    var stat;
	    try {
	        stat = this.nodefs.lstatSync(path$$1);
	    }
	    catch (e) {
	        if (!e.code) {
	            throw e;
	        }
	        throw new this.FS.ErrnoError(this.ERRNO_CODES[e.code]);
	    }
	    return stat.mode;
	};
	BFSEmscriptenFS.prototype.realPath = function realPath (node) {
	    var parts = [];
	    while (node.parent !== node) {
	        parts.push(node.name);
	        node = node.parent;
	    }
	    parts.push(node.mount.opts.root);
	    parts.reverse();
	    return this.PATH.join.apply(null, parts);
	};
	BFSEmscriptenFS.prototype.flagsToPermissionString = function flagsToPermissionString (flags) {
	    var parsedFlags = (typeof flags === "string") ? parseInt(flags, 10) : flags;
	    parsedFlags &= 0x1FFF;
	    if (parsedFlags in this.flagsToPermissionStringMap) {
	        return this.flagsToPermissionStringMap[parsedFlags];
	    }
	    else {
	        return flags;
	    }
	};
	BFSEmscriptenFS.prototype.getNodeFS = function getNodeFS () {
	    return this.nodefs;
	};
	BFSEmscriptenFS.prototype.getFS = function getFS () {
	    return this.FS;
	};
	BFSEmscriptenFS.prototype.getPATH = function getPATH () {
	    return this.PATH;
	};
	BFSEmscriptenFS.prototype.getERRNO_CODES = function getERRNO_CODES () {
	    return this.ERRNO_CODES;
	};
	
	/**
	 * Basic filesystem class. Most filesystems should extend this class, as it
	 * provides default implementations for a handful of methods.
	 */
	var BaseFileSystem = function BaseFileSystem () {};
	
	BaseFileSystem.prototype.supportsLinks = function supportsLinks () {
	    return false;
	};
	BaseFileSystem.prototype.diskSpace = function diskSpace (p, cb) {
	    cb(0, 0);
	};
	/**
	 * Opens the file at path p with the given flag. The file must exist.
	 * @param p The path to open.
	 * @param flag The flag to use when opening the file.
	 */
	BaseFileSystem.prototype.openFile = function openFile (p, flag, cb) {
	    throw new ApiError(ErrorCode.ENOTSUP);
	};
	/**
	 * Create the file at path p with the given mode. Then, open it with the given
	 * flag.
	 */
	BaseFileSystem.prototype.createFile = function createFile (p, flag, mode, cb) {
	    throw new ApiError(ErrorCode.ENOTSUP);
	};
	BaseFileSystem.prototype.open = function open (p, flag, mode, cb) {
	        var this$1 = this;
	
	    var mustBeFile = function (e, stats) {
	        if (e) {
	            // File does not exist.
	            switch (flag.pathNotExistsAction()) {
	                case ActionType.CREATE_FILE:
	                    // Ensure parent exists.
	                    return this$1.stat(path.dirname(p), false, function (e, parentStats) {
	                        if (e) {
	                            cb(e);
	                        }
	                        else if (parentStats && !parentStats.isDirectory()) {
	                            cb(ApiError.ENOTDIR(path.dirname(p)));
	                        }
	                        else {
	                            this$1.createFile(p, flag, mode, cb);
	                        }
	                    });
	                case ActionType.THROW_EXCEPTION:
	                    return cb(ApiError.ENOENT(p));
	                default:
	                    return cb(new ApiError(ErrorCode.EINVAL, 'Invalid FileFlag object.'));
	            }
	        }
	        else {
	            // File exists.
	            if (stats && stats.isDirectory()) {
	                return cb(ApiError.EISDIR(p));
	            }
	            switch (flag.pathExistsAction()) {
	                case ActionType.THROW_EXCEPTION:
	                    return cb(ApiError.EEXIST(p));
	                case ActionType.TRUNCATE_FILE:
	                    // NOTE: In a previous implementation, we deleted the file and
	                    // re-created it. However, this created a race condition if another
	                    // asynchronous request was trying to read the file, as the file
	                    // would not exist for a small period of time.
	                    return this$1.openFile(p, flag, function (e, fd) {
	                        if (e) {
	                            cb(e);
	                        }
	                        else if (fd) {
	                            fd.truncate(0, function () {
	                                fd.sync(function () {
	                                    cb(null, fd);
	                                });
	                            });
	                        }
	                        else {
	                            fail();
	                        }
	                    });
	                case ActionType.NOP:
	                    return this$1.openFile(p, flag, cb);
	                default:
	                    return cb(new ApiError(ErrorCode.EINVAL, 'Invalid FileFlag object.'));
	            }
	        }
	    };
	    this.stat(p, false, mustBeFile);
	};
	BaseFileSystem.prototype.rename = function rename (oldPath, newPath, cb) {
	    cb(new ApiError(ErrorCode.ENOTSUP));
	};
	BaseFileSystem.prototype.renameSync = function renameSync (oldPath, newPath) {
	    throw new ApiError(ErrorCode.ENOTSUP);
	};
	BaseFileSystem.prototype.stat = function stat (p, isLstat, cb) {
	    cb(new ApiError(ErrorCode.ENOTSUP));
	};
	BaseFileSystem.prototype.statSync = function statSync (p, isLstat) {
	    throw new ApiError(ErrorCode.ENOTSUP);
	};
	/**
	 * Opens the file at path p with the given flag. The file must exist.
	 * @param p The path to open.
	 * @param flag The flag to use when opening the file.
	 * @return A File object corresponding to the opened file.
	 */
	BaseFileSystem.prototype.openFileSync = function openFileSync (p, flag, mode) {
	    throw new ApiError(ErrorCode.ENOTSUP);
	};
	/**
	 * Create the file at path p with the given mode. Then, open it with the given
	 * flag.
	 */
	BaseFileSystem.prototype.createFileSync = function createFileSync (p, flag, mode) {
	    throw new ApiError(ErrorCode.ENOTSUP);
	};
	BaseFileSystem.prototype.openSync = function openSync (p, flag, mode) {
	    // Check if the path exists, and is a file.
	    var stats;
	    try {
	        stats = this.statSync(p, false);
	    }
	    catch (e) {
	        // File does not exist.
	        switch (flag.pathNotExistsAction()) {
	            case ActionType.CREATE_FILE:
	                // Ensure parent exists.
	                var parentStats = this.statSync(path.dirname(p), false);
	                if (!parentStats.isDirectory()) {
	                    throw ApiError.ENOTDIR(path.dirname(p));
	                }
	                return this.createFileSync(p, flag, mode);
	            case ActionType.THROW_EXCEPTION:
	                throw ApiError.ENOENT(p);
	            default:
	                throw new ApiError(ErrorCode.EINVAL, 'Invalid FileFlag object.');
	        }
	    }
	    // File exists.
	    if (stats.isDirectory()) {
	        throw ApiError.EISDIR(p);
	    }
	    switch (flag.pathExistsAction()) {
	        case ActionType.THROW_EXCEPTION:
	            throw ApiError.EEXIST(p);
	        case ActionType.TRUNCATE_FILE:
	            // Delete file.
	            this.unlinkSync(p);
	            // Create file. Use the same mode as the old file.
	            // Node itself modifies the ctime when this occurs, so this action
	            // will preserve that behavior if the underlying file system
	            // supports those properties.
	            return this.createFileSync(p, flag, stats.mode);
	        case ActionType.NOP:
	            return this.openFileSync(p, flag, mode);
	        default:
	            throw new ApiError(ErrorCode.EINVAL, 'Invalid FileFlag object.');
	    }
	};
	BaseFileSystem.prototype.unlink = function unlink (p, cb) {
	    cb(new ApiError(ErrorCode.ENOTSUP));
	};
	BaseFileSystem.prototype.unlinkSync = function unlinkSync (p) {
	    throw new ApiError(ErrorCode.ENOTSUP);
	};
	BaseFileSystem.prototype.rmdir = function rmdir (p, cb) {
	    cb(new ApiError(ErrorCode.ENOTSUP));
	};
	BaseFileSystem.prototype.rmdirSync = function rmdirSync (p) {
	    throw new ApiError(ErrorCode.ENOTSUP);
	};
	BaseFileSystem.prototype.mkdir = function mkdir (p, mode, cb) {
	    cb(new ApiError(ErrorCode.ENOTSUP));
	};
	BaseFileSystem.prototype.mkdirSync = function mkdirSync (p, mode) {
	    throw new ApiError(ErrorCode.ENOTSUP);
	};
	BaseFileSystem.prototype.readdir = function readdir (p, cb) {
	    cb(new ApiError(ErrorCode.ENOTSUP));
	};
	BaseFileSystem.prototype.readdirSync = function readdirSync (p) {
	    throw new ApiError(ErrorCode.ENOTSUP);
	};
	BaseFileSystem.prototype.exists = function exists (p, cb) {
	    this.stat(p, null, function (err) {
	        cb(!err);
	    });
	};
	BaseFileSystem.prototype.existsSync = function existsSync (p) {
	    try {
	        this.statSync(p, true);
	        return true;
	    }
	    catch (e) {
	        return false;
	    }
	};
	BaseFileSystem.prototype.realpath = function realpath (p, cache, cb) {
	    if (this.supportsLinks()) {
	        // The path could contain symlinks. Split up the path,
	        // resolve any symlinks, return the resolved string.
	        var splitPath = p.split(path.sep);
	        // TODO: Simpler to just pass through file, find sep and such.
	        for (var i = 0; i < splitPath.length; i++) {
	            var addPaths = splitPath.slice(0, i + 1);
	            splitPath[i] = path.join.apply(null, addPaths);
	        }
	    }
	    else {
	        // No symlinks. We just need to verify that it exists.
	        this.exists(p, function (doesExist) {
	            if (doesExist) {
	                cb(null, p);
	            }
	            else {
	                cb(ApiError.ENOENT(p));
	            }
	        });
	    }
	};
	BaseFileSystem.prototype.realpathSync = function realpathSync (p, cache) {
	    if (this.supportsLinks()) {
	        // The path could contain symlinks. Split up the path,
	        // resolve any symlinks, return the resolved string.
	        var splitPath = p.split(path.sep);
	        // TODO: Simpler to just pass through file, find sep and such.
	        for (var i = 0; i < splitPath.length; i++) {
	            var addPaths = splitPath.slice(0, i + 1);
	            splitPath[i] = path.join.apply(path, addPaths);
	        }
	        return splitPath.join(path.sep);
	    }
	    else {
	        // No symlinks. We just need to verify that it exists.
	        if (this.existsSync(p)) {
	            return p;
	        }
	        else {
	            throw ApiError.ENOENT(p);
	        }
	    }
	};
	BaseFileSystem.prototype.truncate = function truncate (p, len, cb) {
	    this.open(p, FileFlag.getFileFlag('r+'), 0x1a4, (function (er, fd) {
	        if (er) {
	            return cb(er);
	        }
	        fd.truncate(len, (function (er) {
	            fd.close((function (er2) {
	                cb(er || er2);
	            }));
	        }));
	    }));
	};
	BaseFileSystem.prototype.truncateSync = function truncateSync (p, len) {
	    var fd = this.openSync(p, FileFlag.getFileFlag('r+'), 0x1a4);
	    // Need to safely close FD, regardless of whether or not truncate succeeds.
	    try {
	        fd.truncateSync(len);
	    }
	    catch (e) {
	        throw e;
	    }
	    finally {
	        fd.closeSync();
	    }
	};
	BaseFileSystem.prototype.readFile = function readFile (fname, encoding, flag, cb) {
	    // Wrap cb in file closing code.
	    var oldCb = cb;
	    // Get file.
	    this.open(fname, flag, 0x1a4, function (err, fd) {
	        if (err) {
	            return cb(err);
	        }
	        cb = function (err, arg) {
	            fd.close(function (err2) {
	                if (!err) {
	                    err = err2;
	                }
	                return oldCb(err, arg);
	            });
	        };
	        fd.stat(function (err, stat) {
	            if (err) {
	                return cb(err);
	            }
	            // Allocate buffer.
	            var buf = Buffer.alloc(stat.size);
	            fd.read(buf, 0, stat.size, 0, function (err) {
	                if (err) {
	                    return cb(err);
	                }
	                else if (encoding === null) {
	                    return cb(err, buf);
	                }
	                try {
	                    cb(null, buf.toString(encoding));
	                }
	                catch (e) {
	                    cb(e);
	                }
	            });
	        });
	    });
	};
	BaseFileSystem.prototype.readFileSync = function readFileSync (fname, encoding, flag) {
	    // Get file.
	    var fd = this.openSync(fname, flag, 0x1a4);
	    try {
	        var stat = fd.statSync();
	        // Allocate buffer.
	        var buf = Buffer.alloc(stat.size);
	        fd.readSync(buf, 0, stat.size, 0);
	        fd.closeSync();
	        if (encoding === null) {
	            return buf;
	        }
	        return buf.toString(encoding);
	    }
	    finally {
	        fd.closeSync();
	    }
	};
	BaseFileSystem.prototype.writeFile = function writeFile (fname, data, encoding, flag, mode, cb) {
	    // Wrap cb in file closing code.
	    var oldCb = cb;
	    // Get file.
	    this.open(fname, flag, 0x1a4, function (err, fd) {
	        if (err) {
	            return cb(err);
	        }
	        cb = function (err) {
	            fd.close(function (err2) {
	                oldCb(err ? err : err2);
	            });
	        };
	        try {
	            if (typeof data === 'string') {
	                data = Buffer.from(data, encoding);
	            }
	        }
	        catch (e) {
	            return cb(e);
	        }
	        // Write into file.
	        fd.write(data, 0, data.length, 0, cb);
	    });
	};
	BaseFileSystem.prototype.writeFileSync = function writeFileSync (fname, data, encoding, flag, mode) {
	    // Get file.
	    var fd = this.openSync(fname, flag, mode);
	    try {
	        if (typeof data === 'string') {
	            data = Buffer.from(data, encoding);
	        }
	        // Write into file.
	        fd.writeSync(data, 0, data.length, 0);
	    }
	    finally {
	        fd.closeSync();
	    }
	};
	BaseFileSystem.prototype.appendFile = function appendFile (fname, data, encoding, flag, mode, cb) {
	    // Wrap cb in file closing code.
	    var oldCb = cb;
	    this.open(fname, flag, mode, function (err, fd) {
	        if (err) {
	            return cb(err);
	        }
	        cb = function (err) {
	            fd.close(function (err2) {
	                oldCb(err ? err : err2);
	            });
	        };
	        if (typeof data === 'string') {
	            data = Buffer.from(data, encoding);
	        }
	        fd.write(data, 0, data.length, null, cb);
	    });
	};
	BaseFileSystem.prototype.appendFileSync = function appendFileSync (fname, data, encoding, flag, mode) {
	    var fd = this.openSync(fname, flag, mode);
	    try {
	        if (typeof data === 'string') {
	            data = Buffer.from(data, encoding);
	        }
	        fd.writeSync(data, 0, data.length, null);
	    }
	    finally {
	        fd.closeSync();
	    }
	};
	BaseFileSystem.prototype.chmod = function chmod (p, isLchmod, mode, cb) {
	    cb(new ApiError(ErrorCode.ENOTSUP));
	};
	BaseFileSystem.prototype.chmodSync = function chmodSync (p, isLchmod, mode) {
	    throw new ApiError(ErrorCode.ENOTSUP);
	};
	BaseFileSystem.prototype.chown = function chown (p, isLchown, uid, gid, cb) {
	    cb(new ApiError(ErrorCode.ENOTSUP));
	};
	BaseFileSystem.prototype.chownSync = function chownSync (p, isLchown, uid, gid) {
	    throw new ApiError(ErrorCode.ENOTSUP);
	};
	BaseFileSystem.prototype.utimes = function utimes (p, atime, mtime, cb) {
	    cb(new ApiError(ErrorCode.ENOTSUP));
	};
	BaseFileSystem.prototype.utimesSync = function utimesSync (p, atime, mtime) {
	    throw new ApiError(ErrorCode.ENOTSUP);
	};
	BaseFileSystem.prototype.link = function link (srcpath, dstpath, cb) {
	    cb(new ApiError(ErrorCode.ENOTSUP));
	};
	BaseFileSystem.prototype.linkSync = function linkSync (srcpath, dstpath) {
	    throw new ApiError(ErrorCode.ENOTSUP);
	};
	BaseFileSystem.prototype.symlink = function symlink (srcpath, dstpath, type, cb) {
	    cb(new ApiError(ErrorCode.ENOTSUP));
	};
	BaseFileSystem.prototype.symlinkSync = function symlinkSync (srcpath, dstpath, type) {
	    throw new ApiError(ErrorCode.ENOTSUP);
	};
	BaseFileSystem.prototype.readlink = function readlink (p, cb) {
	    cb(new ApiError(ErrorCode.ENOTSUP));
	};
	BaseFileSystem.prototype.readlinkSync = function readlinkSync (p) {
	    throw new ApiError(ErrorCode.ENOTSUP);
	};
	/**
	 * Implements the asynchronous API in terms of the synchronous API.
	 * @class SynchronousFileSystem
	 */
	var SynchronousFileSystem = (function (BaseFileSystem) {
	    function SynchronousFileSystem () {
	        BaseFileSystem.apply(this, arguments);
	    }
	
	    if ( BaseFileSystem ) SynchronousFileSystem.__proto__ = BaseFileSystem;
	    SynchronousFileSystem.prototype = Object.create( BaseFileSystem && BaseFileSystem.prototype );
	    SynchronousFileSystem.prototype.constructor = SynchronousFileSystem;
	
	    SynchronousFileSystem.prototype.supportsSynch = function supportsSynch () {
	        return true;
	    };
	    SynchronousFileSystem.prototype.rename = function rename (oldPath, newPath, cb) {
	        try {
	            this.renameSync(oldPath, newPath);
	            cb();
	        }
	        catch (e) {
	            cb(e);
	        }
	    };
	    SynchronousFileSystem.prototype.stat = function stat (p, isLstat, cb) {
	        try {
	            cb(null, this.statSync(p, isLstat));
	        }
	        catch (e) {
	            cb(e);
	        }
	    };
	    SynchronousFileSystem.prototype.open = function open (p, flags, mode, cb) {
	        try {
	            cb(null, this.openSync(p, flags, mode));
	        }
	        catch (e) {
	            cb(e);
	        }
	    };
	    SynchronousFileSystem.prototype.unlink = function unlink (p, cb) {
	        try {
	            this.unlinkSync(p);
	            cb();
	        }
	        catch (e) {
	            cb(e);
	        }
	    };
	    SynchronousFileSystem.prototype.rmdir = function rmdir (p, cb) {
	        try {
	            this.rmdirSync(p);
	            cb();
	        }
	        catch (e) {
	            cb(e);
	        }
	    };
	    SynchronousFileSystem.prototype.mkdir = function mkdir (p, mode, cb) {
	        try {
	            this.mkdirSync(p, mode);
	            cb();
	        }
	        catch (e) {
	            cb(e);
	        }
	    };
	    SynchronousFileSystem.prototype.readdir = function readdir (p, cb) {
	        try {
	            cb(null, this.readdirSync(p));
	        }
	        catch (e) {
	            cb(e);
	        }
	    };
	    SynchronousFileSystem.prototype.chmod = function chmod (p, isLchmod, mode, cb) {
	        try {
	            this.chmodSync(p, isLchmod, mode);
	            cb();
	        }
	        catch (e) {
	            cb(e);
	        }
	    };
	    SynchronousFileSystem.prototype.chown = function chown (p, isLchown, uid, gid, cb) {
	        try {
	            this.chownSync(p, isLchown, uid, gid);
	            cb();
	        }
	        catch (e) {
	            cb(e);
	        }
	    };
	    SynchronousFileSystem.prototype.utimes = function utimes (p, atime, mtime, cb) {
	        try {
	            this.utimesSync(p, atime, mtime);
	            cb();
	        }
	        catch (e) {
	            cb(e);
	        }
	    };
	    SynchronousFileSystem.prototype.link = function link (srcpath, dstpath, cb) {
	        try {
	            this.linkSync(srcpath, dstpath);
	            cb();
	        }
	        catch (e) {
	            cb(e);
	        }
	    };
	    SynchronousFileSystem.prototype.symlink = function symlink (srcpath, dstpath, type, cb) {
	        try {
	            this.symlinkSync(srcpath, dstpath, type);
	            cb();
	        }
	        catch (e) {
	            cb(e);
	        }
	    };
	    SynchronousFileSystem.prototype.readlink = function readlink (p, cb) {
	        try {
	            cb(null, this.readlinkSync(p));
	        }
	        catch (e) {
	            cb(e);
	        }
	    };
	
	    return SynchronousFileSystem;
	}(BaseFileSystem));
	
	/**
	 * Base class that contains shared implementations of functions for the file
	 * object.
	 */
	var BaseFile = function BaseFile () {};
	
	BaseFile.prototype.sync = function sync (cb) {
	    cb(new ApiError(ErrorCode.ENOTSUP));
	};
	BaseFile.prototype.syncSync = function syncSync () {
	    throw new ApiError(ErrorCode.ENOTSUP);
	};
	BaseFile.prototype.datasync = function datasync (cb) {
	    this.sync(cb);
	};
	BaseFile.prototype.datasyncSync = function datasyncSync () {
	    return this.syncSync();
	};
	BaseFile.prototype.chown = function chown (uid, gid, cb) {
	    cb(new ApiError(ErrorCode.ENOTSUP));
	};
	BaseFile.prototype.chownSync = function chownSync (uid, gid) {
	    throw new ApiError(ErrorCode.ENOTSUP);
	};
	BaseFile.prototype.chmod = function chmod (mode, cb) {
	    cb(new ApiError(ErrorCode.ENOTSUP));
	};
	BaseFile.prototype.chmodSync = function chmodSync (mode) {
	    throw new ApiError(ErrorCode.ENOTSUP);
	};
	BaseFile.prototype.utimes = function utimes (atime, mtime, cb) {
	    cb(new ApiError(ErrorCode.ENOTSUP));
	};
	BaseFile.prototype.utimesSync = function utimesSync (atime, mtime) {
	    throw new ApiError(ErrorCode.ENOTSUP);
	};
	
	/**
	 * An implementation of the File interface that operates on a file that is
	 * completely in-memory. PreloadFiles are backed by a Buffer.
	 *
	 * This is also an abstract class, as it lacks an implementation of 'sync' and
	 * 'close'. Each filesystem that wishes to use this file representation must
	 * extend this class and implement those two methods.
	 * @todo 'close' lever that disables functionality once closed.
	 */
	var PreloadFile = (function (BaseFile$$1) {
	    function PreloadFile(_fs, _path, _flag, _stat, contents) {
	        BaseFile$$1.call(this);
	        this._pos = 0;
	        this._dirty = false;
	        this._fs = _fs;
	        this._path = _path;
	        this._flag = _flag;
	        this._stat = _stat;
	        if (contents) {
	            this._buffer = contents;
	        }
	        else {
	            // Empty buffer. It'll expand once we write stuff to it.
	            this._buffer = emptyBuffer();
	        }
	        // Note: This invariant is *not* maintained once the file starts getting
	        // modified.
	        // Note: Only actually matters if file is readable, as writeable modes may
	        // truncate/append to file.
	        if (this._stat.size !== this._buffer.length && this._flag.isReadable()) {
	            throw new Error(("Invalid buffer: Buffer is " + (this._buffer.length) + " long, yet Stats object specifies that file is " + (this._stat.size) + " long."));
	        }
	    }
	
	    if ( BaseFile$$1 ) PreloadFile.__proto__ = BaseFile$$1;
	    PreloadFile.prototype = Object.create( BaseFile$$1 && BaseFile$$1.prototype );
	    PreloadFile.prototype.constructor = PreloadFile;
	    /**
	     * NONSTANDARD: Get the underlying buffer for this file. !!DO NOT MUTATE!! Will mess up dirty tracking.
	     */
	    PreloadFile.prototype.getBuffer = function getBuffer () {
	        return this._buffer;
	    };
	    /**
	     * NONSTANDARD: Get underlying stats for this file. !!DO NOT MUTATE!!
	     */
	    PreloadFile.prototype.getStats = function getStats () {
	        return this._stat;
	    };
	    PreloadFile.prototype.getFlag = function getFlag () {
	        return this._flag;
	    };
	    /**
	     * Get the path to this file.
	     * @return [String] The path to the file.
	     */
	    PreloadFile.prototype.getPath = function getPath () {
	        return this._path;
	    };
	    /**
	     * Get the current file position.
	     *
	     * We emulate the following bug mentioned in the Node documentation:
	     * > On Linux, positional writes don't work when the file is opened in append
	     *   mode. The kernel ignores the position argument and always appends the data
	     *   to the end of the file.
	     * @return [Number] The current file position.
	     */
	    PreloadFile.prototype.getPos = function getPos () {
	        if (this._flag.isAppendable()) {
	            return this._stat.size;
	        }
	        return this._pos;
	    };
	    /**
	     * Advance the current file position by the indicated number of positions.
	     * @param [Number] delta
	     */
	    PreloadFile.prototype.advancePos = function advancePos (delta) {
	        return this._pos += delta;
	    };
	    /**
	     * Set the file position.
	     * @param [Number] newPos
	     */
	    PreloadFile.prototype.setPos = function setPos (newPos) {
	        return this._pos = newPos;
	    };
	    /**
	     * **Core**: Asynchronous sync. Must be implemented by subclasses of this
	     * class.
	     * @param [Function(BrowserFS.ApiError)] cb
	     */
	    PreloadFile.prototype.sync = function sync (cb) {
	        try {
	            this.syncSync();
	            cb();
	        }
	        catch (e) {
	            cb(e);
	        }
	    };
	    /**
	     * **Core**: Synchronous sync.
	     */
	    PreloadFile.prototype.syncSync = function syncSync () {
	        throw new ApiError(ErrorCode.ENOTSUP);
	    };
	    /**
	     * **Core**: Asynchronous close. Must be implemented by subclasses of this
	     * class.
	     * @param [Function(BrowserFS.ApiError)] cb
	     */
	    PreloadFile.prototype.close = function close (cb) {
	        try {
	            this.closeSync();
	            cb();
	        }
	        catch (e) {
	            cb(e);
	        }
	    };
	    /**
	     * **Core**: Synchronous close.
	     */
	    PreloadFile.prototype.closeSync = function closeSync () {
	        throw new ApiError(ErrorCode.ENOTSUP);
	    };
	    /**
	     * Asynchronous `stat`.
	     * @param [Function(BrowserFS.ApiError, BrowserFS.node.fs.Stats)] cb
	     */
	    PreloadFile.prototype.stat = function stat (cb) {
	        try {
	            cb(null, this._stat.clone());
	        }
	        catch (e) {
	            cb(e);
	        }
	    };
	    /**
	     * Synchronous `stat`.
	     */
	    PreloadFile.prototype.statSync = function statSync () {
	        return this._stat.clone();
	    };
	    /**
	     * Asynchronous truncate.
	     * @param [Number] len
	     * @param [Function(BrowserFS.ApiError)] cb
	     */
	    PreloadFile.prototype.truncate = function truncate (len, cb) {
	        try {
	            this.truncateSync(len);
	            if (this._flag.isSynchronous() && !_fsMock.getRootFS().supportsSynch()) {
	                this.sync(cb);
	            }
	            cb();
	        }
	        catch (e) {
	            return cb(e);
	        }
	    };
	    /**
	     * Synchronous truncate.
	     * @param [Number] len
	     */
	    PreloadFile.prototype.truncateSync = function truncateSync (len) {
	        this._dirty = true;
	        if (!this._flag.isWriteable()) {
	            throw new ApiError(ErrorCode.EPERM, 'File not opened with a writeable mode.');
	        }
	        this._stat.mtime = new Date();
	        if (len > this._buffer.length) {
	            var buf = Buffer.alloc(len - this._buffer.length, 0);
	            // Write will set @_stat.size for us.
	            this.writeSync(buf, 0, buf.length, this._buffer.length);
	            if (this._flag.isSynchronous() && _fsMock.getRootFS().supportsSynch()) {
	                this.syncSync();
	            }
	            return;
	        }
	        this._stat.size = len;
	        // Truncate buffer to 'len'.
	        var newBuff = Buffer.alloc(len);
	        this._buffer.copy(newBuff, 0, 0, len);
	        this._buffer = newBuff;
	        if (this._flag.isSynchronous() && _fsMock.getRootFS().supportsSynch()) {
	            this.syncSync();
	        }
	    };
	    /**
	     * Write buffer to the file.
	     * Note that it is unsafe to use fs.write multiple times on the same file
	     * without waiting for the callback.
	     * @param [BrowserFS.node.Buffer] buffer Buffer containing the data to write to
	     *  the file.
	     * @param [Number] offset Offset in the buffer to start reading data from.
	     * @param [Number] length The amount of bytes to write to the file.
	     * @param [Number] position Offset from the beginning of the file where this
	     *   data should be written. If position is null, the data will be written at
	     *   the current position.
	     * @param [Function(BrowserFS.ApiError, Number, BrowserFS.node.Buffer)]
	     *   cb The number specifies the number of bytes written into the file.
	     */
	    PreloadFile.prototype.write = function write (buffer$$1, offset, length, position, cb) {
	        try {
	            cb(null, this.writeSync(buffer$$1, offset, length, position), buffer$$1);
	        }
	        catch (e) {
	            cb(e);
	        }
	    };
	    /**
	     * Write buffer to the file.
	     * Note that it is unsafe to use fs.writeSync multiple times on the same file
	     * without waiting for the callback.
	     * @param [BrowserFS.node.Buffer] buffer Buffer containing the data to write to
	     *  the file.
	     * @param [Number] offset Offset in the buffer to start reading data from.
	     * @param [Number] length The amount of bytes to write to the file.
	     * @param [Number] position Offset from the beginning of the file where this
	     *   data should be written. If position is null, the data will be written at
	     *   the current position.
	     * @return [Number]
	     */
	    PreloadFile.prototype.writeSync = function writeSync (buffer$$1, offset, length, position) {
	        this._dirty = true;
	        if (position === undefined || position === null) {
	            position = this.getPos();
	        }
	        if (!this._flag.isWriteable()) {
	            throw new ApiError(ErrorCode.EPERM, 'File not opened with a writeable mode.');
	        }
	        var endFp = position + length;
	        if (endFp > this._stat.size) {
	            this._stat.size = endFp;
	            if (endFp > this._buffer.length) {
	                // Extend the buffer!
	                var newBuff = Buffer.alloc(endFp);
	                this._buffer.copy(newBuff);
	                this._buffer = newBuff;
	            }
	        }
	        var len = buffer$$1.copy(this._buffer, position, offset, offset + length);
	        this._stat.mtime = new Date();
	        if (this._flag.isSynchronous()) {
	            this.syncSync();
	            return len;
	        }
	        this.setPos(position + len);
	        return len;
	    };
	    /**
	     * Read data from the file.
	     * @param [BrowserFS.node.Buffer] buffer The buffer that the data will be
	     *   written to.
	     * @param [Number] offset The offset within the buffer where writing will
	     *   start.
	     * @param [Number] length An integer specifying the number of bytes to read.
	     * @param [Number] position An integer specifying where to begin reading from
	     *   in the file. If position is null, data will be read from the current file
	     *   position.
	     * @param [Function(BrowserFS.ApiError, Number, BrowserFS.node.Buffer)] cb The
	     *   number is the number of bytes read
	     */
	    PreloadFile.prototype.read = function read (buffer$$1, offset, length, position, cb) {
	        try {
	            cb(null, this.readSync(buffer$$1, offset, length, position), buffer$$1);
	        }
	        catch (e) {
	            cb(e);
	        }
	    };
	    /**
	     * Read data from the file.
	     * @param [BrowserFS.node.Buffer] buffer The buffer that the data will be
	     *   written to.
	     * @param [Number] offset The offset within the buffer where writing will
	     *   start.
	     * @param [Number] length An integer specifying the number of bytes to read.
	     * @param [Number] position An integer specifying where to begin reading from
	     *   in the file. If position is null, data will be read from the current file
	     *   position.
	     * @return [Number]
	     */
	    PreloadFile.prototype.readSync = function readSync (buffer$$1, offset, length, position) {
	        if (!this._flag.isReadable()) {
	            throw new ApiError(ErrorCode.EPERM, 'File not opened with a readable mode.');
	        }
	        if (position === undefined || position === null) {
	            position = this.getPos();
	        }
	        var endRead = position + length;
	        if (endRead > this._stat.size) {
	            length = this._stat.size - position;
	        }
	        var rv = this._buffer.copy(buffer$$1, offset, position, position + length);
	        this._stat.atime = new Date();
	        this._pos = position + length;
	        return rv;
	    };
	    /**
	     * Asynchronous `fchmod`.
	     * @param [Number|String] mode
	     * @param [Function(BrowserFS.ApiError)] cb
	     */
	    PreloadFile.prototype.chmod = function chmod (mode, cb) {
	        try {
	            this.chmodSync(mode);
	            cb();
	        }
	        catch (e) {
	            cb(e);
	        }
	    };
	    /**
	     * Asynchronous `fchmod`.
	     * @param [Number] mode
	     */
	    PreloadFile.prototype.chmodSync = function chmodSync (mode) {
	        if (!this._fs.supportsProps()) {
	            throw new ApiError(ErrorCode.ENOTSUP);
	        }
	        this._dirty = true;
	        this._stat.chmod(mode);
	        this.syncSync();
	    };
	    PreloadFile.prototype.isDirty = function isDirty () {
	        return this._dirty;
	    };
	    /**
	     * Resets the dirty bit. Should only be called after a sync has completed successfully.
	     */
	    PreloadFile.prototype.resetDirty = function resetDirty () {
	        this._dirty = false;
	    };
	
	    return PreloadFile;
	}(BaseFile));
	
	/**
	 * File class for the InMemory and XHR file systems.
	 * Doesn't sync to anything, so it works nicely for memory-only files.
	 */
	var NoSyncFile = (function (PreloadFile) {
	    function NoSyncFile(_fs, _path, _flag, _stat, contents) {
	        PreloadFile.call(this, _fs, _path, _flag, _stat, contents);
	    }
	
	    if ( PreloadFile ) NoSyncFile.__proto__ = PreloadFile;
	    NoSyncFile.prototype = Object.create( PreloadFile && PreloadFile.prototype );
	    NoSyncFile.prototype.constructor = NoSyncFile;
	    /**
	     * Asynchronous sync. Doesn't do anything, simply calls the cb.
	     * @param [Function(BrowserFS.ApiError)] cb
	     */
	    NoSyncFile.prototype.sync = function sync (cb) {
	        cb();
	    };
	    /**
	     * Synchronous sync. Doesn't do anything.
	     */
	    NoSyncFile.prototype.syncSync = function syncSync () {
	        // NOP.
	    };
	    /**
	     * Asynchronous close. Doesn't do anything, simply calls the cb.
	     * @param [Function(BrowserFS.ApiError)] cb
	     */
	    NoSyncFile.prototype.close = function close (cb) {
	        cb();
	    };
	    /**
	     * Synchronous close. Doesn't do anything.
	     */
	    NoSyncFile.prototype.closeSync = function closeSync () {
	        // NOP.
	    };
	
	    return NoSyncFile;
	}(PreloadFile));
	
	/**
	 * We define our own file to interpose on syncSync() for mirroring purposes.
	 */
	var MirrorFile = (function (PreloadFile$$1) {
	    function MirrorFile(fs, path$$1, flag, stat, data) {
	        PreloadFile$$1.call(this, fs, path$$1, flag, stat, data);
	    }
	
	    if ( PreloadFile$$1 ) MirrorFile.__proto__ = PreloadFile$$1;
	    MirrorFile.prototype = Object.create( PreloadFile$$1 && PreloadFile$$1.prototype );
	    MirrorFile.prototype.constructor = MirrorFile;
	    MirrorFile.prototype.syncSync = function syncSync () {
	        if (this.isDirty()) {
	            this._fs._syncSync(this);
	            this.resetDirty();
	        }
	    };
	    MirrorFile.prototype.closeSync = function closeSync () {
	        this.syncSync();
	    };
	
	    return MirrorFile;
	}(PreloadFile));
	/**
	 * AsyncMirrorFS mirrors a synchronous filesystem into an asynchronous filesystem
	 * by:
	 *
	 * * Performing operations over the in-memory copy, while asynchronously pipelining them
	 *   to the backing store.
	 * * During application loading, the contents of the async file system can be reloaded into
	 *   the synchronous store, if desired.
	 *
	 * The two stores will be kept in sync. The most common use-case is to pair a synchronous
	 * in-memory filesystem with an asynchronous backing store.
	 *
	 * Example: Mirroring an IndexedDB file system to an in memory file system. Now, you can use
	 * IndexedDB synchronously.
	 *
	 * ```javascript
	 * BrowserFS.configure({
	 *   fs: "AsyncMirror",
	 *   options: {
	 *     sync: { fs: "InMemory" },
	 *     async: { fs: "IndexedDB" }
	 *   }
	 * }, function(e) {
	 *   // BrowserFS is initialized and ready-to-use!
	 * });
	 * ```
	 *
	 * Or, alternatively:
	 *
	 * ```javascript
	 * BrowserFS.FileSystem.IndexedDB.Create(function(e, idbfs) {
	 *   BrowserFS.FileSystem.InMemory.Create(function(e, inMemory) {
	 *     BrowserFS.FileSystem.AsyncMirror({
	 *       sync: inMemory, async: idbfs
	 *     }, function(e, mirrored) {
	 *       BrowserFS.initialize(mirrored);
	 *     });
	 *   });
	 * });
	 * ```
	 */
	var AsyncMirror = (function (SynchronousFileSystem$$1) {
	    function AsyncMirror(sync, async, deprecateMsg) {
	        if ( deprecateMsg === void 0 ) deprecateMsg = true;
	
	        SynchronousFileSystem$$1.call(this);
	        /**
	         * Queue of pending asynchronous operations.
	         */
	        this._queue = [];
	        this._queueRunning = false;
	        this._isInitialized = false;
	        this._initializeCallbacks = [];
	        this._sync = sync;
	        this._async = async;
	        if (!sync.supportsSynch()) {
	            throw new Error("The first argument to AsyncMirror needs to be a synchronous file system.");
	        }
	        deprecationMessage(deprecateMsg, AsyncMirror.Name, { sync: "sync file system instance", async: "async file system instance" });
	    }
	
	    if ( SynchronousFileSystem$$1 ) AsyncMirror.__proto__ = SynchronousFileSystem$$1;
	    AsyncMirror.prototype = Object.create( SynchronousFileSystem$$1 && SynchronousFileSystem$$1.prototype );
	    AsyncMirror.prototype.constructor = AsyncMirror;
	    /**
	     * Constructs and initializes an AsyncMirror file system with the given options.
	     */
	    AsyncMirror.Create = function Create (opts, cb) {
	        try {
	            var fs = new AsyncMirror(opts.sync, opts.async, false);
	            fs.initialize(function (e) {
	                if (e) {
	                    cb(e);
	                }
	                else {
	                    cb(null, fs);
	                }
	            }, false);
	        }
	        catch (e) {
	            cb(e);
	        }
	    };
	    AsyncMirror.isAvailable = function isAvailable () {
	        return true;
	    };
	    AsyncMirror.prototype.getName = function getName () {
	        return AsyncMirror.Name;
	    };
	    AsyncMirror.prototype._syncSync = function _syncSync (fd) {
	        this._sync.writeFileSync(fd.getPath(), fd.getBuffer(), null, FileFlag.getFileFlag('w'), fd.getStats().mode);
	        this.enqueueOp({
	            apiMethod: 'writeFile',
	            arguments: [fd.getPath(), fd.getBuffer(), null, fd.getFlag(), fd.getStats().mode]
	        });
	    };
	    /**
	     * Called once to load up files from async storage into sync storage.
	     */
	    AsyncMirror.prototype.initialize = function initialize (userCb, deprecateMsg) {
	        var this$1 = this;
	        if ( deprecateMsg === void 0 ) deprecateMsg = true;
	
	        if (deprecateMsg) {
	            console.warn("[AsyncMirror] AsyncMirror.initialize() is deprecated and will be removed in the next major version. Please use 'AsyncMirror.Create({ sync: (sync file system instance), async: (async file system instance)}, cb)' to create and initialize AsyncMirror instances.");
	        }
	        var callbacks = this._initializeCallbacks;
	        var end = function (e) {
	            this$1._isInitialized = !e;
	            this$1._initializeCallbacks = [];
	            callbacks.forEach(function (cb) { return cb(e); });
	        };
	        if (!this._isInitialized) {
	            // First call triggers initialization, the rest wait.
	            if (callbacks.push(userCb) === 1) {
	                var copyDirectory = function (p, mode, cb) {
	                    if (p !== '/') {
	                        this$1._sync.mkdirSync(p, mode);
	                    }
	                    this$1._async.readdir(p, function (err, files) {
	                        var i = 0;
	                        // NOTE: This function must not be in a lexically nested statement,
	                        // such as an if or while statement. Safari refuses to run the
	                        // script since it is undefined behavior.
	                        function copyNextFile(err) {
	                            if (err) {
	                                cb(err);
	                            }
	                            else if (i < files.length) {
	                                copyItem(path.join(p, files[i]), copyNextFile);
	                                i++;
	                            }
	                            else {
	                                cb();
	                            }
	                        }
	                        if (err) {
	                            cb(err);
	                        }
	                        else {
	                            copyNextFile();
	                        }
	                    });
	                }, copyFile = function (p, mode, cb) {
	                    this$1._async.readFile(p, null, FileFlag.getFileFlag('r'), function (err, data) {
	                        if (err) {
	                            cb(err);
	                        }
	                        else {
	                            try {
	                                this$1._sync.writeFileSync(p, data, null, FileFlag.getFileFlag('w'), mode);
	                            }
	                            catch (e) {
	                                err = e;
	                            }
	                            finally {
	                                cb(err);
	                            }
	                        }
	                    });
	                }, copyItem = function (p, cb) {
	                    this$1._async.stat(p, false, function (err, stats) {
	                        if (err) {
	                            cb(err);
	                        }
	                        else if (stats.isDirectory()) {
	                            copyDirectory(p, stats.mode, cb);
	                        }
	                        else {
	                            copyFile(p, stats.mode, cb);
	                        }
	                    });
	                };
	                copyDirectory('/', 0, end);
	            }
	        }
	        else {
	            userCb();
	        }
	    };
	    AsyncMirror.prototype.isReadOnly = function isReadOnly () { return false; };
	    AsyncMirror.prototype.supportsSynch = function supportsSynch () { return true; };
	    AsyncMirror.prototype.supportsLinks = function supportsLinks () { return false; };
	    AsyncMirror.prototype.supportsProps = function supportsProps () { return this._sync.supportsProps() && this._async.supportsProps(); };
	    AsyncMirror.prototype.renameSync = function renameSync (oldPath, newPath) {
	        this.checkInitialized();
	        this._sync.renameSync(oldPath, newPath);
	        this.enqueueOp({
	            apiMethod: 'rename',
	            arguments: [oldPath, newPath]
	        });
	    };
	    AsyncMirror.prototype.statSync = function statSync (p, isLstat) {
	        this.checkInitialized();
	        return this._sync.statSync(p, isLstat);
	    };
	    AsyncMirror.prototype.openSync = function openSync (p, flag, mode) {
	        this.checkInitialized();
	        // Sanity check: Is this open/close permitted?
	        var fd = this._sync.openSync(p, flag, mode);
	        fd.closeSync();
	        return new MirrorFile(this, p, flag, this._sync.statSync(p, false), this._sync.readFileSync(p, null, FileFlag.getFileFlag('r')));
	    };
	    AsyncMirror.prototype.unlinkSync = function unlinkSync (p) {
	        this.checkInitialized();
	        this._sync.unlinkSync(p);
	        this.enqueueOp({
	            apiMethod: 'unlink',
	            arguments: [p]
	        });
	    };
	    AsyncMirror.prototype.rmdirSync = function rmdirSync (p) {
	        this.checkInitialized();
	        this._sync.rmdirSync(p);
	        this.enqueueOp({
	            apiMethod: 'rmdir',
	            arguments: [p]
	        });
	    };
	    AsyncMirror.prototype.mkdirSync = function mkdirSync (p, mode) {
	        this.checkInitialized();
	        this._sync.mkdirSync(p, mode);
	        this.enqueueOp({
	            apiMethod: 'mkdir',
	            arguments: [p, mode]
	        });
	    };
	    AsyncMirror.prototype.readdirSync = function readdirSync (p) {
	        this.checkInitialized();
	        return this._sync.readdirSync(p);
	    };
	    AsyncMirror.prototype.existsSync = function existsSync (p) {
	        this.checkInitialized();
	        return this._sync.existsSync(p);
	    };
	    AsyncMirror.prototype.chmodSync = function chmodSync (p, isLchmod, mode) {
	        this.checkInitialized();
	        this._sync.chmodSync(p, isLchmod, mode);
	        this.enqueueOp({
	            apiMethod: 'chmod',
	            arguments: [p, isLchmod, mode]
	        });
	    };
	    AsyncMirror.prototype.chownSync = function chownSync (p, isLchown, uid, gid) {
	        this.checkInitialized();
	        this._sync.chownSync(p, isLchown, uid, gid);
	        this.enqueueOp({
	            apiMethod: 'chown',
	            arguments: [p, isLchown, uid, gid]
	        });
	    };
	    AsyncMirror.prototype.utimesSync = function utimesSync (p, atime, mtime) {
	        this.checkInitialized();
	        this._sync.utimesSync(p, atime, mtime);
	        this.enqueueOp({
	            apiMethod: 'utimes',
	            arguments: [p, atime, mtime]
	        });
	    };
	    AsyncMirror.prototype.checkInitialized = function checkInitialized () {
	        if (!this._isInitialized) {
	            throw new ApiError(ErrorCode.EPERM, "AsyncMirrorFS is not initialized. Please initialize AsyncMirrorFS using its initialize() method before using it.");
	        }
	    };
	    AsyncMirror.prototype.enqueueOp = function enqueueOp (op) {
	        var this$1 = this;
	
	        this._queue.push(op);
	        if (!this._queueRunning) {
	            this._queueRunning = true;
	            var doNextOp = function (err) {
	                if (err) {
	                    console.error(("WARNING: File system has desynchronized. Received following error: " + err + "\n$"));
	                }
	                if (this$1._queue.length > 0) {
	                    var op = this$1._queue.shift(), args = op.arguments;
	                    args.push(doNextOp);
	                    this$1._async[op.apiMethod].apply(this$1._async, args);
	                }
	                else {
	                    this$1._queueRunning = false;
	                }
	            };
	            doNextOp();
	        }
	    };
	
	    return AsyncMirror;
	}(SynchronousFileSystem));
	
	AsyncMirror.Name = "AsyncMirror";
	AsyncMirror.Options = {
	    sync: {
	        type: "object",
	        description: "The synchronous file system to mirror the asynchronous file system to."
	    },
	    async: {
	        type: "object",
	        description: "The asynchronous file system to mirror."
	    }
	};
	
	/**
	 * A faster alternative to `Function#apply`, this function invokes `func`
	 * with the `this` binding of `thisArg` and the arguments of `args`.
	 *
	 * @private
	 * @param {Function} func The function to invoke.
	 * @param {*} thisArg The `this` binding of `func`.
	 * @param {Array} args The arguments to invoke `func` with.
	 * @returns {*} Returns the result of `func`.
	 */
	function apply(func, thisArg, args) {
	  switch (args.length) {
	    case 0: return func.call(thisArg);
	    case 1: return func.call(thisArg, args[0]);
	    case 2: return func.call(thisArg, args[0], args[1]);
	    case 3: return func.call(thisArg, args[0], args[1], args[2]);
	  }
	  return func.apply(thisArg, args);
	}
	
	/* Built-in method references for those with the same name as other `lodash` methods. */
	var nativeMax = Math.max;
	
	/**
	 * A specialized version of `baseRest` which transforms the rest array.
	 *
	 * @private
	 * @param {Function} func The function to apply a rest parameter to.
	 * @param {number} [start=func.length-1] The start position of the rest parameter.
	 * @param {Function} transform The rest array transform.
	 * @returns {Function} Returns the new function.
	 */
	function overRest$1(func, start, transform) {
	  start = nativeMax(start === undefined ? (func.length - 1) : start, 0);
	  return function() {
	    var args = arguments,
	        index = -1,
	        length = nativeMax(args.length - start, 0),
	        array = Array(length);
	
	    while (++index < length) {
	      array[index] = args[start + index];
	    }
	    index = -1;
	    var otherArgs = Array(start + 1);
	    while (++index < start) {
	      otherArgs[index] = args[index];
	    }
	    otherArgs[start] = transform(array);
	    return apply(func, this, otherArgs);
	  };
	}
	
	/**
	 * This method returns the first argument it receives.
	 *
	 * @static
	 * @since 0.1.0
	 * @memberOf _
	 * @category Util
	 * @param {*} value Any value.
	 * @returns {*} Returns `value`.
	 * @example
	 *
	 * var object = { 'a': 1 };
	 *
	 * console.log(_.identity(object) === object);
	 * // => true
	 */
	function identity(value) {
	  return value;
	}
	
	// Lodash rest function without function.toString()
	// remappings
	function rest(func, start) {
	    return overRest$1(func, start, identity);
	}
	
	var initialParams = function (fn) {
	    return rest(function (args/*..., callback*/) {
	        var callback = args.pop();
	        fn.call(this, args, callback);
	    });
	};
	
	function applyEach$1(eachfn) {
	    return rest(function(fns, args) {
	        var go = initialParams(function(args, callback) {
	            var that = this;
	            return eachfn(fns, function (fn, cb) {
	                fn.apply(that, args.concat(cb));
	            }, callback);
	        });
	        if (args.length) {
	            return go.apply(this, args);
	        }
	        else {
	            return go;
	        }
	    });
	}
	
	/** Detect free variable `global` from Node.js. */
	var freeGlobal = typeof global == 'object' && global && global.Object === Object && global;
	
	/** Detect free variable `self`. */
	var freeSelf = typeof self == 'object' && self && self.Object === Object && self;
	
	/** Used as a reference to the global object. */
	var root = freeGlobal || freeSelf || Function('return this')();
	
	/** Built-in value references. */
	var Symbol$1 = root.Symbol;
	
	/** Used for built-in method references. */
	var objectProto = Object.prototype;
	
	/** Used to check objects for own properties. */
	var hasOwnProperty = objectProto.hasOwnProperty;
	
	/**
	 * Used to resolve the
	 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
	 * of values.
	 */
	var nativeObjectToString = objectProto.toString;
	
	/** Built-in value references. */
	var symToStringTag$1 = Symbol$1 ? Symbol$1.toStringTag : undefined;
	
	/**
	 * A specialized version of `baseGetTag` which ignores `Symbol.toStringTag` values.
	 *
	 * @private
	 * @param {*} value The value to query.
	 * @returns {string} Returns the raw `toStringTag`.
	 */
	function getRawTag(value) {
	  var isOwn = hasOwnProperty.call(value, symToStringTag$1),
	      tag = value[symToStringTag$1];
	
	  try {
	    value[symToStringTag$1] = undefined;
	    var unmasked = true;
	  } catch (e) {}
	
	  var result = nativeObjectToString.call(value);
	  if (unmasked) {
	    if (isOwn) {
	      value[symToStringTag$1] = tag;
	    } else {
	      delete value[symToStringTag$1];
	    }
	  }
	  return result;
	}
	
	/** Used for built-in method references. */
	var objectProto$1 = Object.prototype;
	
	/**
	 * Used to resolve the
	 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
	 * of values.
	 */
	var nativeObjectToString$1 = objectProto$1.toString;
	
	/**
	 * Converts `value` to a string using `Object.prototype.toString`.
	 *
	 * @private
	 * @param {*} value The value to convert.
	 * @returns {string} Returns the converted string.
	 */
	function objectToString(value) {
	  return nativeObjectToString$1.call(value);
	}
	
	/** `Object#toString` result references. */
	var nullTag = '[object Null]';
	var undefinedTag = '[object Undefined]';
	
	/** Built-in value references. */
	var symToStringTag = Symbol$1 ? Symbol$1.toStringTag : undefined;
	
	/**
	 * The base implementation of `getTag` without fallbacks for buggy environments.
	 *
	 * @private
	 * @param {*} value The value to query.
	 * @returns {string} Returns the `toStringTag`.
	 */
	function baseGetTag(value) {
	  if (value == null) {
	    return value === undefined ? undefinedTag : nullTag;
	  }
	  return (symToStringTag && symToStringTag in Object(value))
	    ? getRawTag(value)
	    : objectToString(value);
	}
	
	/**
	 * Checks if `value` is the
	 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
	 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
	 * @example
	 *
	 * _.isObject({});
	 * // => true
	 *
	 * _.isObject([1, 2, 3]);
	 * // => true
	 *
	 * _.isObject(_.noop);
	 * // => true
	 *
	 * _.isObject(null);
	 * // => false
	 */
	function isObject(value) {
	  var type = typeof value;
	  return value != null && (type == 'object' || type == 'function');
	}
	
	/** `Object#toString` result references. */
	var asyncTag = '[object AsyncFunction]';
	var funcTag = '[object Function]';
	var genTag = '[object GeneratorFunction]';
	var proxyTag = '[object Proxy]';
	
	/**
	 * Checks if `value` is classified as a `Function` object.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a function, else `false`.
	 * @example
	 *
	 * _.isFunction(_);
	 * // => true
	 *
	 * _.isFunction(/abc/);
	 * // => false
	 */
	function isFunction(value) {
	  if (!isObject(value)) {
	    return false;
	  }
	  // The use of `Object#toString` avoids issues with the `typeof` operator
	  // in Safari 9 which returns 'object' for typed arrays and other constructors.
	  var tag = baseGetTag(value);
	  return tag == funcTag || tag == genTag || tag == asyncTag || tag == proxyTag;
	}
	
	/** Used as references for various `Number` constants. */
	var MAX_SAFE_INTEGER = 9007199254740991;
	
	/**
	 * Checks if `value` is a valid array-like length.
	 *
	 * **Note:** This method is loosely based on
	 * [`ToLength`](http://ecma-international.org/ecma-262/7.0/#sec-tolength).
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
	 * @example
	 *
	 * _.isLength(3);
	 * // => true
	 *
	 * _.isLength(Number.MIN_VALUE);
	 * // => false
	 *
	 * _.isLength(Infinity);
	 * // => false
	 *
	 * _.isLength('3');
	 * // => false
	 */
	function isLength(value) {
	  return typeof value == 'number' &&
	    value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
	}
	
	/**
	 * Checks if `value` is array-like. A value is considered array-like if it's
	 * not a function and has a `value.length` that's an integer greater than or
	 * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
	 * @example
	 *
	 * _.isArrayLike([1, 2, 3]);
	 * // => true
	 *
	 * _.isArrayLike(document.body.children);
	 * // => true
	 *
	 * _.isArrayLike('abc');
	 * // => true
	 *
	 * _.isArrayLike(_.noop);
	 * // => false
	 */
	function isArrayLike(value) {
	  return value != null && isLength(value.length) && !isFunction(value);
	}
	
	// A temporary value used to identify if the loop should be broken.
	// See #1064, #1293
	var breakLoop = {};
	
	/**
	 * This method returns `undefined`.
	 *
	 * @static
	 * @memberOf _
	 * @since 2.3.0
	 * @category Util
	 * @example
	 *
	 * _.times(2, _.noop);
	 * // => [undefined, undefined]
	 */
	function noop() {
	  // No operation performed.
	}
	
	function once(fn) {
	    return function () {
	        if (fn === null) { return; }
	        var callFn = fn;
	        fn = null;
	        callFn.apply(this, arguments);
	    };
	}
	
	var iteratorSymbol = typeof Symbol === 'function' && Symbol.iterator;
	
	var getIterator = function (coll) {
	    return iteratorSymbol && coll[iteratorSymbol] && coll[iteratorSymbol]();
	};
	
	/**
	 * The base implementation of `_.times` without support for iteratee shorthands
	 * or max array length checks.
	 *
	 * @private
	 * @param {number} n The number of times to invoke `iteratee`.
	 * @param {Function} iteratee The function invoked per iteration.
	 * @returns {Array} Returns the array of results.
	 */
	function baseTimes(n, iteratee) {
	  var index = -1,
	      result = Array(n);
	
	  while (++index < n) {
	    result[index] = iteratee(index);
	  }
	  return result;
	}
	
	/**
	 * Checks if `value` is object-like. A value is object-like if it's not `null`
	 * and has a `typeof` result of "object".
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
	 * @example
	 *
	 * _.isObjectLike({});
	 * // => true
	 *
	 * _.isObjectLike([1, 2, 3]);
	 * // => true
	 *
	 * _.isObjectLike(_.noop);
	 * // => false
	 *
	 * _.isObjectLike(null);
	 * // => false
	 */
	function isObjectLike(value) {
	  return value != null && typeof value == 'object';
	}
	
	/** `Object#toString` result references. */
	var argsTag = '[object Arguments]';
	
	/**
	 * The base implementation of `_.isArguments`.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is an `arguments` object,
	 */
	function baseIsArguments(value) {
	  return isObjectLike(value) && baseGetTag(value) == argsTag;
	}
	
	/** Used for built-in method references. */
	var objectProto$3 = Object.prototype;
	
	/** Used to check objects for own properties. */
	var hasOwnProperty$2 = objectProto$3.hasOwnProperty;
	
	/** Built-in value references. */
	var propertyIsEnumerable = objectProto$3.propertyIsEnumerable;
	
	/**
	 * Checks if `value` is likely an `arguments` object.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is an `arguments` object,
	 *  else `false`.
	 * @example
	 *
	 * _.isArguments(function() { return arguments; }());
	 * // => true
	 *
	 * _.isArguments([1, 2, 3]);
	 * // => false
	 */
	var isArguments = baseIsArguments(function() { return arguments; }()) ? baseIsArguments : function(value) {
	  return isObjectLike(value) && hasOwnProperty$2.call(value, 'callee') &&
	    !propertyIsEnumerable.call(value, 'callee');
	};
	
	/**
	 * Checks if `value` is classified as an `Array` object.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is an array, else `false`.
	 * @example
	 *
	 * _.isArray([1, 2, 3]);
	 * // => true
	 *
	 * _.isArray(document.body.children);
	 * // => false
	 *
	 * _.isArray('abc');
	 * // => false
	 *
	 * _.isArray(_.noop);
	 * // => false
	 */
	var isArray = Array.isArray;
	
	/**
	 * This method returns `false`.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.13.0
	 * @category Util
	 * @returns {boolean} Returns `false`.
	 * @example
	 *
	 * _.times(2, _.stubFalse);
	 * // => [false, false]
	 */
	function stubFalse() {
	  return false;
	}
	
	/** Detect free variable `exports`. */
	var freeExports = typeof exports == 'object' && exports && !exports.nodeType && exports;
	
	/** Detect free variable `module`. */
	var freeModule = freeExports && typeof module == 'object' && module && !module.nodeType && module;
	
	/** Detect the popular CommonJS extension `module.exports`. */
	var moduleExports = freeModule && freeModule.exports === freeExports;
	
	/** Built-in value references. */
	var Buffer$1 = moduleExports ? root.Buffer : undefined;
	
	/* Built-in method references for those with the same name as other `lodash` methods. */
	var nativeIsBuffer = Buffer$1 ? Buffer$1.isBuffer : undefined;
	
	/**
	 * Checks if `value` is a buffer.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.3.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a buffer, else `false`.
	 * @example
	 *
	 * _.isBuffer(new Buffer(2));
	 * // => true
	 *
	 * _.isBuffer(new Uint8Array(2));
	 * // => false
	 */
	var isBuffer = nativeIsBuffer || stubFalse;
	
	/** Used as references for various `Number` constants. */
	var MAX_SAFE_INTEGER$1 = 9007199254740991;
	
	/** Used to detect unsigned integer values. */
	var reIsUint = /^(?:0|[1-9]\d*)$/;
	
	/**
	 * Checks if `value` is a valid array-like index.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
	 * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
	 */
	function isIndex(value, length) {
	  length = length == null ? MAX_SAFE_INTEGER$1 : length;
	  return !!length &&
	    (typeof value == 'number' || reIsUint.test(value)) &&
	    (value > -1 && value % 1 == 0 && value < length);
	}
	
	/** `Object#toString` result references. */
	var argsTag$1 = '[object Arguments]';
	var arrayTag = '[object Array]';
	var boolTag = '[object Boolean]';
	var dateTag = '[object Date]';
	var errorTag = '[object Error]';
	var funcTag$1 = '[object Function]';
	var mapTag = '[object Map]';
	var numberTag = '[object Number]';
	var objectTag = '[object Object]';
	var regexpTag = '[object RegExp]';
	var setTag = '[object Set]';
	var stringTag = '[object String]';
	var weakMapTag = '[object WeakMap]';
	
	var arrayBufferTag = '[object ArrayBuffer]';
	var dataViewTag = '[object DataView]';
	var float32Tag = '[object Float32Array]';
	var float64Tag = '[object Float64Array]';
	var int8Tag = '[object Int8Array]';
	var int16Tag = '[object Int16Array]';
	var int32Tag = '[object Int32Array]';
	var uint8Tag = '[object Uint8Array]';
	var uint8ClampedTag = '[object Uint8ClampedArray]';
	var uint16Tag = '[object Uint16Array]';
	var uint32Tag = '[object Uint32Array]';
	
	/** Used to identify `toStringTag` values of typed arrays. */
	var typedArrayTags = {};
	typedArrayTags[float32Tag] = typedArrayTags[float64Tag] =
	typedArrayTags[int8Tag] = typedArrayTags[int16Tag] =
	typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] =
	typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] =
	typedArrayTags[uint32Tag] = true;
	typedArrayTags[argsTag$1] = typedArrayTags[arrayTag] =
	typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] =
	typedArrayTags[dataViewTag] = typedArrayTags[dateTag] =
	typedArrayTags[errorTag] = typedArrayTags[funcTag$1] =
	typedArrayTags[mapTag] = typedArrayTags[numberTag] =
	typedArrayTags[objectTag] = typedArrayTags[regexpTag] =
	typedArrayTags[setTag] = typedArrayTags[stringTag] =
	typedArrayTags[weakMapTag] = false;
	
	/**
	 * The base implementation of `_.isTypedArray` without Node.js optimizations.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
	 */
	function baseIsTypedArray(value) {
	  return isObjectLike(value) &&
	    isLength(value.length) && !!typedArrayTags[baseGetTag(value)];
	}
	
	/**
	 * The base implementation of `_.unary` without support for storing metadata.
	 *
	 * @private
	 * @param {Function} func The function to cap arguments for.
	 * @returns {Function} Returns the new capped function.
	 */
	function baseUnary(func) {
	  return function(value) {
	    return func(value);
	  };
	}
	
	/** Detect free variable `exports`. */
	var freeExports$1 = typeof exports == 'object' && exports && !exports.nodeType && exports;
	
	/** Detect free variable `module`. */
	var freeModule$1 = freeExports$1 && typeof module == 'object' && module && !module.nodeType && module;
	
	/** Detect the popular CommonJS extension `module.exports`. */
	var moduleExports$1 = freeModule$1 && freeModule$1.exports === freeExports$1;
	
	/** Detect free variable `process` from Node.js. */
	var freeProcess = moduleExports$1 && freeGlobal.process;
	
	/** Used to access faster Node.js helpers. */
	var nodeUtil = (function() {
	  try {
	    return freeProcess && freeProcess.binding && freeProcess.binding('util');
	  } catch (e) {}
	}());
	
	/* Node.js helper references. */
	var nodeIsTypedArray = nodeUtil && nodeUtil.isTypedArray;
	
	/**
	 * Checks if `value` is classified as a typed array.
	 *
	 * @static
	 * @memberOf _
	 * @since 3.0.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
	 * @example
	 *
	 * _.isTypedArray(new Uint8Array);
	 * // => true
	 *
	 * _.isTypedArray([]);
	 * // => false
	 */
	var isTypedArray = nodeIsTypedArray ? baseUnary(nodeIsTypedArray) : baseIsTypedArray;
	
	/** Used for built-in method references. */
	var objectProto$2 = Object.prototype;
	
	/** Used to check objects for own properties. */
	var hasOwnProperty$1 = objectProto$2.hasOwnProperty;
	
	/**
	 * Creates an array of the enumerable property names of the array-like `value`.
	 *
	 * @private
	 * @param {*} value The value to query.
	 * @param {boolean} inherited Specify returning inherited property names.
	 * @returns {Array} Returns the array of property names.
	 */
	function arrayLikeKeys(value, inherited) {
	  var isArr = isArray(value),
	      isArg = !isArr && isArguments(value),
	      isBuff = !isArr && !isArg && isBuffer(value),
	      isType = !isArr && !isArg && !isBuff && isTypedArray(value),
	      skipIndexes = isArr || isArg || isBuff || isType,
	      result = skipIndexes ? baseTimes(value.length, String) : [],
	      length = result.length;
	
	  for (var key in value) {
	    if ((inherited || hasOwnProperty$1.call(value, key)) &&
	        !(skipIndexes && (
	           // Safari 9 has enumerable `arguments.length` in strict mode.
	           key == 'length' ||
	           // Node.js 0.10 has enumerable non-index properties on buffers.
	           (isBuff && (key == 'offset' || key == 'parent')) ||
	           // PhantomJS 2 has enumerable non-index properties on typed arrays.
	           (isType && (key == 'buffer' || key == 'byteLength' || key == 'byteOffset')) ||
	           // Skip index properties.
	           isIndex(key, length)
	        ))) {
	      result.push(key);
	    }
	  }
	  return result;
	}
	
	/** Used for built-in method references. */
	var objectProto$5 = Object.prototype;
	
	/**
	 * Checks if `value` is likely a prototype object.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a prototype, else `false`.
	 */
	function isPrototype(value) {
	  var Ctor = value && value.constructor,
	      proto = (typeof Ctor == 'function' && Ctor.prototype) || objectProto$5;
	
	  return value === proto;
	}
	
	/**
	 * Creates a unary function that invokes `func` with its argument transformed.
	 *
	 * @private
	 * @param {Function} func The function to wrap.
	 * @param {Function} transform The argument transform.
	 * @returns {Function} Returns the new function.
	 */
	function overArg(func, transform) {
	  return function(arg) {
	    return func(transform(arg));
	  };
	}
	
	/* Built-in method references for those with the same name as other `lodash` methods. */
	var nativeKeys = overArg(Object.keys, Object);
	
	/** Used for built-in method references. */
	var objectProto$4 = Object.prototype;
	
	/** Used to check objects for own properties. */
	var hasOwnProperty$3 = objectProto$4.hasOwnProperty;
	
	/**
	 * The base implementation of `_.keys` which doesn't treat sparse arrays as dense.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @returns {Array} Returns the array of property names.
	 */
	function baseKeys(object) {
	  if (!isPrototype(object)) {
	    return nativeKeys(object);
	  }
	  var result = [];
	  for (var key in Object(object)) {
	    if (hasOwnProperty$3.call(object, key) && key != 'constructor') {
	      result.push(key);
	    }
	  }
	  return result;
	}
	
	/**
	 * Creates an array of the own enumerable property names of `object`.
	 *
	 * **Note:** Non-object values are coerced to objects. See the
	 * [ES spec](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
	 * for more details.
	 *
	 * @static
	 * @since 0.1.0
	 * @memberOf _
	 * @category Object
	 * @param {Object} object The object to query.
	 * @returns {Array} Returns the array of property names.
	 * @example
	 *
	 * function Foo() {
	 *   this.a = 1;
	 *   this.b = 2;
	 * }
	 *
	 * Foo.prototype.c = 3;
	 *
	 * _.keys(new Foo);
	 * // => ['a', 'b'] (iteration order is not guaranteed)
	 *
	 * _.keys('hi');
	 * // => ['0', '1']
	 */
	function keys(object) {
	  return isArrayLike(object) ? arrayLikeKeys(object) : baseKeys(object);
	}
	
	function createArrayIterator(coll) {
	    var i = -1;
	    var len = coll.length;
	    return function next() {
	        return ++i < len ? {value: coll[i], key: i} : null;
	    }
	}
	
	function createES2015Iterator(iterator) {
	    var i = -1;
	    return function next() {
	        var item = iterator.next();
	        if (item.done)
	            { return null; }
	        i++;
	        return {value: item.value, key: i};
	    }
	}
	
	function createObjectIterator(obj) {
	    var okeys = keys(obj);
	    var i = -1;
	    var len = okeys.length;
	    return function next() {
	        var key = okeys[++i];
	        return i < len ? {value: obj[key], key: key} : null;
	    };
	}
	
	function iterator(coll) {
	    if (isArrayLike(coll)) {
	        return createArrayIterator(coll);
	    }
	
	    var iterator = getIterator(coll);
	    return iterator ? createES2015Iterator(iterator) : createObjectIterator(coll);
	}
	
	function onlyOnce(fn) {
	    return function() {
	        if (fn === null) { throw new Error("Callback was already called."); }
	        var callFn = fn;
	        fn = null;
	        callFn.apply(this, arguments);
	    };
	}
	
	function _eachOfLimit(limit) {
	    return function (obj, iteratee, callback) {
	        callback = once(callback || noop);
	        if (limit <= 0 || !obj) {
	            return callback(null);
	        }
	        var nextElem = iterator(obj);
	        var done = false;
	        var running = 0;
	
	        function iterateeCallback(err, value) {
	            running -= 1;
	            if (err) {
	                done = true;
	                callback(err);
	            }
	            else if (value === breakLoop || (done && running <= 0)) {
	                done = true;
	                return callback(null);
	            }
	            else {
	                replenish();
	            }
	        }
	
	        function replenish () {
	            while (running < limit && !done) {
	                var elem = nextElem();
	                if (elem === null) {
	                    done = true;
	                    if (running <= 0) {
	                        callback(null);
	                    }
	                    return;
	                }
	                running += 1;
	                iteratee(elem.value, elem.key, onlyOnce(iterateeCallback));
	            }
	        }
	
	        replenish();
	    };
	}
	
	/**
	 * The same as [`eachOf`]{@link module:Collections.eachOf} but runs a maximum of `limit` async operations at a
	 * time.
	 *
	 * @name eachOfLimit
	 * @static
	 * @memberOf module:Collections
	 * @method
	 * @see [async.eachOf]{@link module:Collections.eachOf}
	 * @alias forEachOfLimit
	 * @category Collection
	 * @param {Array|Iterable|Object} coll - A collection to iterate over.
	 * @param {number} limit - The maximum number of async operations at a time.
	 * @param {Function} iteratee - A function to apply to each
	 * item in `coll`. The `key` is the item's key, or index in the case of an
	 * array. The iteratee is passed a `callback(err)` which must be called once it
	 * has completed. If no error has occurred, the callback should be run without
	 * arguments or with an explicit `null` argument. Invoked with
	 * (item, key, callback).
	 * @param {Function} [callback] - A callback which is called when all
	 * `iteratee` functions have finished, or an error occurs. Invoked with (err).
	 */
	function eachOfLimit(coll, limit, iteratee, callback) {
	    _eachOfLimit(limit)(coll, iteratee, callback);
	}
	
	function doLimit(fn, limit) {
	    return function (iterable, iteratee, callback) {
	        return fn(iterable, limit, iteratee, callback);
	    };
	}
	
	// eachOf implementation optimized for array-likes
	function eachOfArrayLike(coll, iteratee, callback) {
	    callback = once(callback || noop);
	    var index = 0,
	        completed = 0,
	        length = coll.length;
	    if (length === 0) {
	        callback(null);
	    }
	
	    function iteratorCallback(err, value) {
	        if (err) {
	            callback(err);
	        } else if ((++completed === length) || value === breakLoop) {
	            callback(null);
	        }
	    }
	
	    for (; index < length; index++) {
	        iteratee(coll[index], index, onlyOnce(iteratorCallback));
	    }
	}
	
	// a generic version of eachOf which can handle array, object, and iterator cases.
	var eachOfGeneric = doLimit(eachOfLimit, Infinity);
	
	/**
	 * Like [`each`]{@link module:Collections.each}, except that it passes the key (or index) as the second argument
	 * to the iteratee.
	 *
	 * @name eachOf
	 * @static
	 * @memberOf module:Collections
	 * @method
	 * @alias forEachOf
	 * @category Collection
	 * @see [async.each]{@link module:Collections.each}
	 * @param {Array|Iterable|Object} coll - A collection to iterate over.
	 * @param {Function} iteratee - A function to apply to each
	 * item in `coll`. The `key` is the item's key, or index in the case of an
	 * array. The iteratee is passed a `callback(err)` which must be called once it
	 * has completed. If no error has occurred, the callback should be run without
	 * arguments or with an explicit `null` argument. Invoked with
	 * (item, key, callback).
	 * @param {Function} [callback] - A callback which is called when all
	 * `iteratee` functions have finished, or an error occurs. Invoked with (err).
	 * @example
	 *
	 * var obj = {dev: "/dev.json", test: "/test.json", prod: "/prod.json"};
	 * var configs = {};
	 *
	 * async.forEachOf(obj, function (value, key, callback) {
	 *     fs.readFile(__dirname + value, "utf8", function (err, data) {
	 *         if (err) return callback(err);
	 *         try {
	 *             configs[key] = JSON.parse(data);
	 *         } catch (e) {
	 *             return callback(e);
	 *         }
	 *         callback();
	 *     });
	 * }, function (err) {
	 *     if (err) console.error(err.message);
	 *     // configs is now a map of JSON data
	 *     doSomethingWith(configs);
	 * });
	 */
	var eachOf = function(coll, iteratee, callback) {
	    var eachOfImplementation = isArrayLike(coll) ? eachOfArrayLike : eachOfGeneric;
	    eachOfImplementation(coll, iteratee, callback);
	};
	
	function doParallel(fn) {
	    return function (obj, iteratee, callback) {
	        return fn(eachOf, obj, iteratee, callback);
	    };
	}
	
	function _asyncMap(eachfn, arr, iteratee, callback) {
	    callback = callback || noop;
	    arr = arr || [];
	    var results = [];
	    var counter = 0;
	
	    eachfn(arr, function (value, _, callback) {
	        var index = counter++;
	        iteratee(value, function (err, v) {
	            results[index] = v;
	            callback(err);
	        });
	    }, function (err) {
	        callback(err, results);
	    });
	}
	
	/**
	 * Produces a new collection of values by mapping each value in `coll` through
	 * the `iteratee` function. The `iteratee` is called with an item from `coll`
	 * and a callback for when it has finished processing. Each of these callback
	 * takes 2 arguments: an `error`, and the transformed item from `coll`. If
	 * `iteratee` passes an error to its callback, the main `callback` (for the
	 * `map` function) is immediately called with the error.
	 *
	 * Note, that since this function applies the `iteratee` to each item in
	 * parallel, there is no guarantee that the `iteratee` functions will complete
	 * in order. However, the results array will be in the same order as the
	 * original `coll`.
	 *
	 * If `map` is passed an Object, the results will be an Array.  The results
	 * will roughly be in the order of the original Objects' keys (but this can
	 * vary across JavaScript engines)
	 *
	 * @name map
	 * @static
	 * @memberOf module:Collections
	 * @method
	 * @category Collection
	 * @param {Array|Iterable|Object} coll - A collection to iterate over.
	 * @param {Function} iteratee - A function to apply to each item in `coll`.
	 * The iteratee is passed a `callback(err, transformed)` which must be called
	 * once it has completed with an error (which can be `null`) and a
	 * transformed item. Invoked with (item, callback).
	 * @param {Function} [callback] - A callback which is called when all `iteratee`
	 * functions have finished, or an error occurs. Results is an Array of the
	 * transformed items from the `coll`. Invoked with (err, results).
	 * @example
	 *
	 * async.map(['file1','file2','file3'], fs.stat, function(err, results) {
	 *     // results is now an array of stats for each file
	 * });
	 */
	var map = doParallel(_asyncMap);
	
	/**
	 * Applies the provided arguments to each function in the array, calling
	 * `callback` after all functions have completed. If you only provide the first
	 * argument, `fns`, then it will return a function which lets you pass in the
	 * arguments as if it were a single function call. If more arguments are
	 * provided, `callback` is required while `args` is still optional.
	 *
	 * @name applyEach
	 * @static
	 * @memberOf module:ControlFlow
	 * @method
	 * @category Control Flow
	 * @param {Array|Iterable|Object} fns - A collection of asynchronous functions
	 * to all call with the same arguments
	 * @param {...*} [args] - any number of separate arguments to pass to the
	 * function.
	 * @param {Function} [callback] - the final argument should be the callback,
	 * called when all functions have completed processing.
	 * @returns {Function} - If only the first argument, `fns`, is provided, it will
	 * return a function which lets you pass in the arguments as if it were a single
	 * function call. The signature is `(..args, callback)`. If invoked with any
	 * arguments, `callback` is required.
	 * @example
	 *
	 * async.applyEach([enableSearch, updateSchema], 'bucket', callback);
	 *
	 * // partial application example:
	 * async.each(
	 *     buckets,
	 *     async.applyEach([enableSearch, updateSchema]),
	 *     callback
	 * );
	 */
	applyEach$1(map);
	
	function doParallelLimit(fn) {
	    return function (obj, limit, iteratee, callback) {
	        return fn(_eachOfLimit(limit), obj, iteratee, callback);
	    };
	}
	
	/**
	 * The same as [`map`]{@link module:Collections.map} but runs a maximum of `limit` async operations at a time.
	 *
	 * @name mapLimit
	 * @static
	 * @memberOf module:Collections
	 * @method
	 * @see [async.map]{@link module:Collections.map}
	 * @category Collection
	 * @param {Array|Iterable|Object} coll - A collection to iterate over.
	 * @param {number} limit - The maximum number of async operations at a time.
	 * @param {Function} iteratee - A function to apply to each item in `coll`.
	 * The iteratee is passed a `callback(err, transformed)` which must be called
	 * once it has completed with an error (which can be `null`) and a transformed
	 * item. Invoked with (item, callback).
	 * @param {Function} [callback] - A callback which is called when all `iteratee`
	 * functions have finished, or an error occurs. Results is an array of the
	 * transformed items from the `coll`. Invoked with (err, results).
	 */
	var mapLimit = doParallelLimit(_asyncMap);
	
	/**
	 * The same as [`map`]{@link module:Collections.map} but runs only a single async operation at a time.
	 *
	 * @name mapSeries
	 * @static
	 * @memberOf module:Collections
	 * @method
	 * @see [async.map]{@link module:Collections.map}
	 * @category Collection
	 * @param {Array|Iterable|Object} coll - A collection to iterate over.
	 * @param {Function} iteratee - A function to apply to each item in `coll`.
	 * The iteratee is passed a `callback(err, transformed)` which must be called
	 * once it has completed with an error (which can be `null`) and a
	 * transformed item. Invoked with (item, callback).
	 * @param {Function} [callback] - A callback which is called when all `iteratee`
	 * functions have finished, or an error occurs. Results is an array of the
	 * transformed items from the `coll`. Invoked with (err, results).
	 */
	var mapSeries = doLimit(mapLimit, 1);
	
	/**
	 * The same as [`applyEach`]{@link module:ControlFlow.applyEach} but runs only a single async operation at a time.
	 *
	 * @name applyEachSeries
	 * @static
	 * @memberOf module:ControlFlow
	 * @method
	 * @see [async.applyEach]{@link module:ControlFlow.applyEach}
	 * @category Control Flow
	 * @param {Array|Iterable|Object} fns - A collection of asynchronous functions to all
	 * call with the same arguments
	 * @param {...*} [args] - any number of separate arguments to pass to the
	 * function.
	 * @param {Function} [callback] - the final argument should be the callback,
	 * called when all functions have completed processing.
	 * @returns {Function} - If only the first argument is provided, it will return
	 * a function which lets you pass in the arguments as if it were a single
	 * function call.
	 */
	applyEach$1(mapSeries);
	
	/**
	 * Creates a continuation function with some arguments already applied.
	 *
	 * Useful as a shorthand when combined with other control flow functions. Any
	 * arguments passed to the returned function are added to the arguments
	 * originally passed to apply.
	 *
	 * @name apply
	 * @static
	 * @memberOf module:Utils
	 * @method
	 * @category Util
	 * @param {Function} function - The function you want to eventually apply all
	 * arguments to. Invokes with (arguments...).
	 * @param {...*} arguments... - Any number of arguments to automatically apply
	 * when the continuation is called.
	 * @example
	 *
	 * // using apply
	 * async.parallel([
	 *     async.apply(fs.writeFile, 'testfile1', 'test1'),
	 *     async.apply(fs.writeFile, 'testfile2', 'test2')
	 * ]);
	 *
	 *
	 * // the same process without using apply
	 * async.parallel([
	 *     function(callback) {
	 *         fs.writeFile('testfile1', 'test1', callback);
	 *     },
	 *     function(callback) {
	 *         fs.writeFile('testfile2', 'test2', callback);
	 *     }
	 * ]);
	 *
	 * // It's possible to pass any number of additional arguments when calling the
	 * // continuation:
	 *
	 * node> var fn = async.apply(sys.puts, 'one');
	 * node> fn('two', 'three');
	 * one
	 * two
	 * three
	 */
	rest(function(fn, args) {
	    return rest(function(callArgs) {
	        return fn.apply(null, args.concat(callArgs));
	    });
	});
	
	/**
	 * A specialized version of `_.forEach` for arrays without support for
	 * iteratee shorthands.
	 *
	 * @private
	 * @param {Array} [array] The array to iterate over.
	 * @param {Function} iteratee The function invoked per iteration.
	 * @returns {Array} Returns `array`.
	 */
	function arrayEach(array, iteratee) {
	  var index = -1,
	      length = array == null ? 0 : array.length;
	
	  while (++index < length) {
	    if (iteratee(array[index], index, array) === false) {
	      break;
	    }
	  }
	  return array;
	}
	
	/**
	 * Creates a base function for methods like `_.forIn` and `_.forOwn`.
	 *
	 * @private
	 * @param {boolean} [fromRight] Specify iterating from right to left.
	 * @returns {Function} Returns the new base function.
	 */
	function createBaseFor(fromRight) {
	  return function(object, iteratee, keysFunc) {
	    var index = -1,
	        iterable = Object(object),
	        props = keysFunc(object),
	        length = props.length;
	
	    while (length--) {
	      var key = props[fromRight ? length : ++index];
	      if (iteratee(iterable[key], key, iterable) === false) {
	        break;
	      }
	    }
	    return object;
	  };
	}
	
	/**
	 * The base implementation of `baseForOwn` which iterates over `object`
	 * properties returned by `keysFunc` and invokes `iteratee` for each property.
	 * Iteratee functions may exit iteration early by explicitly returning `false`.
	 *
	 * @private
	 * @param {Object} object The object to iterate over.
	 * @param {Function} iteratee The function invoked per iteration.
	 * @param {Function} keysFunc The function to get the keys of `object`.
	 * @returns {Object} Returns `object`.
	 */
	var baseFor = createBaseFor();
	
	/**
	 * The base implementation of `_.forOwn` without support for iteratee shorthands.
	 *
	 * @private
	 * @param {Object} object The object to iterate over.
	 * @param {Function} iteratee The function invoked per iteration.
	 * @returns {Object} Returns `object`.
	 */
	function baseForOwn(object, iteratee) {
	  return object && baseFor(object, iteratee, keys);
	}
	
	/**
	 * The base implementation of `_.findIndex` and `_.findLastIndex` without
	 * support for iteratee shorthands.
	 *
	 * @private
	 * @param {Array} array The array to inspect.
	 * @param {Function} predicate The function invoked per iteration.
	 * @param {number} fromIndex The index to search from.
	 * @param {boolean} [fromRight] Specify iterating from right to left.
	 * @returns {number} Returns the index of the matched value, else `-1`.
	 */
	function baseFindIndex(array, predicate, fromIndex, fromRight) {
	  var length = array.length,
	      index = fromIndex + (fromRight ? 1 : -1);
	
	  while ((fromRight ? index-- : ++index < length)) {
	    if (predicate(array[index], index, array)) {
	      return index;
	    }
	  }
	  return -1;
	}
	
	/**
	 * The base implementation of `_.isNaN` without support for number objects.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is `NaN`, else `false`.
	 */
	function baseIsNaN(value) {
	  return value !== value;
	}
	
	/**
	 * A specialized version of `_.indexOf` which performs strict equality
	 * comparisons of values, i.e. `===`.
	 *
	 * @private
	 * @param {Array} array The array to inspect.
	 * @param {*} value The value to search for.
	 * @param {number} fromIndex The index to search from.
	 * @returns {number} Returns the index of the matched value, else `-1`.
	 */
	function strictIndexOf(array, value, fromIndex) {
	  var index = fromIndex - 1,
	      length = array.length;
	
	  while (++index < length) {
	    if (array[index] === value) {
	      return index;
	    }
	  }
	  return -1;
	}
	
	/**
	 * The base implementation of `_.indexOf` without `fromIndex` bounds checks.
	 *
	 * @private
	 * @param {Array} array The array to inspect.
	 * @param {*} value The value to search for.
	 * @param {number} fromIndex The index to search from.
	 * @returns {number} Returns the index of the matched value, else `-1`.
	 */
	function baseIndexOf(array, value, fromIndex) {
	  return value === value
	    ? strictIndexOf(array, value, fromIndex)
	    : baseFindIndex(array, baseIsNaN, fromIndex);
	}
	
	/**
	 * Determines the best order for running the functions in `tasks`, based on
	 * their requirements. Each function can optionally depend on other functions
	 * being completed first, and each function is run as soon as its requirements
	 * are satisfied.
	 *
	 * If any of the functions pass an error to their callback, the `auto` sequence
	 * will stop. Further tasks will not execute (so any other functions depending
	 * on it will not run), and the main `callback` is immediately called with the
	 * error.
	 *
	 * Functions also receive an object containing the results of functions which
	 * have completed so far as the first argument, if they have dependencies. If a
	 * task function has no dependencies, it will only be passed a callback.
	 *
	 * @name auto
	 * @static
	 * @memberOf module:ControlFlow
	 * @method
	 * @category Control Flow
	 * @param {Object} tasks - An object. Each of its properties is either a
	 * function or an array of requirements, with the function itself the last item
	 * in the array. The object's key of a property serves as the name of the task
	 * defined by that property, i.e. can be used when specifying requirements for
	 * other tasks. The function receives one or two arguments:
	 * * a `results` object, containing the results of the previously executed
	 *   functions, only passed if the task has any dependencies,
	 * * a `callback(err, result)` function, which must be called when finished,
	 *   passing an `error` (which can be `null`) and the result of the function's
	 *   execution.
	 * @param {number} [concurrency=Infinity] - An optional `integer` for
	 * determining the maximum number of tasks that can be run in parallel. By
	 * default, as many as possible.
	 * @param {Function} [callback] - An optional callback which is called when all
	 * the tasks have been completed. It receives the `err` argument if any `tasks`
	 * pass an error to their callback. Results are always returned; however, if an
	 * error occurs, no further `tasks` will be performed, and the results object
	 * will only contain partial results. Invoked with (err, results).
	 * @returns undefined
	 * @example
	 *
	 * async.auto({
	 *     // this function will just be passed a callback
	 *     readData: async.apply(fs.readFile, 'data.txt', 'utf-8'),
	 *     showData: ['readData', function(results, cb) {
	 *         // results.readData is the file's contents
	 *         // ...
	 *     }]
	 * }, callback);
	 *
	 * async.auto({
	 *     get_data: function(callback) {
	 *         console.log('in get_data');
	 *         // async code to get some data
	 *         callback(null, 'data', 'converted to array');
	 *     },
	 *     make_folder: function(callback) {
	 *         console.log('in make_folder');
	 *         // async code to create a directory to store a file in
	 *         // this is run at the same time as getting the data
	 *         callback(null, 'folder');
	 *     },
	 *     write_file: ['get_data', 'make_folder', function(results, callback) {
	 *         console.log('in write_file', JSON.stringify(results));
	 *         // once there is some data and the directory exists,
	 *         // write the data to a file in the directory
	 *         callback(null, 'filename');
	 *     }],
	 *     email_link: ['write_file', function(results, callback) {
	 *         console.log('in email_link', JSON.stringify(results));
	 *         // once the file is written let's email a link to it...
	 *         // results.write_file contains the filename returned by write_file.
	 *         callback(null, {'file':results.write_file, 'email':'user@example.com'});
	 *     }]
	 * }, function(err, results) {
	 *     console.log('err = ', err);
	 *     console.log('results = ', results);
	 * });
	 */
	
	/**
	 * A specialized version of `_.map` for arrays without support for iteratee
	 * shorthands.
	 *
	 * @private
	 * @param {Array} [array] The array to iterate over.
	 * @param {Function} iteratee The function invoked per iteration.
	 * @returns {Array} Returns the new mapped array.
	 */
	
	/**
	 * The base implementation of `_.slice` without an iteratee call guard.
	 *
	 * @private
	 * @param {Array} array The array to slice.
	 * @param {number} [start=0] The start position.
	 * @param {number} [end=array.length] The end position.
	 * @returns {Array} Returns the slice of `array`.
	 */
	
	/**
	 * Converts an ASCII `string` to an array.
	 *
	 * @private
	 * @param {string} string The string to convert.
	 * @returns {Array} Returns the converted array.
	 */
	
	/** Used to compose unicode character classes. */
	
	/** Used to compose unicode character classes. */
	var rsAstralRange$1 = '\\ud800-\\udfff';
	var rsComboMarksRange$1 = '\\u0300-\\u036f';
	var reComboHalfMarksRange$1 = '\\ufe20-\\ufe2f';
	var rsComboSymbolsRange$1 = '\\u20d0-\\u20ff';
	var rsComboRange$1 = rsComboMarksRange$1 + reComboHalfMarksRange$1 + rsComboSymbolsRange$1;
	var rsVarRange$1 = '\\ufe0e\\ufe0f';
	
	/** Used to compose unicode capture groups. */
	var rsAstral = '[' + rsAstralRange$1 + ']';
	var rsCombo = '[' + rsComboRange$1 + ']';
	var rsFitz = '\\ud83c[\\udffb-\\udfff]';
	var rsModifier = '(?:' + rsCombo + '|' + rsFitz + ')';
	var rsNonAstral = '[^' + rsAstralRange$1 + ']';
	var rsRegional = '(?:\\ud83c[\\udde6-\\uddff]){2}';
	var rsSurrPair = '[\\ud800-\\udbff][\\udc00-\\udfff]';
	var rsZWJ$1 = '\\u200d';
	
	/** Used to compose unicode regexes. */
	var reOptMod = rsModifier + '?';
	var rsOptVar = '[' + rsVarRange$1 + ']?';
	var rsOptJoin = '(?:' + rsZWJ$1 + '(?:' + [rsNonAstral, rsRegional, rsSurrPair].join('|') + ')' + rsOptVar + reOptMod + ')*';
	var rsSeq = rsOptVar + reOptMod + rsOptJoin;
	var rsSymbol = '(?:' + [rsNonAstral + rsCombo + '?', rsCombo, rsRegional, rsSurrPair, rsAstral].join('|') + ')';
	
	var hasSetImmediate = typeof setImmediate === 'function' && setImmediate;
	var hasNextTick = typeof process === 'object' && typeof process.nextTick === 'function';
	
	function fallback(fn) {
	    setTimeout(fn, 0);
	}
	
	function wrap(defer) {
	    return rest(function (fn, args) {
	        defer(function () {
	            fn.apply(null, args);
	        });
	    });
	}
	
	var _defer;
	
	if (hasSetImmediate) {
	    _defer = setImmediate;
	} else if (hasNextTick) {
	    _defer = process.nextTick;
	} else {
	    _defer = fallback;
	}
	
	wrap(_defer);
	
	// Simple doubly linked list (https://en.wikipedia.org/wiki/Doubly_linked_list) implementation
	// used for queues. This implementation assumes that the node provided by the user can be modified
	// to adjust the next and last properties. We implement only the minimal functionality
	// for queue support.
	
	/**
	 * The same as [`eachOf`]{@link module:Collections.eachOf} but runs only a single async operation at a time.
	 *
	 * @name eachOfSeries
	 * @static
	 * @memberOf module:Collections
	 * @method
	 * @see [async.eachOf]{@link module:Collections.eachOf}
	 * @alias forEachOfSeries
	 * @category Collection
	 * @param {Array|Iterable|Object} coll - A collection to iterate over.
	 * @param {Function} iteratee - A function to apply to each item in `coll`. The
	 * `key` is the item's key, or index in the case of an array. The iteratee is
	 * passed a `callback(err)` which must be called once it has completed. If no
	 * error has occurred, the callback should be run without arguments or with an
	 * explicit `null` argument. Invoked with (item, key, callback).
	 * @param {Function} [callback] - A callback which is called when all `iteratee`
	 * functions have finished, or an error occurs. Invoked with (err).
	 */
	var eachOfSeries = doLimit(eachOfLimit, 1);
	
	/**
	 * Reduces `coll` into a single value using an async `iteratee` to return each
	 * successive step. `memo` is the initial state of the reduction. This function
	 * only operates in series.
	 *
	 * For performance reasons, it may make sense to split a call to this function
	 * into a parallel map, and then use the normal `Array.prototype.reduce` on the
	 * results. This function is for situations where each step in the reduction
	 * needs to be async; if you can get the data before reducing it, then it's
	 * probably a good idea to do so.
	 *
	 * @name reduce
	 * @static
	 * @memberOf module:Collections
	 * @method
	 * @alias inject
	 * @alias foldl
	 * @category Collection
	 * @param {Array|Iterable|Object} coll - A collection to iterate over.
	 * @param {*} memo - The initial state of the reduction.
	 * @param {Function} iteratee - A function applied to each item in the
	 * array to produce the next step in the reduction. The `iteratee` is passed a
	 * `callback(err, reduction)` which accepts an optional error as its first
	 * argument, and the state of the reduction as the second. If an error is
	 * passed to the callback, the reduction is stopped and the main `callback` is
	 * immediately called with the error. Invoked with (memo, item, callback).
	 * @param {Function} [callback] - A callback which is called after all the
	 * `iteratee` functions have finished. Result is the reduced value. Invoked with
	 * (err, result).
	 * @example
	 *
	 * async.reduce([1,2,3], 0, function(memo, item, callback) {
	 *     // pointless async:
	 *     process.nextTick(function() {
	 *         callback(null, memo + item)
	 *     });
	 * }, function(err, result) {
	 *     // result is now equal to the last value of memo, which is 6
	 * });
	 */
	function reduce(coll, memo, iteratee, callback) {
	    callback = once(callback || noop);
	    eachOfSeries(coll, function(x, i, callback) {
	        iteratee(memo, x, function(err, v) {
	            memo = v;
	            callback(err);
	        });
	    }, function(err) {
	        callback(err, memo);
	    });
	}
	
	/**
	 * Version of the compose function that is more natural to read. Each function
	 * consumes the return value of the previous function. It is the equivalent of
	 * [compose]{@link module:ControlFlow.compose} with the arguments reversed.
	 *
	 * Each function is executed with the `this` binding of the composed function.
	 *
	 * @name seq
	 * @static
	 * @memberOf module:ControlFlow
	 * @method
	 * @see [async.compose]{@link module:ControlFlow.compose}
	 * @category Control Flow
	 * @param {...Function} functions - the asynchronous functions to compose
	 * @returns {Function} a function that composes the `functions` in order
	 * @example
	 *
	 * // Requires lodash (or underscore), express3 and dresende's orm2.
	 * // Part of an app, that fetches cats of the logged user.
	 * // This example uses `seq` function to avoid overnesting and error
	 * // handling clutter.
	 * app.get('/cats', function(request, response) {
	 *     var User = request.models.User;
	 *     async.seq(
	 *         _.bind(User.get, User),  // 'User.get' has signature (id, callback(err, data))
	 *         function(user, fn) {
	 *             user.getCats(fn);      // 'getCats' has signature (callback(err, data))
	 *         }
	 *     )(req.session.user_id, function (err, cats) {
	 *         if (err) {
	 *             console.error(err);
	 *             response.json({ status: 'error', message: err.message });
	 *         } else {
	 *             response.json({ status: 'ok', message: 'Cats found', data: cats });
	 *         }
	 *     });
	 * });
	 */
	var seq = rest(function seq(functions) {
	    return rest(function(args) {
	        var that = this;
	
	        var cb = args[args.length - 1];
	        if (typeof cb == 'function') {
	            args.pop();
	        } else {
	            cb = noop;
	        }
	
	        reduce(functions, args, function(newargs, fn, cb) {
	            fn.apply(that, newargs.concat(rest(function(err, nextargs) {
	                cb(err, nextargs);
	            })));
	        },
	        function(err, results) {
	            cb.apply(that, [err].concat(results));
	        });
	    });
	});
	
	/**
	 * Creates a function which is a composition of the passed asynchronous
	 * functions. Each function consumes the return value of the function that
	 * follows. Composing functions `f()`, `g()`, and `h()` would produce the result
	 * of `f(g(h()))`, only this version uses callbacks to obtain the return values.
	 *
	 * Each function is executed with the `this` binding of the composed function.
	 *
	 * @name compose
	 * @static
	 * @memberOf module:ControlFlow
	 * @method
	 * @category Control Flow
	 * @param {...Function} functions - the asynchronous functions to compose
	 * @returns {Function} an asynchronous function that is the composed
	 * asynchronous `functions`
	 * @example
	 *
	 * function add1(n, callback) {
	 *     setTimeout(function () {
	 *         callback(null, n + 1);
	 *     }, 10);
	 * }
	 *
	 * function mul3(n, callback) {
	 *     setTimeout(function () {
	 *         callback(null, n * 3);
	 *     }, 10);
	 * }
	 *
	 * var add1mul3 = async.compose(mul3, add1);
	 * add1mul3(4, function (err, result) {
	 *     // result now equals 15
	 * });
	 */
	rest(function(args) {
	    return seq.apply(null, args.reverse());
	});
	
	/**
	 * Applies `iteratee` to each item in `coll`, concatenating the results. Returns
	 * the concatenated list. The `iteratee`s are called in parallel, and the
	 * results are concatenated as they return. There is no guarantee that the
	 * results array will be returned in the original order of `coll` passed to the
	 * `iteratee` function.
	 *
	 * @name concat
	 * @static
	 * @memberOf module:Collections
	 * @method
	 * @category Collection
	 * @param {Array|Iterable|Object} coll - A collection to iterate over.
	 * @param {Function} iteratee - A function to apply to each item in `coll`.
	 * The iteratee is passed a `callback(err, results)` which must be called once
	 * it has completed with an error (which can be `null`) and an array of results.
	 * Invoked with (item, callback).
	 * @param {Function} [callback(err)] - A callback which is called after all the
	 * `iteratee` functions have finished, or an error occurs. Results is an array
	 * containing the concatenated results of the `iteratee` function. Invoked with
	 * (err, results).
	 * @example
	 *
	 * async.concat(['dir1','dir2','dir3'], fs.readdir, function(err, files) {
	 *     // files is now a list of filenames that exist in the 3 directories
	 * });
	 */
	
	/**
	 * The same as [`concat`]{@link module:Collections.concat} but runs only a single async operation at a time.
	 *
	 * @name concatSeries
	 * @static
	 * @memberOf module:Collections
	 * @method
	 * @see [async.concat]{@link module:Collections.concat}
	 * @category Collection
	 * @param {Array|Iterable|Object} coll - A collection to iterate over.
	 * @param {Function} iteratee - A function to apply to each item in `coll`.
	 * The iteratee is passed a `callback(err, results)` which must be called once
	 * it has completed with an error (which can be `null`) and an array of results.
	 * Invoked with (item, callback).
	 * @param {Function} [callback(err)] - A callback which is called after all the
	 * `iteratee` functions have finished, or an error occurs. Results is an array
	 * containing the concatenated results of the `iteratee` function. Invoked with
	 * (err, results).
	 */
	
	/**
	 * Returns a function that when called, calls-back with the values provided.
	 * Useful as the first function in a [`waterfall`]{@link module:ControlFlow.waterfall}, or for plugging values in to
	 * [`auto`]{@link module:ControlFlow.auto}.
	 *
	 * @name constant
	 * @static
	 * @memberOf module:Utils
	 * @method
	 * @category Util
	 * @param {...*} arguments... - Any number of arguments to automatically invoke
	 * callback with.
	 * @returns {Function} Returns a function that when invoked, automatically
	 * invokes the callback with the previous given arguments.
	 * @example
	 *
	 * async.waterfall([
	 *     async.constant(42),
	 *     function (value, next) {
	 *         // value === 42
	 *     },
	 *     //...
	 * ], callback);
	 *
	 * async.waterfall([
	 *     async.constant(filename, "utf8"),
	 *     fs.readFile,
	 *     function (fileData, next) {
	 *         //...
	 *     }
	 *     //...
	 * ], callback);
	 *
	 * async.auto({
	 *     hostname: async.constant("https://server.net/"),
	 *     port: findFreePort,
	 *     launchServer: ["hostname", "port", function (options, cb) {
	 *         startServer(options, cb);
	 *     }],
	 *     //...
	 * }, callback);
	 */
	rest(function(values) {
	    var args = [null].concat(values);
	    return initialParams(function (ignoredArgs, callback) {
	        return callback.apply(this, args);
	    });
	});
	
	/**
	 * Returns the first value in `coll` that passes an async truth test. The
	 * `iteratee` is applied in parallel, meaning the first iteratee to return
	 * `true` will fire the detect `callback` with that result. That means the
	 * result might not be the first item in the original `coll` (in terms of order)
	 * that passes the test.
	
	 * If order within the original `coll` is important, then look at
	 * [`detectSeries`]{@link module:Collections.detectSeries}.
	 *
	 * @name detect
	 * @static
	 * @memberOf module:Collections
	 * @method
	 * @alias find
	 * @category Collections
	 * @param {Array|Iterable|Object} coll - A collection to iterate over.
	 * @param {Function} iteratee - A truth test to apply to each item in `coll`.
	 * The iteratee is passed a `callback(err, truthValue)` which must be called
	 * with a boolean argument once it has completed. Invoked with (item, callback).
	 * @param {Function} [callback] - A callback which is called as soon as any
	 * iteratee returns `true`, or after all the `iteratee` functions have finished.
	 * Result will be the first item in the array that passes the truth test
	 * (iteratee) or the value `undefined` if none passed. Invoked with
	 * (err, result).
	 * @example
	 *
	 * async.detect(['file1','file2','file3'], function(filePath, callback) {
	 *     fs.access(filePath, function(err) {
	 *         callback(null, !err)
	 *     });
	 * }, function(err, result) {
	 *     // result now equals the first file in the list that exists
	 * });
	 */
	
	/**
	 * The same as [`detect`]{@link module:Collections.detect} but runs a maximum of `limit` async operations at a
	 * time.
	 *
	 * @name detectLimit
	 * @static
	 * @memberOf module:Collections
	 * @method
	 * @see [async.detect]{@link module:Collections.detect}
	 * @alias findLimit
	 * @category Collections
	 * @param {Array|Iterable|Object} coll - A collection to iterate over.
	 * @param {number} limit - The maximum number of async operations at a time.
	 * @param {Function} iteratee - A truth test to apply to each item in `coll`.
	 * The iteratee is passed a `callback(err, truthValue)` which must be called
	 * with a boolean argument once it has completed. Invoked with (item, callback).
	 * @param {Function} [callback] - A callback which is called as soon as any
	 * iteratee returns `true`, or after all the `iteratee` functions have finished.
	 * Result will be the first item in the array that passes the truth test
	 * (iteratee) or the value `undefined` if none passed. Invoked with
	 * (err, result).
	 */
	
	/**
	 * The same as [`detect`]{@link module:Collections.detect} but runs only a single async operation at a time.
	 *
	 * @name detectSeries
	 * @static
	 * @memberOf module:Collections
	 * @method
	 * @see [async.detect]{@link module:Collections.detect}
	 * @alias findSeries
	 * @category Collections
	 * @param {Array|Iterable|Object} coll - A collection to iterate over.
	 * @param {Function} iteratee - A truth test to apply to each item in `coll`.
	 * The iteratee is passed a `callback(err, truthValue)` which must be called
	 * with a boolean argument once it has completed. Invoked with (item, callback).
	 * @param {Function} [callback] - A callback which is called as soon as any
	 * iteratee returns `true`, or after all the `iteratee` functions have finished.
	 * Result will be the first item in the array that passes the truth test
	 * (iteratee) or the value `undefined` if none passed. Invoked with
	 * (err, result).
	 */
	
	function consoleFunc(name) {
	    return rest(function (fn, args) {
	        fn.apply(null, args.concat(rest(function (err, args) {
	            if (typeof console === 'object') {
	                if (err) {
	                    if (console.error) {
	                        console.error(err);
	                    }
	                }
	                else if (console[name]) {
	                    arrayEach(args, function (x) {
	                        console[name](x);
	                    });
	                }
	            }
	        })));
	    });
	}
	
	/**
	 * Logs the result of an `async` function to the `console` using `console.dir`
	 * to display the properties of the resulting object. Only works in Node.js or
	 * in browsers that support `console.dir` and `console.error` (such as FF and
	 * Chrome). If multiple arguments are returned from the async function,
	 * `console.dir` is called on each argument in order.
	 *
	 * @name dir
	 * @static
	 * @memberOf module:Utils
	 * @method
	 * @category Util
	 * @param {Function} function - The function you want to eventually apply all
	 * arguments to.
	 * @param {...*} arguments... - Any number of arguments to apply to the function.
	 * @example
	 *
	 * // in a module
	 * var hello = function(name, callback) {
	 *     setTimeout(function() {
	 *         callback(null, {hello: name});
	 *     }, 1000);
	 * };
	 *
	 * // in the node repl
	 * node> async.dir(hello, 'world');
	 * {hello: 'world'}
	 */
	consoleFunc('dir');
	
	function _withoutIndex(iteratee) {
	    return function (value, index, callback) {
	        return iteratee(value, callback);
	    };
	}
	
	/**
	 * Applies the function `iteratee` to each item in `coll`, in parallel.
	 * The `iteratee` is called with an item from the list, and a callback for when
	 * it has finished. If the `iteratee` passes an error to its `callback`, the
	 * main `callback` (for the `each` function) is immediately called with the
	 * error.
	 *
	 * Note, that since this function applies `iteratee` to each item in parallel,
	 * there is no guarantee that the iteratee functions will complete in order.
	 *
	 * @name each
	 * @static
	 * @memberOf module:Collections
	 * @method
	 * @alias forEach
	 * @category Collection
	 * @param {Array|Iterable|Object} coll - A collection to iterate over.
	 * @param {Function} iteratee - A function to apply to each item
	 * in `coll`. The iteratee is passed a `callback(err)` which must be called once
	 * it has completed. If no error has occurred, the `callback` should be run
	 * without arguments or with an explicit `null` argument. The array index is not
	 * passed to the iteratee. Invoked with (item, callback). If you need the index,
	 * use `eachOf`.
	 * @param {Function} [callback] - A callback which is called when all
	 * `iteratee` functions have finished, or an error occurs. Invoked with (err).
	 * @example
	 *
	 * // assuming openFiles is an array of file names and saveFile is a function
	 * // to save the modified contents of that file:
	 *
	 * async.each(openFiles, saveFile, function(err){
	 *   // if any of the saves produced an error, err would equal that error
	 * });
	 *
	 * // assuming openFiles is an array of file names
	 * async.each(openFiles, function(file, callback) {
	 *
	 *     // Perform operation on file here.
	 *     console.log('Processing file ' + file);
	 *
	 *     if( file.length > 32 ) {
	 *       console.log('This file name is too long');
	 *       callback('File name too long');
	 *     } else {
	 *       // Do work to process file here
	 *       console.log('File processed');
	 *       callback();
	 *     }
	 * }, function(err) {
	 *     // if any of the file processing produced an error, err would equal that error
	 *     if( err ) {
	 *       // One of the iterations produced an error.
	 *       // All processing will now stop.
	 *       console.log('A file failed to process');
	 *     } else {
	 *       console.log('All files have been processed successfully');
	 *     }
	 * });
	 */
	function eachLimit(coll, iteratee, callback) {
	    eachOf(coll, _withoutIndex(iteratee), callback);
	}
	
	/**
	 * The same as [`each`]{@link module:Collections.each} but runs only a single async operation at a time.
	 *
	 * @name eachSeries
	 * @static
	 * @memberOf module:Collections
	 * @method
	 * @see [async.each]{@link module:Collections.each}
	 * @alias forEachSeries
	 * @category Collection
	 * @param {Array|Iterable|Object} coll - A collection to iterate over.
	 * @param {Function} iteratee - A function to apply to each
	 * item in `coll`. The iteratee is passed a `callback(err)` which must be called
	 * once it has completed. If no error has occurred, the `callback` should be run
	 * without arguments or with an explicit `null` argument. The array index is
	 * not passed to the iteratee. Invoked with (item, callback). If you need the
	 * index, use `eachOfSeries`.
	 * @param {Function} [callback] - A callback which is called when all
	 * `iteratee` functions have finished, or an error occurs. Invoked with (err).
	 */
	
	/**
	 * Returns `true` if every element in `coll` satisfies an async test. If any
	 * iteratee call returns `false`, the main `callback` is immediately called.
	 *
	 * @name every
	 * @static
	 * @memberOf module:Collections
	 * @method
	 * @alias all
	 * @category Collection
	 * @param {Array|Iterable|Object} coll - A collection to iterate over.
	 * @param {Function} iteratee - A truth test to apply to each item in the
	 * collection in parallel. The iteratee is passed a `callback(err, truthValue)`
	 * which must be called with a  boolean argument once it has completed. Invoked
	 * with (item, callback).
	 * @param {Function} [callback] - A callback which is called after all the
	 * `iteratee` functions have finished. Result will be either `true` or `false`
	 * depending on the values of the async tests. Invoked with (err, result).
	 * @example
	 *
	 * async.every(['file1','file2','file3'], function(filePath, callback) {
	 *     fs.access(filePath, function(err) {
	 *         callback(null, !err)
	 *     });
	 * }, function(err, result) {
	 *     // if result is true then every file exists
	 * });
	 */
	
	/**
	 * The same as [`every`]{@link module:Collections.every} but runs a maximum of `limit` async operations at a time.
	 *
	 * @name everyLimit
	 * @static
	 * @memberOf module:Collections
	 * @method
	 * @see [async.every]{@link module:Collections.every}
	 * @alias allLimit
	 * @category Collection
	 * @param {Array|Iterable|Object} coll - A collection to iterate over.
	 * @param {number} limit - The maximum number of async operations at a time.
	 * @param {Function} iteratee - A truth test to apply to each item in the
	 * collection in parallel. The iteratee is passed a `callback(err, truthValue)`
	 * which must be called with a  boolean argument once it has completed. Invoked
	 * with (item, callback).
	 * @param {Function} [callback] - A callback which is called after all the
	 * `iteratee` functions have finished. Result will be either `true` or `false`
	 * depending on the values of the async tests. Invoked with (err, result).
	 */
	
	/**
	 * The same as [`every`]{@link module:Collections.every} but runs only a single async operation at a time.
	 *
	 * @name everySeries
	 * @static
	 * @memberOf module:Collections
	 * @method
	 * @see [async.every]{@link module:Collections.every}
	 * @alias allSeries
	 * @category Collection
	 * @param {Array|Iterable|Object} coll - A collection to iterate over.
	 * @param {Function} iteratee - A truth test to apply to each item in the
	 * collection in parallel. The iteratee is passed a `callback(err, truthValue)`
	 * which must be called with a  boolean argument once it has completed. Invoked
	 * with (item, callback).
	 * @param {Function} [callback] - A callback which is called after all the
	 * `iteratee` functions have finished. Result will be either `true` or `false`
	 * depending on the values of the async tests. Invoked with (err, result).
	 */
	
	/**
	 * The base implementation of `_.property` without support for deep paths.
	 *
	 * @private
	 * @param {string} key The key of the property to get.
	 * @returns {Function} Returns the new accessor function.
	 */
	
	/**
	 * Returns a new array of all the values in `coll` which pass an async truth
	 * test. This operation is performed in parallel, but the results array will be
	 * in the same order as the original.
	 *
	 * @name filter
	 * @static
	 * @memberOf module:Collections
	 * @method
	 * @alias select
	 * @category Collection
	 * @param {Array|Iterable|Object} coll - A collection to iterate over.
	 * @param {Function} iteratee - A truth test to apply to each item in `coll`.
	 * The `iteratee` is passed a `callback(err, truthValue)`, which must be called
	 * with a boolean argument once it has completed. Invoked with (item, callback).
	 * @param {Function} [callback] - A callback which is called after all the
	 * `iteratee` functions have finished. Invoked with (err, results).
	 * @example
	 *
	 * async.filter(['file1','file2','file3'], function(filePath, callback) {
	 *     fs.access(filePath, function(err) {
	 *         callback(null, !err)
	 *     });
	 * }, function(err, results) {
	 *     // results now equals an array of the existing files
	 * });
	 */
	
	/**
	 * The same as [`filter`]{@link module:Collections.filter} but runs a maximum of `limit` async operations at a
	 * time.
	 *
	 * @name filterLimit
	 * @static
	 * @memberOf module:Collections
	 * @method
	 * @see [async.filter]{@link module:Collections.filter}
	 * @alias selectLimit
	 * @category Collection
	 * @param {Array|Iterable|Object} coll - A collection to iterate over.
	 * @param {number} limit - The maximum number of async operations at a time.
	 * @param {Function} iteratee - A truth test to apply to each item in `coll`.
	 * The `iteratee` is passed a `callback(err, truthValue)`, which must be called
	 * with a boolean argument once it has completed. Invoked with (item, callback).
	 * @param {Function} [callback] - A callback which is called after all the
	 * `iteratee` functions have finished. Invoked with (err, results).
	 */
	
	/**
	 * The same as [`filter`]{@link module:Collections.filter} but runs only a single async operation at a time.
	 *
	 * @name filterSeries
	 * @static
	 * @memberOf module:Collections
	 * @method
	 * @see [async.filter]{@link module:Collections.filter}
	 * @alias selectSeries
	 * @category Collection
	 * @param {Array|Iterable|Object} coll - A collection to iterate over.
	 * @param {Function} iteratee - A truth test to apply to each item in `coll`.
	 * The `iteratee` is passed a `callback(err, truthValue)`, which must be called
	 * with a boolean argument once it has completed. Invoked with (item, callback).
	 * @param {Function} [callback] - A callback which is called after all the
	 * `iteratee` functions have finished. Invoked with (err, results)
	 */
	
	/**
	 * Logs the result of an `async` function to the `console`. Only works in
	 * Node.js or in browsers that support `console.log` and `console.error` (such
	 * as FF and Chrome). If multiple arguments are returned from the async
	 * function, `console.log` is called on each argument in order.
	 *
	 * @name log
	 * @static
	 * @memberOf module:Utils
	 * @method
	 * @category Util
	 * @param {Function} function - The function you want to eventually apply all
	 * arguments to.
	 * @param {...*} arguments... - Any number of arguments to apply to the function.
	 * @example
	 *
	 * // in a module
	 * var hello = function(name, callback) {
	 *     setTimeout(function() {
	 *         callback(null, 'hello ' + name);
	 *     }, 1000);
	 * };
	 *
	 * // in the node repl
	 * node> async.log(hello, 'world');
	 * 'hello world'
	 */
	consoleFunc('log');
	
	/**
	 * A relative of [`map`]{@link module:Collections.map}, designed for use with objects.
	 *
	 * Produces a new Object by mapping each value of `obj` through the `iteratee`
	 * function. The `iteratee` is called each `value` and `key` from `obj` and a
	 * callback for when it has finished processing. Each of these callbacks takes
	 * two arguments: an `error`, and the transformed item from `obj`. If `iteratee`
	 * passes an error to its callback, the main `callback` (for the `mapValues`
	 * function) is immediately called with the error.
	 *
	 * Note, the order of the keys in the result is not guaranteed.  The keys will
	 * be roughly in the order they complete, (but this is very engine-specific)
	 *
	 * @name mapValues
	 * @static
	 * @memberOf module:Collections
	 * @method
	 * @category Collection
	 * @param {Object} obj - A collection to iterate over.
	 * @param {Function} iteratee - A function to apply to each value and key in
	 * `coll`. The iteratee is passed a `callback(err, transformed)` which must be
	 * called once it has completed with an error (which can be `null`) and a
	 * transformed value. Invoked with (value, key, callback).
	 * @param {Function} [callback] - A callback which is called when all `iteratee`
	 * functions have finished, or an error occurs. `result` is a new object consisting
	 * of each key from `obj`, with each transformed value on the right-hand side.
	 * Invoked with (err, result).
	 * @example
	 *
	 * async.mapValues({
	 *     f1: 'file1',
	 *     f2: 'file2',
	 *     f3: 'file3'
	 * }, function (file, key, callback) {
	 *   fs.stat(file, callback);
	 * }, function(err, result) {
	 *     // result is now a map of stats for each file, e.g.
	 *     // {
	 *     //     f1: [stats for file1],
	 *     //     f2: [stats for file2],
	 *     //     f3: [stats for file3]
	 *     // }
	 * });
	 */
	
	/**
	 * The same as [`mapValues`]{@link module:Collections.mapValues} but runs only a single async operation at a time.
	 *
	 * @name mapValuesSeries
	 * @static
	 * @memberOf module:Collections
	 * @method
	 * @see [async.mapValues]{@link module:Collections.mapValues}
	 * @category Collection
	 * @param {Object} obj - A collection to iterate over.
	 * @param {Function} iteratee - A function to apply to each value in `obj`.
	 * The iteratee is passed a `callback(err, transformed)` which must be called
	 * once it has completed with an error (which can be `null`) and a
	 * transformed value. Invoked with (value, key, callback).
	 * @param {Function} [callback] - A callback which is called when all `iteratee`
	 * functions have finished, or an error occurs. `result` is a new object consisting
	 * of each key from `obj`, with each transformed value on the right-hand side.
	 * Invoked with (err, result).
	 */
	
	/**
	 * Calls `callback` on a later loop around the event loop. In Node.js this just
	 * calls `setImmediate`.  In the browser it will use `setImmediate` if
	 * available, otherwise `setTimeout(callback, 0)`, which means other higher
	 * priority events may precede the execution of `callback`.
	 *
	 * This is used internally for browser-compatibility purposes.
	 *
	 * @name nextTick
	 * @static
	 * @memberOf module:Utils
	 * @method
	 * @alias setImmediate
	 * @category Util
	 * @param {Function} callback - The function to call on a later loop around
	 * the event loop. Invoked with (args...).
	 * @param {...*} args... - any number of additional arguments to pass to the
	 * callback on the next tick.
	 * @example
	 *
	 * var call_order = [];
	 * async.nextTick(function() {
	 *     call_order.push('two');
	 *     // call_order now equals ['one','two']
	 * });
	 * call_order.push('one');
	 *
	 * async.setImmediate(function (a, b, c) {
	 *     // a, b, and c equal 1, 2, and 3
	 * }, 1, 2, 3);
	 */
	var _defer$1;
	
	if (hasNextTick) {
	    _defer$1 = process.nextTick;
	} else if (hasSetImmediate) {
	    _defer$1 = setImmediate;
	} else {
	    _defer$1 = fallback;
	}
	
	wrap(_defer$1);
	
	/**
	 * Calls `callback` on a later loop around the event loop. In Node.js this just
	 * calls `setImmediate`.  In the browser it will use `setImmediate` if
	 * available, otherwise `setTimeout(callback, 0)`, which means other higher
	 * priority events may precede the execution of `callback`.
	 *
	 * This is used internally for browser-compatibility purposes.
	 *
	 * @name setImmediate
	 * @static
	 * @memberOf module:Utils
	 * @method
	 * @alias nextTick
	 * @category Util
	 * @param {Function} callback - The function to call on a later loop around
	 * the event loop. Invoked with (args...).
	 * @param {...*} args... - any number of additional arguments to pass to the
	 * callback on the next tick.
	 * @example
	 *
	 * var call_order = [];
	 * async.nextTick(function() {
	 *     call_order.push('two');
	 *     // call_order now equals ['one','two']
	 * });
	 * call_order.push('one');
	 *
	 * async.setImmediate(function (a, b, c) {
	 *     // a, b, and c equal 1, 2, and 3
	 * }, 1, 2, 3);
	 */
	
	/**
	 * A queue of tasks for the worker function to complete.
	 * @typedef {Object} QueueObject
	 * @memberOf module:ControlFlow
	 * @property {Function} length - a function returning the number of items
	 * waiting to be processed. Invoke with `queue.length()`.
	 * @property {boolean} started - a boolean indicating whether or not any
	 * items have been pushed and processed by the queue.
	 * @property {Function} running - a function returning the number of items
	 * currently being processed. Invoke with `queue.running()`.
	 * @property {Function} workersList - a function returning the array of items
	 * currently being processed. Invoke with `queue.workersList()`.
	 * @property {Function} idle - a function returning false if there are items
	 * waiting or being processed, or true if not. Invoke with `queue.idle()`.
	 * @property {number} concurrency - an integer for determining how many `worker`
	 * functions should be run in parallel. This property can be changed after a
	 * `queue` is created to alter the concurrency on-the-fly.
	 * @property {Function} push - add a new task to the `queue`. Calls `callback`
	 * once the `worker` has finished processing the task. Instead of a single task,
	 * a `tasks` array can be submitted. The respective callback is used for every
	 * task in the list. Invoke with `queue.push(task, [callback])`,
	 * @property {Function} unshift - add a new task to the front of the `queue`.
	 * Invoke with `queue.unshift(task, [callback])`.
	 * @property {Function} saturated - a callback that is called when the number of
	 * running workers hits the `concurrency` limit, and further tasks will be
	 * queued.
	 * @property {Function} unsaturated - a callback that is called when the number
	 * of running workers is less than the `concurrency` & `buffer` limits, and
	 * further tasks will not be queued.
	 * @property {number} buffer - A minimum threshold buffer in order to say that
	 * the `queue` is `unsaturated`.
	 * @property {Function} empty - a callback that is called when the last item
	 * from the `queue` is given to a `worker`.
	 * @property {Function} drain - a callback that is called when the last item
	 * from the `queue` has returned from the `worker`.
	 * @property {Function} error - a callback that is called when a task errors.
	 * Has the signature `function(error, task)`.
	 * @property {boolean} paused - a boolean for determining whether the queue is
	 * in a paused state.
	 * @property {Function} pause - a function that pauses the processing of tasks
	 * until `resume()` is called. Invoke with `queue.pause()`.
	 * @property {Function} resume - a function that resumes the processing of
	 * queued tasks when the queue is paused. Invoke with `queue.resume()`.
	 * @property {Function} kill - a function that removes the `drain` callback and
	 * empties remaining tasks from the queue forcing it to go idle. Invoke with `queue.kill()`.
	 */
	
	/**
	 * Creates a `queue` object with the specified `concurrency`. Tasks added to the
	 * `queue` are processed in parallel (up to the `concurrency` limit). If all
	 * `worker`s are in progress, the task is queued until one becomes available.
	 * Once a `worker` completes a `task`, that `task`'s callback is called.
	 *
	 * @name queue
	 * @static
	 * @memberOf module:ControlFlow
	 * @method
	 * @category Control Flow
	 * @param {Function} worker - An asynchronous function for processing a queued
	 * task, which must call its `callback(err)` argument when finished, with an
	 * optional `error` as an argument.  If you want to handle errors from an
	 * individual task, pass a callback to `q.push()`. Invoked with
	 * (task, callback).
	 * @param {number} [concurrency=1] - An `integer` for determining how many
	 * `worker` functions should be run in parallel.  If omitted, the concurrency
	 * defaults to `1`.  If the concurrency is `0`, an error is thrown.
	 * @returns {module:ControlFlow.QueueObject} A queue object to manage the tasks. Callbacks can
	 * attached as certain properties to listen for specific events during the
	 * lifecycle of the queue.
	 * @example
	 *
	 * // create a queue object with concurrency 2
	 * var q = async.queue(function(task, callback) {
	 *     console.log('hello ' + task.name);
	 *     callback();
	 * }, 2);
	 *
	 * // assign a callback
	 * q.drain = function() {
	 *     console.log('all items have been processed');
	 * };
	 *
	 * // add some items to the queue
	 * q.push({name: 'foo'}, function(err) {
	 *     console.log('finished processing foo');
	 * });
	 * q.push({name: 'bar'}, function (err) {
	 *     console.log('finished processing bar');
	 * });
	 *
	 * // add some items to the queue (batch-wise)
	 * q.push([{name: 'baz'},{name: 'bay'},{name: 'bax'}], function(err) {
	 *     console.log('finished processing item');
	 * });
	 *
	 * // add some items to the front of the queue
	 * q.unshift({name: 'bar'}, function (err) {
	 *     console.log('finished processing bar');
	 * });
	 */
	
	/**
	 * The same as [async.queue]{@link module:ControlFlow.queue} only tasks are assigned a priority and
	 * completed in ascending priority order.
	 *
	 * @name priorityQueue
	 * @static
	 * @memberOf module:ControlFlow
	 * @method
	 * @see [async.queue]{@link module:ControlFlow.queue}
	 * @category Control Flow
	 * @param {Function} worker - An asynchronous function for processing a queued
	 * task, which must call its `callback(err)` argument when finished, with an
	 * optional `error` as an argument.  If you want to handle errors from an
	 * individual task, pass a callback to `q.push()`. Invoked with
	 * (task, callback).
	 * @param {number} concurrency - An `integer` for determining how many `worker`
	 * functions should be run in parallel.  If omitted, the concurrency defaults to
	 * `1`.  If the concurrency is `0`, an error is thrown.
	 * @returns {module:ControlFlow.QueueObject} A priorityQueue object to manage the tasks. There are two
	 * differences between `queue` and `priorityQueue` objects:
	 * * `push(task, priority, [callback])` - `priority` should be a number. If an
	 *   array of `tasks` is given, all tasks will be assigned the same priority.
	 * * The `unshift` method was removed.
	 */
	
	/**
	 * The opposite of [`filter`]{@link module:Collections.filter}. Removes values that pass an `async` truth test.
	 *
	 * @name reject
	 * @static
	 * @memberOf module:Collections
	 * @method
	 * @see [async.filter]{@link module:Collections.filter}
	 * @category Collection
	 * @param {Array|Iterable|Object} coll - A collection to iterate over.
	 * @param {Function} iteratee - A truth test to apply to each item in `coll`.
	 * The `iteratee` is passed a `callback(err, truthValue)`, which must be called
	 * with a boolean argument once it has completed. Invoked with (item, callback).
	 * @param {Function} [callback] - A callback which is called after all the
	 * `iteratee` functions have finished. Invoked with (err, results).
	 * @example
	 *
	 * async.reject(['file1','file2','file3'], function(filePath, callback) {
	 *     fs.access(filePath, function(err) {
	 *         callback(null, !err)
	 *     });
	 * }, function(err, results) {
	 *     // results now equals an array of missing files
	 *     createFiles(results);
	 * });
	 */
	
	/**
	 * The same as [`reject`]{@link module:Collections.reject} but runs a maximum of `limit` async operations at a
	 * time.
	 *
	 * @name rejectLimit
	 * @static
	 * @memberOf module:Collections
	 * @method
	 * @see [async.reject]{@link module:Collections.reject}
	 * @category Collection
	 * @param {Array|Iterable|Object} coll - A collection to iterate over.
	 * @param {number} limit - The maximum number of async operations at a time.
	 * @param {Function} iteratee - A truth test to apply to each item in `coll`.
	 * The `iteratee` is passed a `callback(err, truthValue)`, which must be called
	 * with a boolean argument once it has completed. Invoked with (item, callback).
	 * @param {Function} [callback] - A callback which is called after all the
	 * `iteratee` functions have finished. Invoked with (err, results).
	 */
	
	/**
	 * The same as [`reject`]{@link module:Collections.reject} but runs only a single async operation at a time.
	 *
	 * @name rejectSeries
	 * @static
	 * @memberOf module:Collections
	 * @method
	 * @see [async.reject]{@link module:Collections.reject}
	 * @category Collection
	 * @param {Array|Iterable|Object} coll - A collection to iterate over.
	 * @param {Function} iteratee - A truth test to apply to each item in `coll`.
	 * The `iteratee` is passed a `callback(err, truthValue)`, which must be called
	 * with a boolean argument once it has completed. Invoked with (item, callback).
	 * @param {Function} [callback] - A callback which is called after all the
	 * `iteratee` functions have finished. Invoked with (err, results).
	 */
	
	/**
	 * Creates a function that returns `value`.
	 *
	 * @static
	 * @memberOf _
	 * @since 2.4.0
	 * @category Util
	 * @param {*} value The value to return from the new function.
	 * @returns {Function} Returns the new constant function.
	 * @example
	 *
	 * var objects = _.times(2, _.constant({ 'a': 1 }));
	 *
	 * console.log(objects);
	 * // => [{ 'a': 1 }, { 'a': 1 }]
	 *
	 * console.log(objects[0] === objects[1]);
	 * // => true
	 */
	
	/**
	 * A close relative of [`retry`]{@link module:ControlFlow.retry}.  This method wraps a task and makes it
	 * retryable, rather than immediately calling it with retries.
	 *
	 * @name retryable
	 * @static
	 * @memberOf module:ControlFlow
	 * @method
	 * @see [async.retry]{@link module:ControlFlow.retry}
	 * @category Control Flow
	 * @param {Object|number} [opts = {times: 5, interval: 0}| 5] - optional
	 * options, exactly the same as from `retry`
	 * @param {Function} task - the asynchronous function to wrap
	 * @returns {Functions} The wrapped function, which when invoked, will retry on
	 * an error, based on the parameters specified in `opts`.
	 * @example
	 *
	 * async.auto({
	 *     dep1: async.retryable(3, getFromFlakyService),
	 *     process: ["dep1", async.retryable(3, function (results, cb) {
	 *         maybeProcessData(results.dep1, cb);
	 *     })]
	 * }, callback);
	 */
	
	/**
	 * Returns `true` if at least one element in the `coll` satisfies an async test.
	 * If any iteratee call returns `true`, the main `callback` is immediately
	 * called.
	 *
	 * @name some
	 * @static
	 * @memberOf module:Collections
	 * @method
	 * @alias any
	 * @category Collection
	 * @param {Array|Iterable|Object} coll - A collection to iterate over.
	 * @param {Function} iteratee - A truth test to apply to each item in the array
	 * in parallel. The iteratee is passed a `callback(err, truthValue)` which must
	 * be called with a boolean argument once it has completed. Invoked with
	 * (item, callback).
	 * @param {Function} [callback] - A callback which is called as soon as any
	 * iteratee returns `true`, or after all the iteratee functions have finished.
	 * Result will be either `true` or `false` depending on the values of the async
	 * tests. Invoked with (err, result).
	 * @example
	 *
	 * async.some(['file1','file2','file3'], function(filePath, callback) {
	 *     fs.access(filePath, function(err) {
	 *         callback(null, !err)
	 *     });
	 * }, function(err, result) {
	 *     // if result is true then at least one of the files exists
	 * });
	 */
	
	/**
	 * The same as [`some`]{@link module:Collections.some} but runs a maximum of `limit` async operations at a time.
	 *
	 * @name someLimit
	 * @static
	 * @memberOf module:Collections
	 * @method
	 * @see [async.some]{@link module:Collections.some}
	 * @alias anyLimit
	 * @category Collection
	 * @param {Array|Iterable|Object} coll - A collection to iterate over.
	 * @param {number} limit - The maximum number of async operations at a time.
	 * @param {Function} iteratee - A truth test to apply to each item in the array
	 * in parallel. The iteratee is passed a `callback(err, truthValue)` which must
	 * be called with a boolean argument once it has completed. Invoked with
	 * (item, callback).
	 * @param {Function} [callback] - A callback which is called as soon as any
	 * iteratee returns `true`, or after all the iteratee functions have finished.
	 * Result will be either `true` or `false` depending on the values of the async
	 * tests. Invoked with (err, result).
	 */
	
	/**
	 * The same as [`some`]{@link module:Collections.some} but runs only a single async operation at a time.
	 *
	 * @name someSeries
	 * @static
	 * @memberOf module:Collections
	 * @method
	 * @see [async.some]{@link module:Collections.some}
	 * @alias anySeries
	 * @category Collection
	 * @param {Array|Iterable|Object} coll - A collection to iterate over.
	 * @param {Function} iteratee - A truth test to apply to each item in the array
	 * in parallel. The iteratee is passed a `callback(err, truthValue)` which must
	 * be called with a boolean argument once it has completed. Invoked with
	 * (item, callback).
	 * @param {Function} [callback] - A callback which is called as soon as any
	 * iteratee returns `true`, or after all the iteratee functions have finished.
	 * Result will be either `true` or `false` depending on the values of the async
	 * tests. Invoked with (err, result).
	 */
	
	/* Built-in method references for those with the same name as other `lodash` methods. */
	var nativeCeil = Math.ceil;
	var nativeMax$1 = Math.max;
	
	/**
	 * Calls the `iteratee` function `n` times, and accumulates results in the same
	 * manner you would use with [map]{@link module:Collections.map}.
	 *
	 * @name times
	 * @static
	 * @memberOf module:ControlFlow
	 * @method
	 * @see [async.map]{@link module:Collections.map}
	 * @category Control Flow
	 * @param {number} n - The number of times to run the function.
	 * @param {Function} iteratee - The function to call `n` times. Invoked with the
	 * iteration index and a callback (n, next).
	 * @param {Function} callback - see {@link module:Collections.map}.
	 * @example
	 *
	 * // Pretend this is some complicated async factory
	 * var createUser = function(id, callback) {
	 *     callback(null, {
	 *         id: 'user' + id
	 *     });
	 * };
	 *
	 * // generate 5 users
	 * async.times(5, function(n, next) {
	 *     createUser(n, function(err, user) {
	 *         next(err, user);
	 *     });
	 * }, function(err, users) {
	 *     // we should now have 5 users
	 * });
	 */
	
	/**
	 * The same as [times]{@link module:ControlFlow.times} but runs only a single async operation at a time.
	 *
	 * @name timesSeries
	 * @static
	 * @memberOf module:ControlFlow
	 * @method
	 * @see [async.times]{@link module:ControlFlow.times}
	 * @category Control Flow
	 * @param {number} n - The number of times to run the function.
	 * @param {Function} iteratee - The function to call `n` times. Invoked with the
	 * iteration index and a callback (n, next).
	 * @param {Function} callback - see {@link module:Collections.map}.
	 */
	
	/**
	 * Undoes a [memoize]{@link module:Utils.memoize}d function, reverting it to the original,
	 * unmemoized form. Handy for testing.
	 *
	 * @name unmemoize
	 * @static
	 * @memberOf module:Utils
	 * @method
	 * @see [async.memoize]{@link module:Utils.memoize}
	 * @category Util
	 * @param {Function} fn - the memoized function
	 * @returns {Function} a function that calls the original unmemoized function
	 */
	
	/**
	 * Runs the `tasks` array of functions in series, each passing their results to
	 * the next in the array. However, if any of the `tasks` pass an error to their
	 * own callback, the next function is not executed, and the main `callback` is
	 * immediately called with the error.
	 *
	 * @name waterfall
	 * @static
	 * @memberOf module:ControlFlow
	 * @method
	 * @category Control Flow
	 * @param {Array} tasks - An array of functions to run, each function is passed
	 * a `callback(err, result1, result2, ...)` it must call on completion. The
	 * first argument is an error (which can be `null`) and any further arguments
	 * will be passed as arguments in order to the next task.
	 * @param {Function} [callback] - An optional callback to run once all the
	 * functions have completed. This will be passed the results of the last task's
	 * callback. Invoked with (err, [results]).
	 * @returns undefined
	 * @example
	 *
	 * async.waterfall([
	 *     function(callback) {
	 *         callback(null, 'one', 'two');
	 *     },
	 *     function(arg1, arg2, callback) {
	 *         // arg1 now equals 'one' and arg2 now equals 'two'
	 *         callback(null, 'three');
	 *     },
	 *     function(arg1, callback) {
	 *         // arg1 now equals 'three'
	 *         callback(null, 'done');
	 *     }
	 * ], function (err, result) {
	 *     // result now equals 'done'
	 * });
	 *
	 * // Or, with named functions:
	 * async.waterfall([
	 *     myFirstFunction,
	 *     mySecondFunction,
	 *     myLastFunction,
	 * ], function (err, result) {
	 *     // result now equals 'done'
	 * });
	 * function myFirstFunction(callback) {
	 *     callback(null, 'one', 'two');
	 * }
	 * function mySecondFunction(arg1, arg2, callback) {
	 *     // arg1 now equals 'one' and arg2 now equals 'two'
	 *     callback(null, 'three');
	 * }
	 * function myLastFunction(arg1, callback) {
	 *     // arg1 now equals 'three'
	 *     callback(null, 'done');
	 * }
	 */
	
	/**
	 * Async is a utility module which provides straight-forward, powerful functions
	 * for working with asynchronous JavaScript. Although originally designed for
	 * use with [Node.js](http://nodejs.org) and installable via
	 * `npm install --save async`, it can also be used directly in the browser.
	 * @module async
	 */
	
	/**
	 * A collection of `async` functions for manipulating collections, such as
	 * arrays and objects.
	 * @module Collections
	 */
	
	/**
	 * A collection of `async` functions for controlling the flow through a script.
	 * @module ControlFlow
	 */
	
	 /**
	  * A collection of `async` utility functions.
	  * @module Utils
	  */
	
	/**
	 * @hidden
	 */
	var errorCodeLookup;
	/**
	 * Lazily construct error code lookup, since DropboxJS might be loaded *after* BrowserFS (or not at all!)
	 * @hidden
	 */
	function constructErrorCodeLookup() {
	    if (errorCodeLookup) {
	        return;
	    }
	    errorCodeLookup = {};
	    // This indicates a network transmission error on modern browsers. Internet Explorer might cause this code to be reported on some API server errors.
	    errorCodeLookup[Dropbox.ApiError.NETWORK_ERROR] = ErrorCode.EIO;
	    // This happens when the contentHash parameter passed to a Dropbox.Client#readdir or Dropbox.Client#stat matches the most recent content, so the API call response is omitted, to save bandwidth.
	    // errorCodeLookup[Dropbox.ApiError.NO_CONTENT];
	    // The error property on {Dropbox.ApiError#response} should indicate which input parameter is invalid and why.
	    errorCodeLookup[Dropbox.ApiError.INVALID_PARAM] = ErrorCode.EINVAL;
	    // The OAuth token used for the request will never become valid again, so the user should be re-authenticated.
	    errorCodeLookup[Dropbox.ApiError.INVALID_TOKEN] = ErrorCode.EPERM;
	    // This indicates a bug in dropbox.js and should never occur under normal circumstances.
	    // ^ Actually, that's false. This occurs when you try to move folders to themselves, or move a file over another file.
	    errorCodeLookup[Dropbox.ApiError.OAUTH_ERROR] = ErrorCode.EPERM;
	    // This happens when trying to read from a non-existing file, readdir a non-existing directory, write a file into a non-existing directory, etc.
	    errorCodeLookup[Dropbox.ApiError.NOT_FOUND] = ErrorCode.ENOENT;
	    // This indicates a bug in dropbox.js and should never occur under normal circumstances.
	    errorCodeLookup[Dropbox.ApiError.INVALID_METHOD] = ErrorCode.EINVAL;
	    // This happens when a Dropbox.Client#readdir or Dropbox.Client#stat call would return more than a maximum amount of directory entries.
	    errorCodeLookup[Dropbox.ApiError.NOT_ACCEPTABLE] = ErrorCode.EINVAL;
	    // This is used by some backend methods to indicate that the client needs to download server-side changes and perform conflict resolution. Under normal usage, errors with this code should never surface to the code using dropbox.js.
	    errorCodeLookup[Dropbox.ApiError.CONFLICT] = ErrorCode.EINVAL;
	    // Status value indicating that the application is making too many requests.
	    errorCodeLookup[Dropbox.ApiError.RATE_LIMITED] = ErrorCode.EBUSY;
	    // The request should be retried after some time.
	    errorCodeLookup[Dropbox.ApiError.SERVER_ERROR] = ErrorCode.EBUSY;
	    // Status value indicating that the user's Dropbox is over its storage quota.
	    errorCodeLookup[Dropbox.ApiError.OVER_QUOTA] = ErrorCode.ENOSPC;
	}
	/**
	 * @hidden
	 */
	function isFileInfo(cache) {
	    return cache && cache.stat.isFile;
	}
	/**
	 * @hidden
	 */
	function isDirInfo(cache) {
	    return cache && cache.stat.isFolder;
	}
	/**
	 * @hidden
	 */
	function isArrayBuffer(ab) {
	    // Accept null / undefined, too.
	    return ab === null || ab === undefined || (typeof (ab) === 'object' && typeof (ab['byteLength']) === 'number');
	}
	/**
	 * Wraps a Dropbox client and caches operations.
	 * @hidden
	 */
	var CachedDropboxClient = function CachedDropboxClient(client) {
	    this._cache = {};
	    this._client = client;
	};
	CachedDropboxClient.prototype.readdir = function readdir (p, cb) {
	        var this$1 = this;
	
	    var cacheInfo = this.getCachedDirInfo(p);
	    this._wrap(function (interceptCb) {
	        if (cacheInfo !== null && cacheInfo.contents) {
	            this$1._client.readdir(p, {
	                contentHash: cacheInfo.stat.contentHash
	            }, interceptCb);
	        }
	        else {
	            this$1._client.readdir(p, interceptCb);
	        }
	    }, function (err, filenames, stat, folderEntries) {
	        if (err) {
	            if (err.status === Dropbox.ApiError.NO_CONTENT && cacheInfo !== null) {
	                cb(null, cacheInfo.contents.slice(0));
	            }
	            else {
	                cb(err);
	            }
	        }
	        else {
	            this$1.updateCachedDirInfo(p, stat, filenames.slice(0));
	            folderEntries.forEach(function (entry) {
	                this$1.updateCachedInfo(path.join(p, entry.name), entry);
	            });
	            cb(null, filenames);
	        }
	    });
	};
	CachedDropboxClient.prototype.remove = function remove (p, cb) {
	        var this$1 = this;
	
	    this._wrap(function (interceptCb) {
	        this$1._client.remove(p, interceptCb);
	    }, function (err, stat) {
	        if (!err) {
	            this$1.updateCachedInfo(p, stat);
	        }
	        cb(err);
	    });
	};
	CachedDropboxClient.prototype.move = function move (src, dest, cb) {
	        var this$1 = this;
	
	    this._wrap(function (interceptCb) {
	        this$1._client.move(src, dest, interceptCb);
	    }, function (err, stat) {
	        if (!err) {
	            this$1.deleteCachedInfo(src);
	            this$1.updateCachedInfo(dest, stat);
	        }
	        cb(err);
	    });
	};
	CachedDropboxClient.prototype.stat = function stat (p, cb) {
	        var this$1 = this;
	
	    this._wrap(function (interceptCb) {
	        this$1._client.stat(p, interceptCb);
	    }, function (err, stat) {
	        if (!err) {
	            this$1.updateCachedInfo(p, stat);
	        }
	        cb(err, stat);
	    });
	};
	CachedDropboxClient.prototype.readFile = function readFile (p, cb) {
	        var this$1 = this;
	
	    var cacheInfo = this.getCachedFileInfo(p);
	    if (cacheInfo !== null && cacheInfo.contents !== null) {
	        // Try to use cached info; issue a stat to see if contents are up-to-date.
	        this.stat(p, function (error, stat) {
	            if (error) {
	                cb(error);
	            }
	            else if (stat.contentHash === cacheInfo.stat.contentHash) {
	                // No file changes.
	                cb(error, cacheInfo.contents.slice(0), cacheInfo.stat);
	            }
	            else {
	                // File changes; rerun to trigger actual readFile.
	                this$1.readFile(p, cb);
	            }
	        });
	    }
	    else {
	        this._wrap(function (interceptCb) {
	            this$1._client.readFile(p, { arrayBuffer: true }, interceptCb);
	        }, function (err, contents, stat) {
	            if (!err) {
	                this$1.updateCachedInfo(p, stat, contents.slice(0));
	            }
	            cb(err, contents, stat);
	        });
	    }
	};
	CachedDropboxClient.prototype.writeFile = function writeFile (p, contents, cb) {
	        var this$1 = this;
	
	    this._wrap(function (interceptCb) {
	        this$1._client.writeFile(p, contents, interceptCb);
	    }, function (err, stat) {
	        if (!err) {
	            this$1.updateCachedInfo(p, stat, contents.slice(0));
	        }
	        cb(err, stat);
	    });
	};
	CachedDropboxClient.prototype.mkdir = function mkdir (p, cb) {
	        var this$1 = this;
	
	    this._wrap(function (interceptCb) {
	        this$1._client.mkdir(p, interceptCb);
	    }, function (err, stat) {
	        if (!err) {
	            this$1.updateCachedInfo(p, stat, []);
	        }
	        cb(err);
	    });
	};
	/**
	 * Wraps an operation such that we retry a failed operation 3 times.
	 * Necessary to deal with Dropbox rate limiting.
	 *
	 * @param performOp Function that performs the operation. Will be called up to three times.
	 * @param cb Called when the operation succeeds, fails in a non-temporary manner, or fails three times.
	 */
	CachedDropboxClient.prototype._wrap = function _wrap (performOp, cb) {
	    var numRun = 0;
	    var interceptCb = function (error) {
	        // Timeout duration, in seconds.
	        var timeoutDuration = 2;
	        if (error && 3 > (++numRun)) {
	            switch (error.status) {
	                case Dropbox.ApiError.SERVER_ERROR:
	                case Dropbox.ApiError.NETWORK_ERROR:
	                case Dropbox.ApiError.RATE_LIMITED:
	                    setTimeout(function () {
	                        performOp(interceptCb);
	                    }, timeoutDuration * 1000);
	                    break;
	                default:
	                    cb.apply(null, arguments);
	                    break;
	            }
	        }
	        else {
	            cb.apply(null, arguments);
	        }
	    };
	    performOp(interceptCb);
	};
	CachedDropboxClient.prototype.getCachedInfo = function getCachedInfo (p) {
	    return this._cache[p.toLowerCase()];
	};
	CachedDropboxClient.prototype.putCachedInfo = function putCachedInfo (p, cache) {
	    this._cache[p.toLowerCase()] = cache;
	};
	CachedDropboxClient.prototype.deleteCachedInfo = function deleteCachedInfo (p) {
	    delete this._cache[p.toLowerCase()];
	};
	CachedDropboxClient.prototype.getCachedDirInfo = function getCachedDirInfo (p) {
	    var info = this.getCachedInfo(p);
	    if (isDirInfo(info)) {
	        return info;
	    }
	    else {
	        return null;
	    }
	};
	CachedDropboxClient.prototype.getCachedFileInfo = function getCachedFileInfo (p) {
	    var info = this.getCachedInfo(p);
	    if (isFileInfo(info)) {
	        return info;
	    }
	    else {
	        return null;
	    }
	};
	CachedDropboxClient.prototype.updateCachedDirInfo = function updateCachedDirInfo (p, stat, contents) {
	        if ( contents === void 0 ) contents = null;
	
	    var cachedInfo = this.getCachedInfo(p);
	    // Dropbox uses the *contentHash* property for directories.
	    // Ignore stat objects w/o a contentHash defined; those actually exist!!!
	    // (Example: readdir returns an array of stat objs; stat objs for dirs in that context have no contentHash)
	    if (stat.contentHash !== null && (cachedInfo === undefined || cachedInfo.stat.contentHash !== stat.contentHash)) {
	        this.putCachedInfo(p, {
	            stat: stat,
	            contents: contents
	        });
	    }
	};
	CachedDropboxClient.prototype.updateCachedFileInfo = function updateCachedFileInfo (p, stat, contents) {
	        if ( contents === void 0 ) contents = null;
	
	    var cachedInfo = this.getCachedInfo(p);
	    // Dropbox uses the *versionTag* property for files.
	    // Ignore stat objects w/o a versionTag defined.
	    if (stat.versionTag !== null && (cachedInfo === undefined || cachedInfo.stat.versionTag !== stat.versionTag)) {
	        this.putCachedInfo(p, {
	            stat: stat,
	            contents: contents
	        });
	    }
	};
	CachedDropboxClient.prototype.updateCachedInfo = function updateCachedInfo (p, stat, contents) {
	        if ( contents === void 0 ) contents = null;
	
	    if (stat.isFile && isArrayBuffer(contents)) {
	        this.updateCachedFileInfo(p, stat, contents);
	    }
	    else if (stat.isFolder && Array.isArray(contents)) {
	        this.updateCachedDirInfo(p, stat, contents);
	    }
	};
	var DropboxFile = (function (PreloadFile$$1) {
	    function DropboxFile(_fs, _path, _flag, _stat, contents) {
	        PreloadFile$$1.call(this, _fs, _path, _flag, _stat, contents);
	    }
	
	    if ( PreloadFile$$1 ) DropboxFile.__proto__ = PreloadFile$$1;
	    DropboxFile.prototype = Object.create( PreloadFile$$1 && PreloadFile$$1.prototype );
	    DropboxFile.prototype.constructor = DropboxFile;
	    DropboxFile.prototype.sync = function sync (cb) {
	        var this$1 = this;
	
	        if (this.isDirty()) {
	            var buffer$$1 = this.getBuffer(), arrayBuffer = buffer2ArrayBuffer(buffer$$1);
	            this._fs._writeFileStrict(this.getPath(), arrayBuffer, function (e) {
	                if (!e) {
	                    this$1.resetDirty();
	                }
	                cb(e);
	            });
	        }
	        else {
	            cb();
	        }
	    };
	    DropboxFile.prototype.close = function close (cb) {
	        this.sync(cb);
	    };
	
	    return DropboxFile;
	}(PreloadFile));
	/**
	 * A read/write file system backed by Dropbox cloud storage.
	 *
	 * Uses the Dropbox V1 API.
	 *
	 * NOTE: You must use the v0.10 version of the [Dropbox JavaScript SDK](https://www.npmjs.com/package/dropbox).
	 */
	var DropboxFileSystem = (function (BaseFileSystem$$1) {
	    function DropboxFileSystem(client, deprecateMsg) {
	        if ( deprecateMsg === void 0 ) deprecateMsg = true;
	
	        BaseFileSystem$$1.call(this);
	        this._client = new CachedDropboxClient(client);
	        deprecationMessage(deprecateMsg, DropboxFileSystem.Name, { client: "authenticated dropbox client instance" });
	        constructErrorCodeLookup();
	    }
	
	    if ( BaseFileSystem$$1 ) DropboxFileSystem.__proto__ = BaseFileSystem$$1;
	    DropboxFileSystem.prototype = Object.create( BaseFileSystem$$1 && BaseFileSystem$$1.prototype );
	    DropboxFileSystem.prototype.constructor = DropboxFileSystem;
	    /**
	     * Creates a new DropboxFileSystem instance with the given options.
	     * Must be given an *authenticated* DropboxJS client from the old v0.10 version of the Dropbox JS SDK.
	     */
	    DropboxFileSystem.Create = function Create (opts, cb) {
	        cb(null, new DropboxFileSystem(opts.client, false));
	    };
	    DropboxFileSystem.isAvailable = function isAvailable () {
	        // Checks if the Dropbox library is loaded.
	        return typeof Dropbox !== 'undefined';
	    };
	    DropboxFileSystem.prototype.getName = function getName () {
	        return DropboxFileSystem.Name;
	    };
	    DropboxFileSystem.prototype.isReadOnly = function isReadOnly () {
	        return false;
	    };
	    // Dropbox doesn't support symlinks, properties, or synchronous calls
	    DropboxFileSystem.prototype.supportsSymlinks = function supportsSymlinks () {
	        return false;
	    };
	    DropboxFileSystem.prototype.supportsProps = function supportsProps () {
	        return false;
	    };
	    DropboxFileSystem.prototype.supportsSynch = function supportsSynch () {
	        return false;
	    };
	    DropboxFileSystem.prototype.empty = function empty (mainCb) {
	        var this$1 = this;
	
	        this._client.readdir('/', function (error, files) {
	            if (error) {
	                mainCb(this$1.convert(error, '/'));
	            }
	            else {
	                var deleteFile = function (file, cb) {
	                    var p = path.join('/', file);
	                    this$1._client.remove(p, function (err) {
	                        cb(err ? this$1.convert(err, p) : null);
	                    });
	                };
	                var finished = function (err) {
	                    if (err) {
	                        mainCb(err);
	                    }
	                    else {
	                        mainCb();
	                    }
	                };
	                // XXX: <any> typing is to get around overly-restrictive ErrorCallback typing.
	                eachLimit(files, deleteFile, finished);
	            }
	        });
	    };
	    DropboxFileSystem.prototype.rename = function rename (oldPath, newPath, cb) {
	        var this$1 = this;
	
	        this._client.move(oldPath, newPath, function (error) {
	            if (error) {
	                // the move is permitted if newPath is a file.
	                // Check if this is the case, and remove if so.
	                this$1._client.stat(newPath, function (error2, stat) {
	                    if (error2 || stat.isFolder) {
	                        var missingPath = error.response.error.indexOf(oldPath) > -1 ? oldPath : newPath;
	                        cb(this$1.convert(error, missingPath));
	                    }
	                    else {
	                        // Delete file, repeat rename.
	                        this$1._client.remove(newPath, function (error2) {
	                            if (error2) {
	                                cb(this$1.convert(error2, newPath));
	                            }
	                            else {
	                                this$1.rename(oldPath, newPath, cb);
	                            }
	                        });
	                    }
	                });
	            }
	            else {
	                cb();
	            }
	        });
	    };
	    DropboxFileSystem.prototype.stat = function stat (path$$1, isLstat, cb) {
	        var this$1 = this;
	
	        // Ignore lstat case -- Dropbox doesn't support symlinks
	        // Stat the file
	        this._client.stat(path$$1, function (error, stat) {
	            if (error) {
	                cb(this$1.convert(error, path$$1));
	            }
	            else if (stat && stat.isRemoved) {
	                // Dropbox keeps track of deleted files, so if a file has existed in the
	                // past but doesn't any longer, you wont get an error
	                cb(ApiError.FileError(ErrorCode.ENOENT, path$$1));
	            }
	            else {
	                var stats = new Stats(this$1._statType(stat), stat.size);
	                return cb(null, stats);
	            }
	        });
	    };
	    DropboxFileSystem.prototype.open = function open (path$$1, flags, mode, cb) {
	        var this$1 = this;
	
	        // Try and get the file's contents
	        this._client.readFile(path$$1, function (error, content, dbStat) {
	            if (error) {
	                // If the file's being opened for reading and doesn't exist, return an
	                // error
	                if (flags.isReadable()) {
	                    cb(this$1.convert(error, path$$1));
	                }
	                else {
	                    switch (error.status) {
	                        // If it's being opened for writing or appending, create it so that
	                        // it can be written to
	                        case Dropbox.ApiError.NOT_FOUND:
	                            var ab = new ArrayBuffer(0);
	                            return this$1._writeFileStrict(path$$1, ab, function (error2, stat) {
	                                if (error2) {
	                                    cb(error2);
	                                }
	                                else {
	                                    var file = this$1._makeFile(path$$1, flags, stat, arrayBuffer2Buffer(ab));
	                                    cb(null, file);
	                                }
	                            });
	                        default:
	                            return cb(this$1.convert(error, path$$1));
	                    }
	                }
	            }
	            else {
	                // No error
	                var buffer$$1;
	                // Dropbox.js seems to set `content` to `null` rather than to an empty
	                // buffer when reading an empty file. Not sure why this is.
	                if (content === null) {
	                    buffer$$1 = emptyBuffer();
	                }
	                else {
	                    buffer$$1 = arrayBuffer2Buffer(content);
	                }
	                var file = this$1._makeFile(path$$1, flags, dbStat, buffer$$1);
	                return cb(null, file);
	            }
	        });
	    };
	    DropboxFileSystem.prototype._writeFileStrict = function _writeFileStrict (p, data, cb) {
	        var this$1 = this;
	
	        var parent = path.dirname(p);
	        this.stat(parent, false, function (error, stat) {
	            if (error) {
	                cb(ApiError.FileError(ErrorCode.ENOENT, parent));
	            }
	            else {
	                this$1._client.writeFile(p, data, function (error2, stat) {
	                    if (error2) {
	                        cb(this$1.convert(error2, p));
	                    }
	                    else {
	                        cb(null, stat);
	                    }
	                });
	            }
	        });
	    };
	    /**
	     * Private
	     * Returns a BrowserFS object representing the type of a Dropbox.js stat object
	     */
	    DropboxFileSystem.prototype._statType = function _statType (stat) {
	        return stat.isFile ? FileType.FILE : FileType.DIRECTORY;
	    };
	    /**
	     * Private
	     * Returns a BrowserFS object representing a File, created from the data
	     * returned by calls to the Dropbox API.
	     */
	    DropboxFileSystem.prototype._makeFile = function _makeFile (path$$1, flag, stat, buffer$$1) {
	        var type = this._statType(stat);
	        var stats = new Stats(type, stat.size);
	        return new DropboxFile(this, path$$1, flag, stats, buffer$$1);
	    };
	    /**
	     * Private
	     * Delete a file or directory from Dropbox
	     * isFile should reflect which call was made to remove the it (`unlink` or
	     * `rmdir`). If this doesn't match what's actually at `path`, an error will be
	     * returned
	     */
	    DropboxFileSystem.prototype._remove = function _remove (path$$1, cb, isFile) {
	        var this$1 = this;
	
	        this._client.stat(path$$1, function (error, stat) {
	            if (error) {
	                cb(this$1.convert(error, path$$1));
	            }
	            else {
	                if (stat.isFile && !isFile) {
	                    cb(ApiError.FileError(ErrorCode.ENOTDIR, path$$1));
	                }
	                else if (!stat.isFile && isFile) {
	                    cb(ApiError.FileError(ErrorCode.EISDIR, path$$1));
	                }
	                else {
	                    this$1._client.remove(path$$1, function (error) {
	                        if (error) {
	                            cb(this$1.convert(error, path$$1));
	                        }
	                        else {
	                            cb(null);
	                        }
	                    });
	                }
	            }
	        });
	    };
	    /**
	     * Delete a file
	     */
	    DropboxFileSystem.prototype.unlink = function unlink (path$$1, cb) {
	        this._remove(path$$1, cb, true);
	    };
	    /**
	     * Delete a directory
	     */
	    DropboxFileSystem.prototype.rmdir = function rmdir (path$$1, cb) {
	        this._remove(path$$1, cb, false);
	    };
	    /**
	     * Create a directory
	     */
	    DropboxFileSystem.prototype.mkdir = function mkdir (p, mode, cb) {
	        var this$1 = this;
	
	        // Dropbox.js' client.mkdir() behaves like `mkdir -p`, i.e. it creates a
	        // directory and all its ancestors if they don't exist.
	        // Node's fs.mkdir() behaves like `mkdir`, i.e. it throws an error if an attempt
	        // is made to create a directory without a parent.
	        // To handle this inconsistency, a check for the existence of `path`'s parent
	        // must be performed before it is created, and an error thrown if it does
	        // not exist
	        var parent = path.dirname(p);
	        this._client.stat(parent, function (error, stat) {
	            if (error) {
	                cb(this$1.convert(error, parent));
	            }
	            else {
	                this$1._client.mkdir(p, function (error) {
	                    if (error) {
	                        cb(ApiError.FileError(ErrorCode.EEXIST, p));
	                    }
	                    else {
	                        cb(null);
	                    }
	                });
	            }
	        });
	    };
	    /**
	     * Get the names of the files in a directory
	     */
	    DropboxFileSystem.prototype.readdir = function readdir (path$$1, cb) {
	        var this$1 = this;
	
	        this._client.readdir(path$$1, function (error, files) {
	            if (error) {
	                return cb(this$1.convert(error));
	            }
	            else {
	                return cb(null, files);
	            }
	        });
	    };
	    /**
	     * Converts a Dropbox-JS error into a BFS error.
	     */
	    DropboxFileSystem.prototype.convert = function convert (err, path$$1) {
	        if ( path$$1 === void 0 ) path$$1 = null;
	
	        var errorCode = errorCodeLookup[err.status];
	        if (errorCode === undefined) {
	            errorCode = ErrorCode.EIO;
	        }
	        if (!path$$1) {
	            return new ApiError(errorCode);
	        }
	        else {
	            return ApiError.FileError(errorCode, path$$1);
	        }
	    };
	
	    return DropboxFileSystem;
	}(BaseFileSystem));
	
	DropboxFileSystem.Name = "Dropbox";
	DropboxFileSystem.Options = {
	    client: {
	        type: "object",
	        description: "An *authenticated* Dropbox client. Must be from the 0.10 JS SDK.",
	        validator: function (opt, cb) {
	            if (opt.isAuthenticated && opt.isAuthenticated()) {
	                cb();
	            }
	            else {
	                cb(new ApiError(ErrorCode.EINVAL, "'client' option must be an authenticated Dropbox client from the v0.10 JS SDK."));
	            }
	        }
	    }
	};
	
	/**
	 * @hidden
	 */
	function convertError(e, path$$1) {
	    if ( path$$1 === void 0 ) path$$1 = '';
	
	    var errno = e.errno;
	    var parent = e.node;
	    var paths = [];
	    while (parent) {
	        paths.unshift(parent.name);
	        if (parent === parent.parent) {
	            break;
	        }
	        parent = parent.parent;
	    }
	    return new ApiError(errno, ErrorStrings[errno], paths.length > 0 ? '/' + paths.join('/') : path$$1);
	}
	var EmscriptenFile = (function (BaseFile$$1) {
	    function EmscriptenFile(_fs, _FS, _path, _stream) {
	        BaseFile$$1.call(this);
	        this._fs = _fs;
	        this._FS = _FS;
	        this._path = _path;
	        this._stream = _stream;
	    }
	
	    if ( BaseFile$$1 ) EmscriptenFile.__proto__ = BaseFile$$1;
	    EmscriptenFile.prototype = Object.create( BaseFile$$1 && BaseFile$$1.prototype );
	    EmscriptenFile.prototype.constructor = EmscriptenFile;
	    EmscriptenFile.prototype.getPos = function getPos () {
	        return undefined;
	    };
	    EmscriptenFile.prototype.close = function close (cb) {
	        var err = null;
	        try {
	            this.closeSync();
	        }
	        catch (e) {
	            err = e;
	        }
	        finally {
	            cb(err);
	        }
	    };
	    EmscriptenFile.prototype.closeSync = function closeSync () {
	        try {
	            this._FS.close(this._stream);
	        }
	        catch (e) {
	            throw convertError(e, this._path);
	        }
	    };
	    EmscriptenFile.prototype.stat = function stat (cb) {
	        try {
	            cb(null, this.statSync());
	        }
	        catch (e) {
	            cb(e);
	        }
	    };
	    EmscriptenFile.prototype.statSync = function statSync () {
	        try {
	            return this._fs.statSync(this._path, false);
	        }
	        catch (e) {
	            throw convertError(e, this._path);
	        }
	    };
	    EmscriptenFile.prototype.truncate = function truncate (len, cb) {
	        var err = null;
	        try {
	            this.truncateSync(len);
	        }
	        catch (e) {
	            err = e;
	        }
	        finally {
	            cb(err);
	        }
	    };
	    EmscriptenFile.prototype.truncateSync = function truncateSync (len) {
	        try {
	            this._FS.ftruncate(this._stream.fd, len);
	        }
	        catch (e) {
	            throw convertError(e, this._path);
	        }
	    };
	    EmscriptenFile.prototype.write = function write (buffer$$1, offset, length, position, cb) {
	        try {
	            cb(null, this.writeSync(buffer$$1, offset, length, position), buffer$$1);
	        }
	        catch (e) {
	            cb(e);
	        }
	    };
	    EmscriptenFile.prototype.writeSync = function writeSync (buffer$$1, offset, length, position) {
	        try {
	            var u8 = buffer2Uint8array(buffer$$1);
	            // Emscripten is particular about what position is set to.
	            var emPosition = position === null ? undefined : position;
	            return this._FS.write(this._stream, u8, offset, length, emPosition);
	        }
	        catch (e) {
	            throw convertError(e, this._path);
	        }
	    };
	    EmscriptenFile.prototype.read = function read (buffer$$1, offset, length, position, cb) {
	        try {
	            cb(null, this.readSync(buffer$$1, offset, length, position), buffer$$1);
	        }
	        catch (e) {
	            cb(e);
	        }
	    };
	    EmscriptenFile.prototype.readSync = function readSync (buffer$$1, offset, length, position) {
	        try {
	            var u8 = buffer2Uint8array(buffer$$1);
	            // Emscripten is particular about what position is set to.
	            var emPosition = position === null ? undefined : position;
	            return this._FS.read(this._stream, u8, offset, length, emPosition);
	        }
	        catch (e) {
	            throw convertError(e, this._path);
	        }
	    };
	    EmscriptenFile.prototype.sync = function sync (cb) {
	        // NOP.
	        cb();
	    };
	    EmscriptenFile.prototype.syncSync = function syncSync () {
	        // NOP.
	    };
	    EmscriptenFile.prototype.chown = function chown (uid, gid, cb) {
	        var err = null;
	        try {
	            this.chownSync(uid, gid);
	        }
	        catch (e) {
	            err = e;
	        }
	        finally {
	            cb(err);
	        }
	    };
	    EmscriptenFile.prototype.chownSync = function chownSync (uid, gid) {
	        try {
	            this._FS.fchown(this._stream.fd, uid, gid);
	        }
	        catch (e) {
	            throw convertError(e, this._path);
	        }
	    };
	    EmscriptenFile.prototype.chmod = function chmod (mode, cb) {
	        var err = null;
	        try {
	            this.chmodSync(mode);
	        }
	        catch (e) {
	            err = e;
	        }
	        finally {
	            cb(err);
	        }
	    };
	    EmscriptenFile.prototype.chmodSync = function chmodSync (mode) {
	        try {
	            this._FS.fchmod(this._stream.fd, mode);
	        }
	        catch (e) {
	            throw convertError(e, this._path);
	        }
	    };
	    EmscriptenFile.prototype.utimes = function utimes (atime, mtime, cb) {
	        var err = null;
	        try {
	            this.utimesSync(atime, mtime);
	        }
	        catch (e) {
	            err = e;
	        }
	        finally {
	            cb(err);
	        }
	    };
	    EmscriptenFile.prototype.utimesSync = function utimesSync (atime, mtime) {
	        this._fs.utimesSync(this._path, atime, mtime);
	    };
	
	    return EmscriptenFile;
	}(BaseFile));
	/**
	 * Mounts an Emscripten file system into the BrowserFS file system.
	 */
	var EmscriptenFileSystem = (function (SynchronousFileSystem$$1) {
	    function EmscriptenFileSystem(_FS) {
	        SynchronousFileSystem$$1.call(this);
	        this._FS = _FS;
	    }
	
	    if ( SynchronousFileSystem$$1 ) EmscriptenFileSystem.__proto__ = SynchronousFileSystem$$1;
	    EmscriptenFileSystem.prototype = Object.create( SynchronousFileSystem$$1 && SynchronousFileSystem$$1.prototype );
	    EmscriptenFileSystem.prototype.constructor = EmscriptenFileSystem;
	    /**
	     * Create an EmscriptenFileSystem instance with the given options.
	     */
	    EmscriptenFileSystem.Create = function Create (opts, cb) {
	        cb(null, new EmscriptenFileSystem(opts.FS));
	    };
	    EmscriptenFileSystem.isAvailable = function isAvailable () { return true; };
	    EmscriptenFileSystem.prototype.getName = function getName () { return this._FS.DB_NAME(); };
	    EmscriptenFileSystem.prototype.isReadOnly = function isReadOnly () { return false; };
	    EmscriptenFileSystem.prototype.supportsLinks = function supportsLinks () { return true; };
	    EmscriptenFileSystem.prototype.supportsProps = function supportsProps () { return true; };
	    EmscriptenFileSystem.prototype.supportsSynch = function supportsSynch () { return true; };
	    EmscriptenFileSystem.prototype.renameSync = function renameSync (oldPath, newPath) {
	        try {
	            this._FS.rename(oldPath, newPath);
	        }
	        catch (e) {
	            if (e.errno === ErrorCode.ENOENT) {
	                throw convertError(e, this.existsSync(oldPath) ? newPath : oldPath);
	            }
	            else {
	                throw convertError(e);
	            }
	        }
	    };
	    EmscriptenFileSystem.prototype.statSync = function statSync (p, isLstat) {
	        try {
	            var stats = isLstat ? this._FS.lstat(p) : this._FS.stat(p);
	            var itemType = this.modeToFileType(stats.mode);
	            return new Stats(itemType, stats.size, stats.mode, stats.atime, stats.mtime, stats.ctime);
	        }
	        catch (e) {
	            throw convertError(e, p);
	        }
	    };
	    EmscriptenFileSystem.prototype.openSync = function openSync (p, flag, mode) {
	        try {
	            var stream = this._FS.open(p, flag.getFlagString(), mode);
	            if (this._FS.isDir(stream.node.mode)) {
	                this._FS.close(stream);
	                throw ApiError.EISDIR(p);
	            }
	            return new EmscriptenFile(this, this._FS, p, stream);
	        }
	        catch (e) {
	            throw convertError(e, p);
	        }
	    };
	    EmscriptenFileSystem.prototype.unlinkSync = function unlinkSync (p) {
	        try {
	            this._FS.unlink(p);
	        }
	        catch (e) {
	            throw convertError(e, p);
	        }
	    };
	    EmscriptenFileSystem.prototype.rmdirSync = function rmdirSync (p) {
	        try {
	            this._FS.rmdir(p);
	        }
	        catch (e) {
	            throw convertError(e, p);
	        }
	    };
	    EmscriptenFileSystem.prototype.mkdirSync = function mkdirSync (p, mode) {
	        try {
	            this._FS.mkdir(p, mode);
	        }
	        catch (e) {
	            throw convertError(e, p);
	        }
	    };
	    EmscriptenFileSystem.prototype.readdirSync = function readdirSync (p) {
	        try {
	            // Emscripten returns items for '.' and '..'. Node does not.
	            return this._FS.readdir(p).filter(function (p) { return p !== '.' && p !== '..'; });
	        }
	        catch (e) {
	            throw convertError(e, p);
	        }
	    };
	    EmscriptenFileSystem.prototype.truncateSync = function truncateSync (p, len) {
	        try {
	            this._FS.truncate(p, len);
	        }
	        catch (e) {
	            throw convertError(e, p);
	        }
	    };
	    EmscriptenFileSystem.prototype.readFileSync = function readFileSync (p, encoding, flag) {
	        try {
	            var data = this._FS.readFile(p, { flags: flag.getFlagString() });
	            var buff = uint8Array2Buffer(data);
	            if (encoding) {
	                return buff.toString(encoding);
	            }
	            else {
	                return buff;
	            }
	        }
	        catch (e) {
	            throw convertError(e, p);
	        }
	    };
	    EmscriptenFileSystem.prototype.writeFileSync = function writeFileSync (p, data, encoding, flag, mode) {
	        try {
	            if (encoding) {
	                data = Buffer.from(data, encoding);
	            }
	            var u8 = buffer2Uint8array(data);
	            this._FS.writeFile(p, u8, { flags: flag.getFlagString(), encoding: 'binary' });
	            this._FS.chmod(p, mode);
	        }
	        catch (e) {
	            throw convertError(e, p);
	        }
	    };
	    EmscriptenFileSystem.prototype.chmodSync = function chmodSync (p, isLchmod, mode) {
	        try {
	            isLchmod ? this._FS.lchmod(p, mode) : this._FS.chmod(p, mode);
	        }
	        catch (e) {
	            throw convertError(e, p);
	        }
	    };
	    EmscriptenFileSystem.prototype.chownSync = function chownSync (p, isLchown, uid, gid) {
	        try {
	            isLchown ? this._FS.lchown(p, uid, gid) : this._FS.chown(p, uid, gid);
	        }
	        catch (e) {
	            throw convertError(e, p);
	        }
	    };
	    EmscriptenFileSystem.prototype.symlinkSync = function symlinkSync (srcpath, dstpath, type) {
	        try {
	            this._FS.symlink(srcpath, dstpath);
	        }
	        catch (e) {
	            throw convertError(e);
	        }
	    };
	    EmscriptenFileSystem.prototype.readlinkSync = function readlinkSync (p) {
	        try {
	            return this._FS.readlink(p);
	        }
	        catch (e) {
	            throw convertError(e, p);
	        }
	    };
	    EmscriptenFileSystem.prototype.utimesSync = function utimesSync (p, atime, mtime) {
	        try {
	            this._FS.utime(p, atime.getTime(), mtime.getTime());
	        }
	        catch (e) {
	            throw convertError(e, p);
	        }
	    };
	    EmscriptenFileSystem.prototype.modeToFileType = function modeToFileType (mode) {
	        if (this._FS.isDir(mode)) {
	            return FileType.DIRECTORY;
	        }
	        else if (this._FS.isFile(mode)) {
	            return FileType.FILE;
	        }
	        else if (this._FS.isLink(mode)) {
	            return FileType.SYMLINK;
	        }
	        else {
	            throw ApiError.EPERM(("Invalid mode: " + mode));
	        }
	    };
	
	    return EmscriptenFileSystem;
	}(SynchronousFileSystem));
	
	EmscriptenFileSystem.Name = "EmscriptenFileSystem";
	EmscriptenFileSystem.Options = {
	    FS: {
	        type: "object",
	        description: "The Emscripten file system to use (the `FS` variable)"
	    }
	};
	
	/**
	 * The FolderAdapter file system wraps a file system, and scopes all interactions to a subfolder of that file system.
	 *
	 * Example: Given a file system `foo` with folder `bar` and file `bar/baz`...
	 *
	 * ```javascript
	 * BrowserFS.configure({
	 *   fs: "FolderAdapter",
	 *   options: {
	 *     folder: "bar",
	 *     wrapped: foo
	 *   }
	 * }, function(e) {
	 *   var fs = BrowserFS.BFSRequire('fs');
	 *   fs.readdirSync('/'); // ['baz']
	 * });
	 * ```
	 */
	var FolderAdapter = (function (BaseFileSystem$$1) {
	    function FolderAdapter(folder, wrapped) {
	        BaseFileSystem$$1.call(this);
	        this._folder = folder;
	        this._wrapped = wrapped;
	    }
	
	    if ( BaseFileSystem$$1 ) FolderAdapter.__proto__ = BaseFileSystem$$1;
	    FolderAdapter.prototype = Object.create( BaseFileSystem$$1 && BaseFileSystem$$1.prototype );
	    FolderAdapter.prototype.constructor = FolderAdapter;
	    /**
	     * Creates a FolderAdapter instance with the given options.
	     */
	    FolderAdapter.Create = function Create (opts, cb) {
	        cb(null, new FolderAdapter(opts.folder, opts.wrapped));
	    };
	    FolderAdapter.isAvailable = function isAvailable () {
	        return true;
	    };
	    /**
	     * Initialize the file system. Ensures that the wrapped file system
	     * has the given folder.
	     */
	    FolderAdapter.prototype.initialize = function initialize (cb) {
	        var this$1 = this;
	
	        this._wrapped.exists(this._folder, function (exists) {
	            if (exists) {
	                cb();
	            }
	            else if (this$1._wrapped.isReadOnly()) {
	                cb(ApiError.ENOENT(this$1._folder));
	            }
	            else {
	                this$1._wrapped.mkdir(this$1._folder, 0x1ff, cb);
	            }
	        });
	    };
	    FolderAdapter.prototype.getName = function getName () { return this._wrapped.getName(); };
	    FolderAdapter.prototype.isReadOnly = function isReadOnly () { return this._wrapped.isReadOnly(); };
	    FolderAdapter.prototype.supportsProps = function supportsProps () { return this._wrapped.supportsProps(); };
	    FolderAdapter.prototype.supportsSynch = function supportsSynch () { return this._wrapped.supportsSynch(); };
	    FolderAdapter.prototype.supportsLinks = function supportsLinks () { return false; };
	
	    return FolderAdapter;
	}(BaseFileSystem));
	
	FolderAdapter.Name = "FolderAdapter";
	FolderAdapter.Options = {
	    folder: {
	        type: "string",
	        description: "The folder to use as the root directory"
	    },
	    wrapped: {
	        type: "object",
	        description: "The file system to wrap"
	    }
	};
	/**
	 * @hidden
	 */
	function translateError(folder, e) {
	    if (e !== null && typeof e === 'object') {
	        var err = e;
	        var p = err.path;
	        if (p) {
	            p = '/' + path.relative(folder, p);
	            err.message = err.message.replace(err.path, p);
	            err.path = p;
	        }
	    }
	    return e;
	}
	/**
	 * @hidden
	 */
	function wrapCallback(folder, cb) {
	    if (typeof cb === 'function') {
	        return function (err) {
	            if (arguments.length > 0) {
	                arguments[0] = translateError(folder, err);
	            }
	            cb.apply(null, arguments);
	        };
	    }
	    else {
	        return cb;
	    }
	}
	/**
	 * @hidden
	 */
	function wrapFunction(name, wrapFirst, wrapSecond) {
	    if (name.slice(name.length - 4) !== 'Sync') {
	        // Async function. Translate error in callback.
	        return function () {
	            if (arguments.length > 0) {
	                if (wrapFirst) {
	                    arguments[0] = path.join(this._folder, arguments[0]);
	                }
	                if (wrapSecond) {
	                    arguments[1] = path.join(this._folder, arguments[1]);
	                }
	                arguments[arguments.length - 1] = wrapCallback(this._folder, arguments[arguments.length - 1]);
	            }
	            return this._wrapped[name].apply(this._wrapped, arguments);
	        };
	    }
	    else {
	        // Sync function. Translate error in catch.
	        return function () {
	            try {
	                if (wrapFirst) {
	                    arguments[0] = path.join(this._folder, arguments[0]);
	                }
	                if (wrapSecond) {
	                    arguments[1] = path.join(this._folder, arguments[1]);
	                }
	                return this._wrapped[name].apply(this._wrapped, arguments);
	            }
	            catch (e) {
	                throw translateError(this._folder, e);
	            }
	        };
	    }
	}
	// First argument is a path.
	['diskSpace', 'stat', 'statSync', 'open', 'openSync', 'unlink', 'unlinkSync',
	    'rmdir', 'rmdirSync', 'mkdir', 'mkdirSync', 'readdir', 'readdirSync', 'exists',
	    'existsSync', 'realpath', 'realpathSync', 'truncate', 'truncateSync', 'readFile',
	    'readFileSync', 'writeFile', 'writeFileSync', 'appendFile', 'appendFileSync',
	    'chmod', 'chmodSync', 'chown', 'chownSync', 'utimes', 'utimesSync', 'readlink',
	    'readlinkSync'].forEach(function (name) {
	    FolderAdapter.prototype[name] = wrapFunction(name, true, false);
	});
	// First and second arguments are paths.
	['rename', 'renameSync', 'link', 'linkSync', 'symlink', 'symlinkSync'].forEach(function (name) {
	    FolderAdapter.prototype[name] = wrapFunction(name, true, true);
	});
	
	/**
	 * @hidden
	 */
	var toExport;
	if (typeof (window) !== 'undefined') {
	    toExport = window;
	}
	else if (typeof (self) !== 'undefined') {
	    toExport = self;
	}
	else {
	    toExport = global;
	}
	var global$1 = toExport;
	
	/**
	 * @hidden
	 */
	function isDirectoryEntry(entry) {
	    return entry.isDirectory;
	}
	/**
	 * @hidden
	 */
	var _getFS = global$1.webkitRequestFileSystem || global$1.requestFileSystem || null;
	/**
	 * @hidden
	 */
	function _requestQuota(type, size, success, errorCallback) {
	    // We cast navigator and window to '<any>' because everything here is
	    // nonstandard functionality, despite the fact that Chrome has the only
	    // implementation of the HTML5FS and is likely driving the standardization
	    // process. Thus, these objects defined off of navigator and window are not
	    // present in the DefinitelyTyped TypeScript typings for FileSystem.
	    if (typeof navigator['webkitPersistentStorage'] !== 'undefined') {
	        switch (type) {
	            case global$1.PERSISTENT:
	                navigator.webkitPersistentStorage.requestQuota(size, success, errorCallback);
	                break;
	            case global$1.TEMPORARY:
	                navigator.webkitTemporaryStorage.requestQuota(size, success, errorCallback);
	                break;
	            default:
	                errorCallback(new TypeError(("Invalid storage type: " + type)));
	                break;
	        }
	    }
	    else {
	        global$1.webkitStorageInfo.requestQuota(type, size, success, errorCallback);
	    }
	}
	/**
	 * @hidden
	 */
	function _toArray(list) {
	    return Array.prototype.slice.call(list || [], 0);
	}
	/**
	 * Converts the given DOMError into an appropriate ApiError.
	 * @url https://developer.mozilla.org/en-US/docs/Web/API/DOMError
	 * @hidden
	 */
	function convertError$1(err, p, expectedDir) {
	    switch (err.name) {
	        /* The user agent failed to create a file or directory due to the existence of a file or
	            directory with the same path.  */
	        case "PathExistsError":
	            return ApiError.EEXIST(p);
	        /* The operation failed because it would cause the application to exceed its storage quota.  */
	        case 'QuotaExceededError':
	            return ApiError.FileError(ErrorCode.ENOSPC, p);
	        /*  A required file or directory could not be found at the time an operation was processed.   */
	        case 'NotFoundError':
	            return ApiError.ENOENT(p);
	        /* This is a security error code to be used in situations not covered by any other error codes.
	            - A required file was unsafe for access within a Web application
	            - Too many calls are being made on filesystem resources */
	        case 'SecurityError':
	            return ApiError.FileError(ErrorCode.EACCES, p);
	        /* The modification requested was illegal. Examples of invalid modifications include moving a
	            directory into its own child, moving a file into its parent directory without changing its name,
	            or copying a directory to a path occupied by a file.  */
	        case 'InvalidModificationError':
	            return ApiError.FileError(ErrorCode.EPERM, p);
	        /* The user has attempted to look up a file or directory, but the Entry found is of the wrong type
	            [e.g. is a DirectoryEntry when the user requested a FileEntry].  */
	        case 'TypeMismatchError':
	            return ApiError.FileError(expectedDir ? ErrorCode.ENOTDIR : ErrorCode.EISDIR, p);
	        /* A path or URL supplied to the API was malformed.  */
	        case "EncodingError":
	        /* An operation depended on state cached in an interface object, but that state that has changed
	            since it was read from disk.  */
	        case "InvalidStateError":
	        /* The user attempted to write to a file or directory which could not be modified due to the state
	            of the underlying filesystem.  */
	        case "NoModificationAllowedError":
	        default:
	            return ApiError.FileError(ErrorCode.EINVAL, p);
	    }
	}
	// A note about getFile and getDirectory options:
	// These methods are called at numerous places in this file, and are passed
	// some combination of these two options:
	//   - create: If true, the entry will be created if it doesn't exist.
	//             If false, an error will be thrown if it doesn't exist.
	//   - exclusive: If true, only create the entry if it doesn't already exist,
	//                and throw an error if it does.
	var HTML5FSFile = (function (PreloadFile$$1) {
	    function HTML5FSFile(fs, entry, path$$1, flag, stat, contents) {
	        PreloadFile$$1.call(this, fs, path$$1, flag, stat, contents);
	        this._entry = entry;
	    }
	
	    if ( PreloadFile$$1 ) HTML5FSFile.__proto__ = PreloadFile$$1;
	    HTML5FSFile.prototype = Object.create( PreloadFile$$1 && PreloadFile$$1.prototype );
	    HTML5FSFile.prototype.constructor = HTML5FSFile;
	    HTML5FSFile.prototype.sync = function sync (cb) {
	        var this$1 = this;
	
	        if (!this.isDirty()) {
	            return cb();
	        }
	        this._entry.createWriter(function (writer) {
	            var buffer$$1 = this$1.getBuffer();
	            var blob = new Blob([buffer2ArrayBuffer(buffer$$1)]);
	            var length = blob.size;
	            writer.onwriteend = function (err) {
	                writer.onwriteend = null;
	                writer.onerror = null;
	                writer.truncate(length);
	                this$1.resetDirty();
	                cb();
	            };
	            writer.onerror = function (err) {
	                cb(convertError$1(err, this$1.getPath(), false));
	            };
	            writer.write(blob);
	        });
	    };
	    HTML5FSFile.prototype.close = function close (cb) {
	        this.sync(cb);
	    };
	
	    return HTML5FSFile;
	}(PreloadFile));
	/**
	 * A read-write filesystem backed by the HTML5 FileSystem API.
	 *
	 * As the HTML5 FileSystem is only implemented in Blink, this interface is
	 * only available in Chrome.
	 */
	var HTML5FS = (function (BaseFileSystem$$1) {
	    function HTML5FS(size, type, deprecateMsg) {
	        if ( size === void 0 ) size = 5;
	        if ( type === void 0 ) type = global$1.PERSISTENT;
	        if ( deprecateMsg === void 0 ) deprecateMsg = true;
	
	        BaseFileSystem$$1.call(this);
	        // Convert MB to bytes.
	        this.size = 1024 * 1024 * size;
	        this.type = type;
	        deprecationMessage(deprecateMsg, HTML5FS.Name, { size: size, type: type });
	    }
	
	    if ( BaseFileSystem$$1 ) HTML5FS.__proto__ = BaseFileSystem$$1;
	    HTML5FS.prototype = Object.create( BaseFileSystem$$1 && BaseFileSystem$$1.prototype );
	    HTML5FS.prototype.constructor = HTML5FS;
	    /**
	     * Creates an HTML5FS instance with the given options.
	     */
	    HTML5FS.Create = function Create (opts, cb) {
	        var fs = new HTML5FS(opts.size, opts.type, false);
	        fs.allocate(function (e) { return e ? cb(e) : cb(null, fs); }, false);
	    };
	    HTML5FS.isAvailable = function isAvailable () {
	        return !!_getFS;
	    };
	    HTML5FS.prototype.getName = function getName () {
	        return HTML5FS.Name;
	    };
	    HTML5FS.prototype.isReadOnly = function isReadOnly () {
	        return false;
	    };
	    HTML5FS.prototype.supportsSymlinks = function supportsSymlinks () {
	        return false;
	    };
	    HTML5FS.prototype.supportsProps = function supportsProps () {
	        return false;
	    };
	    HTML5FS.prototype.supportsSynch = function supportsSynch () {
	        return false;
	    };
	    /**
	     * **Deprecated. Please use Create() method instead to create and allocate an HTML5FS.**
	     *
	     * Requests a storage quota from the browser to back this FS.
	     * Must be called before file system can be used!
	     */
	    HTML5FS.prototype.allocate = function allocate (cb, deprecateMsg) {
	        var this$1 = this;
	        if ( cb === void 0 ) cb = function () { };
	        if ( deprecateMsg === void 0 ) deprecateMsg = true;
	
	        if (deprecateMsg) {
	            console.warn(("[HTML5FS] HTML5FS.allocate() is deprecated and will be removed in the next major release. Please use 'HTML5FS.Create({type: " + (this.type) + ", size: " + (this.size) + "}, cb)' to create and allocate HTML5FS instances."));
	        }
	        var success = function (fs) {
	            this$1.fs = fs;
	            cb();
	        };
	        var error = function (err) {
	            cb(convertError$1(err, "/", true));
	        };
	        if (this.type === global$1.PERSISTENT) {
	            _requestQuota(this.type, this.size, function (granted) {
	                _getFS(this$1.type, granted, success, error);
	            }, error);
	        }
	        else {
	            _getFS(this.type, this.size, success, error);
	        }
	    };
	    /**
	     * Deletes everything in the FS. Used for testing.
	     * Karma clears the storage after you quit it but not between runs of the test
	     * suite, and the tests expect an empty FS every time.
	     */
	    HTML5FS.prototype.empty = function empty (mainCb) {
	        // Get a list of all entries in the root directory to delete them
	        this._readdir('/', function (err, entries) {
	            if (err) {
	                console.error('Failed to empty FS');
	                mainCb(err);
	            }
	            else {
	                // Called when every entry has been operated on
	                var finished = function (er) {
	                    if (err) {
	                        console.error("Failed to empty FS");
	                        mainCb(err);
	                    }
	                    else {
	                        mainCb();
	                    }
	                };
	                // Removes files and recursively removes directories
	                var deleteEntry = function (entry, cb) {
	                    var succ = function () {
	                        cb();
	                    };
	                    var error = function (err) {
	                        cb(convertError$1(err, entry.fullPath, !entry.isDirectory));
	                    };
	                    if (isDirectoryEntry(entry)) {
	                        entry.removeRecursively(succ, error);
	                    }
	                    else {
	                        entry.remove(succ, error);
	                    }
	                };
	                // Loop through the entries and remove them, then call the callback
	                // when they're all finished.
	                eachLimit(entries, deleteEntry, finished);
	            }
	        });
	    };
	    HTML5FS.prototype.rename = function rename (oldPath, newPath, cb) {
	        var this$1 = this;
	
	        var semaphore = 2;
	        var successCount = 0;
	        var root = this.fs.root;
	        var currentPath = oldPath;
	        var error = function (err) {
	            if (--semaphore <= 0) {
	                cb(convertError$1(err, currentPath, false));
	            }
	        };
	        var success = function (file) {
	            if (++successCount === 2) {
	                return cb(new ApiError(ErrorCode.EINVAL, "Something was identified as both a file and a directory. This should never happen."));
	            }
	            // SPECIAL CASE: If newPath === oldPath, and the path exists, then
	            // this operation trivially succeeds.
	            if (oldPath === newPath) {
	                return cb();
	            }
	            // Get the new parent directory.
	            currentPath = path.dirname(newPath);
	            root.getDirectory(currentPath, {}, function (parentDir) {
	                currentPath = path.basename(newPath);
	                file.moveTo(parentDir, currentPath, function (entry) { cb(); }, function (err) {
	                    // SPECIAL CASE: If oldPath is a directory, and newPath is a
	                    // file, rename should delete the file and perform the move.
	                    if (file.isDirectory) {
	                        currentPath = newPath;
	                        // Unlink only works on files. Try to delete newPath.
	                        this$1.unlink(newPath, function (e) {
	                            if (e) {
	                                // newPath is probably a directory.
	                                error(err);
	                            }
	                            else {
	                                // Recur, now that newPath doesn't exist.
	                                this$1.rename(oldPath, newPath, cb);
	                            }
	                        });
	                    }
	                    else {
	                        error(err);
	                    }
	                });
	            }, error);
	        };
	        // We don't know if oldPath is a *file* or a *directory*, and there's no
	        // way to stat items. So launch both requests, see which one succeeds.
	        root.getFile(oldPath, {}, success, error);
	        root.getDirectory(oldPath, {}, success, error);
	    };
	    HTML5FS.prototype.stat = function stat (path$$1, isLstat, cb) {
	        var this$1 = this;
	
	        // Throw an error if the entry doesn't exist, because then there's nothing
	        // to stat.
	        var opts = {
	            create: false
	        };
	        // Called when the path has been successfully loaded as a file.
	        var loadAsFile = function (entry) {
	            var fileFromEntry = function (file) {
	                var stat = new Stats(FileType.FILE, file.size);
	                cb(null, stat);
	            };
	            entry.file(fileFromEntry, failedToLoad);
	        };
	        // Called when the path has been successfully loaded as a directory.
	        var loadAsDir = function (dir$$1) {
	            // Directory entry size can't be determined from the HTML5 FS API, and is
	            // implementation-dependant anyway, so a dummy value is used.
	            var size = 4096;
	            var stat = new Stats(FileType.DIRECTORY, size);
	            cb(null, stat);
	        };
	        // Called when the path couldn't be opened as a directory or a file.
	        var failedToLoad = function (err) {
	            cb(convertError$1(err, path$$1, false /* Unknown / irrelevant */));
	        };
	        // Called when the path couldn't be opened as a file, but might still be a
	        // directory.
	        var failedToLoadAsFile = function () {
	            this$1.fs.root.getDirectory(path$$1, opts, loadAsDir, failedToLoad);
	        };
	        // No method currently exists to determine whether a path refers to a
	        // directory or a file, so this implementation tries both and uses the first
	        // one that succeeds.
	        this.fs.root.getFile(path$$1, opts, loadAsFile, failedToLoadAsFile);
	    };
	    HTML5FS.prototype.open = function open (p, flags, mode, cb) {
	        var this$1 = this;
	
	        // XXX: err is a DOMError
	        var error = function (err) {
	            if (err.name === 'InvalidModificationError' && flags.isExclusive()) {
	                cb(ApiError.EEXIST(p));
	            }
	            else {
	                cb(convertError$1(err, p, false));
	            }
	        };
	        this.fs.root.getFile(p, {
	            create: flags.pathNotExistsAction() === ActionType.CREATE_FILE,
	            exclusive: flags.isExclusive()
	        }, function (entry) {
	            // Try to fetch corresponding file.
	            entry.file(function (file) {
	                var reader = new FileReader();
	                reader.onloadend = function (event) {
	                    var bfsFile = this$1._makeFile(p, entry, flags, file, reader.result);
	                    cb(null, bfsFile);
	                };
	                reader.onerror = function (ev) {
	                    error(reader.error);
	                };
	                reader.readAsArrayBuffer(file);
	            }, error);
	        }, error);
	    };
	    HTML5FS.prototype.unlink = function unlink (path$$1, cb) {
	        this._remove(path$$1, cb, true);
	    };
	    HTML5FS.prototype.rmdir = function rmdir (path$$1, cb) {
	        var this$1 = this;
	
	        // Check if directory is non-empty, first.
	        this.readdir(path$$1, function (e, files) {
	            if (e) {
	                cb(e);
	            }
	            else if (files.length > 0) {
	                cb(ApiError.ENOTEMPTY(path$$1));
	            }
	            else {
	                this$1._remove(path$$1, cb, false);
	            }
	        });
	    };
	    HTML5FS.prototype.mkdir = function mkdir (path$$1, mode, cb) {
	        // Create the directory, but throw an error if it already exists, as per
	        // mkdir(1)
	        var opts = {
	            create: true,
	            exclusive: true
	        };
	        var success = function (dir$$1) {
	            cb();
	        };
	        var error = function (err) {
	            cb(convertError$1(err, path$$1, true));
	        };
	        this.fs.root.getDirectory(path$$1, opts, success, error);
	    };
	    /**
	     * Map _readdir's list of `FileEntry`s to their names and return that.
	     */
	    HTML5FS.prototype.readdir = function readdir (path$$1, cb) {
	        this._readdir(path$$1, function (e, entries) {
	            if (entries) {
	                var rv = [];
	                for (var i = 0, list = entries; i < list.length; i += 1) {
	                    var entry = list[i];
	
	                    rv.push(entry.name);
	                }
	                cb(null, rv);
	            }
	            else {
	                return cb(e);
	            }
	        });
	    };
	    /**
	     * Returns a BrowserFS object representing a File.
	     */
	    HTML5FS.prototype._makeFile = function _makeFile (path$$1, entry, flag, stat, data) {
	        if ( data === void 0 ) data = new ArrayBuffer(0);
	
	        var stats = new Stats(FileType.FILE, stat.size);
	        var buffer$$1 = arrayBuffer2Buffer(data);
	        return new HTML5FSFile(this, entry, path$$1, flag, stats, buffer$$1);
	    };
	    /**
	     * Returns an array of `FileEntry`s. Used internally by empty and readdir.
	     */
	    HTML5FS.prototype._readdir = function _readdir (path$$1, cb) {
	        var error = function (err) {
	            cb(convertError$1(err, path$$1, true));
	        };
	        // Grab the requested directory.
	        this.fs.root.getDirectory(path$$1, { create: false }, function (dirEntry) {
	            var reader = dirEntry.createReader();
	            var entries = [];
	            // Call the reader.readEntries() until no more results are returned.
	            var readEntries = function () {
	                reader.readEntries((function (results) {
	                    if (results.length) {
	                        entries = entries.concat(_toArray(results));
	                        readEntries();
	                    }
	                    else {
	                        cb(null, entries);
	                    }
	                }), error);
	            };
	            readEntries();
	        }, error);
	    };
	    /**
	     * Delete a file or directory from the file system
	     * isFile should reflect which call was made to remove the it (`unlink` or
	     * `rmdir`). If this doesn't match what's actually at `path`, an error will be
	     * returned
	     */
	    HTML5FS.prototype._remove = function _remove (path$$1, cb, isFile) {
	        var success = function (entry) {
	            var succ = function () {
	                cb();
	            };
	            var err = function (err) {
	                cb(convertError$1(err, path$$1, !isFile));
	            };
	            entry.remove(succ, err);
	        };
	        var error = function (err) {
	            cb(convertError$1(err, path$$1, !isFile));
	        };
	        // Deleting the entry, so don't create it
	        var opts = {
	            create: false
	        };
	        if (isFile) {
	            this.fs.root.getFile(path$$1, opts, success, error);
	        }
	        else {
	            this.fs.root.getDirectory(path$$1, opts, success, error);
	        }
	    };
	
	    return HTML5FS;
	}(BaseFileSystem));
	
	HTML5FS.Name = "HTML5FS";
	HTML5FS.Options = {
	    size: {
	        type: "number",
	        optional: true,
	        description: "Storage quota to request, in megabytes. Allocated value may be less. Defaults to 5."
	    },
	    type: {
	        type: "number",
	        optional: true,
	        description: "window.PERSISTENT or window.TEMPORARY. Defaults to PERSISTENT."
	    }
	};
	
	/**
	 * Generic inode definition that can easily be serialized.
	 */
	var Inode = function Inode(id, size, mode, atime, mtime, ctime) {
	    this.id = id;
	    this.size = size;
	    this.mode = mode;
	    this.atime = atime;
	    this.mtime = mtime;
	    this.ctime = ctime;
	};
	/**
	 * Converts the buffer into an Inode.
	 */
	Inode.fromBuffer = function fromBuffer (buffer$$1) {
	    if (buffer$$1 === undefined) {
	        throw new Error("NO");
	    }
	    return new Inode(buffer$$1.toString('ascii', 30), buffer$$1.readUInt32LE(0), buffer$$1.readUInt16LE(4), buffer$$1.readDoubleLE(6), buffer$$1.readDoubleLE(14), buffer$$1.readDoubleLE(22));
	};
	/**
	 * Handy function that converts the Inode to a Node Stats object.
	 */
	Inode.prototype.toStats = function toStats () {
	    return new Stats((this.mode & 0xF000) === FileType.DIRECTORY ? FileType.DIRECTORY : FileType.FILE, this.size, this.mode, new Date(this.atime), new Date(this.mtime), new Date(this.ctime));
	};
	/**
	 * Get the size of this Inode, in bytes.
	 */
	Inode.prototype.getSize = function getSize () {
	    // ASSUMPTION: ID is ASCII (1 byte per char).
	    return 30 + this.id.length;
	};
	/**
	 * Writes the inode into the start of the buffer.
	 */
	Inode.prototype.toBuffer = function toBuffer (buff) {
	        if ( buff === void 0 ) buff = Buffer.alloc(this.getSize());
	
	    buff.writeUInt32LE(this.size, 0);
	    buff.writeUInt16LE(this.mode, 4);
	    buff.writeDoubleLE(this.atime, 6);
	    buff.writeDoubleLE(this.mtime, 14);
	    buff.writeDoubleLE(this.ctime, 22);
	    buff.write(this.id, 30, this.id.length, 'ascii');
	    return buff;
	};
	/**
	 * Updates the Inode using information from the stats object. Used by file
	 * systems at sync time, e.g.:
	 * - Program opens file and gets a File object.
	 * - Program mutates file. File object is responsible for maintaining
	 *   metadata changes locally -- typically in a Stats object.
	 * - Program closes file. File object's metadata changes are synced with the
	 *   file system.
	 * @return True if any changes have occurred.
	 */
	Inode.prototype.update = function update (stats) {
	    var hasChanged = false;
	    if (this.size !== stats.size) {
	        this.size = stats.size;
	        hasChanged = true;
	    }
	    if (this.mode !== stats.mode) {
	        this.mode = stats.mode;
	        hasChanged = true;
	    }
	    var atimeMs = stats.atime.getTime();
	    if (this.atime !== atimeMs) {
	        this.atime = atimeMs;
	        hasChanged = true;
	    }
	    var mtimeMs = stats.mtime.getTime();
	    if (this.mtime !== mtimeMs) {
	        this.mtime = mtimeMs;
	        hasChanged = true;
	    }
	    var ctimeMs = stats.ctime.getTime();
	    if (this.ctime !== ctimeMs) {
	        this.ctime = ctimeMs;
	        hasChanged = true;
	    }
	    return hasChanged;
	};
	// XXX: Copied from Stats. Should reconcile these two into something more
	//  compact.
	/**
	 * @return [Boolean] True if this item is a file.
	 */
	Inode.prototype.isFile = function isFile () {
	    return (this.mode & 0xF000) === FileType.FILE;
	};
	/**
	 * @return [Boolean] True if this item is a directory.
	 */
	Inode.prototype.isDirectory = function isDirectory () {
	    return (this.mode & 0xF000) === FileType.DIRECTORY;
	};
	
	/**
	 * @hidden
	 */
	var ROOT_NODE_ID = "/";
	/**
	 * @hidden
	 */
	var emptyDirNode = null;
	/**
	 * Returns an empty directory node.
	 * @hidden
	 */
	function getEmptyDirNode() {
	    if (emptyDirNode) {
	        return emptyDirNode;
	    }
	    return emptyDirNode = Buffer.from("{}");
	}
	/**
	 * Generates a random ID.
	 * @hidden
	 */
	function GenerateRandomID() {
	    // From http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
	    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
	        var r = Math.random() * 16 | 0;
	        var v = c === 'x' ? r : (r & 0x3 | 0x8);
	        return v.toString(16);
	    });
	}
	/**
	 * Helper function. Checks if 'e' is defined. If so, it triggers the callback
	 * with 'e' and returns false. Otherwise, returns true.
	 * @hidden
	 */
	function noError(e, cb) {
	    if (e) {
	        cb(e);
	        return false;
	    }
	    return true;
	}
	/**
	 * Helper function. Checks if 'e' is defined. If so, it aborts the transaction,
	 * triggers the callback with 'e', and returns false. Otherwise, returns true.
	 * @hidden
	 */
	function noErrorTx(e, tx, cb) {
	    if (e) {
	        tx.abort(function () {
	            cb(e);
	        });
	        return false;
	    }
	    return true;
	}
	/**
	 * A simple RW transaction for simple synchronous key-value stores.
	 */
	var SimpleSyncRWTransaction = function SimpleSyncRWTransaction(store) {
	    this.store = store;
	    /**
	     * Stores data in the keys we modify prior to modifying them.
	     * Allows us to roll back commits.
	     */
	    this.originalData = {};
	    /**
	     * List of keys modified in this transaction, if any.
	     */
	    this.modifiedKeys = [];
	};
	SimpleSyncRWTransaction.prototype.get = function get (key) {
	    var val = this.store.get(key);
	    this.stashOldValue(key, val);
	    return val;
	};
	SimpleSyncRWTransaction.prototype.put = function put (key, data, overwrite) {
	    this.markModified(key);
	    return this.store.put(key, data, overwrite);
	};
	SimpleSyncRWTransaction.prototype.del = function del (key) {
	    this.markModified(key);
	    this.store.del(key);
	};
	SimpleSyncRWTransaction.prototype.commit = function commit () { };
	SimpleSyncRWTransaction.prototype.abort = function abort () {
	        var this$1 = this;
	
	    // Rollback old values.
	    for (var i = 0, list = this$1.modifiedKeys; i < list.length; i += 1) {
	        var key = list[i];
	
	            var value = this$1.originalData[key];
	        if (!value) {
	            // Key didn't exist.
	            this$1.store.del(key);
	        }
	        else {
	            // Key existed. Store old value.
	            this$1.store.put(key, value, true);
	        }
	    }
	};
	/**
	 * Stashes given key value pair into `originalData` if it doesn't already
	 * exist. Allows us to stash values the program is requesting anyway to
	 * prevent needless `get` requests if the program modifies the data later
	 * on during the transaction.
	 */
	SimpleSyncRWTransaction.prototype.stashOldValue = function stashOldValue (key, value) {
	    // Keep only the earliest value in the transaction.
	    if (!this.originalData.hasOwnProperty(key)) {
	        this.originalData[key] = value;
	    }
	};
	/**
	 * Marks the given key as modified, and stashes its value if it has not been
	 * stashed already.
	 */
	SimpleSyncRWTransaction.prototype.markModified = function markModified (key) {
	    if (this.modifiedKeys.indexOf(key) === -1) {
	        this.modifiedKeys.push(key);
	        if (!this.originalData.hasOwnProperty(key)) {
	            this.originalData[key] = this.store.get(key);
	        }
	    }
	};
	var SyncKeyValueFile = (function (PreloadFile$$1) {
	    function SyncKeyValueFile(_fs, _path, _flag, _stat, contents) {
	        PreloadFile$$1.call(this, _fs, _path, _flag, _stat, contents);
	    }
	
	    if ( PreloadFile$$1 ) SyncKeyValueFile.__proto__ = PreloadFile$$1;
	    SyncKeyValueFile.prototype = Object.create( PreloadFile$$1 && PreloadFile$$1.prototype );
	    SyncKeyValueFile.prototype.constructor = SyncKeyValueFile;
	    SyncKeyValueFile.prototype.syncSync = function syncSync () {
	        if (this.isDirty()) {
	            this._fs._syncSync(this.getPath(), this.getBuffer(), this.getStats());
	            this.resetDirty();
	        }
	    };
	    SyncKeyValueFile.prototype.closeSync = function closeSync () {
	        this.syncSync();
	    };
	
	    return SyncKeyValueFile;
	}(PreloadFile));
	/**
	 * A "Synchronous key-value file system". Stores data to/retrieves data from an
	 * underlying key-value store.
	 *
	 * We use a unique ID for each node in the file system. The root node has a
	 * fixed ID.
	 * @todo Introduce Node ID caching.
	 * @todo Check modes.
	 */
	var SyncKeyValueFileSystem = (function (SynchronousFileSystem$$1) {
	    function SyncKeyValueFileSystem(options) {
	        SynchronousFileSystem$$1.call(this);
	        this.store = options.store;
	        // INVARIANT: Ensure that the root exists.
	        this.makeRootDirectory();
	    }
	
	    if ( SynchronousFileSystem$$1 ) SyncKeyValueFileSystem.__proto__ = SynchronousFileSystem$$1;
	    SyncKeyValueFileSystem.prototype = Object.create( SynchronousFileSystem$$1 && SynchronousFileSystem$$1.prototype );
	    SyncKeyValueFileSystem.prototype.constructor = SyncKeyValueFileSystem;
	    SyncKeyValueFileSystem.isAvailable = function isAvailable () { return true; };
	
	    SyncKeyValueFileSystem.prototype.getName = function getName () { return this.store.name(); };
	    SyncKeyValueFileSystem.prototype.isReadOnly = function isReadOnly () { return false; };
	    SyncKeyValueFileSystem.prototype.supportsSymlinks = function supportsSymlinks () { return false; };
	    SyncKeyValueFileSystem.prototype.supportsProps = function supportsProps () { return false; };
	    SyncKeyValueFileSystem.prototype.supportsSynch = function supportsSynch () { return true; };
	    /**
	     * Delete all contents stored in the file system.
	     */
	    SyncKeyValueFileSystem.prototype.empty = function empty () {
	        this.store.clear();
	        // INVARIANT: Root always exists.
	        this.makeRootDirectory();
	    };
	    SyncKeyValueFileSystem.prototype.renameSync = function renameSync (oldPath, newPath) {
	        var tx = this.store.beginTransaction('readwrite'), oldParent = path.dirname(oldPath), oldName = path.basename(oldPath), newParent = path.dirname(newPath), newName = path.basename(newPath), 
	        // Remove oldPath from parent's directory listing.
	        oldDirNode = this.findINode(tx, oldParent), oldDirList = this.getDirListing(tx, oldParent, oldDirNode);
	        if (!oldDirList[oldName]) {
	            throw ApiError.ENOENT(oldPath);
	        }
	        var nodeId = oldDirList[oldName];
	        delete oldDirList[oldName];
	        // Invariant: Can't move a folder inside itself.
	        // This funny little hack ensures that the check passes only if oldPath
	        // is a subpath of newParent. We append '/' to avoid matching folders that
	        // are a substring of the bottom-most folder in the path.
	        if ((newParent + '/').indexOf(oldPath + '/') === 0) {
	            throw new ApiError(ErrorCode.EBUSY, oldParent);
	        }
	        // Add newPath to parent's directory listing.
	        var newDirNode, newDirList;
	        if (newParent === oldParent) {
	            // Prevent us from re-grabbing the same directory listing, which still
	            // contains oldName.
	            newDirNode = oldDirNode;
	            newDirList = oldDirList;
	        }
	        else {
	            newDirNode = this.findINode(tx, newParent);
	            newDirList = this.getDirListing(tx, newParent, newDirNode);
	        }
	        if (newDirList[newName]) {
	            // If it's a file, delete it.
	            var newNameNode = this.getINode(tx, newPath, newDirList[newName]);
	            if (newNameNode.isFile()) {
	                try {
	                    tx.del(newNameNode.id);
	                    tx.del(newDirList[newName]);
	                }
	                catch (e) {
	                    tx.abort();
	                    throw e;
	                }
	            }
	            else {
	                // If it's a directory, throw a permissions error.
	                throw ApiError.EPERM(newPath);
	            }
	        }
	        newDirList[newName] = nodeId;
	        // Commit the two changed directory listings.
	        try {
	            tx.put(oldDirNode.id, Buffer.from(JSON.stringify(oldDirList)), true);
	            tx.put(newDirNode.id, Buffer.from(JSON.stringify(newDirList)), true);
	        }
	        catch (e) {
	            tx.abort();
	            throw e;
	        }
	        tx.commit();
	    };
	    SyncKeyValueFileSystem.prototype.statSync = function statSync (p, isLstat) {
	        // Get the inode to the item, convert it into a Stats object.
	        return this.findINode(this.store.beginTransaction('readonly'), p).toStats();
	    };
	    SyncKeyValueFileSystem.prototype.createFileSync = function createFileSync (p, flag, mode) {
	        var tx = this.store.beginTransaction('readwrite'), data = emptyBuffer(), newFile = this.commitNewFile(tx, p, FileType.FILE, mode, data);
	        // Open the file.
	        return new SyncKeyValueFile(this, p, flag, newFile.toStats(), data);
	    };
	    SyncKeyValueFileSystem.prototype.openFileSync = function openFileSync (p, flag) {
	        var tx = this.store.beginTransaction('readonly'), node = this.findINode(tx, p), data = tx.get(node.id);
	        if (data === undefined) {
	            throw ApiError.ENOENT(p);
	        }
	        return new SyncKeyValueFile(this, p, flag, node.toStats(), data);
	    };
	    SyncKeyValueFileSystem.prototype.unlinkSync = function unlinkSync (p) {
	        this.removeEntry(p, false);
	    };
	    SyncKeyValueFileSystem.prototype.rmdirSync = function rmdirSync (p) {
	        // Check first if directory is empty.
	        if (this.readdirSync(p).length > 0) {
	            throw ApiError.ENOTEMPTY(p);
	        }
	        else {
	            this.removeEntry(p, true);
	        }
	    };
	    SyncKeyValueFileSystem.prototype.mkdirSync = function mkdirSync (p, mode) {
	        var tx = this.store.beginTransaction('readwrite'), data = Buffer.from('{}');
	        this.commitNewFile(tx, p, FileType.DIRECTORY, mode, data);
	    };
	    SyncKeyValueFileSystem.prototype.readdirSync = function readdirSync (p) {
	        var tx = this.store.beginTransaction('readonly');
	        return Object.keys(this.getDirListing(tx, p, this.findINode(tx, p)));
	    };
	    SyncKeyValueFileSystem.prototype._syncSync = function _syncSync (p, data, stats) {
	        // @todo Ensure mtime updates properly, and use that to determine if a data
	        //       update is required.
	        var tx = this.store.beginTransaction('readwrite'), 
	        // We use the _findInode helper because we actually need the INode id.
	        fileInodeId = this._findINode(tx, path.dirname(p), path.basename(p)), fileInode = this.getINode(tx, p, fileInodeId), inodeChanged = fileInode.update(stats);
	        try {
	            // Sync data.
	            tx.put(fileInode.id, data, true);
	            // Sync metadata.
	            if (inodeChanged) {
	                tx.put(fileInodeId, fileInode.toBuffer(), true);
	            }
	        }
	        catch (e) {
	            tx.abort();
	            throw e;
	        }
	        tx.commit();
	    };
	    /**
	     * Checks if the root directory exists. Creates it if it doesn't.
	     */
	    SyncKeyValueFileSystem.prototype.makeRootDirectory = function makeRootDirectory () {
	        var tx = this.store.beginTransaction('readwrite');
	        if (tx.get(ROOT_NODE_ID) === undefined) {
	            // Create new inode.
	            var currTime = (new Date()).getTime(), 
	            // Mode 0666
	            dirInode = new Inode(GenerateRandomID(), 4096, 511 | FileType.DIRECTORY, currTime, currTime, currTime);
	            // If the root doesn't exist, the first random ID shouldn't exist,
	            // either.
	            tx.put(dirInode.id, getEmptyDirNode(), false);
	            tx.put(ROOT_NODE_ID, dirInode.toBuffer(), false);
	            tx.commit();
	        }
	    };
	    /**
	     * Helper function for findINode.
	     * @param parent The parent directory of the file we are attempting to find.
	     * @param filename The filename of the inode we are attempting to find, minus
	     *   the parent.
	     * @return string The ID of the file's inode in the file system.
	     */
	    SyncKeyValueFileSystem.prototype._findINode = function _findINode (tx, parent, filename) {
	        var this$1 = this;
	
	        var readDirectory = function (inode) {
	            // Get the root's directory listing.
	            var dirList = this$1.getDirListing(tx, parent, inode);
	            // Get the file's ID.
	            if (dirList[filename]) {
	                return dirList[filename];
	            }
	            else {
	                throw ApiError.ENOENT(path.resolve(parent, filename));
	            }
	        };
	        if (parent === '/') {
	            if (filename === '') {
	                // BASE CASE #1: Return the root's ID.
	                return ROOT_NODE_ID;
	            }
	            else {
	                // BASE CASE #2: Find the item in the root ndoe.
	                return readDirectory(this.getINode(tx, parent, ROOT_NODE_ID));
	            }
	        }
	        else {
	            return readDirectory(this.getINode(tx, parent + path.sep + filename, this._findINode(tx, path.dirname(parent), path.basename(parent))));
	        }
	    };
	    /**
	     * Finds the Inode of the given path.
	     * @param p The path to look up.
	     * @return The Inode of the path p.
	     * @todo memoize/cache
	     */
	    SyncKeyValueFileSystem.prototype.findINode = function findINode (tx, p) {
	        return this.getINode(tx, p, this._findINode(tx, path.dirname(p), path.basename(p)));
	    };
	    /**
	     * Given the ID of a node, retrieves the corresponding Inode.
	     * @param tx The transaction to use.
	     * @param p The corresponding path to the file (used for error messages).
	     * @param id The ID to look up.
	     */
	    SyncKeyValueFileSystem.prototype.getINode = function getINode (tx, p, id) {
	        var inode = tx.get(id);
	        if (inode === undefined) {
	            throw ApiError.ENOENT(p);
	        }
	        return Inode.fromBuffer(inode);
	    };
	    /**
	     * Given the Inode of a directory, retrieves the corresponding directory
	     * listing.
	     */
	    SyncKeyValueFileSystem.prototype.getDirListing = function getDirListing (tx, p, inode) {
	        if (!inode.isDirectory()) {
	            throw ApiError.ENOTDIR(p);
	        }
	        var data = tx.get(inode.id);
	        if (data === undefined) {
	            throw ApiError.ENOENT(p);
	        }
	        return JSON.parse(data.toString());
	    };
	    /**
	     * Creates a new node under a random ID. Retries 5 times before giving up in
	     * the exceedingly unlikely chance that we try to reuse a random GUID.
	     * @return The GUID that the data was stored under.
	     */
	    SyncKeyValueFileSystem.prototype.addNewNode = function addNewNode (tx, data) {
	        var retries = 0;
	        var currId;
	        while (retries < 5) {
	            try {
	                currId = GenerateRandomID();
	                tx.put(currId, data, false);
	                return currId;
	            }
	            catch (e) {
	                // Ignore and reroll.
	            }
	        }
	        throw new ApiError(ErrorCode.EIO, 'Unable to commit data to key-value store.');
	    };
	    /**
	     * Commits a new file (well, a FILE or a DIRECTORY) to the file system with
	     * the given mode.
	     * Note: This will commit the transaction.
	     * @param p The path to the new file.
	     * @param type The type of the new file.
	     * @param mode The mode to create the new file with.
	     * @param data The data to store at the file's data node.
	     * @return The Inode for the new file.
	     */
	    SyncKeyValueFileSystem.prototype.commitNewFile = function commitNewFile (tx, p, type, mode, data) {
	        var parentDir = path.dirname(p), fname = path.basename(p), parentNode = this.findINode(tx, parentDir), dirListing = this.getDirListing(tx, parentDir, parentNode), currTime = (new Date()).getTime();
	        // Invariant: The root always exists.
	        // If we don't check this prior to taking steps below, we will create a
	        // file with name '' in root should p == '/'.
	        if (p === '/') {
	            throw ApiError.EEXIST(p);
	        }
	        // Check if file already exists.
	        if (dirListing[fname]) {
	            throw ApiError.EEXIST(p);
	        }
	        var fileNode;
	        try {
	            // Commit data.
	            var dataId = this.addNewNode(tx, data);
	            fileNode = new Inode(dataId, data.length, mode | type, currTime, currTime, currTime);
	            // Commit file node.
	            var fileNodeId = this.addNewNode(tx, fileNode.toBuffer());
	            // Update and commit parent directory listing.
	            dirListing[fname] = fileNodeId;
	            tx.put(parentNode.id, Buffer.from(JSON.stringify(dirListing)), true);
	        }
	        catch (e) {
	            tx.abort();
	            throw e;
	        }
	        tx.commit();
	        return fileNode;
	    };
	    /**
	     * Remove all traces of the given path from the file system.
	     * @param p The path to remove from the file system.
	     * @param isDir Does the path belong to a directory, or a file?
	     * @todo Update mtime.
	     */
	    SyncKeyValueFileSystem.prototype.removeEntry = function removeEntry (p, isDir) {
	        var tx = this.store.beginTransaction('readwrite'), parent = path.dirname(p), parentNode = this.findINode(tx, parent), parentListing = this.getDirListing(tx, parent, parentNode), fileName = path.basename(p);
	        if (!parentListing[fileName]) {
	            throw ApiError.ENOENT(p);
	        }
	        // Remove from directory listing of parent.
	        var fileNodeId = parentListing[fileName];
	        delete parentListing[fileName];
	        // Get file inode.
	        var fileNode = this.getINode(tx, p, fileNodeId);
	        if (!isDir && fileNode.isDirectory()) {
	            throw ApiError.EISDIR(p);
	        }
	        else if (isDir && !fileNode.isDirectory()) {
	            throw ApiError.ENOTDIR(p);
	        }
	        try {
	            // Delete data.
	            tx.del(fileNode.id);
	            // Delete node.
	            tx.del(fileNodeId);
	            // Update directory listing.
	            tx.put(parentNode.id, Buffer.from(JSON.stringify(parentListing)), true);
	        }
	        catch (e) {
	            tx.abort();
	            throw e;
	        }
	        // Success.
	        tx.commit();
	    };
	
	    return SyncKeyValueFileSystem;
	}(SynchronousFileSystem));
	var AsyncKeyValueFile = (function (PreloadFile$$1) {
	    function AsyncKeyValueFile(_fs, _path, _flag, _stat, contents) {
	        PreloadFile$$1.call(this, _fs, _path, _flag, _stat, contents);
	    }
	
	    if ( PreloadFile$$1 ) AsyncKeyValueFile.__proto__ = PreloadFile$$1;
	    AsyncKeyValueFile.prototype = Object.create( PreloadFile$$1 && PreloadFile$$1.prototype );
	    AsyncKeyValueFile.prototype.constructor = AsyncKeyValueFile;
	    AsyncKeyValueFile.prototype.sync = function sync (cb) {
	        var this$1 = this;
	
	        if (this.isDirty()) {
	            this._fs._sync(this.getPath(), this.getBuffer(), this.getStats(), function (e) {
	                if (!e) {
	                    this$1.resetDirty();
	                }
	                cb(e);
	            });
	        }
	        else {
	            cb();
	        }
	    };
	    AsyncKeyValueFile.prototype.close = function close (cb) {
	        this.sync(cb);
	    };
	
	    return AsyncKeyValueFile;
	}(PreloadFile));
	/**
	 * An "Asynchronous key-value file system". Stores data to/retrieves data from
	 * an underlying asynchronous key-value store.
	 */
	var AsyncKeyValueFileSystem = (function (BaseFileSystem$$1) {
	    function AsyncKeyValueFileSystem () {
	        BaseFileSystem$$1.apply(this, arguments);
	    }
	
	    if ( BaseFileSystem$$1 ) AsyncKeyValueFileSystem.__proto__ = BaseFileSystem$$1;
	    AsyncKeyValueFileSystem.prototype = Object.create( BaseFileSystem$$1 && BaseFileSystem$$1.prototype );
	    AsyncKeyValueFileSystem.prototype.constructor = AsyncKeyValueFileSystem;
	
	    AsyncKeyValueFileSystem.isAvailable = function isAvailable () { return true; };
	    /**
	     * Initializes the file system. Typically called by subclasses' async
	     * constructors.
	     */
	    AsyncKeyValueFileSystem.prototype.init = function init (store, cb) {
	        this.store = store;
	        // INVARIANT: Ensure that the root exists.
	        this.makeRootDirectory(cb);
	    };
	    AsyncKeyValueFileSystem.prototype.getName = function getName () { return this.store.name(); };
	    AsyncKeyValueFileSystem.prototype.isReadOnly = function isReadOnly () { return false; };
	    AsyncKeyValueFileSystem.prototype.supportsSymlinks = function supportsSymlinks () { return false; };
	    AsyncKeyValueFileSystem.prototype.supportsProps = function supportsProps () { return false; };
	    AsyncKeyValueFileSystem.prototype.supportsSynch = function supportsSynch () { return false; };
	    /**
	     * Delete all contents stored in the file system.
	     */
	    AsyncKeyValueFileSystem.prototype.empty = function empty (cb) {
	        var this$1 = this;
	
	        this.store.clear(function (e) {
	            if (noError(e, cb)) {
	                // INVARIANT: Root always exists.
	                this$1.makeRootDirectory(cb);
	            }
	        });
	    };
	    AsyncKeyValueFileSystem.prototype.rename = function rename (oldPath, newPath, cb) {
	        var this$1 = this;
	
	        var tx = this.store.beginTransaction('readwrite');
	        var oldParent = path.dirname(oldPath), oldName = path.basename(oldPath);
	        var newParent = path.dirname(newPath), newName = path.basename(newPath);
	        var inodes = {};
	        var lists = {};
	        var errorOccurred = false;
	        // Invariant: Can't move a folder inside itself.
	        // This funny little hack ensures that the check passes only if oldPath
	        // is a subpath of newParent. We append '/' to avoid matching folders that
	        // are a substring of the bottom-most folder in the path.
	        if ((newParent + '/').indexOf(oldPath + '/') === 0) {
	            return cb(new ApiError(ErrorCode.EBUSY, oldParent));
	        }
	        /**
	         * Responsible for Phase 2 of the rename operation: Modifying and
	         * committing the directory listings. Called once we have successfully
	         * retrieved both the old and new parent's inodes and listings.
	         */
	        var theOleSwitcharoo = function () {
	            // Sanity check: Ensure both paths are present, and no error has occurred.
	            if (errorOccurred || !lists.hasOwnProperty(oldParent) || !lists.hasOwnProperty(newParent)) {
	                return;
	            }
	            var oldParentList = lists[oldParent], oldParentINode = inodes[oldParent], newParentList = lists[newParent], newParentINode = inodes[newParent];
	            // Delete file from old parent.
	            if (!oldParentList[oldName]) {
	                cb(ApiError.ENOENT(oldPath));
	            }
	            else {
	                var fileId = oldParentList[oldName];
	                delete oldParentList[oldName];
	                // Finishes off the renaming process by adding the file to the new
	                // parent.
	                var completeRename = function () {
	                    newParentList[newName] = fileId;
	                    // Commit old parent's list.
	                    tx.put(oldParentINode.id, Buffer.from(JSON.stringify(oldParentList)), true, function (e) {
	                        if (noErrorTx(e, tx, cb)) {
	                            if (oldParent === newParent) {
	                                // DONE!
	                                tx.commit(cb);
	                            }
	                            else {
	                                // Commit new parent's list.
	                                tx.put(newParentINode.id, Buffer.from(JSON.stringify(newParentList)), true, function (e) {
	                                    if (noErrorTx(e, tx, cb)) {
	                                        tx.commit(cb);
	                                    }
	                                });
	                            }
	                        }
	                    });
	                };
	                if (newParentList[newName]) {
	                    // 'newPath' already exists. Check if it's a file or a directory, and
	                    // act accordingly.
	                    this$1.getINode(tx, newPath, newParentList[newName], function (e, inode) {
	                        if (noErrorTx(e, tx, cb)) {
	                            if (inode.isFile()) {
	                                // Delete the file and continue.
	                                tx.del(inode.id, function (e) {
	                                    if (noErrorTx(e, tx, cb)) {
	                                        tx.del(newParentList[newName], function (e) {
	                                            if (noErrorTx(e, tx, cb)) {
	                                                completeRename();
	                                            }
	                                        });
	                                    }
	                                });
	                            }
	                            else {
	                                // Can't overwrite a directory using rename.
	                                tx.abort(function (e) {
	                                    cb(ApiError.EPERM(newPath));
	                                });
	                            }
	                        }
	                    });
	                }
	                else {
	                    completeRename();
	                }
	            }
	        };
	        /**
	         * Grabs a path's inode and directory listing, and shoves it into the
	         * inodes and lists hashes.
	         */
	        var processInodeAndListings = function (p) {
	            this$1.findINodeAndDirListing(tx, p, function (e, node, dirList) {
	                if (e) {
	                    if (!errorOccurred) {
	                        errorOccurred = true;
	                        tx.abort(function () {
	                            cb(e);
	                        });
	                    }
	                    // If error has occurred already, just stop here.
	                }
	                else {
	                    inodes[p] = node;
	                    lists[p] = dirList;
	                    theOleSwitcharoo();
	                }
	            });
	        };
	        processInodeAndListings(oldParent);
	        if (oldParent !== newParent) {
	            processInodeAndListings(newParent);
	        }
	    };
	    AsyncKeyValueFileSystem.prototype.stat = function stat (p, isLstat, cb) {
	        var tx = this.store.beginTransaction('readonly');
	        this.findINode(tx, p, function (e, inode) {
	            if (noError(e, cb)) {
	                cb(null, inode.toStats());
	            }
	        });
	    };
	    AsyncKeyValueFileSystem.prototype.createFile = function createFile (p, flag, mode, cb) {
	        var this$1 = this;
	
	        var tx = this.store.beginTransaction('readwrite'), data = emptyBuffer();
	        this.commitNewFile(tx, p, FileType.FILE, mode, data, function (e, newFile) {
	            if (noError(e, cb)) {
	                cb(null, new AsyncKeyValueFile(this$1, p, flag, newFile.toStats(), data));
	            }
	        });
	    };
	    AsyncKeyValueFileSystem.prototype.openFile = function openFile (p, flag, cb) {
	        var this$1 = this;
	
	        var tx = this.store.beginTransaction('readonly');
	        // Step 1: Grab the file's inode.
	        this.findINode(tx, p, function (e, inode) {
	            if (noError(e, cb)) {
	                // Step 2: Grab the file's data.
	                tx.get(inode.id, function (e, data) {
	                    if (noError(e, cb)) {
	                        if (data === undefined) {
	                            cb(ApiError.ENOENT(p));
	                        }
	                        else {
	                            cb(null, new AsyncKeyValueFile(this$1, p, flag, inode.toStats(), data));
	                        }
	                    }
	                });
	            }
	        });
	    };
	    AsyncKeyValueFileSystem.prototype.unlink = function unlink (p, cb) {
	        this.removeEntry(p, false, cb);
	    };
	    AsyncKeyValueFileSystem.prototype.rmdir = function rmdir (p, cb) {
	        var this$1 = this;
	
	        // Check first if directory is empty.
	        this.readdir(p, function (err, files) {
	            if (err) {
	                cb(err);
	            }
	            else if (files.length > 0) {
	                cb(ApiError.ENOTEMPTY(p));
	            }
	            else {
	                this$1.removeEntry(p, true, cb);
	            }
	        });
	    };
	    AsyncKeyValueFileSystem.prototype.mkdir = function mkdir (p, mode, cb) {
	        var tx = this.store.beginTransaction('readwrite'), data = Buffer.from('{}');
	        this.commitNewFile(tx, p, FileType.DIRECTORY, mode, data, cb);
	    };
	    AsyncKeyValueFileSystem.prototype.readdir = function readdir (p, cb) {
	        var this$1 = this;
	
	        var tx = this.store.beginTransaction('readonly');
	        this.findINode(tx, p, function (e, inode) {
	            if (noError(e, cb)) {
	                this$1.getDirListing(tx, p, inode, function (e, dirListing) {
	                    if (noError(e, cb)) {
	                        cb(null, Object.keys(dirListing));
	                    }
	                });
	            }
	        });
	    };
	    AsyncKeyValueFileSystem.prototype._sync = function _sync (p, data, stats, cb) {
	        var this$1 = this;
	
	        // @todo Ensure mtime updates properly, and use that to determine if a data
	        //       update is required.
	        var tx = this.store.beginTransaction('readwrite');
	        // Step 1: Get the file node's ID.
	        this._findINode(tx, path.dirname(p), path.basename(p), function (e, fileInodeId) {
	            if (noErrorTx(e, tx, cb)) {
	                // Step 2: Get the file inode.
	                this$1.getINode(tx, p, fileInodeId, function (e, fileInode) {
	                    if (noErrorTx(e, tx, cb)) {
	                        var inodeChanged = fileInode.update(stats);
	                        // Step 3: Sync the data.
	                        tx.put(fileInode.id, data, true, function (e) {
	                            if (noErrorTx(e, tx, cb)) {
	                                // Step 4: Sync the metadata (if it changed)!
	                                if (inodeChanged) {
	                                    tx.put(fileInodeId, fileInode.toBuffer(), true, function (e) {
	                                        if (noErrorTx(e, tx, cb)) {
	                                            tx.commit(cb);
	                                        }
	                                    });
	                                }
	                                else {
	                                    // No need to sync metadata; return.
	                                    tx.commit(cb);
	                                }
	                            }
	                        });
	                    }
	                });
	            }
	        });
	    };
	    /**
	     * Checks if the root directory exists. Creates it if it doesn't.
	     */
	    AsyncKeyValueFileSystem.prototype.makeRootDirectory = function makeRootDirectory (cb) {
	        var tx = this.store.beginTransaction('readwrite');
	        tx.get(ROOT_NODE_ID, function (e, data) {
	            if (e || data === undefined) {
	                // Create new inode.
	                var currTime = (new Date()).getTime(), 
	                // Mode 0666
	                dirInode = new Inode(GenerateRandomID(), 4096, 511 | FileType.DIRECTORY, currTime, currTime, currTime);
	                // If the root doesn't exist, the first random ID shouldn't exist,
	                // either.
	                tx.put(dirInode.id, getEmptyDirNode(), false, function (e) {
	                    if (noErrorTx(e, tx, cb)) {
	                        tx.put(ROOT_NODE_ID, dirInode.toBuffer(), false, function (e) {
	                            if (e) {
	                                tx.abort(function () { cb(e); });
	                            }
	                            else {
	                                tx.commit(cb);
	                            }
	                        });
	                    }
	                });
	            }
	            else {
	                // We're good.
	                tx.commit(cb);
	            }
	        });
	    };
	    /**
	     * Helper function for findINode.
	     * @param parent The parent directory of the file we are attempting to find.
	     * @param filename The filename of the inode we are attempting to find, minus
	     *   the parent.
	     * @param cb Passed an error or the ID of the file's inode in the file system.
	     */
	    AsyncKeyValueFileSystem.prototype._findINode = function _findINode (tx, parent, filename, cb) {
	        var this$1 = this;
	
	        var handleDirectoryListings = function (e, inode, dirList) {
	            if (e) {
	                cb(e);
	            }
	            else if (dirList[filename]) {
	                cb(null, dirList[filename]);
	            }
	            else {
	                cb(ApiError.ENOENT(path.resolve(parent, filename)));
	            }
	        };
	        if (parent === '/') {
	            if (filename === '') {
	                // BASE CASE #1: Return the root's ID.
	                cb(null, ROOT_NODE_ID);
	            }
	            else {
	                // BASE CASE #2: Find the item in the root node.
	                this.getINode(tx, parent, ROOT_NODE_ID, function (e, inode) {
	                    if (noError(e, cb)) {
	                        this$1.getDirListing(tx, parent, inode, function (e, dirList) {
	                            // handle_directory_listings will handle e for us.
	                            handleDirectoryListings(e, inode, dirList);
	                        });
	                    }
	                });
	            }
	        }
	        else {
	            // Get the parent directory's INode, and find the file in its directory
	            // listing.
	            this.findINodeAndDirListing(tx, parent, handleDirectoryListings);
	        }
	    };
	    /**
	     * Finds the Inode of the given path.
	     * @param p The path to look up.
	     * @param cb Passed an error or the Inode of the path p.
	     * @todo memoize/cache
	     */
	    AsyncKeyValueFileSystem.prototype.findINode = function findINode (tx, p, cb) {
	        var this$1 = this;
	
	        this._findINode(tx, path.dirname(p), path.basename(p), function (e, id) {
	            if (noError(e, cb)) {
	                this$1.getINode(tx, p, id, cb);
	            }
	        });
	    };
	    /**
	     * Given the ID of a node, retrieves the corresponding Inode.
	     * @param tx The transaction to use.
	     * @param p The corresponding path to the file (used for error messages).
	     * @param id The ID to look up.
	     * @param cb Passed an error or the inode under the given id.
	     */
	    AsyncKeyValueFileSystem.prototype.getINode = function getINode (tx, p, id, cb) {
	        tx.get(id, function (e, data) {
	            if (noError(e, cb)) {
	                if (data === undefined) {
	                    cb(ApiError.ENOENT(p));
	                }
	                else {
	                    cb(null, Inode.fromBuffer(data));
	                }
	            }
	        });
	    };
	    /**
	     * Given the Inode of a directory, retrieves the corresponding directory
	     * listing.
	     */
	    AsyncKeyValueFileSystem.prototype.getDirListing = function getDirListing (tx, p, inode, cb) {
	        if (!inode.isDirectory()) {
	            cb(ApiError.ENOTDIR(p));
	        }
	        else {
	            tx.get(inode.id, function (e, data) {
	                if (noError(e, cb)) {
	                    try {
	                        cb(null, JSON.parse(data.toString()));
	                    }
	                    catch (e) {
	                        // Occurs when data is undefined, or corresponds to something other
	                        // than a directory listing. The latter should never occur unless
	                        // the file system is corrupted.
	                        cb(ApiError.ENOENT(p));
	                    }
	                }
	            });
	        }
	    };
	    /**
	     * Given a path to a directory, retrieves the corresponding INode and
	     * directory listing.
	     */
	    AsyncKeyValueFileSystem.prototype.findINodeAndDirListing = function findINodeAndDirListing (tx, p, cb) {
	        var this$1 = this;
	
	        this.findINode(tx, p, function (e, inode) {
	            if (noError(e, cb)) {
	                this$1.getDirListing(tx, p, inode, function (e, listing) {
	                    if (noError(e, cb)) {
	                        cb(null, inode, listing);
	                    }
	                });
	            }
	        });
	    };
	    /**
	     * Adds a new node under a random ID. Retries 5 times before giving up in
	     * the exceedingly unlikely chance that we try to reuse a random GUID.
	     * @param cb Passed an error or the GUID that the data was stored under.
	     */
	    AsyncKeyValueFileSystem.prototype.addNewNode = function addNewNode (tx, data, cb) {
	        var retries = 0, currId;
	        var reroll = function () {
	            if (++retries === 5) {
	                // Max retries hit. Return with an error.
	                cb(new ApiError(ErrorCode.EIO, 'Unable to commit data to key-value store.'));
	            }
	            else {
	                // Try again.
	                currId = GenerateRandomID();
	                tx.put(currId, data, false, function (e, committed) {
	                    if (e || !committed) {
	                        reroll();
	                    }
	                    else {
	                        // Successfully stored under 'currId'.
	                        cb(null, currId);
	                    }
	                });
	            }
	        };
	        reroll();
	    };
	    /**
	     * Commits a new file (well, a FILE or a DIRECTORY) to the file system with
	     * the given mode.
	     * Note: This will commit the transaction.
	     * @param p The path to the new file.
	     * @param type The type of the new file.
	     * @param mode The mode to create the new file with.
	     * @param data The data to store at the file's data node.
	     * @param cb Passed an error or the Inode for the new file.
	     */
	    AsyncKeyValueFileSystem.prototype.commitNewFile = function commitNewFile (tx, p, type, mode, data, cb) {
	        var this$1 = this;
	
	        var parentDir = path.dirname(p), fname = path.basename(p), currTime = (new Date()).getTime();
	        // Invariant: The root always exists.
	        // If we don't check this prior to taking steps below, we will create a
	        // file with name '' in root should p == '/'.
	        if (p === '/') {
	            return cb(ApiError.EEXIST(p));
	        }
	        // Let's build a pyramid of code!
	        // Step 1: Get the parent directory's inode and directory listing
	        this.findINodeAndDirListing(tx, parentDir, function (e, parentNode, dirListing) {
	            if (noErrorTx(e, tx, cb)) {
	                if (dirListing[fname]) {
	                    // File already exists.
	                    tx.abort(function () {
	                        cb(ApiError.EEXIST(p));
	                    });
	                }
	                else {
	                    // Step 2: Commit data to store.
	                    this$1.addNewNode(tx, data, function (e, dataId) {
	                        if (noErrorTx(e, tx, cb)) {
	                            // Step 3: Commit the file's inode to the store.
	                            var fileInode = new Inode(dataId, data.length, mode | type, currTime, currTime, currTime);
	                            this$1.addNewNode(tx, fileInode.toBuffer(), function (e, fileInodeId) {
	                                if (noErrorTx(e, tx, cb)) {
	                                    // Step 4: Update parent directory's listing.
	                                    dirListing[fname] = fileInodeId;
	                                    tx.put(parentNode.id, Buffer.from(JSON.stringify(dirListing)), true, function (e) {
	                                        if (noErrorTx(e, tx, cb)) {
	                                            // Step 5: Commit and return the new inode.
	                                            tx.commit(function (e) {
	                                                if (noErrorTx(e, tx, cb)) {
	                                                    cb(null, fileInode);
	                                                }
	                                            });
	                                        }
	                                    });
	                                }
	                            });
	                        }
	                    });
	                }
	            }
	        });
	    };
	    /**
	     * Remove all traces of the given path from the file system.
	     * @param p The path to remove from the file system.
	     * @param isDir Does the path belong to a directory, or a file?
	     * @todo Update mtime.
	     */
	    AsyncKeyValueFileSystem.prototype.removeEntry = function removeEntry (p, isDir, cb) {
	        var this$1 = this;
	
	        var tx = this.store.beginTransaction('readwrite'), parent = path.dirname(p), fileName = path.basename(p);
	        // Step 1: Get parent directory's node and directory listing.
	        this.findINodeAndDirListing(tx, parent, function (e, parentNode, parentListing) {
	            if (noErrorTx(e, tx, cb)) {
	                if (!parentListing[fileName]) {
	                    tx.abort(function () {
	                        cb(ApiError.ENOENT(p));
	                    });
	                }
	                else {
	                    // Remove from directory listing of parent.
	                    var fileNodeId = parentListing[fileName];
	                    delete parentListing[fileName];
	                    // Step 2: Get file inode.
	                    this$1.getINode(tx, p, fileNodeId, function (e, fileNode) {
	                        if (noErrorTx(e, tx, cb)) {
	                            if (!isDir && fileNode.isDirectory()) {
	                                tx.abort(function () {
	                                    cb(ApiError.EISDIR(p));
	                                });
	                            }
	                            else if (isDir && !fileNode.isDirectory()) {
	                                tx.abort(function () {
	                                    cb(ApiError.ENOTDIR(p));
	                                });
	                            }
	                            else {
	                                // Step 3: Delete data.
	                                tx.del(fileNode.id, function (e) {
	                                    if (noErrorTx(e, tx, cb)) {
	                                        // Step 4: Delete node.
	                                        tx.del(fileNodeId, function (e) {
	                                            if (noErrorTx(e, tx, cb)) {
	                                                // Step 5: Update directory listing.
	                                                tx.put(parentNode.id, Buffer.from(JSON.stringify(parentListing)), true, function (e) {
	                                                    if (noErrorTx(e, tx, cb)) {
	                                                        tx.commit(cb);
	                                                    }
	                                                });
	                                            }
	                                        });
	                                    }
	                                });
	                            }
	                        }
	                    });
	                }
	            }
	        });
	    };
	
	    return AsyncKeyValueFileSystem;
	}(BaseFileSystem));
	
	/**
	 * A simple in-memory key-value store backed by a JavaScript object.
	 */
	var InMemoryStore = function InMemoryStore() {
	    this.store = {};
	};
	InMemoryStore.prototype.name = function name () { return InMemoryFileSystem.Name; };
	InMemoryStore.prototype.clear = function clear () { this.store = {}; };
	InMemoryStore.prototype.beginTransaction = function beginTransaction (type) {
	    return new SimpleSyncRWTransaction(this);
	};
	InMemoryStore.prototype.get = function get (key) {
	    return this.store[key];
	};
	InMemoryStore.prototype.put = function put (key, data, overwrite) {
	    if (!overwrite && this.store.hasOwnProperty(key)) {
	        return false;
	    }
	    this.store[key] = data;
	    return true;
	};
	InMemoryStore.prototype.del = function del (key) {
	    delete this.store[key];
	};
	/**
	 * A simple in-memory file system backed by an InMemoryStore.
	 * Files are not persisted across page loads.
	 */
	var InMemoryFileSystem = (function (SyncKeyValueFileSystem$$1) {
	    function InMemoryFileSystem() {
	        SyncKeyValueFileSystem$$1.call(this, { store: new InMemoryStore() });
	    }
	
	    if ( SyncKeyValueFileSystem$$1 ) InMemoryFileSystem.__proto__ = SyncKeyValueFileSystem$$1;
	    InMemoryFileSystem.prototype = Object.create( SyncKeyValueFileSystem$$1 && SyncKeyValueFileSystem$$1.prototype );
	    InMemoryFileSystem.prototype.constructor = InMemoryFileSystem;
	    /**
	     * Creates an InMemoryFileSystem instance.
	     */
	    InMemoryFileSystem.Create = function Create (options, cb) {
	        cb(null, new InMemoryFileSystem());
	    };
	
	    return InMemoryFileSystem;
	}(SyncKeyValueFileSystem));
	
	InMemoryFileSystem.Name = "InMemory";
	InMemoryFileSystem.Options = {};
	
	/**
	 * Get the indexedDB constructor for the current browser.
	 * @hidden
	 */
	var indexedDB = global$1.indexedDB ||
	    global$1.mozIndexedDB ||
	    global$1.webkitIndexedDB ||
	    global$1.msIndexedDB;
	/**
	 * Converts a DOMException or a DOMError from an IndexedDB event into a
	 * standardized BrowserFS API error.
	 * @hidden
	 */
	function convertError$2(e, message) {
	    if ( message === void 0 ) message = e.toString();
	
	    switch (e.name) {
	        case "NotFoundError":
	            return new ApiError(ErrorCode.ENOENT, message);
	        case "QuotaExceededError":
	            return new ApiError(ErrorCode.ENOSPC, message);
	        default:
	            // The rest do not seem to map cleanly to standard error codes.
	            return new ApiError(ErrorCode.EIO, message);
	    }
	}
	/**
	 * Produces a new onerror handler for IDB. Our errors are always fatal, so we
	 * handle them generically: Call the user-supplied callback with a translated
	 * version of the error, and let the error bubble up.
	 * @hidden
	 */
	function onErrorHandler(cb, code, message) {
	    if ( code === void 0 ) code = ErrorCode.EIO;
	    if ( message === void 0 ) message = null;
	
	    return function (e) {
	        // Prevent the error from canceling the transaction.
	        e.preventDefault();
	        cb(new ApiError(code, message !== null ? message : undefined));
	    };
	}
	/**
	 * @hidden
	 */
	var IndexedDBROTransaction = function IndexedDBROTransaction(tx, store) {
	    this.tx = tx;
	    this.store = store;
	};
	IndexedDBROTransaction.prototype.get = function get (key, cb) {
	    try {
	        var r = this.store.get(key);
	        r.onerror = onErrorHandler(cb);
	        r.onsuccess = function (event) {
	            // IDB returns the value 'undefined' when you try to get keys that
	            // don't exist. The caller expects this behavior.
	            var result = event.target.result;
	            if (result === undefined) {
	                cb(null, result);
	            }
	            else {
	                // IDB data is stored as an ArrayBuffer
	                cb(null, arrayBuffer2Buffer(result));
	            }
	        };
	    }
	    catch (e) {
	        cb(convertError$2(e));
	    }
	};
	/**
	 * @hidden
	 */
	var IndexedDBRWTransaction = (function (IndexedDBROTransaction) {
	    function IndexedDBRWTransaction(tx, store) {
	        IndexedDBROTransaction.call(this, tx, store);
	    }
	
	    if ( IndexedDBROTransaction ) IndexedDBRWTransaction.__proto__ = IndexedDBROTransaction;
	    IndexedDBRWTransaction.prototype = Object.create( IndexedDBROTransaction && IndexedDBROTransaction.prototype );
	    IndexedDBRWTransaction.prototype.constructor = IndexedDBRWTransaction;
	    IndexedDBRWTransaction.prototype.put = function put (key, data, overwrite, cb) {
	        try {
	            var arraybuffer = buffer2ArrayBuffer(data);
	            var r;
	            if (overwrite) {
	                r = this.store.put(arraybuffer, key);
	            }
	            else {
	                // 'add' will never overwrite an existing key.
	                r = this.store.add(arraybuffer, key);
	            }
	            // XXX: NEED TO RETURN FALSE WHEN ADD HAS A KEY CONFLICT. NO ERROR.
	            r.onerror = onErrorHandler(cb);
	            r.onsuccess = function (event) {
	                cb(null, true);
	            };
	        }
	        catch (e) {
	            cb(convertError$2(e));
	        }
	    };
	    IndexedDBRWTransaction.prototype.del = function del (key, cb) {
	        try {
	            // NOTE: IE8 has a bug with identifiers named 'delete' unless used as a string
	            // like this.
	            // http://stackoverflow.com/a/26479152
	            var r = this.store['delete'](key);
	            r.onerror = onErrorHandler(cb);
	            r.onsuccess = function (event) {
	                cb();
	            };
	        }
	        catch (e) {
	            cb(convertError$2(e));
	        }
	    };
	    IndexedDBRWTransaction.prototype.commit = function commit (cb) {
	        // Return to the event loop to commit the transaction.
	        setTimeout(cb, 0);
	    };
	    IndexedDBRWTransaction.prototype.abort = function abort (cb) {
	        var _e = null;
	        try {
	            this.tx.abort();
	        }
	        catch (e) {
	            _e = convertError$2(e);
	        }
	        finally {
	            cb(_e);
	        }
	    };
	
	    return IndexedDBRWTransaction;
	}(IndexedDBROTransaction));
	var IndexedDBStore = function IndexedDBStore(cb, storeName) {
	    var this$1 = this;
	    if ( storeName === void 0 ) storeName = 'browserfs';
	
	    this.storeName = storeName;
	    var openReq = indexedDB.open(this.storeName, 1);
	    openReq.onupgradeneeded = function (event) {
	        var db = event.target.result;
	        // Huh. This should never happen; we're at version 1. Why does another
	        // database exist?
	        if (db.objectStoreNames.contains(this$1.storeName)) {
	            db.deleteObjectStore(this$1.storeName);
	        }
	        db.createObjectStore(this$1.storeName);
	    };
	    openReq.onsuccess = function (event) {
	        this$1.db = event.target.result;
	        cb(null, this$1);
	    };
	    openReq.onerror = onErrorHandler(cb, ErrorCode.EACCES);
	};
	IndexedDBStore.prototype.name = function name () {
	    return IndexedDBFileSystem.Name + " - " + this.storeName;
	};
	IndexedDBStore.prototype.clear = function clear (cb) {
	    try {
	        var tx = this.db.transaction(this.storeName, 'readwrite'), objectStore = tx.objectStore(this.storeName), r = objectStore.clear();
	        r.onsuccess = function (event) {
	            // Use setTimeout to commit transaction.
	            setTimeout(cb, 0);
	        };
	        r.onerror = onErrorHandler(cb);
	    }
	    catch (e) {
	        cb(convertError$2(e));
	    }
	};
	IndexedDBStore.prototype.beginTransaction = function beginTransaction (type) {
	        if ( type === void 0 ) type = 'readonly';
	
	    var tx = this.db.transaction(this.storeName, type), objectStore = tx.objectStore(this.storeName);
	    if (type === 'readwrite') {
	        return new IndexedDBRWTransaction(tx, objectStore);
	    }
	    else if (type === 'readonly') {
	        return new IndexedDBROTransaction(tx, objectStore);
	    }
	    else {
	        throw new ApiError(ErrorCode.EINVAL, 'Invalid transaction type.');
	    }
	};
	/**
	 * A file system that uses the IndexedDB key value file system.
	 */
	var IndexedDBFileSystem = (function (AsyncKeyValueFileSystem$$1) {
	    function IndexedDBFileSystem(cb, storeName, deprecateMsg) {
	        var this$1 = this;
	        if ( deprecateMsg === void 0 ) deprecateMsg = true;
	
	        AsyncKeyValueFileSystem$$1.call(this);
	        this.store = new IndexedDBStore(function (e) {
	            if (e) {
	                cb(e);
	            }
	            else {
	                this$1.init(this$1.store, function (e) {
	                    cb(e, this$1);
	                });
	            }
	        }, storeName);
	        deprecationMessage(deprecateMsg, IndexedDBFileSystem.Name, { storeName: storeName });
	    }
	
	    if ( AsyncKeyValueFileSystem$$1 ) IndexedDBFileSystem.__proto__ = AsyncKeyValueFileSystem$$1;
	    IndexedDBFileSystem.prototype = Object.create( AsyncKeyValueFileSystem$$1 && AsyncKeyValueFileSystem$$1.prototype );
	    IndexedDBFileSystem.prototype.constructor = IndexedDBFileSystem;
	    /**
	     * Constructs an IndexedDB file system with the given options.
	     */
	    IndexedDBFileSystem.Create = function Create (opts, cb) {
	        // tslint:disable-next-line:no-unused-new
	        new IndexedDBFileSystem(cb, opts.storeName, false);
	        // tslint:enable-next-line:no-unused-new
	    };
	    IndexedDBFileSystem.isAvailable = function isAvailable () {
	        // In Safari's private browsing mode, indexedDB.open returns NULL.
	        // In Firefox, it throws an exception.
	        // In Chrome, it "just works", and clears the database when you leave the page.
	        // Untested: Opera, IE.
	        try {
	            return typeof indexedDB !== 'undefined' && null !== indexedDB.open("__browserfs_test__");
	        }
	        catch (e) {
	            return false;
	        }
	    };
	
	    return IndexedDBFileSystem;
	}(AsyncKeyValueFileSystem));
	
	IndexedDBFileSystem.Name = "IndexedDB";
	IndexedDBFileSystem.Options = {
	    storeName: {
	        type: "string",
	        optional: true,
	        description: "The name of this file system. You can have multiple IndexedDB file systems operating at once, but each must have a different name."
	    }
	};
	
	/**
	 * Some versions of FF and all versions of IE do not support the full range of
	 * 16-bit numbers encoded as characters, as they enforce UTF-16 restrictions.
	 * @url http://stackoverflow.com/questions/11170716/are-there-any-characters-that-are-not-allowed-in-localstorage/11173673#11173673
	 * @hidden
	 */
	var supportsBinaryString = false;
	var binaryEncoding;
	try {
	    global$1.localStorage.setItem("__test__", String.fromCharCode(0xD800));
	    supportsBinaryString = global$1.localStorage.getItem("__test__") === String.fromCharCode(0xD800);
	}
	catch (e) {
	    // IE throws an exception.
	    supportsBinaryString = false;
	}
	binaryEncoding = supportsBinaryString ? 'binary_string' : 'binary_string_ie';
	if (!Buffer.isEncoding(binaryEncoding)) {
	    // Fallback for non BrowserFS implementations of buffer that lack a
	    // binary_string format.
	    binaryEncoding = "base64";
	}
	/**
	 * A synchronous key-value store backed by localStorage.
	 */
	var LocalStorageStore = function LocalStorageStore () {};
	
	LocalStorageStore.prototype.name = function name () {
	    return LocalStorageFileSystem.Name;
	};
	LocalStorageStore.prototype.clear = function clear () {
	    global$1.localStorage.clear();
	};
	LocalStorageStore.prototype.beginTransaction = function beginTransaction (type) {
	    // No need to differentiate.
	    return new SimpleSyncRWTransaction(this);
	};
	LocalStorageStore.prototype.get = function get (key) {
	    try {
	        var data = global$1.localStorage.getItem(key);
	        if (data !== null) {
	            return Buffer.from(data, binaryEncoding);
	        }
	    }
	    catch (e) {
	        // Do nothing.
	    }
	    // Key doesn't exist, or a failure occurred.
	    return undefined;
	};
	LocalStorageStore.prototype.put = function put (key, data, overwrite) {
	    try {
	        if (!overwrite && global$1.localStorage.getItem(key) !== null) {
	            // Don't want to overwrite the key!
	            return false;
	        }
	        global$1.localStorage.setItem(key, data.toString(binaryEncoding));
	        return true;
	    }
	    catch (e) {
	        throw new ApiError(ErrorCode.ENOSPC, "LocalStorage is full.");
	    }
	};
	LocalStorageStore.prototype.del = function del (key) {
	    try {
	        global$1.localStorage.removeItem(key);
	    }
	    catch (e) {
	        throw new ApiError(ErrorCode.EIO, "Unable to delete key " + key + ": " + e);
	    }
	};
	/**
	 * A synchronous file system backed by localStorage. Connects our
	 * LocalStorageStore to our SyncKeyValueFileSystem.
	 */
	var LocalStorageFileSystem = (function (SyncKeyValueFileSystem$$1) {
	    function LocalStorageFileSystem() { SyncKeyValueFileSystem$$1.call(this, { store: new LocalStorageStore() }); }
	
	    if ( SyncKeyValueFileSystem$$1 ) LocalStorageFileSystem.__proto__ = SyncKeyValueFileSystem$$1;
	    LocalStorageFileSystem.prototype = Object.create( SyncKeyValueFileSystem$$1 && SyncKeyValueFileSystem$$1.prototype );
	    LocalStorageFileSystem.prototype.constructor = LocalStorageFileSystem;
	    /**
	     * Creates a LocalStorageFileSystem instance.
	     */
	    LocalStorageFileSystem.Create = function Create (options, cb) {
	        cb(null, new LocalStorageFileSystem());
	    };
	    LocalStorageFileSystem.isAvailable = function isAvailable () {
	        return typeof global$1.localStorage !== 'undefined';
	    };
	
	    return LocalStorageFileSystem;
	}(SyncKeyValueFileSystem));
	
	LocalStorageFileSystem.Name = "LocalStorage";
	LocalStorageFileSystem.Options = {};
	
	/**
	 * The MountableFileSystem allows you to mount multiple backend types or
	 * multiple instantiations of the same backend into a single file system tree.
	 * The file systems do not need to know about each other; all interactions are
	 * automatically facilitated through this interface.
	 *
	 * For example, if a file system is mounted at /mnt/blah, and a request came in
	 * for /mnt/blah/foo.txt, the file system would see a request for /foo.txt.
	 *
	 * You can mount file systems when you configure the file system:
	 * ```javascript
	 * BrowserFS.configure({
	 *   fs: "MountableFileSystem",
	 *   options: {
	 *     '/data': { fs: 'XmlHttpRequest', options: { index: "http://mysite.com/files/index.json" } },
	 *     '/home': { fs: 'LocalStorage' }
	 *   }
	 * }, function(e) {
	 *
	 * });
	 * ```
	 *
	 * For advanced users, you can also mount file systems *after* MFS is constructed:
	 * ```javascript
	 * BrowserFS.FileSystem.XmlHttpRequest.Create({
	 *   index: "http://mysite.com/files/index.json"
	 * }, function(e, xhrfs) {
	 *   BrowserFS.FileSystem.MountableFileSystem.Create({
	 *     '/data': xhrfs
	 *   }, function(e, mfs) {
	 *     BrowserFS.initialize(mfs);
	 *
	 *     // Added after-the-fact...
	 *     BrowserFS.FileSystem.LocalStorage.Create(function(e, lsfs) {
	 *       mfs.mount('/home', lsfs);
	 *     });
	 *   });
	 * });
	 * ```
	 *
	 * Since MountableFileSystem simply proxies requests to mounted file systems, it supports all of the operations that the mounted file systems support.
	 *
	 * With no mounted file systems, `MountableFileSystem` acts as a simple `InMemory` filesystem.
	 */
	var MountableFileSystem = (function (BaseFileSystem$$1) {
	    function MountableFileSystem() {
	        BaseFileSystem$$1.call(this);
	        // Contains the list of mount points in mntMap, sorted by string length in decreasing order.
	        // Ensures that we scan the most specific mount points for a match first, which lets us
	        // nest mount points.
	        this.mountList = [];
	        this.mntMap = {};
	        // The InMemory file system serves purely to provide directory listings for
	        // mounted file systems.
	        this.rootFs = new InMemoryFileSystem();
	    }
	
	    if ( BaseFileSystem$$1 ) MountableFileSystem.__proto__ = BaseFileSystem$$1;
	    MountableFileSystem.prototype = Object.create( BaseFileSystem$$1 && BaseFileSystem$$1.prototype );
	    MountableFileSystem.prototype.constructor = MountableFileSystem;
	    /**
	     * Creates a MountableFileSystem instance with the given options.
	     */
	    MountableFileSystem.Create = function Create (opts, cb) {
	        var fs = new MountableFileSystem();
	        Object.keys(opts).forEach(function (mountPoint) {
	            fs.mount(mountPoint, opts[mountPoint]);
	        });
	        cb(null, fs);
	    };
	    MountableFileSystem.isAvailable = function isAvailable () {
	        return true;
	    };
	    /**
	     * Mounts the file system at the given mount point.
	     */
	    MountableFileSystem.prototype.mount = function mount (mountPoint, fs) {
	        if (mountPoint[0] !== '/') {
	            mountPoint = "/" + mountPoint;
	        }
	        mountPoint = path.resolve(mountPoint);
	        if (this.mntMap[mountPoint]) {
	            throw new ApiError(ErrorCode.EINVAL, "Mount point " + mountPoint + " is already taken.");
	        }
	        mkdirpSync(mountPoint, 0x1ff, this.rootFs);
	        this.mntMap[mountPoint] = fs;
	        this.mountList.push(mountPoint);
	        this.mountList = this.mountList.sort(function (a, b) { return b.length - a.length; });
	    };
	    MountableFileSystem.prototype.umount = function umount (mountPoint) {
	        var this$1 = this;
	
	        if (mountPoint[0] !== '/') {
	            mountPoint = "/" + mountPoint;
	        }
	        mountPoint = path.resolve(mountPoint);
	        if (!this.mntMap[mountPoint]) {
	            throw new ApiError(ErrorCode.EINVAL, "Mount point " + mountPoint + " is already unmounted.");
	        }
	        delete this.mntMap[mountPoint];
	        this.mountList.splice(this.mountList.indexOf(mountPoint), 1);
	        while (mountPoint !== '/') {
	            if (this$1.rootFs.readdirSync(mountPoint).length === 0) {
	                this$1.rootFs.rmdirSync(mountPoint);
	                mountPoint = path.dirname(mountPoint);
	            }
	            else {
	                break;
	            }
	        }
	    };
	    /**
	     * Returns the file system that the path points to.
	     */
	    MountableFileSystem.prototype._getFs = function _getFs (path$$1) {
	        var this$1 = this;
	
	        var mountList = this.mountList, len = mountList.length;
	        for (var i = 0; i < len; i++) {
	            var mountPoint = mountList[i];
	            // We know path is normalized, so it is a substring of the mount point.
	            if (mountPoint.length <= path$$1.length && path$$1.indexOf(mountPoint) === 0) {
	                path$$1 = path$$1.substr(mountPoint.length > 1 ? mountPoint.length : 0);
	                if (path$$1 === '') {
	                    path$$1 = '/';
	                }
	                return { fs: this$1.mntMap[mountPoint], path: path$$1 };
	            }
	        }
	        // Query our root file system.
	        return { fs: this.rootFs, path: path$$1 };
	    };
	    // Global information methods
	    MountableFileSystem.prototype.getName = function getName () {
	        return MountableFileSystem.Name;
	    };
	    MountableFileSystem.prototype.diskSpace = function diskSpace (path$$1, cb) {
	        cb(0, 0);
	    };
	    MountableFileSystem.prototype.isReadOnly = function isReadOnly () {
	        return false;
	    };
	    MountableFileSystem.prototype.supportsLinks = function supportsLinks () {
	        // I'm not ready for cross-FS links yet.
	        return false;
	    };
	    MountableFileSystem.prototype.supportsProps = function supportsProps () {
	        return false;
	    };
	    MountableFileSystem.prototype.supportsSynch = function supportsSynch () {
	        return true;
	    };
	    /**
	     * Fixes up error messages so they mention the mounted file location relative
	     * to the MFS root, not to the particular FS's root.
	     * Mutates the input error, and returns it.
	     */
	    MountableFileSystem.prototype.standardizeError = function standardizeError (err, path$$1, realPath) {
	        var index = err.message.indexOf(path$$1);
	        if (index !== -1) {
	            err.message = err.message.substr(0, index) + realPath + err.message.substr(index + path$$1.length);
	            err.path = realPath;
	        }
	        return err;
	    };
	    // The following methods involve multiple file systems, and thus have custom
	    // logic.
	    // Note that we go through the Node API to use its robust default argument
	    // processing.
	    MountableFileSystem.prototype.rename = function rename (oldPath, newPath, cb) {
	        var this$1 = this;
	
	        // Scenario 1: old and new are on same FS.
	        var fs1rv = this._getFs(oldPath);
	        var fs2rv = this._getFs(newPath);
	        if (fs1rv.fs === fs2rv.fs) {
	            return fs1rv.fs.rename(fs1rv.path, fs2rv.path, function (e) {
	                if (e) {
	                    this$1.standardizeError(this$1.standardizeError(e, fs1rv.path, oldPath), fs2rv.path, newPath);
	                }
	                cb(e);
	            });
	        }
	        // Scenario 2: Different file systems.
	        // Read old file, write new file, delete old file.
	        return _fsMock.readFile(oldPath, function (err, data) {
	            if (err) {
	                return cb(err);
	            }
	            _fsMock.writeFile(newPath, data, function (err) {
	                if (err) {
	                    return cb(err);
	                }
	                _fsMock.unlink(oldPath, cb);
	            });
	        });
	    };
	    MountableFileSystem.prototype.renameSync = function renameSync (oldPath, newPath) {
	        // Scenario 1: old and new are on same FS.
	        var fs1rv = this._getFs(oldPath);
	        var fs2rv = this._getFs(newPath);
	        if (fs1rv.fs === fs2rv.fs) {
	            try {
	                return fs1rv.fs.renameSync(fs1rv.path, fs2rv.path);
	            }
	            catch (e) {
	                this.standardizeError(this.standardizeError(e, fs1rv.path, oldPath), fs2rv.path, newPath);
	                throw e;
	            }
	        }
	        // Scenario 2: Different file systems.
	        var data = _fsMock.readFileSync(oldPath);
	        _fsMock.writeFileSync(newPath, data);
	        return _fsMock.unlinkSync(oldPath);
	    };
	    MountableFileSystem.prototype.readdirSync = function readdirSync (p) {
	        var fsInfo = this._getFs(p);
	        // If null, rootfs did not have the directory
	        // (or the target FS is the root fs).
	        var rv = null;
	        // Mount points are all defined in the root FS.
	        // Ensure that we list those, too.
	        if (fsInfo.fs !== this.rootFs) {
	            try {
	                rv = this.rootFs.readdirSync(p);
	            }
	            catch (e) {
	                // Ignore.
	            }
	        }
	        try {
	            var rv2 = fsInfo.fs.readdirSync(fsInfo.path);
	            if (rv === null) {
	                return rv2;
	            }
	            else {
	                // Filter out duplicates.
	                return rv2.concat(rv.filter(function (val) { return rv2.indexOf(val) === -1; }));
	            }
	        }
	        catch (e) {
	            if (rv === null) {
	                throw this.standardizeError(e, fsInfo.path, p);
	            }
	            else {
	                // The root FS had something.
	                return rv;
	            }
	        }
	    };
	    MountableFileSystem.prototype.readdir = function readdir (p, cb) {
	        var this$1 = this;
	
	        var fsInfo = this._getFs(p);
	        fsInfo.fs.readdir(fsInfo.path, function (err, files) {
	            if (fsInfo.fs !== this$1.rootFs) {
	                try {
	                    var rv = this$1.rootFs.readdirSync(p);
	                    if (files) {
	                        // Filter out duplicates.
	                        files = files.concat(rv.filter(function (val) { return files.indexOf(val) === -1; }));
	                    }
	                    else {
	                        files = rv;
	                    }
	                }
	                catch (e) {
	                    // Root FS and target FS did not have directory.
	                    if (err) {
	                        return cb(this$1.standardizeError(err, fsInfo.path, p));
	                    }
	                }
	            }
	            else if (err) {
	                // Root FS and target FS are the same, and did not have directory.
	                return cb(this$1.standardizeError(err, fsInfo.path, p));
	            }
	            cb(null, files);
	        });
	    };
	    MountableFileSystem.prototype.rmdirSync = function rmdirSync (p) {
	        var fsInfo = this._getFs(p);
	        if (this._containsMountPt(p)) {
	            throw ApiError.ENOTEMPTY(p);
	        }
	        else {
	            try {
	                fsInfo.fs.rmdirSync(fsInfo.path);
	            }
	            catch (e) {
	                throw this.standardizeError(e, fsInfo.path, p);
	            }
	        }
	    };
	    MountableFileSystem.prototype.rmdir = function rmdir (p, cb) {
	        var this$1 = this;
	
	        var fsInfo = this._getFs(p);
	        if (this._containsMountPt(p)) {
	            cb(ApiError.ENOTEMPTY(p));
	        }
	        else {
	            fsInfo.fs.rmdir(fsInfo.path, function (err) {
	                cb(err ? this$1.standardizeError(err, fsInfo.path, p) : null);
	            });
	        }
	    };
	    /**
	     * Returns true if the given path contains a mount point.
	     */
	    MountableFileSystem.prototype._containsMountPt = function _containsMountPt (p) {
	        var mountPoints = this.mountList, len = mountPoints.length;
	        for (var i = 0; i < len; i++) {
	            var pt = mountPoints[i];
	            if (pt.length >= p.length && pt.slice(0, p.length) === p) {
	                return true;
	            }
	        }
	        return false;
	    };
	
	    return MountableFileSystem;
	}(BaseFileSystem));
	
	MountableFileSystem.Name = "MountableFileSystem";
	MountableFileSystem.Options = {};
	/**
	 * Tricky: Define all of the functions that merely forward arguments to the
	 * relevant file system, or return/throw an error.
	 * Take advantage of the fact that the *first* argument is always the path, and
	 * the *last* is the callback function (if async).
	 * @todo Can use numArgs to make proxying more efficient.
	 * @hidden
	 */
	function defineFcn(name, isSync, numArgs) {
	    if (isSync) {
	        return function () {
	            var args = [], len = arguments.length;
	            while ( len-- ) args[ len ] = arguments[ len ];
	
	            var path$$1 = args[0];
	            var rv = this._getFs(path$$1);
	            args[0] = rv.path;
	            try {
	                return rv.fs[name].apply(rv.fs, args);
	            }
	            catch (e) {
	                this.standardizeError(e, rv.path, path$$1);
	                throw e;
	            }
	        };
	    }
	    else {
	        return function () {
	            var this$1 = this;
	            var args = [], len = arguments.length;
	            while ( len-- ) args[ len ] = arguments[ len ];
	
	            var path$$1 = args[0];
	            var rv = this._getFs(path$$1);
	            args[0] = rv.path;
	            if (typeof args[args.length - 1] === 'function') {
	                var cb = args[args.length - 1];
	                args[args.length - 1] = function () {
	                    var args = [], len = arguments.length;
	                    while ( len-- ) args[ len ] = arguments[ len ];
	
	                    if (args.length > 0 && args[0] instanceof ApiError) {
	                        this$1.standardizeError(args[0], rv.path, path$$1);
	                    }
	                    cb.apply(null, args);
	                };
	            }
	            return rv.fs[name].apply(rv.fs, args);
	        };
	    }
	}
	/**
	 * @hidden
	 */
	var fsCmdMap = [
	    // 1 arg functions
	    ['exists', 'unlink', 'readlink'],
	    // 2 arg functions
	    ['stat', 'mkdir', 'realpath', 'truncate'],
	    // 3 arg functions
	    ['open', 'readFile', 'chmod', 'utimes'],
	    // 4 arg functions
	    ['chown'],
	    // 5 arg functions
	    ['writeFile', 'appendFile']
	];
	for (var i = 0; i < fsCmdMap.length; i++) {
	    var cmds = fsCmdMap[i];
	    for (var i$1 = 0, list = cmds; i$1 < list.length; i$1 += 1) {
	        var fnName = list[i$1];
	
	        MountableFileSystem.prototype[fnName] = defineFcn(fnName, false, i + 1);
	        MountableFileSystem.prototype[fnName + 'Sync'] = defineFcn(fnName + 'Sync', true, i + 1);
	    }
	}
	
	/**
	 * @hidden
	 */
	var bfsSetImmediate;
	if (typeof (setImmediate) !== "undefined") {
	    bfsSetImmediate = setImmediate;
	}
	else {
	    var gScope = global$1;
	    var timeouts = [];
	    var messageName = "zero-timeout-message";
	    var canUsePostMessage = function () {
	        if (typeof gScope.importScripts !== 'undefined' || !gScope.postMessage) {
	            return false;
	        }
	        var postMessageIsAsync = true;
	        var oldOnMessage = gScope.onmessage;
	        gScope.onmessage = function () {
	            postMessageIsAsync = false;
	        };
	        gScope.postMessage('', '*');
	        gScope.onmessage = oldOnMessage;
	        return postMessageIsAsync;
	    };
	    if (canUsePostMessage()) {
	        bfsSetImmediate = function (fn) {
	            timeouts.push(fn);
	            gScope.postMessage(messageName, "*");
	        };
	        var handleMessage = function (event) {
	            if (event.source === self && event.data === messageName) {
	                if (event.stopPropagation) {
	                    event.stopPropagation();
	                }
	                else {
	                    event.cancelBubble = true;
	                }
	                if (timeouts.length > 0) {
	                    var fn = timeouts.shift();
	                    return fn();
	                }
	            }
	        };
	        if (gScope.addEventListener) {
	            gScope.addEventListener('message', handleMessage, true);
	        }
	        else {
	            gScope.attachEvent('onmessage', handleMessage);
	        }
	    }
	    else if (gScope.MessageChannel) {
	        // WebWorker MessageChannel
	        var channel = new gScope.MessageChannel();
	        channel.port1.onmessage = function (event) {
	            if (timeouts.length > 0) {
	                return timeouts.shift()();
	            }
	        };
	        bfsSetImmediate = function (fn) {
	            timeouts.push(fn);
	            channel.port2.postMessage('');
	        };
	    }
	    else {
	        bfsSetImmediate = function (fn) {
	            return setTimeout(fn, 0);
	        };
	    }
	}
	var setImmediate$3 = bfsSetImmediate;
	
	/**
	 * Non-recursive mutex
	 * @hidden
	 */
	var Mutex = function Mutex() {
	    this._locked = false;
	    this._waiters = [];
	};
	Mutex.prototype.lock = function lock (cb) {
	    if (this._locked) {
	        this._waiters.push(cb);
	        return;
	    }
	    this._locked = true;
	    cb();
	};
	Mutex.prototype.unlock = function unlock () {
	    if (!this._locked) {
	        throw new Error('unlock of a non-locked mutex');
	    }
	    var next = this._waiters.shift();
	    // don't unlock - we want to queue up next for the
	    // _end_ of the current task execution, but we don't
	    // want it to be called inline with whatever the
	    // current stack is.  This way we still get the nice
	    // behavior that an unlock immediately followed by a
	    // lock won't cause starvation.
	    if (next) {
	        setImmediate$3(next);
	        return;
	    }
	    this._locked = false;
	};
	Mutex.prototype.tryLock = function tryLock () {
	    if (this._locked) {
	        return false;
	    }
	    this._locked = true;
	    return true;
	};
	Mutex.prototype.isLocked = function isLocked () {
	    return this._locked;
	};
	
	/**
	 * This class serializes access to an underlying async filesystem.
	 * For example, on an OverlayFS instance with an async lower
	 * directory operations like rename and rmdir may involve multiple
	 * requests involving both the upper and lower filesystems -- they
	 * are not executed in a single atomic step.  OverlayFS uses this
	 * LockedFS to avoid having to reason about the correctness of
	 * multiple requests interleaving.
	 */
	var LockedFS = function LockedFS(fs) {
	    this._fs = fs;
	    this._mu = new Mutex();
	};
	LockedFS.prototype.getName = function getName () {
	    return 'LockedFS<' + this._fs.getName() + '>';
	};
	LockedFS.prototype.getFSUnlocked = function getFSUnlocked () {
	    return this._fs;
	};
	LockedFS.prototype.initialize = function initialize (cb) {
	    // FIXME: check to see if FS supports initialization
	    this._fs.initialize(cb);
	};
	LockedFS.prototype.diskSpace = function diskSpace (p, cb) {
	    // FIXME: should this lock?
	    this._fs.diskSpace(p, cb);
	};
	LockedFS.prototype.isReadOnly = function isReadOnly () {
	    return this._fs.isReadOnly();
	};
	LockedFS.prototype.supportsLinks = function supportsLinks () {
	    return this._fs.supportsLinks();
	};
	LockedFS.prototype.supportsProps = function supportsProps () {
	    return this._fs.supportsProps();
	};
	LockedFS.prototype.supportsSynch = function supportsSynch () {
	    return this._fs.supportsSynch();
	};
	LockedFS.prototype.rename = function rename (oldPath, newPath, cb) {
	        var this$1 = this;
	
	    this._mu.lock(function () {
	        this$1._fs.rename(oldPath, newPath, function (err) {
	            this$1._mu.unlock();
	            cb(err);
	        });
	    });
	};
	LockedFS.prototype.renameSync = function renameSync (oldPath, newPath) {
	    if (this._mu.isLocked()) {
	        throw new Error('invalid sync call');
	    }
	    return this._fs.renameSync(oldPath, newPath);
	};
	LockedFS.prototype.stat = function stat (p, isLstat, cb) {
	        var this$1 = this;
	
	    this._mu.lock(function () {
	        this$1._fs.stat(p, isLstat, function (err, stat) {
	            this$1._mu.unlock();
	            cb(err, stat);
	        });
	    });
	};
	LockedFS.prototype.statSync = function statSync (p, isLstat) {
	    if (this._mu.isLocked()) {
	        throw new Error('invalid sync call');
	    }
	    return this._fs.statSync(p, isLstat);
	};
	LockedFS.prototype.open = function open (p, flag, mode, cb) {
	        var this$1 = this;
	
	    this._mu.lock(function () {
	        this$1._fs.open(p, flag, mode, function (err, fd) {
	            this$1._mu.unlock();
	            cb(err, fd);
	        });
	    });
	};
	LockedFS.prototype.openSync = function openSync (p, flag, mode) {
	    if (this._mu.isLocked()) {
	        throw new Error('invalid sync call');
	    }
	    return this._fs.openSync(p, flag, mode);
	};
	LockedFS.prototype.unlink = function unlink (p, cb) {
	        var this$1 = this;
	
	    this._mu.lock(function () {
	        this$1._fs.unlink(p, function (err) {
	            this$1._mu.unlock();
	            cb(err);
	        });
	    });
	};
	LockedFS.prototype.unlinkSync = function unlinkSync (p) {
	    if (this._mu.isLocked()) {
	        throw new Error('invalid sync call');
	    }
	    return this._fs.unlinkSync(p);
	};
	LockedFS.prototype.rmdir = function rmdir (p, cb) {
	        var this$1 = this;
	
	    this._mu.lock(function () {
	        this$1._fs.rmdir(p, function (err) {
	            this$1._mu.unlock();
	            cb(err);
	        });
	    });
	};
	LockedFS.prototype.rmdirSync = function rmdirSync (p) {
	    if (this._mu.isLocked()) {
	        throw new Error('invalid sync call');
	    }
	    return this._fs.rmdirSync(p);
	};
	LockedFS.prototype.mkdir = function mkdir (p, mode, cb) {
	        var this$1 = this;
	
	    this._mu.lock(function () {
	        this$1._fs.mkdir(p, mode, function (err) {
	            this$1._mu.unlock();
	            cb(err);
	        });
	    });
	};
	LockedFS.prototype.mkdirSync = function mkdirSync (p, mode) {
	    if (this._mu.isLocked()) {
	        throw new Error('invalid sync call');
	    }
	    return this._fs.mkdirSync(p, mode);
	};
	LockedFS.prototype.readdir = function readdir (p, cb) {
	        var this$1 = this;
	
	    this._mu.lock(function () {
	        this$1._fs.readdir(p, function (err, files) {
	            this$1._mu.unlock();
	            cb(err, files);
	        });
	    });
	};
	LockedFS.prototype.readdirSync = function readdirSync (p) {
	    if (this._mu.isLocked()) {
	        throw new Error('invalid sync call');
	    }
	    return this._fs.readdirSync(p);
	};
	LockedFS.prototype.exists = function exists (p, cb) {
	        var this$1 = this;
	
	    this._mu.lock(function () {
	        this$1._fs.exists(p, function (exists) {
	            this$1._mu.unlock();
	            cb(exists);
	        });
	    });
	};
	LockedFS.prototype.existsSync = function existsSync (p) {
	    if (this._mu.isLocked()) {
	        throw new Error('invalid sync call');
	    }
	    return this._fs.existsSync(p);
	};
	LockedFS.prototype.realpath = function realpath (p, cache, cb) {
	        var this$1 = this;
	
	    this._mu.lock(function () {
	        this$1._fs.realpath(p, cache, function (err, resolvedPath) {
	            this$1._mu.unlock();
	            cb(err, resolvedPath);
	        });
	    });
	};
	LockedFS.prototype.realpathSync = function realpathSync (p, cache) {
	    if (this._mu.isLocked()) {
	        throw new Error('invalid sync call');
	    }
	    return this._fs.realpathSync(p, cache);
	};
	LockedFS.prototype.truncate = function truncate (p, len, cb) {
	        var this$1 = this;
	
	    this._mu.lock(function () {
	        this$1._fs.truncate(p, len, function (err) {
	            this$1._mu.unlock();
	            cb(err);
	        });
	    });
	};
	LockedFS.prototype.truncateSync = function truncateSync (p, len) {
	    if (this._mu.isLocked()) {
	        throw new Error('invalid sync call');
	    }
	    return this._fs.truncateSync(p, len);
	};
	LockedFS.prototype.readFile = function readFile (fname, encoding, flag, cb) {
	        var this$1 = this;
	
	    this._mu.lock(function () {
	        this$1._fs.readFile(fname, encoding, flag, function (err, data) {
	            this$1._mu.unlock();
	            cb(err, data);
	        });
	    });
	};
	LockedFS.prototype.readFileSync = function readFileSync (fname, encoding, flag) {
	    if (this._mu.isLocked()) {
	        throw new Error('invalid sync call');
	    }
	    return this._fs.readFileSync(fname, encoding, flag);
	};
	LockedFS.prototype.writeFile = function writeFile (fname, data, encoding, flag, mode, cb) {
	        var this$1 = this;
	
	    this._mu.lock(function () {
	        this$1._fs.writeFile(fname, data, encoding, flag, mode, function (err) {
	            this$1._mu.unlock();
	            cb(err);
	        });
	    });
	};
	LockedFS.prototype.writeFileSync = function writeFileSync (fname, data, encoding, flag, mode) {
	    if (this._mu.isLocked()) {
	        throw new Error('invalid sync call');
	    }
	    return this._fs.writeFileSync(fname, data, encoding, flag, mode);
	};
	LockedFS.prototype.appendFile = function appendFile (fname, data, encoding, flag, mode, cb) {
	        var this$1 = this;
	
	    this._mu.lock(function () {
	        this$1._fs.appendFile(fname, data, encoding, flag, mode, function (err) {
	            this$1._mu.unlock();
	            cb(err);
	        });
	    });
	};
	LockedFS.prototype.appendFileSync = function appendFileSync (fname, data, encoding, flag, mode) {
	    if (this._mu.isLocked()) {
	        throw new Error('invalid sync call');
	    }
	    return this._fs.appendFileSync(fname, data, encoding, flag, mode);
	};
	LockedFS.prototype.chmod = function chmod (p, isLchmod, mode, cb) {
	        var this$1 = this;
	
	    this._mu.lock(function () {
	        this$1._fs.chmod(p, isLchmod, mode, function (err) {
	            this$1._mu.unlock();
	            cb(err);
	        });
	    });
	};
	LockedFS.prototype.chmodSync = function chmodSync (p, isLchmod, mode) {
	    if (this._mu.isLocked()) {
	        throw new Error('invalid sync call');
	    }
	    return this._fs.chmodSync(p, isLchmod, mode);
	};
	LockedFS.prototype.chown = function chown (p, isLchown, uid, gid, cb) {
	        var this$1 = this;
	
	    this._mu.lock(function () {
	        this$1._fs.chown(p, isLchown, uid, gid, function (err) {
	            this$1._mu.unlock();
	            cb(err);
	        });
	    });
	};
	LockedFS.prototype.chownSync = function chownSync (p, isLchown, uid, gid) {
	    if (this._mu.isLocked()) {
	        throw new Error('invalid sync call');
	    }
	    return this._fs.chownSync(p, isLchown, uid, gid);
	};
	LockedFS.prototype.utimes = function utimes (p, atime, mtime, cb) {
	        var this$1 = this;
	
	    this._mu.lock(function () {
	        this$1._fs.utimes(p, atime, mtime, function (err) {
	            this$1._mu.unlock();
	            cb(err);
	        });
	    });
	};
	LockedFS.prototype.utimesSync = function utimesSync (p, atime, mtime) {
	    if (this._mu.isLocked()) {
	        throw new Error('invalid sync call');
	    }
	    return this._fs.utimesSync(p, atime, mtime);
	};
	LockedFS.prototype.link = function link (srcpath, dstpath, cb) {
	        var this$1 = this;
	
	    this._mu.lock(function () {
	        this$1._fs.link(srcpath, dstpath, function (err) {
	            this$1._mu.unlock();
	            cb(err);
	        });
	    });
	};
	LockedFS.prototype.linkSync = function linkSync (srcpath, dstpath) {
	    if (this._mu.isLocked()) {
	        throw new Error('invalid sync call');
	    }
	    return this._fs.linkSync(srcpath, dstpath);
	};
	LockedFS.prototype.symlink = function symlink (srcpath, dstpath, type, cb) {
	        var this$1 = this;
	
	    this._mu.lock(function () {
	        this$1._fs.symlink(srcpath, dstpath, type, function (err) {
	            this$1._mu.unlock();
	            cb(err);
	        });
	    });
	};
	LockedFS.prototype.symlinkSync = function symlinkSync (srcpath, dstpath, type) {
	    if (this._mu.isLocked()) {
	        throw new Error('invalid sync call');
	    }
	    return this._fs.symlinkSync(srcpath, dstpath, type);
	};
	LockedFS.prototype.readlink = function readlink (p, cb) {
	        var this$1 = this;
	
	    this._mu.lock(function () {
	        this$1._fs.readlink(p, function (err, linkString) {
	            this$1._mu.unlock();
	            cb(err, linkString);
	        });
	    });
	};
	LockedFS.prototype.readlinkSync = function readlinkSync (p) {
	    if (this._mu.isLocked()) {
	        throw new Error('invalid sync call');
	    }
	    return this._fs.readlinkSync(p);
	};
	
	/**
	 * @hidden
	 */
	var deletionLogPath = '/.deletedFiles.log';
	/**
	 * Given a read-only mode, makes it writable.
	 * @hidden
	 */
	function makeModeWritable(mode) {
	    return 146 | mode;
	}
	/**
	 * @hidden
	 */
	function getFlag(f) {
	    return FileFlag.getFileFlag(f);
	}
	/**
	 * Overlays a RO file to make it writable.
	 */
	var OverlayFile = (function (PreloadFile$$1) {
	    function OverlayFile(fs, path$$1, flag, stats, data) {
	        PreloadFile$$1.call(this, fs, path$$1, flag, stats, data);
	    }
	
	    if ( PreloadFile$$1 ) OverlayFile.__proto__ = PreloadFile$$1;
	    OverlayFile.prototype = Object.create( PreloadFile$$1 && PreloadFile$$1.prototype );
	    OverlayFile.prototype.constructor = OverlayFile;
	    OverlayFile.prototype.sync = function sync (cb) {
	        var this$1 = this;
	
	        if (!this.isDirty()) {
	            cb(null);
	            return;
	        }
	        this._fs._syncAsync(this, function (err) {
	            this$1.resetDirty();
	            cb(err);
	        });
	    };
	    OverlayFile.prototype.syncSync = function syncSync () {
	        if (this.isDirty()) {
	            this._fs._syncSync(this);
	            this.resetDirty();
	        }
	    };
	    OverlayFile.prototype.close = function close (cb) {
	        this.sync(cb);
	    };
	    OverlayFile.prototype.closeSync = function closeSync () {
	        this.syncSync();
	    };
	
	    return OverlayFile;
	}(PreloadFile));
	/**
	 * *INTERNAL, DO NOT USE DIRECTLY!*
	 *
	 * Core OverlayFS class that contains no locking whatsoever. We wrap these objects
	 * in a LockedFS to prevent races.
	 */
	var UnlockedOverlayFS = (function (BaseFileSystem$$1) {
	    function UnlockedOverlayFS(writable, readable) {
	        BaseFileSystem$$1.call(this);
	        this._isInitialized = false;
	        this._initializeCallbacks = [];
	        this._deletedFiles = {};
	        this._deleteLog = '';
	        // If 'true', we have scheduled a delete log update.
	        this._deleteLogUpdatePending = false;
	        // If 'true', a delete log update is needed after the scheduled delete log
	        // update finishes.
	        this._deleteLogUpdateNeeded = false;
	        // If there was an error updating the delete log...
	        this._deleteLogError = null;
	        this._writable = writable;
	        this._readable = readable;
	        if (this._writable.isReadOnly()) {
	            throw new ApiError(ErrorCode.EINVAL, "Writable file system must be writable.");
	        }
	    }
	
	    if ( BaseFileSystem$$1 ) UnlockedOverlayFS.__proto__ = BaseFileSystem$$1;
	    UnlockedOverlayFS.prototype = Object.create( BaseFileSystem$$1 && BaseFileSystem$$1.prototype );
	    UnlockedOverlayFS.prototype.constructor = UnlockedOverlayFS;
	    UnlockedOverlayFS.isAvailable = function isAvailable () {
	        return true;
	    };
	    UnlockedOverlayFS.prototype.getOverlayedFileSystems = function getOverlayedFileSystems () {
	        return {
	            readable: this._readable,
	            writable: this._writable
	        };
	    };
	    UnlockedOverlayFS.prototype._syncAsync = function _syncAsync (file, cb) {
	        var this$1 = this;
	
	        this.createParentDirectoriesAsync(file.getPath(), function (err) {
	            if (err) {
	                return cb(err);
	            }
	            this$1._writable.writeFile(file.getPath(), file.getBuffer(), null, getFlag('w'), file.getStats().mode, cb);
	        });
	    };
	    UnlockedOverlayFS.prototype._syncSync = function _syncSync (file) {
	        this.createParentDirectories(file.getPath());
	        this._writable.writeFileSync(file.getPath(), file.getBuffer(), null, getFlag('w'), file.getStats().mode);
	    };
	    UnlockedOverlayFS.prototype.getName = function getName () {
	        return OverlayFS.Name;
	    };
	    /**
	     * Called once to load up metadata stored on the writable file system.
	     */
	    UnlockedOverlayFS.prototype.initialize = function initialize (cb) {
	        var this$1 = this;
	
	        var callbackArray = this._initializeCallbacks;
	        var end = function (e) {
	            this$1._isInitialized = !e;
	            this$1._initializeCallbacks = [];
	            callbackArray.forEach((function (cb) { return cb(e); }));
	        };
	        // if we're already initialized, immediately invoke the callback
	        if (this._isInitialized) {
	            return cb();
	        }
	        callbackArray.push(cb);
	        // The first call to initialize initializes, the rest wait for it to complete.
	        if (callbackArray.length !== 1) {
	            return;
	        }
	        // Read deletion log, process into metadata.
	        this._writable.readFile(deletionLogPath, 'utf8', getFlag('r'), function (err, data) {
	            if (err) {
	                // ENOENT === Newly-instantiated file system, and thus empty log.
	                if (err.errno !== ErrorCode.ENOENT) {
	                    return end(err);
	                }
	            }
	            else {
	                this$1._deleteLog = data;
	            }
	            this$1._reparseDeletionLog();
	            end();
	        });
	    };
	    UnlockedOverlayFS.prototype.isReadOnly = function isReadOnly () { return false; };
	    UnlockedOverlayFS.prototype.supportsSynch = function supportsSynch () { return this._readable.supportsSynch() && this._writable.supportsSynch(); };
	    UnlockedOverlayFS.prototype.supportsLinks = function supportsLinks () { return false; };
	    UnlockedOverlayFS.prototype.supportsProps = function supportsProps () { return this._readable.supportsProps() && this._writable.supportsProps(); };
	    UnlockedOverlayFS.prototype.getDeletionLog = function getDeletionLog () {
	        return this._deleteLog;
	    };
	    UnlockedOverlayFS.prototype.restoreDeletionLog = function restoreDeletionLog (log) {
	        this._deleteLog = log;
	        this._reparseDeletionLog();
	        this.updateLog('');
	    };
	    UnlockedOverlayFS.prototype.rename = function rename (oldPath, newPath, cb) {
	        var this$1 = this;
	
	        if (!this.checkInitAsync(cb) || this.checkPathAsync(oldPath, cb) || this.checkPathAsync(newPath, cb)) {
	            return;
	        }
	        if (oldPath === deletionLogPath || newPath === deletionLogPath) {
	            return cb(ApiError.EPERM('Cannot rename deletion log.'));
	        }
	        // nothing to do if paths match
	        if (oldPath === newPath) {
	            return cb();
	        }
	        this.stat(oldPath, false, function (oldErr, oldStats) {
	            if (oldErr) {
	                return cb(oldErr);
	            }
	            return this$1.stat(newPath, false, function (newErr, newStats) {
	                var self = this$1;
	                // precondition: both oldPath and newPath exist and are dirs.
	                // decreases: |files|
	                // Need to move *every file/folder* currently stored on
	                // readable to its new location on writable.
	                function copyDirContents(files) {
	                    var file = files.shift();
	                    if (!file) {
	                        return cb();
	                    }
	                    var oldFile = path.resolve(oldPath, file);
	                    var newFile = path.resolve(newPath, file);
	                    // Recursion! Should work for any nested files / folders.
	                    self.rename(oldFile, newFile, function (err) {
	                        if (err) {
	                            return cb(err);
	                        }
	                        copyDirContents(files);
	                    });
	                }
	                var mode = 511;
	                // from linux's rename(2) manpage: oldpath can specify a
	                // directory.  In this case, newpath must either not exist, or
	                // it must specify an empty directory.
	                if (oldStats.isDirectory()) {
	                    if (newErr) {
	                        if (newErr.errno !== ErrorCode.ENOENT) {
	                            return cb(newErr);
	                        }
	                        return this$1._writable.exists(oldPath, function (exists) {
	                            // simple case - both old and new are on the writable layer
	                            if (exists) {
	                                return this$1._writable.rename(oldPath, newPath, cb);
	                            }
	                            this$1._writable.mkdir(newPath, mode, function (mkdirErr) {
	                                if (mkdirErr) {
	                                    return cb(mkdirErr);
	                                }
	                                this$1._readable.readdir(oldPath, function (err, files) {
	                                    if (err) {
	                                        return cb();
	                                    }
	                                    copyDirContents(files);
	                                });
	                            });
	                        });
	                    }
	                    mode = newStats.mode;
	                    if (!newStats.isDirectory()) {
	                        return cb(ApiError.ENOTDIR(newPath));
	                    }
	                    this$1.readdir(newPath, function (readdirErr, files) {
	                        if (files && files.length) {
	                            return cb(ApiError.ENOTEMPTY(newPath));
	                        }
	                        this$1._readable.readdir(oldPath, function (err, files) {
	                            if (err) {
	                                return cb();
	                            }
	                            copyDirContents(files);
	                        });
	                    });
	                }
	                if (newStats && newStats.isDirectory()) {
	                    return cb(ApiError.EISDIR(newPath));
	                }
	                this$1.readFile(oldPath, null, getFlag('r'), function (err, data) {
	                    if (err) {
	                        return cb(err);
	                    }
	                    return this$1.writeFile(newPath, data, null, getFlag('w'), oldStats.mode, function (err) {
	                        if (err) {
	                            return cb(err);
	                        }
	                        return this$1.unlink(oldPath, cb);
	                    });
	                });
	            });
	        });
	    };
	    UnlockedOverlayFS.prototype.renameSync = function renameSync (oldPath, newPath) {
	        var this$1 = this;
	
	        this.checkInitialized();
	        this.checkPath(oldPath);
	        this.checkPath(newPath);
	        if (oldPath === deletionLogPath || newPath === deletionLogPath) {
	            throw ApiError.EPERM('Cannot rename deletion log.');
	        }
	        // Write newPath using oldPath's contents, delete oldPath.
	        var oldStats = this.statSync(oldPath, false);
	        if (oldStats.isDirectory()) {
	            // Optimization: Don't bother moving if old === new.
	            if (oldPath === newPath) {
	                return;
	            }
	            var mode = 511;
	            if (this.existsSync(newPath)) {
	                var stats = this.statSync(newPath, false);
	                mode = stats.mode;
	                if (stats.isDirectory()) {
	                    if (this.readdirSync(newPath).length > 0) {
	                        throw ApiError.ENOTEMPTY(newPath);
	                    }
	                }
	                else {
	                    throw ApiError.ENOTDIR(newPath);
	                }
	            }
	            // Take care of writable first. Move any files there, or create an empty directory
	            // if it doesn't exist.
	            if (this._writable.existsSync(oldPath)) {
	                this._writable.renameSync(oldPath, newPath);
	            }
	            else if (!this._writable.existsSync(newPath)) {
	                this._writable.mkdirSync(newPath, mode);
	            }
	            // Need to move *every file/folder* currently stored on readable to its new location
	            // on writable.
	            if (this._readable.existsSync(oldPath)) {
	                this._readable.readdirSync(oldPath).forEach(function (name) {
	                    // Recursion! Should work for any nested files / folders.
	                    this$1.renameSync(path.resolve(oldPath, name), path.resolve(newPath, name));
	                });
	            }
	        }
	        else {
	            if (this.existsSync(newPath) && this.statSync(newPath, false).isDirectory()) {
	                throw ApiError.EISDIR(newPath);
	            }
	            this.writeFileSync(newPath, this.readFileSync(oldPath, null, getFlag('r')), null, getFlag('w'), oldStats.mode);
	        }
	        if (oldPath !== newPath && this.existsSync(oldPath)) {
	            this.unlinkSync(oldPath);
	        }
	    };
	    UnlockedOverlayFS.prototype.stat = function stat (p, isLstat, cb) {
	        var this$1 = this;
	
	        if (!this.checkInitAsync(cb)) {
	            return;
	        }
	        this._writable.stat(p, isLstat, function (err, stat) {
	            if (err && err.errno === ErrorCode.ENOENT) {
	                if (this$1._deletedFiles[p]) {
	                    cb(ApiError.ENOENT(p));
	                }
	                this$1._readable.stat(p, isLstat, function (err, stat) {
	                    if (stat) {
	                        // Make the oldStat's mode writable. Preserve the topmost
	                        // part of the mode, which specifies if it is a file or a
	                        // directory.
	                        stat = stat.clone();
	                        stat.mode = makeModeWritable(stat.mode);
	                    }
	                    cb(err, stat);
	                });
	            }
	            else {
	                cb(err, stat);
	            }
	        });
	    };
	    UnlockedOverlayFS.prototype.statSync = function statSync (p, isLstat) {
	        this.checkInitialized();
	        try {
	            return this._writable.statSync(p, isLstat);
	        }
	        catch (e) {
	            if (this._deletedFiles[p]) {
	                throw ApiError.ENOENT(p);
	            }
	            var oldStat = this._readable.statSync(p, isLstat).clone();
	            // Make the oldStat's mode writable. Preserve the topmost part of the
	            // mode, which specifies if it is a file or a directory.
	            oldStat.mode = makeModeWritable(oldStat.mode);
	            return oldStat;
	        }
	    };
	    UnlockedOverlayFS.prototype.open = function open (p, flag, mode, cb) {
	        var this$1 = this;
	
	        if (!this.checkInitAsync(cb) || this.checkPathAsync(p, cb)) {
	            return;
	        }
	        this.stat(p, false, function (err, stats) {
	            if (stats) {
	                switch (flag.pathExistsAction()) {
	                    case ActionType.TRUNCATE_FILE:
	                        return this$1.createParentDirectoriesAsync(p, function (err) {
	                            if (err) {
	                                return cb(err);
	                            }
	                            this$1._writable.open(p, flag, mode, cb);
	                        });
	                    case ActionType.NOP:
	                        return this$1._writable.exists(p, function (exists) {
	                            if (exists) {
	                                this$1._writable.open(p, flag, mode, cb);
	                            }
	                            else {
	                                // at this point we know the stats object we got is from
	                                // the readable FS.
	                                stats = stats.clone();
	                                stats.mode = mode;
	                                this$1._readable.readFile(p, null, getFlag('r'), function (readFileErr, data) {
	                                    if (readFileErr) {
	                                        return cb(readFileErr);
	                                    }
	                                    if (stats.size === -1) {
	                                        stats.size = data.length;
	                                    }
	                                    var f = new OverlayFile(this$1, p, flag, stats, data);
	                                    cb(null, f);
	                                });
	                            }
	                        });
	                    default:
	                        return cb(ApiError.EEXIST(p));
	                }
	            }
	            else {
	                switch (flag.pathNotExistsAction()) {
	                    case ActionType.CREATE_FILE:
	                        return this$1.createParentDirectoriesAsync(p, function (err) {
	                            if (err) {
	                                return cb(err);
	                            }
	                            return this$1._writable.open(p, flag, mode, cb);
	                        });
	                    default:
	                        return cb(ApiError.ENOENT(p));
	                }
	            }
	        });
	    };
	    UnlockedOverlayFS.prototype.openSync = function openSync (p, flag, mode) {
	        this.checkInitialized();
	        this.checkPath(p);
	        if (p === deletionLogPath) {
	            throw ApiError.EPERM('Cannot open deletion log.');
	        }
	        if (this.existsSync(p)) {
	            switch (flag.pathExistsAction()) {
	                case ActionType.TRUNCATE_FILE:
	                    this.createParentDirectories(p);
	                    return this._writable.openSync(p, flag, mode);
	                case ActionType.NOP:
	                    if (this._writable.existsSync(p)) {
	                        return this._writable.openSync(p, flag, mode);
	                    }
	                    else {
	                        // Create an OverlayFile.
	                        var buf = this._readable.readFileSync(p, null, getFlag('r'));
	                        var stats = this._readable.statSync(p, false).clone();
	                        stats.mode = mode;
	                        return new OverlayFile(this, p, flag, stats, buf);
	                    }
	                default:
	                    throw ApiError.EEXIST(p);
	            }
	        }
	        else {
	            switch (flag.pathNotExistsAction()) {
	                case ActionType.CREATE_FILE:
	                    this.createParentDirectories(p);
	                    return this._writable.openSync(p, flag, mode);
	                default:
	                    throw ApiError.ENOENT(p);
	            }
	        }
	    };
	    UnlockedOverlayFS.prototype.unlink = function unlink (p, cb) {
	        var this$1 = this;
	
	        if (!this.checkInitAsync(cb) || this.checkPathAsync(p, cb)) {
	            return;
	        }
	        this.exists(p, function (exists) {
	            if (!exists) {
	                return cb(ApiError.ENOENT(p));
	            }
	            this$1._writable.exists(p, function (writableExists) {
	                if (writableExists) {
	                    return this$1._writable.unlink(p, function (err) {
	                        if (err) {
	                            return cb(err);
	                        }
	                        this$1.exists(p, function (readableExists) {
	                            if (readableExists) {
	                                this$1.deletePath(p);
	                            }
	                            cb(null);
	                        });
	                    });
	                }
	                else {
	                    // if this only exists on the readable FS, add it to the
	                    // delete map.
	                    this$1.deletePath(p);
	                    cb(null);
	                }
	            });
	        });
	    };
	    UnlockedOverlayFS.prototype.unlinkSync = function unlinkSync (p) {
	        this.checkInitialized();
	        this.checkPath(p);
	        if (this.existsSync(p)) {
	            if (this._writable.existsSync(p)) {
	                this._writable.unlinkSync(p);
	            }
	            // if it still exists add to the delete log
	            if (this.existsSync(p)) {
	                this.deletePath(p);
	            }
	        }
	        else {
	            throw ApiError.ENOENT(p);
	        }
	    };
	    UnlockedOverlayFS.prototype.rmdir = function rmdir (p, cb) {
	        var this$1 = this;
	
	        if (!this.checkInitAsync(cb)) {
	            return;
	        }
	        var rmdirLower = function () {
	            this$1.readdir(p, function (err, files) {
	                if (err) {
	                    return cb(err);
	                }
	                if (files.length) {
	                    return cb(ApiError.ENOTEMPTY(p));
	                }
	                this$1.deletePath(p);
	                cb(null);
	            });
	        };
	        this.exists(p, function (exists) {
	            if (!exists) {
	                return cb(ApiError.ENOENT(p));
	            }
	            this$1._writable.exists(p, function (writableExists) {
	                if (writableExists) {
	                    this$1._writable.rmdir(p, function (err) {
	                        if (err) {
	                            return cb(err);
	                        }
	                        this$1._readable.exists(p, function (readableExists) {
	                            if (readableExists) {
	                                rmdirLower();
	                            }
	                            else {
	                                cb();
	                            }
	                        });
	                    });
	                }
	                else {
	                    rmdirLower();
	                }
	            });
	        });
	    };
	    UnlockedOverlayFS.prototype.rmdirSync = function rmdirSync (p) {
	        this.checkInitialized();
	        if (this.existsSync(p)) {
	            if (this._writable.existsSync(p)) {
	                this._writable.rmdirSync(p);
	            }
	            if (this.existsSync(p)) {
	                // Check if directory is empty.
	                if (this.readdirSync(p).length > 0) {
	                    throw ApiError.ENOTEMPTY(p);
	                }
	                else {
	                    this.deletePath(p);
	                }
	            }
	        }
	        else {
	            throw ApiError.ENOENT(p);
	        }
	    };
	    UnlockedOverlayFS.prototype.mkdir = function mkdir (p, mode, cb) {
	        var this$1 = this;
	
	        if (!this.checkInitAsync(cb)) {
	            return;
	        }
	        this.exists(p, function (exists) {
	            if (exists) {
	                return cb(ApiError.EEXIST(p));
	            }
	            // The below will throw should any of the parent directories
	            // fail to exist on _writable.
	            this$1.createParentDirectoriesAsync(p, function (err) {
	                if (err) {
	                    return cb(err);
	                }
	                this$1._writable.mkdir(p, mode, cb);
	            });
	        });
	    };
	    UnlockedOverlayFS.prototype.mkdirSync = function mkdirSync (p, mode) {
	        this.checkInitialized();
	        if (this.existsSync(p)) {
	            throw ApiError.EEXIST(p);
	        }
	        else {
	            // The below will throw should any of the parent directories fail to exist
	            // on _writable.
	            this.createParentDirectories(p);
	            this._writable.mkdirSync(p, mode);
	        }
	    };
	    UnlockedOverlayFS.prototype.readdir = function readdir (p, cb) {
	        var this$1 = this;
	
	        if (!this.checkInitAsync(cb)) {
	            return;
	        }
	        this.stat(p, false, function (err, dirStats) {
	            if (err) {
	                return cb(err);
	            }
	            if (!dirStats.isDirectory()) {
	                return cb(ApiError.ENOTDIR(p));
	            }
	            this$1._writable.readdir(p, function (err, wFiles) {
	                if (err && err.code !== 'ENOENT') {
	                    return cb(err);
	                }
	                else if (err || !wFiles) {
	                    wFiles = [];
	                }
	                this$1._readable.readdir(p, function (err, rFiles) {
	                    // if the directory doesn't exist on the lower FS set rFiles
	                    // here to simplify the following code.
	                    if (err || !rFiles) {
	                        rFiles = [];
	                    }
	                    // Readdir in both, check delete log on read-only file system's files, merge, return.
	                    var seenMap = {};
	                    var filtered = wFiles.concat(rFiles.filter(function (fPath) { return !this$1._deletedFiles[(p + "/" + fPath)]; })).filter(function (fPath) {
	                        // Remove duplicates.
	                        var result = !seenMap[fPath];
	                        seenMap[fPath] = true;
	                        return result;
	                    });
	                    cb(null, filtered);
	                });
	            });
	        });
	    };
	    UnlockedOverlayFS.prototype.readdirSync = function readdirSync (p) {
	        var this$1 = this;
	
	        this.checkInitialized();
	        var dirStats = this.statSync(p, false);
	        if (!dirStats.isDirectory()) {
	            throw ApiError.ENOTDIR(p);
	        }
	        // Readdir in both, check delete log on RO file system's listing, merge, return.
	        var contents = [];
	        try {
	            contents = contents.concat(this._writable.readdirSync(p));
	        }
	        catch (e) {
	            // NOP.
	        }
	        try {
	            contents = contents.concat(this._readable.readdirSync(p).filter(function (fPath) { return !this$1._deletedFiles[(p + "/" + fPath)]; }));
	        }
	        catch (e) {
	            // NOP.
	        }
	        var seenMap = {};
	        return contents.filter(function (fileP) {
	            var result = !seenMap[fileP];
	            seenMap[fileP] = true;
	            return result;
	        });
	    };
	    UnlockedOverlayFS.prototype.exists = function exists (p, cb) {
	        var this$1 = this;
	
	        // Cannot pass an error back to callback, so throw an exception instead
	        // if not initialized.
	        this.checkInitialized();
	        this._writable.exists(p, function (existsWritable) {
	            if (existsWritable) {
	                return cb(true);
	            }
	            this$1._readable.exists(p, function (existsReadable) {
	                cb(existsReadable && this$1._deletedFiles[p] !== true);
	            });
	        });
	    };
	    UnlockedOverlayFS.prototype.existsSync = function existsSync (p) {
	        this.checkInitialized();
	        return this._writable.existsSync(p) || (this._readable.existsSync(p) && this._deletedFiles[p] !== true);
	    };
	    UnlockedOverlayFS.prototype.chmod = function chmod (p, isLchmod, mode, cb) {
	        var this$1 = this;
	
	        if (!this.checkInitAsync(cb)) {
	            return;
	        }
	        this.operateOnWritableAsync(p, function (err) {
	            if (err) {
	                return cb(err);
	            }
	            else {
	                this$1._writable.chmod(p, isLchmod, mode, cb);
	            }
	        });
	    };
	    UnlockedOverlayFS.prototype.chmodSync = function chmodSync (p, isLchmod, mode) {
	        var this$1 = this;
	
	        this.checkInitialized();
	        this.operateOnWritable(p, function () {
	            this$1._writable.chmodSync(p, isLchmod, mode);
	        });
	    };
	    UnlockedOverlayFS.prototype.chown = function chown (p, isLchmod, uid, gid, cb) {
	        var this$1 = this;
	
	        if (!this.checkInitAsync(cb)) {
	            return;
	        }
	        this.operateOnWritableAsync(p, function (err) {
	            if (err) {
	                return cb(err);
	            }
	            else {
	                this$1._writable.chown(p, isLchmod, uid, gid, cb);
	            }
	        });
	    };
	    UnlockedOverlayFS.prototype.chownSync = function chownSync (p, isLchown, uid, gid) {
	        var this$1 = this;
	
	        this.checkInitialized();
	        this.operateOnWritable(p, function () {
	            this$1._writable.chownSync(p, isLchown, uid, gid);
	        });
	    };
	    UnlockedOverlayFS.prototype.utimes = function utimes (p, atime, mtime, cb) {
	        var this$1 = this;
	
	        if (!this.checkInitAsync(cb)) {
	            return;
	        }
	        this.operateOnWritableAsync(p, function (err) {
	            if (err) {
	                return cb(err);
	            }
	            else {
	                this$1._writable.utimes(p, atime, mtime, cb);
	            }
	        });
	    };
	    UnlockedOverlayFS.prototype.utimesSync = function utimesSync (p, atime, mtime) {
	        var this$1 = this;
	
	        this.checkInitialized();
	        this.operateOnWritable(p, function () {
	            this$1._writable.utimesSync(p, atime, mtime);
	        });
	    };
	    UnlockedOverlayFS.prototype.deletePath = function deletePath (p) {
	        this._deletedFiles[p] = true;
	        this.updateLog(("d" + p + "\n"));
	    };
	    UnlockedOverlayFS.prototype.updateLog = function updateLog (addition) {
	        var this$1 = this;
	
	        this._deleteLog += addition;
	        if (this._deleteLogUpdatePending) {
	            this._deleteLogUpdateNeeded = true;
	        }
	        else {
	            this._deleteLogUpdatePending = true;
	            this._writable.writeFile(deletionLogPath, this._deleteLog, 'utf8', FileFlag.getFileFlag('w'), 420, function (e) {
	                this$1._deleteLogUpdatePending = false;
	                if (e) {
	                    this$1._deleteLogError = e;
	                }
	                else if (this$1._deleteLogUpdateNeeded) {
	                    this$1._deleteLogUpdateNeeded = false;
	                    this$1.updateLog('');
	                }
	            });
	        }
	    };
	    UnlockedOverlayFS.prototype._reparseDeletionLog = function _reparseDeletionLog () {
	        var this$1 = this;
	
	        this._deletedFiles = {};
	        this._deleteLog.split('\n').forEach(function (path$$1) {
	            // If the log entry begins w/ 'd', it's a deletion.
	            this$1._deletedFiles[path$$1.slice(1)] = path$$1.slice(0, 1) === 'd';
	        });
	    };
	    UnlockedOverlayFS.prototype.checkInitialized = function checkInitialized () {
	        if (!this._isInitialized) {
	            throw new ApiError(ErrorCode.EPERM, "OverlayFS is not initialized. Please initialize OverlayFS using its initialize() method before using it.");
	        }
	        else if (this._deleteLogError !== null) {
	            var e = this._deleteLogError;
	            this._deleteLogError = null;
	            throw e;
	        }
	    };
	    UnlockedOverlayFS.prototype.checkInitAsync = function checkInitAsync (cb) {
	        if (!this._isInitialized) {
	            cb(new ApiError(ErrorCode.EPERM, "OverlayFS is not initialized. Please initialize OverlayFS using its initialize() method before using it."));
	            return false;
	        }
	        else if (this._deleteLogError !== null) {
	            var e = this._deleteLogError;
	            this._deleteLogError = null;
	            cb(e);
	            return false;
	        }
	        return true;
	    };
	    UnlockedOverlayFS.prototype.checkPath = function checkPath (p) {
	        if (p === deletionLogPath) {
	            throw ApiError.EPERM(p);
	        }
	    };
	    UnlockedOverlayFS.prototype.checkPathAsync = function checkPathAsync (p, cb) {
	        if (p === deletionLogPath) {
	            cb(ApiError.EPERM(p));
	            return true;
	        }
	        return false;
	    };
	    UnlockedOverlayFS.prototype.createParentDirectoriesAsync = function createParentDirectoriesAsync (p, cb) {
	        var parent = path.dirname(p);
	        var toCreate = [];
	        var self = this;
	        this._writable.stat(parent, false, statDone);
	        function statDone(err, stat) {
	            if (err) {
	                toCreate.push(parent);
	                parent = path.dirname(parent);
	                self._writable.stat(parent, false, statDone);
	            }
	            else {
	                createParents();
	            }
	        }
	        function createParents() {
	            if (!toCreate.length) {
	                return cb();
	            }
	            var dir = toCreate.pop();
	            self._readable.stat(dir, false, function (err, stats) {
	                // stop if we couldn't read the dir
	                if (!stats) {
	                    return cb();
	                }
	                self._writable.mkdir(dir, stats.mode, function (err) {
	                    if (err) {
	                        return cb(err);
	                    }
	                    createParents();
	                });
	            });
	        }
	    };
	    /**
	     * With the given path, create the needed parent directories on the writable storage
	     * should they not exist. Use modes from the read-only storage.
	     */
	    UnlockedOverlayFS.prototype.createParentDirectories = function createParentDirectories (p) {
	        var this$1 = this;
	
	        var parent = path.dirname(p), toCreate = [];
	        while (!this._writable.existsSync(parent)) {
	            toCreate.push(parent);
	            parent = path.dirname(parent);
	        }
	        toCreate = toCreate.reverse();
	        toCreate.forEach(function (p) {
	            this$1._writable.mkdirSync(p, this$1.statSync(p, false).mode);
	        });
	    };
	    /**
	     * Helper function:
	     * - Ensures p is on writable before proceeding. Throws an error if it doesn't exist.
	     * - Calls f to perform operation on writable.
	     */
	    UnlockedOverlayFS.prototype.operateOnWritable = function operateOnWritable (p, f) {
	        if (this.existsSync(p)) {
	            if (!this._writable.existsSync(p)) {
	                // File is on readable storage. Copy to writable storage before
	                // changing its mode.
	                this.copyToWritable(p);
	            }
	            f();
	        }
	        else {
	            throw ApiError.ENOENT(p);
	        }
	    };
	    UnlockedOverlayFS.prototype.operateOnWritableAsync = function operateOnWritableAsync (p, cb) {
	        var this$1 = this;
	
	        this.exists(p, function (exists) {
	            if (!exists) {
	                return cb(ApiError.ENOENT(p));
	            }
	            this$1._writable.exists(p, function (existsWritable) {
	                if (existsWritable) {
	                    cb();
	                }
	                else {
	                    return this$1.copyToWritableAsync(p, cb);
	                }
	            });
	        });
	    };
	    /**
	     * Copy from readable to writable storage.
	     * PRECONDITION: File does not exist on writable storage.
	     */
	    UnlockedOverlayFS.prototype.copyToWritable = function copyToWritable (p) {
	        var pStats = this.statSync(p, false);
	        if (pStats.isDirectory()) {
	            this._writable.mkdirSync(p, pStats.mode);
	        }
	        else {
	            this.writeFileSync(p, this._readable.readFileSync(p, null, getFlag('r')), null, getFlag('w'), this.statSync(p, false).mode);
	        }
	    };
	    UnlockedOverlayFS.prototype.copyToWritableAsync = function copyToWritableAsync (p, cb) {
	        var this$1 = this;
	
	        this.stat(p, false, function (err, pStats) {
	            if (err) {
	                return cb(err);
	            }
	            if (pStats.isDirectory()) {
	                return this$1._writable.mkdir(p, pStats.mode, cb);
	            }
	            // need to copy file.
	            this$1._readable.readFile(p, null, getFlag('r'), function (err, data) {
	                if (err) {
	                    return cb(err);
	                }
	                this$1.writeFile(p, data, null, getFlag('w'), pStats.mode, cb);
	            });
	        });
	    };
	
	    return UnlockedOverlayFS;
	}(BaseFileSystem));
	/**
	 * OverlayFS makes a read-only filesystem writable by storing writes on a second,
	 * writable file system. Deletes are persisted via metadata stored on the writable
	 * file system.
	 */
	var OverlayFS = (function (LockedFS$$1) {
	    function OverlayFS(writable, readable, deprecateMsg) {
	        if ( deprecateMsg === void 0 ) deprecateMsg = true;
	
	        LockedFS$$1.call(this, new UnlockedOverlayFS(writable, readable));
	        deprecationMessage(deprecateMsg, OverlayFS.Name, { readable: "readable file system", writable: "writable file system" });
	    }
	
	    if ( LockedFS$$1 ) OverlayFS.__proto__ = LockedFS$$1;
	    OverlayFS.prototype = Object.create( LockedFS$$1 && LockedFS$$1.prototype );
	    OverlayFS.prototype.constructor = OverlayFS;
	    /**
	     * Constructs and initializes an OverlayFS instance with the given options.
	     */
	    OverlayFS.Create = function Create (opts, cb) {
	        try {
	            var fs = new OverlayFS(opts.writable, opts.readable, false);
	            fs.initialize(function (e) {
	                cb(e, fs);
	            }, false);
	        }
	        catch (e) {
	            cb(e);
	        }
	    };
	    OverlayFS.isAvailable = function isAvailable () {
	        return UnlockedOverlayFS.isAvailable();
	    };
	    /**
	     * **Deprecated. Please use OverlayFS.Create() to construct and initialize OverlayFS instances.**
	     */
	    OverlayFS.prototype.initialize = function initialize (cb, deprecateMsg) {
	        if ( deprecateMsg === void 0 ) deprecateMsg = true;
	
	        if (deprecateMsg) {
	            console.warn("[OverlayFS] OverlayFS.initialize() is deprecated and will be removed in the next major release. Please use 'OverlayFS.Create({readable: readable file system instance, writable: writable file system instance}, cb)' to create and initialize OverlayFS instances.");
	        }
	        LockedFS$$1.prototype.initialize.call(this, cb);
	    };
	    OverlayFS.prototype.getOverlayedFileSystems = function getOverlayedFileSystems () {
	        return LockedFS$$1.prototype.getFSUnlocked.call(this).getOverlayedFileSystems();
	    };
	    OverlayFS.prototype.unwrap = function unwrap () {
	        return LockedFS$$1.prototype.getFSUnlocked.call(this);
	    };
	
	    return OverlayFS;
	}(LockedFS));
	
	OverlayFS.Name = "OverlayFS";
	OverlayFS.Options = {
	    writable: {
	        type: "object",
	        description: "The file system to write modified files to."
	    },
	    readable: {
	        type: "object",
	        description: "The file system that initially populates this file system."
	    }
	};
	
	/**
	 * @hidden
	 */
	var SpecialArgType;
	(function (SpecialArgType) {
	    // Callback
	    SpecialArgType[SpecialArgType["CB"] = 0] = "CB";
	    // File descriptor
	    SpecialArgType[SpecialArgType["FD"] = 1] = "FD";
	    // API error
	    SpecialArgType[SpecialArgType["API_ERROR"] = 2] = "API_ERROR";
	    // Stats object
	    SpecialArgType[SpecialArgType["STATS"] = 3] = "STATS";
	    // Initial probe for file system information.
	    SpecialArgType[SpecialArgType["PROBE"] = 4] = "PROBE";
	    // FileFlag object.
	    SpecialArgType[SpecialArgType["FILEFLAG"] = 5] = "FILEFLAG";
	    // Buffer object.
	    SpecialArgType[SpecialArgType["BUFFER"] = 6] = "BUFFER";
	    // Generic Error object.
	    SpecialArgType[SpecialArgType["ERROR"] = 7] = "ERROR";
	})(SpecialArgType || (SpecialArgType = {}));
	/**
	 * Converts callback arguments into ICallbackArgument objects, and back
	 * again.
	 * @hidden
	 */
	var CallbackArgumentConverter = function CallbackArgumentConverter() {
	    this._callbacks = {};
	    this._nextId = 0;
	};
	CallbackArgumentConverter.prototype.toRemoteArg = function toRemoteArg (cb) {
	    var id = this._nextId++;
	    this._callbacks[id] = cb;
	    return {
	        type: SpecialArgType.CB,
	        id: id
	    };
	};
	CallbackArgumentConverter.prototype.toLocalArg = function toLocalArg (id) {
	    var cb = this._callbacks[id];
	    delete this._callbacks[id];
	    return cb;
	};
	/**
	 * @hidden
	 */
	var FileDescriptorArgumentConverter = function FileDescriptorArgumentConverter() {
	    this._fileDescriptors = {};
	    this._nextId = 0;
	};
	FileDescriptorArgumentConverter.prototype.toRemoteArg = function toRemoteArg (fd, p, flag, cb) {
	    var id = this._nextId++;
	    var data;
	    var stat;
	    this._fileDescriptors[id] = fd;
	    // Extract needed information asynchronously.
	    fd.stat(function (err, stats) {
	        if (err) {
	            cb(err);
	        }
	        else {
	            stat = bufferToTransferrableObject(stats.toBuffer());
	            // If it's a readable flag, we need to grab contents.
	            if (flag.isReadable()) {
	                fd.read(Buffer.alloc(stats.size), 0, stats.size, 0, function (err, bytesRead, buff) {
	                    if (err) {
	                        cb(err);
	                    }
	                    else {
	                        data = bufferToTransferrableObject(buff);
	                        cb(null, {
	                            type: SpecialArgType.FD,
	                            id: id,
	                            data: data,
	                            stat: stat,
	                            path: p,
	                            flag: flag.getFlagString()
	                        });
	                    }
	                });
	            }
	            else {
	                // File is not readable, which means writing to it will append or
	                // truncate/replace existing contents. Return an empty arraybuffer.
	                cb(null, {
	                    type: SpecialArgType.FD,
	                    id: id,
	                    data: new ArrayBuffer(0),
	                    stat: stat,
	                    path: p,
	                    flag: flag.getFlagString()
	                });
	            }
	        }
	    });
	};
	FileDescriptorArgumentConverter.prototype.applyFdAPIRequest = function applyFdAPIRequest (request, cb) {
	        var this$1 = this;
	
	    var fdArg = request.args[0];
	    this._applyFdChanges(fdArg, function (err, fd) {
	        if (err) {
	            cb(err);
	        }
	        else {
	            // Apply method on now-changed file descriptor.
	            fd[request.method](function (e) {
	                if (request.method === 'close') {
	                    delete this$1._fileDescriptors[fdArg.id];
	                }
	                cb(e);
	            });
	        }
	    });
	};
	FileDescriptorArgumentConverter.prototype._applyFdChanges = function _applyFdChanges (remoteFd, cb) {
	    var fd = this._fileDescriptors[remoteFd.id], data = transferrableObjectToBuffer(remoteFd.data), remoteStats = Stats.fromBuffer(transferrableObjectToBuffer(remoteFd.stat));
	    // Write data if the file is writable.
	    var flag = FileFlag.getFileFlag(remoteFd.flag);
	    if (flag.isWriteable()) {
	        // Appendable: Write to end of file.
	        // Writeable: Replace entire contents of file.
	        fd.write(data, 0, data.length, flag.isAppendable() ? fd.getPos() : 0, function (e) {
	            function applyStatChanges() {
	                // Check if mode changed.
	                fd.stat(function (e, stats) {
	                    if (e) {
	                        cb(e);
	                    }
	                    else {
	                        if (stats.mode !== remoteStats.mode) {
	                            fd.chmod(remoteStats.mode, function (e) {
	                                cb(e, fd);
	                            });
	                        }
	                        else {
	                            cb(e, fd);
	                        }
	                    }
	                });
	            }
	            if (e) {
	                cb(e);
	            }
	            else {
	                // If writeable & not appendable, we need to ensure file contents are
	                // identical to those from the remote FD. Thus, we truncate to the
	                // length of the remote file.
	                if (!flag.isAppendable()) {
	                    fd.truncate(data.length, function () {
	                        applyStatChanges();
	                    });
	                }
	                else {
	                    applyStatChanges();
	                }
	            }
	        });
	    }
	    else {
	        cb(null, fd);
	    }
	};
	/**
	 * @hidden
	 */
	function apiErrorLocal2Remote(e) {
	    return {
	        type: SpecialArgType.API_ERROR,
	        errorData: bufferToTransferrableObject(e.writeToBuffer())
	    };
	}
	/**
	 * @hidden
	 */
	function apiErrorRemote2Local(e) {
	    return ApiError.fromBuffer(transferrableObjectToBuffer(e.errorData));
	}
	/**
	 * @hidden
	 */
	function errorLocal2Remote(e) {
	    return {
	        type: SpecialArgType.ERROR,
	        name: e.name,
	        message: e.message,
	        stack: e.stack
	    };
	}
	/**
	 * @hidden
	 */
	function errorRemote2Local(e) {
	    var cnstr = global$1[e.name];
	    if (typeof (cnstr) !== 'function') {
	        cnstr = Error;
	    }
	    var err = new cnstr(e.message);
	    err.stack = e.stack;
	    return err;
	}
	/**
	 * @hidden
	 */
	function statsLocal2Remote(stats) {
	    return {
	        type: SpecialArgType.STATS,
	        statsData: bufferToTransferrableObject(stats.toBuffer())
	    };
	}
	/**
	 * @hidden
	 */
	function statsRemote2Local(stats) {
	    return Stats.fromBuffer(transferrableObjectToBuffer(stats.statsData));
	}
	/**
	 * @hidden
	 */
	function fileFlagLocal2Remote(flag) {
	    return {
	        type: SpecialArgType.FILEFLAG,
	        flagStr: flag.getFlagString()
	    };
	}
	/**
	 * @hidden
	 */
	function fileFlagRemote2Local(remoteFlag) {
	    return FileFlag.getFileFlag(remoteFlag.flagStr);
	}
	/**
	 * @hidden
	 */
	function bufferToTransferrableObject(buff) {
	    return buffer2ArrayBuffer(buff);
	}
	/**
	 * @hidden
	 */
	function transferrableObjectToBuffer(buff) {
	    return arrayBuffer2Buffer(buff);
	}
	/**
	 * @hidden
	 */
	function bufferLocal2Remote(buff) {
	    return {
	        type: SpecialArgType.BUFFER,
	        data: bufferToTransferrableObject(buff)
	    };
	}
	/**
	 * @hidden
	 */
	function bufferRemote2Local(buffArg) {
	    return transferrableObjectToBuffer(buffArg.data);
	}
	/**
	 * @hidden
	 */
	function isAPIRequest(data) {
	    return data && typeof data === 'object' && data.hasOwnProperty('browserfsMessage') && data['browserfsMessage'];
	}
	/**
	 * @hidden
	 */
	function isAPIResponse(data) {
	    return data && typeof data === 'object' && data.hasOwnProperty('browserfsMessage') && data['browserfsMessage'];
	}
	/**
	 * Represents a remote file in a different worker/thread.
	 */
	var WorkerFile = (function (PreloadFile$$1) {
	    function WorkerFile(_fs, _path, _flag, _stat, remoteFdId, contents) {
	        PreloadFile$$1.call(this, _fs, _path, _flag, _stat, contents);
	        this._remoteFdId = remoteFdId;
	    }
	
	    if ( PreloadFile$$1 ) WorkerFile.__proto__ = PreloadFile$$1;
	    WorkerFile.prototype = Object.create( PreloadFile$$1 && PreloadFile$$1.prototype );
	    WorkerFile.prototype.constructor = WorkerFile;
	    WorkerFile.prototype.getRemoteFdId = function getRemoteFdId () {
	        return this._remoteFdId;
	    };
	    /**
	     * @hidden
	     */
	    WorkerFile.prototype.toRemoteArg = function toRemoteArg () {
	        return {
	            type: SpecialArgType.FD,
	            id: this._remoteFdId,
	            data: bufferToTransferrableObject(this.getBuffer()),
	            stat: bufferToTransferrableObject(this.getStats().toBuffer()),
	            path: this.getPath(),
	            flag: this.getFlag().getFlagString()
	        };
	    };
	    WorkerFile.prototype.sync = function sync (cb) {
	        this._syncClose('sync', cb);
	    };
	    WorkerFile.prototype.close = function close (cb) {
	        this._syncClose('close', cb);
	    };
	    WorkerFile.prototype._syncClose = function _syncClose (type, cb) {
	        var this$1 = this;
	
	        if (this.isDirty()) {
	            this._fs.syncClose(type, this, function (e) {
	                if (!e) {
	                    this$1.resetDirty();
	                }
	                cb(e);
	            });
	        }
	        else {
	            cb();
	        }
	    };
	
	    return WorkerFile;
	}(PreloadFile));
	/**
	 * WorkerFS lets you access a BrowserFS instance that is running in a different
	 * JavaScript context (e.g. access BrowserFS in one of your WebWorkers, or
	 * access BrowserFS running on the main page from a WebWorker).
	 *
	 * For example, to have a WebWorker access files in the main browser thread,
	 * do the following:
	 *
	 * MAIN BROWSER THREAD:
	 *
	 * ```javascript
	 *   // Listen for remote file system requests.
	 *   BrowserFS.FileSystem.WorkerFS.attachRemoteListener(webWorkerObject);
	 * ```
	 *
	 * WEBWORKER THREAD:
	 *
	 * ```javascript
	 *   // Set the remote file system as the root file system.
	 *   BrowserFS.configure({ fs: "WorkerFS", options: { worker: self }}, function(e) {
	 *     // Ready!
	 *   });
	 * ```
	 *
	 * Note that synchronous operations are not permitted on the WorkerFS, regardless
	 * of the configuration option of the remote FS.
	 */
	var WorkerFS = (function (BaseFileSystem$$1) {
	    function WorkerFS(worker, deprecateMsg) {
	        var this$1 = this;
	        if ( deprecateMsg === void 0 ) deprecateMsg = true;
	
	        BaseFileSystem$$1.call(this);
	        this._callbackConverter = new CallbackArgumentConverter();
	        this._isInitialized = false;
	        this._isReadOnly = false;
	        this._supportLinks = false;
	        this._supportProps = false;
	        this._worker = worker;
	        deprecationMessage(deprecateMsg, WorkerFS.Name, { worker: "Web Worker instance" });
	        this._worker.addEventListener('message', function (e) {
	            var resp = e.data;
	            if (isAPIResponse(resp)) {
	                var i;
	                var args = resp.args;
	                var fixedArgs = new Array(args.length);
	                // Dispatch event to correct id.
	                for (i = 0; i < fixedArgs.length; i++) {
	                    fixedArgs[i] = this$1._argRemote2Local(args[i]);
	                }
	                this$1._callbackConverter.toLocalArg(resp.cbId).apply(null, fixedArgs);
	            }
	        });
	    }
	
	    if ( BaseFileSystem$$1 ) WorkerFS.__proto__ = BaseFileSystem$$1;
	    WorkerFS.prototype = Object.create( BaseFileSystem$$1 && BaseFileSystem$$1.prototype );
	    WorkerFS.prototype.constructor = WorkerFS;
	    WorkerFS.Create = function Create (opts, cb) {
	        var fs = new WorkerFS(opts.worker, false);
	        fs.initialize(function () {
	            cb(null, fs);
	        });
	    };
	    WorkerFS.isAvailable = function isAvailable () {
	        return typeof (importScripts) !== 'undefined' || typeof (Worker) !== 'undefined';
	    };
	    /**
	     * Attaches a listener to the remote worker for file system requests.
	     */
	    WorkerFS.attachRemoteListener = function attachRemoteListener (worker) {
	        var fdConverter = new FileDescriptorArgumentConverter();
	        function argLocal2Remote(arg, requestArgs, cb) {
	            switch (typeof arg) {
	                case 'object':
	                    if (arg instanceof Stats) {
	                        cb(null, statsLocal2Remote(arg));
	                    }
	                    else if (arg instanceof ApiError) {
	                        cb(null, apiErrorLocal2Remote(arg));
	                    }
	                    else if (arg instanceof BaseFile) {
	                        // Pass in p and flags from original request.
	                        cb(null, fdConverter.toRemoteArg(arg, requestArgs[0], requestArgs[1], cb));
	                    }
	                    else if (arg instanceof FileFlag) {
	                        cb(null, fileFlagLocal2Remote(arg));
	                    }
	                    else if (arg instanceof Buffer) {
	                        cb(null, bufferLocal2Remote(arg));
	                    }
	                    else if (arg instanceof Error) {
	                        cb(null, errorLocal2Remote(arg));
	                    }
	                    else {
	                        cb(null, arg);
	                    }
	                    break;
	                default:
	                    cb(null, arg);
	                    break;
	            }
	        }
	        function argRemote2Local(arg, fixedRequestArgs) {
	            if (!arg) {
	                return arg;
	            }
	            switch (typeof arg) {
	                case 'object':
	                    if (typeof arg['type'] === 'number') {
	                        var specialArg = arg;
	                        switch (specialArg.type) {
	                            case SpecialArgType.CB:
	                                var cbId = arg.id;
	                                return function () {
	                                    var arguments$1 = arguments;
	
	                                    var i;
	                                    var fixedArgs = new Array(arguments.length);
	                                    var message, countdown = arguments.length;
	                                    function abortAndSendError(err) {
	                                        if (countdown > 0) {
	                                            countdown = -1;
	                                            message = {
	                                                browserfsMessage: true,
	                                                cbId: cbId,
	                                                args: [apiErrorLocal2Remote(err)]
	                                            };
	                                            worker.postMessage(message);
	                                        }
	                                    }
	                                    for (i = 0; i < arguments.length; i++) {
	                                        // Capture i and argument.
	                                        (function (i, arg) {
	                                            argLocal2Remote(arg, fixedRequestArgs, function (err, fixedArg) {
	                                                fixedArgs[i] = fixedArg;
	                                                if (err) {
	                                                    abortAndSendError(err);
	                                                }
	                                                else if (--countdown === 0) {
	                                                    message = {
	                                                        browserfsMessage: true,
	                                                        cbId: cbId,
	                                                        args: fixedArgs
	                                                    };
	                                                    worker.postMessage(message);
	                                                }
	                                            });
	                                        })(i, arguments$1[i]);
	                                    }
	                                    if (arguments.length === 0) {
	                                        message = {
	                                            browserfsMessage: true,
	                                            cbId: cbId,
	                                            args: fixedArgs
	                                        };
	                                        worker.postMessage(message);
	                                    }
	                                };
	                            case SpecialArgType.API_ERROR:
	                                return apiErrorRemote2Local(specialArg);
	                            case SpecialArgType.STATS:
	                                return statsRemote2Local(specialArg);
	                            case SpecialArgType.FILEFLAG:
	                                return fileFlagRemote2Local(specialArg);
	                            case SpecialArgType.BUFFER:
	                                return bufferRemote2Local(specialArg);
	                            case SpecialArgType.ERROR:
	                                return errorRemote2Local(specialArg);
	                            default:
	                                // No idea what this is.
	                                return arg;
	                        }
	                    }
	                    else {
	                        return arg;
	                    }
	                default:
	                    return arg;
	            }
	        }
	        worker.addEventListener('message', function (e) {
	            var request = e.data;
	            if (isAPIRequest(request)) {
	                var args = request.args, fixedArgs = new Array(args.length);
	                switch (request.method) {
	                    case 'close':
	                    case 'sync':
	                        (function () {
	                            // File descriptor-relative methods.
	                            var remoteCb = args[1];
	                            fdConverter.applyFdAPIRequest(request, function (err) {
	                                // Send response.
	                                var response = {
	                                    browserfsMessage: true,
	                                    cbId: remoteCb.id,
	                                    args: err ? [apiErrorLocal2Remote(err)] : []
	                                };
	                                worker.postMessage(response);
	                            });
	                        })();
	                        break;
	                    case 'probe':
	                        (function () {
	                            var rootFs = _fsMock.getRootFS(), remoteCb = args[1], probeResponse = {
	                                type: SpecialArgType.PROBE,
	                                isReadOnly: rootFs.isReadOnly(),
	                                supportsLinks: rootFs.supportsLinks(),
	                                supportsProps: rootFs.supportsProps()
	                            }, response = {
	                                browserfsMessage: true,
	                                cbId: remoteCb.id,
	                                args: [probeResponse]
	                            };
	                            worker.postMessage(response);
	                        })();
	                        break;
	                    default:
	                        // File system methods.
	                        for (var i = 0; i < args.length; i++) {
	                            fixedArgs[i] = argRemote2Local(args[i], fixedArgs);
	                        }
	                        var rootFS = _fsMock.getRootFS();
	                        rootFS[request.method].apply(rootFS, fixedArgs);
	                        break;
	                }
	            }
	        });
	    };
	    WorkerFS.prototype.getName = function getName () {
	        return WorkerFS.Name;
	    };
	    /**
	     * **Deprecated. Please use WorkerFS.Create() method to construct and initialize WorkerFS instances.**
	     *
	     * Called once both local and remote sides are set up.
	     */
	    WorkerFS.prototype.initialize = function initialize (cb) {
	        var this$1 = this;
	
	        if (!this._isInitialized) {
	            var message = {
	                browserfsMessage: true,
	                method: 'probe',
	                args: [this._argLocal2Remote(emptyBuffer()), this._callbackConverter.toRemoteArg(function (probeResponse) {
	                        this$1._isInitialized = true;
	                        this$1._isReadOnly = probeResponse.isReadOnly;
	                        this$1._supportLinks = probeResponse.supportsLinks;
	                        this$1._supportProps = probeResponse.supportsProps;
	                        cb();
	                    })]
	            };
	            this._worker.postMessage(message);
	        }
	        else {
	            cb();
	        }
	    };
	    WorkerFS.prototype.isReadOnly = function isReadOnly () { return this._isReadOnly; };
	    WorkerFS.prototype.supportsSynch = function supportsSynch () { return false; };
	    WorkerFS.prototype.supportsLinks = function supportsLinks () { return this._supportLinks; };
	    WorkerFS.prototype.supportsProps = function supportsProps () { return this._supportProps; };
	    WorkerFS.prototype.rename = function rename (oldPath, newPath, cb) {
	        this._rpc('rename', arguments);
	    };
	    WorkerFS.prototype.stat = function stat (p, isLstat, cb) {
	        this._rpc('stat', arguments);
	    };
	    WorkerFS.prototype.open = function open (p, flag, mode, cb) {
	        this._rpc('open', arguments);
	    };
	    WorkerFS.prototype.unlink = function unlink (p, cb) {
	        this._rpc('unlink', arguments);
	    };
	    WorkerFS.prototype.rmdir = function rmdir (p, cb) {
	        this._rpc('rmdir', arguments);
	    };
	    WorkerFS.prototype.mkdir = function mkdir (p, mode, cb) {
	        this._rpc('mkdir', arguments);
	    };
	    WorkerFS.prototype.readdir = function readdir (p, cb) {
	        this._rpc('readdir', arguments);
	    };
	    WorkerFS.prototype.exists = function exists (p, cb) {
	        this._rpc('exists', arguments);
	    };
	    WorkerFS.prototype.realpath = function realpath (p, cache, cb) {
	        this._rpc('realpath', arguments);
	    };
	    WorkerFS.prototype.truncate = function truncate (p, len, cb) {
	        this._rpc('truncate', arguments);
	    };
	    WorkerFS.prototype.readFile = function readFile (fname, encoding, flag, cb) {
	        this._rpc('readFile', arguments);
	    };
	    WorkerFS.prototype.writeFile = function writeFile (fname, data, encoding, flag, mode, cb) {
	        this._rpc('writeFile', arguments);
	    };
	    WorkerFS.prototype.appendFile = function appendFile (fname, data, encoding, flag, mode, cb) {
	        this._rpc('appendFile', arguments);
	    };
	    WorkerFS.prototype.chmod = function chmod (p, isLchmod, mode, cb) {
	        this._rpc('chmod', arguments);
	    };
	    WorkerFS.prototype.chown = function chown (p, isLchown, uid, gid, cb) {
	        this._rpc('chown', arguments);
	    };
	    WorkerFS.prototype.utimes = function utimes (p, atime, mtime, cb) {
	        this._rpc('utimes', arguments);
	    };
	    WorkerFS.prototype.link = function link (srcpath, dstpath, cb) {
	        this._rpc('link', arguments);
	    };
	    WorkerFS.prototype.symlink = function symlink (srcpath, dstpath, type, cb) {
	        this._rpc('symlink', arguments);
	    };
	    WorkerFS.prototype.readlink = function readlink (p, cb) {
	        this._rpc('readlink', arguments);
	    };
	    WorkerFS.prototype.syncClose = function syncClose (method, fd, cb) {
	        this._worker.postMessage({
	            browserfsMessage: true,
	            method: method,
	            args: [fd.toRemoteArg(), this._callbackConverter.toRemoteArg(cb)]
	        });
	    };
	    WorkerFS.prototype._argRemote2Local = function _argRemote2Local (arg) {
	        if (!arg) {
	            return arg;
	        }
	        switch (typeof arg) {
	            case 'object':
	                if (typeof arg['type'] === 'number') {
	                    var specialArg = arg;
	                    switch (specialArg.type) {
	                        case SpecialArgType.API_ERROR:
	                            return apiErrorRemote2Local(specialArg);
	                        case SpecialArgType.FD:
	                            var fdArg = specialArg;
	                            return new WorkerFile(this, fdArg.path, FileFlag.getFileFlag(fdArg.flag), Stats.fromBuffer(transferrableObjectToBuffer(fdArg.stat)), fdArg.id, transferrableObjectToBuffer(fdArg.data));
	                        case SpecialArgType.STATS:
	                            return statsRemote2Local(specialArg);
	                        case SpecialArgType.FILEFLAG:
	                            return fileFlagRemote2Local(specialArg);
	                        case SpecialArgType.BUFFER:
	                            return bufferRemote2Local(specialArg);
	                        case SpecialArgType.ERROR:
	                            return errorRemote2Local(specialArg);
	                        default:
	                            return arg;
	                    }
	                }
	                else {
	                    return arg;
	                }
	            default:
	                return arg;
	        }
	    };
	    WorkerFS.prototype._rpc = function _rpc (methodName, args) {
	        var this$1 = this;
	
	        var fixedArgs = new Array(args.length);
	        for (var i = 0; i < args.length; i++) {
	            fixedArgs[i] = this$1._argLocal2Remote(args[i]);
	        }
	        var message = {
	            browserfsMessage: true,
	            method: methodName,
	            args: fixedArgs
	        };
	        this._worker.postMessage(message);
	    };
	    /**
	     * Converts a local argument into a remote argument. Public so WorkerFile objects can call it.
	     */
	    WorkerFS.prototype._argLocal2Remote = function _argLocal2Remote (arg) {
	        if (!arg) {
	            return arg;
	        }
	        switch (typeof arg) {
	            case "object":
	                if (arg instanceof Stats) {
	                    return statsLocal2Remote(arg);
	                }
	                else if (arg instanceof ApiError) {
	                    return apiErrorLocal2Remote(arg);
	                }
	                else if (arg instanceof WorkerFile) {
	                    return arg.toRemoteArg();
	                }
	                else if (arg instanceof FileFlag) {
	                    return fileFlagLocal2Remote(arg);
	                }
	                else if (arg instanceof Buffer) {
	                    return bufferLocal2Remote(arg);
	                }
	                else if (arg instanceof Error) {
	                    return errorLocal2Remote(arg);
	                }
	                else {
	                    return "Unknown argument";
	                }
	            case "function":
	                return this._callbackConverter.toRemoteArg(arg);
	            default:
	                return arg;
	        }
	    };
	
	    return WorkerFS;
	}(BaseFileSystem));
	
	WorkerFS.Name = "WorkerFS";
	WorkerFS.Options = {
	    worker: {
	        type: "object",
	        description: "The target worker that you want to connect to, or the current worker if in a worker context.",
	        validator: function (v, cb) {
	            // Check for a `postMessage` function.
	            if (v['postMessage']) {
	                cb();
	            }
	            else {
	                cb(new ApiError(ErrorCode.EINVAL, "option must be a Web Worker instance."));
	            }
	        }
	    }
	};
	
	/**
	 * Contains utility methods for performing a variety of tasks with
	 * XmlHttpRequest across browsers.
	 */
	function asyncDownloadFileModern(p, type, cb) {
	    var req = new XMLHttpRequest();
	    req.open('GET', p, true);
	    var jsonSupported = true;
	    switch (type) {
	        case 'buffer':
	            req.responseType = 'arraybuffer';
	            break;
	        case 'json':
	            // Some browsers don't support the JSON response type.
	            // They either reset responseType, or throw an exception.
	            // @see https://github.com/Modernizr/Modernizr/blob/master/src/testXhrType.js
	            try {
	                req.responseType = 'json';
	                jsonSupported = req.responseType === 'json';
	            }
	            catch (e) {
	                jsonSupported = false;
	            }
	            break;
	        default:
	            return cb(new ApiError(ErrorCode.EINVAL, "Invalid download type: " + type));
	    }
	    req.onreadystatechange = function (e) {
	        if (req.readyState === 4) {
	            if (req.status === 200) {
	                switch (type) {
	                    case 'buffer':
	                        // XXX: WebKit-based browsers return *null* when XHRing an empty file.
	                        return cb(null, req.response ? Buffer.from(req.response) : emptyBuffer());
	                    case 'json':
	                        if (jsonSupported) {
	                            return cb(null, req.response);
	                        }
	                        else {
	                            return cb(null, JSON.parse(req.responseText));
	                        }
	                }
	            }
	            else {
	                return cb(new ApiError(req.status, "XHR error."));
	            }
	        }
	    };
	    req.send();
	}
	function syncDownloadFileModern(p, type) {
	    var req = new XMLHttpRequest();
	    req.open('GET', p, false);
	    // On most platforms, we cannot set the responseType of synchronous downloads.
	    // @todo Test for this; IE10 allows this, as do older versions of Chrome/FF.
	    var data = null;
	    var err = null;
	    // Classic hack to download binary data as a string.
	    req.overrideMimeType('text/plain; charset=x-user-defined');
	    req.onreadystatechange = function (e) {
	        if (req.readyState === 4) {
	            if (req.status === 200) {
	                switch (type) {
	                    case 'buffer':
	                        // Convert the text into a buffer.
	                        var text = req.responseText;
	                        data = Buffer.alloc(text.length);
	                        // Throw away the upper bits of each character.
	                        for (var i = 0; i < text.length; i++) {
	                            // This will automatically throw away the upper bit of each
	                            // character for us.
	                            data[i] = text.charCodeAt(i);
	                        }
	                        return;
	                    case 'json':
	                        data = JSON.parse(req.responseText);
	                        return;
	                }
	            }
	            else {
	                err = new ApiError(req.status, "XHR error.");
	                return;
	            }
	        }
	    };
	    req.send();
	    if (err) {
	        throw err;
	    }
	    return data;
	}
	function syncDownloadFileIE10(p, type) {
	    var req = new XMLHttpRequest();
	    req.open('GET', p, false);
	    switch (type) {
	        case 'buffer':
	            req.responseType = 'arraybuffer';
	            break;
	        case 'json':
	            // IE10 does not support the JSON type.
	            break;
	        default:
	            throw new ApiError(ErrorCode.EINVAL, "Invalid download type: " + type);
	    }
	    var data;
	    var err;
	    req.onreadystatechange = function (e) {
	        if (req.readyState === 4) {
	            if (req.status === 200) {
	                switch (type) {
	                    case 'buffer':
	                        data = Buffer.from(req.response);
	                        break;
	                    case 'json':
	                        data = JSON.parse(req.response);
	                        break;
	                }
	            }
	            else {
	                err = new ApiError(req.status, "XHR error.");
	            }
	        }
	    };
	    req.send();
	    if (err) {
	        throw err;
	    }
	    return data;
	}
	/**
	 * @hidden
	 */
	function getFileSize(async, p, cb) {
	    var req = new XMLHttpRequest();
	    req.open('HEAD', p, async);
	    req.onreadystatechange = function (e) {
	        if (req.readyState === 4) {
	            if (req.status === 200) {
	                try {
	                    return cb(null, parseInt(req.getResponseHeader('Content-Length') || '-1', 10));
	                }
	                catch (e) {
	                    // In the event that the header isn't present or there is an error...
	                    return cb(new ApiError(ErrorCode.EIO, "XHR HEAD error: Could not read content-length."));
	                }
	            }
	            else {
	                return cb(new ApiError(req.status, "XHR HEAD error."));
	            }
	        }
	    };
	    req.send();
	}
	/**
	 * Asynchronously download a file as a buffer or a JSON object.
	 * Note that the third function signature with a non-specialized type is
	 * invalid, but TypeScript requires it when you specialize string arguments to
	 * constants.
	 * @hidden
	 */
	var asyncDownloadFile = asyncDownloadFileModern;
	/**
	 * Synchronously download a file as a buffer or a JSON object.
	 * Note that the third function signature with a non-specialized type is
	 * invalid, but TypeScript requires it when you specialize string arguments to
	 * constants.
	 * @hidden
	 */
	var syncDownloadFile = (isIE && typeof Blob !== 'undefined') ? syncDownloadFileIE10 : syncDownloadFileModern;
	/**
	 * Synchronously retrieves the size of the given file in bytes.
	 * @hidden
	 */
	function getFileSizeSync(p) {
	    var rv = -1;
	    getFileSize(false, p, function (err, size) {
	        if (err) {
	            throw err;
	        }
	        rv = size;
	    });
	    return rv;
	}
	/**
	 * Asynchronously retrieves the size of the given file in bytes.
	 * @hidden
	 */
	function getFileSizeAsync(p, cb) {
	    getFileSize(true, p, cb);
	}
	
	/**
	 * A simple class for storing a filesystem index. Assumes that all paths passed
	 * to it are *absolute* paths.
	 *
	 * Can be used as a partial or a full index, although care must be taken if used
	 * for the former purpose, especially when directories are concerned.
	 */
	var FileIndex = function FileIndex() {
	    // _index is a single-level key,value store that maps *directory* paths to
	    // DirInodes. File information is only contained in DirInodes themselves.
	    this._index = {};
	    // Create the root directory.
	    this.addPath('/', new DirInode());
	};
	/**
	 * Static method for constructing indices from a JSON listing.
	 * @param listing Directory listing generated by tools/XHRIndexer.coffee
	 * @return A new FileIndex object.
	 */
	FileIndex.fromListing = function fromListing (listing) {
	    var idx = new FileIndex();
	    // Add a root DirNode.
	    var rootInode = new DirInode();
	    idx._index['/'] = rootInode;
	    var queue = [['', listing, rootInode]];
	    while (queue.length > 0) {
	        var inode = (void 0);
	        var next = queue.pop();
	        var pwd = next[0];
	        var tree = next[1];
	        var parent = next[2];
	        for (var node in tree) {
	            if (tree.hasOwnProperty(node)) {
	                var children = tree[node];
	                var name = pwd + "/" + node;
	                if (children) {
	                    idx._index[name] = inode = new DirInode();
	                    queue.push([name, children, inode]);
	                }
	                else {
	                    // This inode doesn't have correct size information, noted with -1.
	                    inode = new FileInode(new Stats(FileType.FILE, -1, 0x16D));
	                }
	                if (parent) {
	                    parent._ls[node] = inode;
	                }
	            }
	        }
	    }
	    return idx;
	};
	/**
	 * Runs the given function over all files in the index.
	 */
	FileIndex.prototype.fileIterator = function fileIterator (cb) {
	        var this$1 = this;
	
	    for (var path$$1 in this$1._index) {
	        if (this$1._index.hasOwnProperty(path$$1)) {
	            var dir = this$1._index[path$$1];
	            var files = dir.getListing();
	            for (var i = 0, list = files; i < list.length; i += 1) {
	                var file = list[i];
	
	                    var item = dir.getItem(file);
	                if (isFileInode(item)) {
	                    cb(item.getData());
	                }
	            }
	        }
	    }
	};
	/**
	 * Adds the given absolute path to the index if it is not already in the index.
	 * Creates any needed parent directories.
	 * @param path The path to add to the index.
	 * @param inode The inode for the
	 *   path to add.
	 * @return 'True' if it was added or already exists, 'false' if there
	 *   was an issue adding it (e.g. item in path is a file, item exists but is
	 *   different).
	 * @todo If adding fails and implicitly creates directories, we do not clean up
	 *   the new empty directories.
	 */
	FileIndex.prototype.addPath = function addPath (path$$1, inode) {
	    if (!inode) {
	        throw new Error('Inode must be specified');
	    }
	    if (path$$1[0] !== '/') {
	        throw new Error('Path must be absolute, got: ' + path$$1);
	    }
	    // Check if it already exists.
	    if (this._index.hasOwnProperty(path$$1)) {
	        return this._index[path$$1] === inode;
	    }
	    var splitPath = this._split_path(path$$1);
	    var dirpath = splitPath[0];
	    var itemname = splitPath[1];
	    // Try to add to its parent directory first.
	    var parent = this._index[dirpath];
	    if (parent === undefined && path$$1 !== '/') {
	        // Create parent.
	        parent = new DirInode();
	        if (!this.addPath(dirpath, parent)) {
	            return false;
	        }
	    }
	    // Add myself to my parent.
	    if (path$$1 !== '/') {
	        if (!parent.addItem(itemname, inode)) {
	            return false;
	        }
	    }
	    // If I'm a directory, add myself to the index.
	    if (isDirInode(inode)) {
	        this._index[path$$1] = inode;
	    }
	    return true;
	};
	/**
	 * Adds the given absolute path to the index if it is not already in the index.
	 * The path is added without special treatment (no joining of adjacent separators, etc).
	 * Creates any needed parent directories.
	 * @param path The path to add to the index.
	 * @param inode The inode for the
	 *   path to add.
	 * @return 'True' if it was added or already exists, 'false' if there
	 *   was an issue adding it (e.g. item in path is a file, item exists but is
	 *   different).
	 * @todo If adding fails and implicitly creates directories, we do not clean up
	 *   the new empty directories.
	 */
	FileIndex.prototype.addPathFast = function addPathFast (path$$1, inode) {
	    var itemNameMark = path$$1.lastIndexOf('/');
	    var parentPath = itemNameMark === 0 ? "/" : path$$1.substring(0, itemNameMark);
	    var itemName = path$$1.substring(itemNameMark + 1);
	    // Try to add to its parent directory first.
	    var parent = this._index[parentPath];
	    if (parent === undefined) {
	        // Create parent.
	        parent = new DirInode();
	        this.addPathFast(parentPath, parent);
	    }
	    if (!parent.addItem(itemName, inode)) {
	        return false;
	    }
	    // If adding a directory, add to the index as well.
	    if (inode.isDir()) {
	        this._index[path$$1] = inode;
	    }
	    return true;
	};
	/**
	 * Removes the given path. Can be a file or a directory.
	 * @return The removed item,
	 *   or null if it did not exist.
	 */
	FileIndex.prototype.removePath = function removePath (path$$1) {
	        var this$1 = this;
	
	    var splitPath = this._split_path(path$$1);
	    var dirpath = splitPath[0];
	    var itemname = splitPath[1];
	    // Try to remove it from its parent directory first.
	    var parent = this._index[dirpath];
	    if (parent === undefined) {
	        return null;
	    }
	    // Remove myself from my parent.
	    var inode = parent.remItem(itemname);
	    if (inode === null) {
	        return null;
	    }
	    // If I'm a directory, remove myself from the index, and remove my children.
	    if (isDirInode(inode)) {
	        var children = inode.getListing();
	        for (var i = 0, list = children; i < list.length; i += 1) {
	            var child = list[i];
	
	                this$1.removePath(path$$1 + '/' + child);
	        }
	        // Remove the directory from the index, unless it's the root.
	        if (path$$1 !== '/') {
	            delete this._index[path$$1];
	        }
	    }
	    return inode;
	};
	/**
	 * Retrieves the directory listing of the given path.
	 * @return An array of files in the given path, or 'null' if it does not exist.
	 */
	FileIndex.prototype.ls = function ls (path$$1) {
	    var item = this._index[path$$1];
	    if (item === undefined) {
	        return null;
	    }
	    return item.getListing();
	};
	/**
	 * Returns the inode of the given item.
	 * @return Returns null if the item does not exist.
	 */
	FileIndex.prototype.getInode = function getInode (path$$1) {
	    var splitPath = this._split_path(path$$1);
	    var dirpath = splitPath[0];
	    var itemname = splitPath[1];
	    // Retrieve from its parent directory.
	    var parent = this._index[dirpath];
	    if (parent === undefined) {
	        return null;
	    }
	    // Root case
	    if (dirpath === path$$1) {
	        return parent;
	    }
	    return parent.getItem(itemname);
	};
	/**
	 * Split into a (directory path, item name) pair
	 */
	FileIndex.prototype._split_path = function _split_path (p) {
	    var dirpath = path.dirname(p);
	    var itemname = p.substr(dirpath.length + (dirpath === "/" ? 0 : 1));
	    return [dirpath, itemname];
	};
	/**
	 * Inode for a file. Stores an arbitrary (filesystem-specific) data payload.
	 */
	var FileInode = function FileInode(data) {
	    this.data = data;
	};
	FileInode.prototype.isFile = function isFile () { return true; };
	FileInode.prototype.isDir = function isDir () { return false; };
	FileInode.prototype.getData = function getData () { return this.data; };
	FileInode.prototype.setData = function setData (data) { this.data = data; };
	/**
	 * Inode for a directory. Currently only contains the directory listing.
	 */
	var DirInode = function DirInode(data) {
	    if ( data === void 0 ) data = null;
	
	    this.data = data;
	    this._ls = {};
	};
	DirInode.prototype.isFile = function isFile () {
	    return false;
	};
	DirInode.prototype.isDir = function isDir () {
	    return true;
	};
	DirInode.prototype.getData = function getData () { return this.data; };
	/**
	 * Return a Stats object for this inode.
	 * @todo Should probably remove this at some point. This isn't the
	 *   responsibility of the FileIndex.
	 */
	DirInode.prototype.getStats = function getStats () {
	    return new Stats(FileType.DIRECTORY, 4096, 0x16D);
	};
	/**
	 * Returns the directory listing for this directory. Paths in the directory are
	 * relative to the directory's path.
	 * @return The directory listing for this directory.
	 */
	DirInode.prototype.getListing = function getListing () {
	    return Object.keys(this._ls);
	};
	/**
	 * Returns the inode for the indicated item, or null if it does not exist.
	 * @param p Name of item in this directory.
	 */
	DirInode.prototype.getItem = function getItem (p) {
	    var item = this._ls[p];
	    return item ? item : null;
	};
	/**
	 * Add the given item to the directory listing. Note that the given inode is
	 * not copied, and will be mutated by the DirInode if it is a DirInode.
	 * @param p Item name to add to the directory listing.
	 * @param inode The inode for the
	 *   item to add to the directory inode.
	 * @return True if it was added, false if it already existed.
	 */
	DirInode.prototype.addItem = function addItem (p, inode) {
	    if (p in this._ls) {
	        return false;
	    }
	    this._ls[p] = inode;
	    return true;
	};
	/**
	 * Removes the given item from the directory listing.
	 * @param p Name of item to remove from the directory listing.
	 * @return Returns the item
	 *   removed, or null if the item did not exist.
	 */
	DirInode.prototype.remItem = function remItem (p) {
	    var item = this._ls[p];
	    if (item === undefined) {
	        return null;
	    }
	    delete this._ls[p];
	    return item;
	};
	/**
	 * @hidden
	 */
	function isFileInode(inode) {
	    return !!inode && inode.isFile();
	}
	/**
	 * @hidden
	 */
	function isDirInode(inode) {
	    return !!inode && inode.isDir();
	}
	
	/**
	 * Try to convert the given buffer into a string, and pass it to the callback.
	 * Optimization that removes the needed try/catch into a helper function, as
	 * this is an uncommon case.
	 * @hidden
	 */
	function tryToString(buff, encoding, cb) {
	    try {
	        cb(null, buff.toString(encoding));
	    }
	    catch (e) {
	        cb(e);
	    }
	}
	/**
	 * A simple filesystem backed by XMLHttpRequests. You must create a directory listing using the
	 * `make_xhrfs_index` tool provided by BrowserFS.
	 *
	 * If you install BrowserFS globally with `npm i -g browserfs`, you can generate a listing by
	 * running `make_xhrfs_index` in your terminal in the directory you would like to index:
	 *
	 * ```
	 * make_xhrfs_index > index.json
	 * ```
	 *
	 * Listings objects look like the following:
	 *
	 * ```json
	 * {
	 *   "home": {
	 *     "jvilk": {
	 *       "someFile.txt": null,
	 *       "someDir": {
	 *         // Empty directory
	 *       }
	 *     }
	 *   }
	 * }
	 * ```
	 *
	 * *This example has the folder `/home/jvilk` with subfile `someFile.txt` and subfolder `someDir`.*
	 */
	var XmlHttpRequest = (function (BaseFileSystem$$1) {
	    function XmlHttpRequest(listingUrlOrObj, prefixUrl, deprecateMsg) {
	        if ( prefixUrl === void 0 ) prefixUrl = '';
	        if ( deprecateMsg === void 0 ) deprecateMsg = true;
	
	        BaseFileSystem$$1.call(this);
	        if (!listingUrlOrObj) {
	            listingUrlOrObj = 'index.json';
	        }
	        // prefix_url must end in a directory separator.
	        if (prefixUrl.length > 0 && prefixUrl.charAt(prefixUrl.length - 1) !== '/') {
	            prefixUrl = prefixUrl + '/';
	        }
	        this.prefixUrl = prefixUrl;
	        var listing = null;
	        if (typeof (listingUrlOrObj) === "string") {
	            listing = this._requestFileSync(listingUrlOrObj, 'json');
	            if (!listing) {
	                throw new Error("Unable to find listing at URL: ${listingUrlOrObj}");
	            }
	        }
	        else {
	            listing = listingUrlOrObj;
	        }
	        deprecationMessage(deprecateMsg, XmlHttpRequest.Name, { index: typeof (listingUrlOrObj) === "string" ? listingUrlOrObj : "file index as an object", baseUrl: prefixUrl });
	        this._index = FileIndex.fromListing(listing);
	    }
	
	    if ( BaseFileSystem$$1 ) XmlHttpRequest.__proto__ = BaseFileSystem$$1;
	    XmlHttpRequest.prototype = Object.create( BaseFileSystem$$1 && BaseFileSystem$$1.prototype );
	    XmlHttpRequest.prototype.constructor = XmlHttpRequest;
	    /**
	     * Construct an XmlHttpRequest file system backend with the given options.
	     */
	    XmlHttpRequest.Create = function Create (opts, cb) {
	        if (opts.index === undefined) {
	            opts.index = "index.json";
	        }
	        if (typeof (opts.index) === "string") {
	            XmlHttpRequest.FromURL(opts.index, cb, opts.baseUrl, false);
	        }
	        else {
	            cb(null, new XmlHttpRequest(opts.index, opts.baseUrl, false));
	        }
	    };
	    XmlHttpRequest.isAvailable = function isAvailable () {
	        return typeof (XMLHttpRequest) !== "undefined" && XMLHttpRequest !== null;
	    };
	    /**
	     * **Deprecated. Please use XmlHttpRequest.Create() method instead to construct XmlHttpRequest objects.**
	     *
	     * Constructs an XmlHttpRequest object using the directory listing at the given URL.
	     * Uses the base URL as the URL prefix for fetched files.
	     * @param cb Called when the file system has been instantiated, or if an error occurs.
	     */
	    XmlHttpRequest.FromURL = function FromURL (url, cb, baseUrl, deprecateMsg) {
	        if ( baseUrl === void 0 ) baseUrl = url.slice(0, url.lastIndexOf('/') + 1);
	        if ( deprecateMsg === void 0 ) deprecateMsg = true;
	
	        if (deprecateMsg) {
	            console.warn(("[XmlHttpRequest] XmlHttpRequest.FromURL() is deprecated and will be removed in the next major release. Please use 'XmlHttpRequest.Create({ index: \"" + url + "\", baseUrl: \"" + baseUrl + "\" }, cb)' instead."));
	        }
	        asyncDownloadFile(url, "json", function (e, data) {
	            if (e) {
	                cb(e);
	            }
	            else {
	                cb(null, new XmlHttpRequest(data, baseUrl, false));
	            }
	        });
	    };
	    XmlHttpRequest.prototype.empty = function empty () {
	        this._index.fileIterator(function (file) {
	            file.fileData = null;
	        });
	    };
	    XmlHttpRequest.prototype.getName = function getName () {
	        return XmlHttpRequest.Name;
	    };
	    XmlHttpRequest.prototype.diskSpace = function diskSpace (path$$1, cb) {
	        // Read-only file system. We could calculate the total space, but that's not
	        // important right now.
	        cb(0, 0);
	    };
	    XmlHttpRequest.prototype.isReadOnly = function isReadOnly () {
	        return true;
	    };
	    XmlHttpRequest.prototype.supportsLinks = function supportsLinks () {
	        return false;
	    };
	    XmlHttpRequest.prototype.supportsProps = function supportsProps () {
	        return false;
	    };
	    XmlHttpRequest.prototype.supportsSynch = function supportsSynch () {
	        return true;
	    };
	    /**
	     * Special XHR function: Preload the given file into the index.
	     * @param [String] path
	     * @param [BrowserFS.Buffer] buffer
	     */
	    XmlHttpRequest.prototype.preloadFile = function preloadFile (path$$1, buffer$$1) {
	        var inode = this._index.getInode(path$$1);
	        if (isFileInode(inode)) {
	            if (inode === null) {
	                throw ApiError.ENOENT(path$$1);
	            }
	            var stats = inode.getData();
	            stats.size = buffer$$1.length;
	            stats.fileData = buffer$$1;
	        }
	        else {
	            throw ApiError.EISDIR(path$$1);
	        }
	    };
	    XmlHttpRequest.prototype.stat = function stat (path$$1, isLstat, cb) {
	        var inode = this._index.getInode(path$$1);
	        if (inode === null) {
	            return cb(ApiError.ENOENT(path$$1));
	        }
	        var stats;
	        if (isFileInode(inode)) {
	            stats = inode.getData();
	            // At this point, a non-opened file will still have default stats from the listing.
	            if (stats.size < 0) {
	                this._requestFileSizeAsync(path$$1, function (e, size) {
	                    if (e) {
	                        return cb(e);
	                    }
	                    stats.size = size;
	                    cb(null, stats.clone());
	                });
	            }
	            else {
	                cb(null, stats.clone());
	            }
	        }
	        else if (isDirInode(inode)) {
	            stats = inode.getStats();
	            cb(null, stats);
	        }
	        else {
	            cb(ApiError.FileError(ErrorCode.EINVAL, path$$1));
	        }
	    };
	    XmlHttpRequest.prototype.statSync = function statSync (path$$1, isLstat) {
	        var inode = this._index.getInode(path$$1);
	        if (inode === null) {
	            throw ApiError.ENOENT(path$$1);
	        }
	        var stats;
	        if (isFileInode(inode)) {
	            stats = inode.getData();
	            // At this point, a non-opened file will still have default stats from the listing.
	            if (stats.size < 0) {
	                stats.size = this._requestFileSizeSync(path$$1);
	            }
	        }
	        else if (isDirInode(inode)) {
	            stats = inode.getStats();
	        }
	        else {
	            throw ApiError.FileError(ErrorCode.EINVAL, path$$1);
	        }
	        return stats;
	    };
	    XmlHttpRequest.prototype.open = function open (path$$1, flags, mode, cb) {
	        // INVARIANT: You can't write to files on this file system.
	        if (flags.isWriteable()) {
	            return cb(new ApiError(ErrorCode.EPERM, path$$1));
	        }
	        var self = this;
	        // Check if the path exists, and is a file.
	        var inode = this._index.getInode(path$$1);
	        if (inode === null) {
	            return cb(ApiError.ENOENT(path$$1));
	        }
	        if (isFileInode(inode)) {
	            var stats = inode.getData();
	            switch (flags.pathExistsAction()) {
	                case ActionType.THROW_EXCEPTION:
	                case ActionType.TRUNCATE_FILE:
	                    return cb(ApiError.EEXIST(path$$1));
	                case ActionType.NOP:
	                    // Use existing file contents.
	                    // XXX: Uh, this maintains the previously-used flag.
	                    if (stats.fileData) {
	                        return cb(null, new NoSyncFile(self, path$$1, flags, stats.clone(), stats.fileData));
	                    }
	                    // @todo be lazier about actually requesting the file
	                    this._requestFileAsync(path$$1, 'buffer', function (err, buffer$$1) {
	                        if (err) {
	                            return cb(err);
	                        }
	                        // we don't initially have file sizes
	                        stats.size = buffer$$1.length;
	                        stats.fileData = buffer$$1;
	                        return cb(null, new NoSyncFile(self, path$$1, flags, stats.clone(), buffer$$1));
	                    });
	                    break;
	                default:
	                    return cb(new ApiError(ErrorCode.EINVAL, 'Invalid FileMode object.'));
	            }
	        }
	        else {
	            return cb(ApiError.EISDIR(path$$1));
	        }
	    };
	    XmlHttpRequest.prototype.openSync = function openSync (path$$1, flags, mode) {
	        // INVARIANT: You can't write to files on this file system.
	        if (flags.isWriteable()) {
	            throw new ApiError(ErrorCode.EPERM, path$$1);
	        }
	        // Check if the path exists, and is a file.
	        var inode = this._index.getInode(path$$1);
	        if (inode === null) {
	            throw ApiError.ENOENT(path$$1);
	        }
	        if (isFileInode(inode)) {
	            var stats = inode.getData();
	            switch (flags.pathExistsAction()) {
	                case ActionType.THROW_EXCEPTION:
	                case ActionType.TRUNCATE_FILE:
	                    throw ApiError.EEXIST(path$$1);
	                case ActionType.NOP:
	                    // Use existing file contents.
	                    // XXX: Uh, this maintains the previously-used flag.
	                    if (stats.fileData) {
	                        return new NoSyncFile(this, path$$1, flags, stats.clone(), stats.fileData);
	                    }
	                    // @todo be lazier about actually requesting the file
	                    var buffer$$1 = this._requestFileSync(path$$1, 'buffer');
	                    // we don't initially have file sizes
	                    stats.size = buffer$$1.length;
	                    stats.fileData = buffer$$1;
	                    return new NoSyncFile(this, path$$1, flags, stats.clone(), buffer$$1);
	                default:
	                    throw new ApiError(ErrorCode.EINVAL, 'Invalid FileMode object.');
	            }
	        }
	        else {
	            throw ApiError.EISDIR(path$$1);
	        }
	    };
	    XmlHttpRequest.prototype.readdir = function readdir (path$$1, cb) {
	        try {
	            cb(null, this.readdirSync(path$$1));
	        }
	        catch (e) {
	            cb(e);
	        }
	    };
	    XmlHttpRequest.prototype.readdirSync = function readdirSync (path$$1) {
	        // Check if it exists.
	        var inode = this._index.getInode(path$$1);
	        if (inode === null) {
	            throw ApiError.ENOENT(path$$1);
	        }
	        else if (isDirInode(inode)) {
	            return inode.getListing();
	        }
	        else {
	            throw ApiError.ENOTDIR(path$$1);
	        }
	    };
	    /**
	     * We have the entire file as a buffer; optimize readFile.
	     */
	    XmlHttpRequest.prototype.readFile = function readFile (fname, encoding, flag, cb) {
	        // Wrap cb in file closing code.
	        var oldCb = cb;
	        // Get file.
	        this.open(fname, flag, 0x1a4, function (err, fd) {
	            if (err) {
	                return cb(err);
	            }
	            cb = function (err, arg) {
	                fd.close(function (err2) {
	                    if (!err) {
	                        err = err2;
	                    }
	                    return oldCb(err, arg);
	                });
	            };
	            var fdCast = fd;
	            var fdBuff = fdCast.getBuffer();
	            if (encoding === null) {
	                cb(err, copyingSlice(fdBuff));
	            }
	            else {
	                tryToString(fdBuff, encoding, cb);
	            }
	        });
	    };
	    /**
	     * Specially-optimized readfile.
	     */
	    XmlHttpRequest.prototype.readFileSync = function readFileSync (fname, encoding, flag) {
	        // Get file.
	        var fd = this.openSync(fname, flag, 0x1a4);
	        try {
	            var fdCast = fd;
	            var fdBuff = fdCast.getBuffer();
	            if (encoding === null) {
	                return copyingSlice(fdBuff);
	            }
	            return fdBuff.toString(encoding);
	        }
	        finally {
	            fd.closeSync();
	        }
	    };
	    XmlHttpRequest.prototype.getXhrPath = function getXhrPath (filePath) {
	        if (filePath.charAt(0) === '/') {
	            filePath = filePath.slice(1);
	        }
	        return this.prefixUrl + filePath;
	    };
	    XmlHttpRequest.prototype._requestFileAsync = function _requestFileAsync (p, type, cb) {
	        asyncDownloadFile(this.getXhrPath(p), type, cb);
	    };
	    XmlHttpRequest.prototype._requestFileSync = function _requestFileSync (p, type) {
	        return syncDownloadFile(this.getXhrPath(p), type);
	    };
	    /**
	     * Only requests the HEAD content, for the file size.
	     */
	    XmlHttpRequest.prototype._requestFileSizeAsync = function _requestFileSizeAsync (path$$1, cb) {
	        getFileSizeAsync(this.getXhrPath(path$$1), cb);
	    };
	    XmlHttpRequest.prototype._requestFileSizeSync = function _requestFileSizeSync (path$$1) {
	        return getFileSizeSync(this.getXhrPath(path$$1));
	    };
	
	    return XmlHttpRequest;
	}(BaseFileSystem));
	
	XmlHttpRequest.Name = "XmlHttpRequest";
	XmlHttpRequest.Options = {
	    index: {
	        type: ["string", "object"],
	        optional: true,
	        description: "URL to a file index as a JSON file or the file index object itself, generated with the make_xhrfs_index script. Defaults to `index.json`."
	    },
	    baseUrl: {
	        type: "string",
	        optional: true,
	        description: "Used as the URL prefix for fetched files. Default: Fetch files relative to the index."
	    }
	};
	
	/**
	 * (Nonstandard) String utility function for 8-bit ASCII with the extended
	 * character set. Unlike the ASCII above, we do not mask the high bits.
	 *
	 * Placed into a separate file so it can be used with other Buffer implementations.
	 * @see http://en.wikipedia.org/wiki/Extended_ASCII
	 */
	/**
	 * (Nonstandard) String utility function for 8-bit ASCII with the extended
	 * character set. Unlike the ASCII above, we do not mask the high bits.
	 *
	 * Placed into a separate file so it can be used with other Buffer implementations.
	 * @see http://en.wikipedia.org/wiki/Extended_ASCII
	 */ var ExtendedASCII = function ExtendedASCII () {};
	
	 ExtendedASCII.str2byte = function str2byte (str, buf) {
	    var length = str.length > buf.length ? buf.length : str.length;
	    for (var i = 0; i < length; i++) {
	        var charCode = str.charCodeAt(i);
	        if (charCode > 0x7F) {
	            // Check if extended ASCII.
	            var charIdx = ExtendedASCII.extendedChars.indexOf(str.charAt(i));
	            if (charIdx > -1) {
	                charCode = charIdx + 0x80;
	            }
	            // Otherwise, keep it as-is.
	        }
	        buf[charCode] = i;
	    }
	    return length;
	};
	ExtendedASCII.byte2str = function byte2str (buff) {
	    var chars = new Array(buff.length);
	    for (var i = 0; i < buff.length; i++) {
	        var charCode = buff[i];
	        if (charCode > 0x7F) {
	            chars[i] = ExtendedASCII.extendedChars[charCode - 128];
	        }
	        else {
	            chars[i] = String.fromCharCode(charCode);
	        }
	    }
	    return chars.join('');
	};
	ExtendedASCII.byteLength = function byteLength (str) { return str.length; };
	
	 ExtendedASCII.extendedChars = ['\u00C7', '\u00FC', '\u00E9', '\u00E2', '\u00E4',
	    '\u00E0', '\u00E5', '\u00E7', '\u00EA', '\u00EB', '\u00E8', '\u00EF',
	    '\u00EE', '\u00EC', '\u00C4', '\u00C5', '\u00C9', '\u00E6', '\u00C6',
	    '\u00F4', '\u00F6', '\u00F2', '\u00FB', '\u00F9', '\u00FF', '\u00D6',
	    '\u00DC', '\u00F8', '\u00A3', '\u00D8', '\u00D7', '\u0192', '\u00E1',
	    '\u00ED', '\u00F3', '\u00FA', '\u00F1', '\u00D1', '\u00AA', '\u00BA',
	    '\u00BF', '\u00AE', '\u00AC', '\u00BD', '\u00BC', '\u00A1', '\u00AB',
	    '\u00BB', '_', '_', '_', '\u00A6', '\u00A6', '\u00C1', '\u00C2', '\u00C0',
	    '\u00A9', '\u00A6', '\u00A6', '+', '+', '\u00A2', '\u00A5', '+', '+', '-',
	    '-', '+', '-', '+', '\u00E3', '\u00C3', '+', '+', '-', '-', '\u00A6', '-',
	    '+', '\u00A4', '\u00F0', '\u00D0', '\u00CA', '\u00CB', '\u00C8', 'i',
	    '\u00CD', '\u00CE', '\u00CF', '+', '+', '_', '_', '\u00A6', '\u00CC', '_',
	    '\u00D3', '\u00DF', '\u00D4', '\u00D2', '\u00F5', '\u00D5', '\u00B5',
	    '\u00FE', '\u00DE', '\u00DA', '\u00DB', '\u00D9', '\u00FD', '\u00DD',
	    '\u00AF', '\u00B4', '\u00AD', '\u00B1', '_', '\u00BE', '\u00B6', '\u00A7',
	    '\u00F7', '\u00B8', '\u00B0', '\u00A8', '\u00B7', '\u00B9', '\u00B3',
	    '\u00B2', '_', ' '];
	
	/**
	 * @hidden
	 */
	var inflateRaw = __webpack_require__(31).inflateRaw;
	/**
	 * Maps CompressionMethod => function that decompresses.
	 * @hidden
	 */
	var decompressionMethods = {};
	/**
	 * 4.4.2.2: Indicates the compatibiltiy of a file's external attributes.
	 */
	var ExternalFileAttributeType;
	(function (ExternalFileAttributeType) {
	    ExternalFileAttributeType[ExternalFileAttributeType["MSDOS"] = 0] = "MSDOS";
	    ExternalFileAttributeType[ExternalFileAttributeType["AMIGA"] = 1] = "AMIGA";
	    ExternalFileAttributeType[ExternalFileAttributeType["OPENVMS"] = 2] = "OPENVMS";
	    ExternalFileAttributeType[ExternalFileAttributeType["UNIX"] = 3] = "UNIX";
	    ExternalFileAttributeType[ExternalFileAttributeType["VM_CMS"] = 4] = "VM_CMS";
	    ExternalFileAttributeType[ExternalFileAttributeType["ATARI_ST"] = 5] = "ATARI_ST";
	    ExternalFileAttributeType[ExternalFileAttributeType["OS2_HPFS"] = 6] = "OS2_HPFS";
	    ExternalFileAttributeType[ExternalFileAttributeType["MAC"] = 7] = "MAC";
	    ExternalFileAttributeType[ExternalFileAttributeType["Z_SYSTEM"] = 8] = "Z_SYSTEM";
	    ExternalFileAttributeType[ExternalFileAttributeType["CP_M"] = 9] = "CP_M";
	    ExternalFileAttributeType[ExternalFileAttributeType["NTFS"] = 10] = "NTFS";
	    ExternalFileAttributeType[ExternalFileAttributeType["MVS"] = 11] = "MVS";
	    ExternalFileAttributeType[ExternalFileAttributeType["VSE"] = 12] = "VSE";
	    ExternalFileAttributeType[ExternalFileAttributeType["ACORN_RISC"] = 13] = "ACORN_RISC";
	    ExternalFileAttributeType[ExternalFileAttributeType["VFAT"] = 14] = "VFAT";
	    ExternalFileAttributeType[ExternalFileAttributeType["ALT_MVS"] = 15] = "ALT_MVS";
	    ExternalFileAttributeType[ExternalFileAttributeType["BEOS"] = 16] = "BEOS";
	    ExternalFileAttributeType[ExternalFileAttributeType["TANDEM"] = 17] = "TANDEM";
	    ExternalFileAttributeType[ExternalFileAttributeType["OS_400"] = 18] = "OS_400";
	    ExternalFileAttributeType[ExternalFileAttributeType["OSX"] = 19] = "OSX";
	})(ExternalFileAttributeType || (ExternalFileAttributeType = {}));
	/**
	 * 4.4.5
	 */
	var CompressionMethod;
	(function (CompressionMethod) {
	    CompressionMethod[CompressionMethod["STORED"] = 0] = "STORED";
	    CompressionMethod[CompressionMethod["SHRUNK"] = 1] = "SHRUNK";
	    CompressionMethod[CompressionMethod["REDUCED_1"] = 2] = "REDUCED_1";
	    CompressionMethod[CompressionMethod["REDUCED_2"] = 3] = "REDUCED_2";
	    CompressionMethod[CompressionMethod["REDUCED_3"] = 4] = "REDUCED_3";
	    CompressionMethod[CompressionMethod["REDUCED_4"] = 5] = "REDUCED_4";
	    CompressionMethod[CompressionMethod["IMPLODE"] = 6] = "IMPLODE";
	    CompressionMethod[CompressionMethod["DEFLATE"] = 8] = "DEFLATE";
	    CompressionMethod[CompressionMethod["DEFLATE64"] = 9] = "DEFLATE64";
	    CompressionMethod[CompressionMethod["TERSE_OLD"] = 10] = "TERSE_OLD";
	    CompressionMethod[CompressionMethod["BZIP2"] = 12] = "BZIP2";
	    CompressionMethod[CompressionMethod["LZMA"] = 14] = "LZMA";
	    CompressionMethod[CompressionMethod["TERSE_NEW"] = 18] = "TERSE_NEW";
	    CompressionMethod[CompressionMethod["LZ77"] = 19] = "LZ77";
	    CompressionMethod[CompressionMethod["WAVPACK"] = 97] = "WAVPACK";
	    CompressionMethod[CompressionMethod["PPMD"] = 98] = "PPMD"; // PPMd version I, Rev 1
	})(CompressionMethod || (CompressionMethod = {}));
	/**
	 * Converts the input time and date in MS-DOS format into a JavaScript Date
	 * object.
	 * @hidden
	 */
	function msdos2date(time, date) {
	    // MS-DOS Date
	    // |0 0 0 0  0|0 0 0  0|0 0 0  0 0 0 0
	    //   D (1-31)  M (1-23)  Y (from 1980)
	    var day = date & 0x1F;
	    // JS date is 0-indexed, DOS is 1-indexed.
	    var month = ((date >> 5) & 0xF) - 1;
	    var year = (date >> 9) + 1980;
	    // MS DOS Time
	    // |0 0 0 0  0|0 0 0  0 0 0|0  0 0 0 0
	    //    Second      Minute       Hour
	    var second = time & 0x1F;
	    var minute = (time >> 5) & 0x3F;
	    var hour = time >> 11;
	    return new Date(year, month, day, hour, minute, second);
	}
	/**
	 * Safely returns the string from the buffer, even if it is 0 bytes long.
	 * (Normally, calling toString() on a buffer with start === end causes an
	 * exception).
	 * @hidden
	 */
	function safeToString(buff, useUTF8, start, length) {
	    if (length === 0) {
	        return "";
	    }
	    else if (useUTF8) {
	        return buff.toString('utf8', start, start + length);
	    }
	    else {
	        return ExtendedASCII.byte2str(buff.slice(start, start + length));
	    }
	}
	/*
	   4.3.6 Overall .ZIP file format:
	
	      [local file header 1]
	      [encryption header 1]
	      [file data 1]
	      [data descriptor 1]
	      .
	      .
	      .
	      [local file header n]
	      [encryption header n]
	      [file data n]
	      [data descriptor n]
	      [archive decryption header]
	      [archive extra data record]
	      [central directory header 1]
	      .
	      .
	      .
	      [central directory header n]
	      [zip64 end of central directory record]
	      [zip64 end of central directory locator]
	      [end of central directory record]
	*/
	/**
	 * 4.3.7  Local file header:
	 *
	 *     local file header signature     4 bytes  (0x04034b50)
	 *     version needed to extract       2 bytes
	 *     general purpose bit flag        2 bytes
	 *     compression method              2 bytes
	 *    last mod file time              2 bytes
	 *    last mod file date              2 bytes
	 *    crc-32                          4 bytes
	 *    compressed size                 4 bytes
	 *    uncompressed size               4 bytes
	 *    file name length                2 bytes
	 *    extra field length              2 bytes
	 *
	 *    file name (variable size)
	 *    extra field (variable size)
	 */
	var FileHeader = function FileHeader(data) {
	     this.data = data;
	     if (data.readUInt32LE(0) !== 0x04034b50) {
	         throw new ApiError(ErrorCode.EINVAL, "Invalid Zip file: Local file header has invalid signature: " + this.data.readUInt32LE(0));
	     }
	 };
	 FileHeader.prototype.versionNeeded = function versionNeeded () { return this.data.readUInt16LE(4); };
	 FileHeader.prototype.flags = function flags () { return this.data.readUInt16LE(6); };
	 FileHeader.prototype.compressionMethod = function compressionMethod () { return this.data.readUInt16LE(8); };
	 FileHeader.prototype.lastModFileTime = function lastModFileTime () {
	     // Time and date is in MS-DOS format.
	     return msdos2date(this.data.readUInt16LE(10), this.data.readUInt16LE(12));
	 };
	 FileHeader.prototype.rawLastModFileTime = function rawLastModFileTime () {
	     return this.data.readUInt32LE(10);
	 };
	 FileHeader.prototype.crc32 = function crc32 () { return this.data.readUInt32LE(14); };
	 /**
	  * These two values are COMPLETELY USELESS.
	  *
	  * Section 4.4.9:
	  *If bit 3 of the general purpose bit flag is set,
	  *these fields are set to zero in the local header and the
	  *correct values are put in the data descriptor and
	  *in the central directory.
	  *
	  * So we'll just use the central directory's values.
	  */
	 // public compressedSize(): number { return this.data.readUInt32LE(18); }
	 // public uncompressedSize(): number { return this.data.readUInt32LE(22); }
	 FileHeader.prototype.fileNameLength = function fileNameLength () { return this.data.readUInt16LE(26); };
	 FileHeader.prototype.extraFieldLength = function extraFieldLength () { return this.data.readUInt16LE(28); };
	 FileHeader.prototype.fileName = function fileName () {
	     return safeToString(this.data, this.useUTF8(), 30, this.fileNameLength());
	 };
	 FileHeader.prototype.extraField = function extraField () {
	     var start = 30 + this.fileNameLength();
	     return this.data.slice(start, start + this.extraFieldLength());
	 };
	 FileHeader.prototype.totalSize = function totalSize () { return 30 + this.fileNameLength() + this.extraFieldLength(); };
	 FileHeader.prototype.useUTF8 = function useUTF8 () { return (this.flags() & 0x800) === 0x800; };
	/**
	 * 4.3.8  File data
	 *
	 *   Immediately following the local header for a file
	 *   SHOULD be placed the compressed or stored data for the file.
	 *   If the file is encrypted, the encryption header for the file
	 *   SHOULD be placed after the local header and before the file
	 *   data. The series of [local file header][encryption header]
	 *   [file data][data descriptor] repeats for each file in the
	 *   .ZIP archive.
	 *
	 *   Zero-byte files, directories, and other file types that
	 *   contain no content MUST not include file data.
	 */
	var FileData = function FileData(header, record, data) {
	     this.header = header;
	     this.record = record;
	     this.data = data;
	 };
	 FileData.prototype.decompress = function decompress () {
	     // Check the compression
	     var compressionMethod = this.header.compressionMethod();
	     var fcn = decompressionMethods[compressionMethod];
	     if (fcn) {
	         return fcn(this.data, this.record.compressedSize(), this.record.uncompressedSize(), this.record.flag());
	     }
	     else {
	         var name = CompressionMethod[compressionMethod];
	         if (!name) {
	             name = "Unknown: " + compressionMethod;
	         }
	         throw new ApiError(ErrorCode.EINVAL, ("Invalid compression method on file '" + (this.header.fileName()) + "': " + name));
	     }
	 };
	 FileData.prototype.getHeader = function getHeader () {
	     return this.header;
	 };
	 FileData.prototype.getRecord = function getRecord () {
	     return this.record;
	 };
	 FileData.prototype.getRawData = function getRawData () {
	     return this.data;
	 };
	/**
	 * 4.3.9  Data descriptor:
	 *
	 *    crc-32                          4 bytes
	 *    compressed size                 4 bytes
	 *    uncompressed size               4 bytes
	 */
	var DataDescriptor = function DataDescriptor(data) {
	     this.data = data;
	 };
	 DataDescriptor.prototype.crc32 = function crc32 () { return this.data.readUInt32LE(0); };
	 DataDescriptor.prototype.compressedSize = function compressedSize () { return this.data.readUInt32LE(4); };
	 DataDescriptor.prototype.uncompressedSize = function uncompressedSize () { return this.data.readUInt32LE(8); };
	/*
	` 4.3.10  Archive decryption header:
	
	      4.3.10.1 The Archive Decryption Header is introduced in version 6.2
	      of the ZIP format specification.  This record exists in support
	      of the Central Directory Encryption Feature implemented as part of
	      the Strong Encryption Specification as described in this document.
	      When the Central Directory Structure is encrypted, this decryption
	      header MUST precede the encrypted data segment.
	 */
	/**
	 * 4.3.11  Archive extra data record:
	 *
	 *      archive extra data signature    4 bytes  (0x08064b50)
	 *      extra field length              4 bytes
	 *      extra field data                (variable size)
	 *
	 *    4.3.11.1 The Archive Extra Data Record is introduced in version 6.2
	 *    of the ZIP format specification.  This record MAY be used in support
	 *    of the Central Directory Encryption Feature implemented as part of
	 *    the Strong Encryption Specification as described in this document.
	 *    When present, this record MUST immediately precede the central
	 *    directory data structure.
	 */
	var ArchiveExtraDataRecord = function ArchiveExtraDataRecord(data) {
	     this.data = data;
	     if (this.data.readUInt32LE(0) !== 0x08064b50) {
	         throw new ApiError(ErrorCode.EINVAL, "Invalid archive extra data record signature: " + this.data.readUInt32LE(0));
	     }
	 };
	 ArchiveExtraDataRecord.prototype.length = function length () { return this.data.readUInt32LE(4); };
	 ArchiveExtraDataRecord.prototype.extraFieldData = function extraFieldData () { return this.data.slice(8, 8 + this.length()); };
	/**
	 * 4.3.13 Digital signature:
	 *
	 *      header signature                4 bytes  (0x05054b50)
	 *      size of data                    2 bytes
	 *      signature data (variable size)
	 *
	 *    With the introduction of the Central Directory Encryption
	 *    feature in version 6.2 of this specification, the Central
	 *    Directory Structure MAY be stored both compressed and encrypted.
	 *    Although not required, it is assumed when encrypting the
	 *    Central Directory Structure, that it will be compressed
	 *    for greater storage efficiency.  Information on the
	 *    Central Directory Encryption feature can be found in the section
	 *    describing the Strong Encryption Specification. The Digital
	 *    Signature record will be neither compressed nor encrypted.
	 */
	var DigitalSignature = function DigitalSignature(data) {
	     this.data = data;
	     if (this.data.readUInt32LE(0) !== 0x05054b50) {
	         throw new ApiError(ErrorCode.EINVAL, "Invalid digital signature signature: " + this.data.readUInt32LE(0));
	     }
	 };
	 DigitalSignature.prototype.size = function size () { return this.data.readUInt16LE(4); };
	 DigitalSignature.prototype.signatureData = function signatureData () { return this.data.slice(6, 6 + this.size()); };
	/**
	 * 4.3.12  Central directory structure:
	 *
	 *  central file header signature   4 bytes  (0x02014b50)
	 *  version made by                 2 bytes
	 *  version needed to extract       2 bytes
	 *  general purpose bit flag        2 bytes
	 *  compression method              2 bytes
	 *  last mod file time              2 bytes
	 *  last mod file date              2 bytes
	 *  crc-32                          4 bytes
	 *  compressed size                 4 bytes
	 *  uncompressed size               4 bytes
	 *  file name length                2 bytes
	 *  extra field length              2 bytes
	 *  file comment length             2 bytes
	 *  disk number start               2 bytes
	 *  internal file attributes        2 bytes
	 *  external file attributes        4 bytes
	 *  relative offset of local header 4 bytes
	 *
	 *  file name (variable size)
	 *  extra field (variable size)
	 *  file comment (variable size)
	 */
	var CentralDirectory = function CentralDirectory(zipData, data) {
	     this.zipData = zipData;
	     this.data = data;
	     // Sanity check.
	     if (this.data.readUInt32LE(0) !== 0x02014b50) {
	         throw new ApiError(ErrorCode.EINVAL, ("Invalid Zip file: Central directory record has invalid signature: " + (this.data.readUInt32LE(0))));
	     }
	     this._filename = this.produceFilename();
	 };
	 CentralDirectory.prototype.versionMadeBy = function versionMadeBy () { return this.data.readUInt16LE(4); };
	 CentralDirectory.prototype.versionNeeded = function versionNeeded () { return this.data.readUInt16LE(6); };
	 CentralDirectory.prototype.flag = function flag () { return this.data.readUInt16LE(8); };
	 CentralDirectory.prototype.compressionMethod = function compressionMethod () { return this.data.readUInt16LE(10); };
	 CentralDirectory.prototype.lastModFileTime = function lastModFileTime () {
	     // Time and date is in MS-DOS format.
	     return msdos2date(this.data.readUInt16LE(12), this.data.readUInt16LE(14));
	 };
	 CentralDirectory.prototype.rawLastModFileTime = function rawLastModFileTime () {
	     return this.data.readUInt32LE(12);
	 };
	 CentralDirectory.prototype.crc32 = function crc32 () { return this.data.readUInt32LE(16); };
	 CentralDirectory.prototype.compressedSize = function compressedSize () { return this.data.readUInt32LE(20); };
	 CentralDirectory.prototype.uncompressedSize = function uncompressedSize () { return this.data.readUInt32LE(24); };
	 CentralDirectory.prototype.fileNameLength = function fileNameLength () { return this.data.readUInt16LE(28); };
	 CentralDirectory.prototype.extraFieldLength = function extraFieldLength () { return this.data.readUInt16LE(30); };
	 CentralDirectory.prototype.fileCommentLength = function fileCommentLength () { return this.data.readUInt16LE(32); };
	 CentralDirectory.prototype.diskNumberStart = function diskNumberStart () { return this.data.readUInt16LE(34); };
	 CentralDirectory.prototype.internalAttributes = function internalAttributes () { return this.data.readUInt16LE(36); };
	 CentralDirectory.prototype.externalAttributes = function externalAttributes () { return this.data.readUInt32LE(38); };
	 CentralDirectory.prototype.headerRelativeOffset = function headerRelativeOffset () { return this.data.readUInt32LE(42); };
	 CentralDirectory.prototype.produceFilename = function produceFilename () {
	     /*
	       4.4.17.1 claims:
	       * All slashes are forward ('/') slashes.
	       * Filename doesn't begin with a slash.
	       * No drive letters or any nonsense like that.
	       * If filename is missing, the input came from standard input.
	    
	       Unfortunately, this isn't true in practice. Some Windows zip utilities use
	       a backslash here, but the correct Unix-style path in file headers.
	    
	       To avoid seeking all over the file to recover the known-good filenames
	       from file headers, we simply convert '/' to '\' here.
	     */
	     var fileName = safeToString(this.data, this.useUTF8(), 46, this.fileNameLength());
	     return fileName.replace(/\\/g, "/");
	 };
	 CentralDirectory.prototype.fileName = function fileName () {
	     return this._filename;
	 };
	 CentralDirectory.prototype.rawFileName = function rawFileName () {
	     return this.data.slice(46, 46 + this.fileNameLength());
	 };
	 CentralDirectory.prototype.extraField = function extraField () {
	     var start = 44 + this.fileNameLength();
	     return this.data.slice(start, start + this.extraFieldLength());
	 };
	 CentralDirectory.prototype.fileComment = function fileComment () {
	     var start = 46 + this.fileNameLength() + this.extraFieldLength();
	     return safeToString(this.data, this.useUTF8(), start, this.fileCommentLength());
	 };
	 CentralDirectory.prototype.rawFileComment = function rawFileComment () {
	     var start = 46 + this.fileNameLength() + this.extraFieldLength();
	     return this.data.slice(start, start + this.fileCommentLength());
	 };
	 CentralDirectory.prototype.totalSize = function totalSize () {
	     return 46 + this.fileNameLength() + this.extraFieldLength() + this.fileCommentLength();
	 };
	 CentralDirectory.prototype.isDirectory = function isDirectory () {
	     // NOTE: This assumes that the zip file implementation uses the lower byte
	     //    of external attributes for DOS attributes for
	     //    backwards-compatibility. This is not mandated, but appears to be
	     //    commonplace.
	     //    According to the spec, the layout of external attributes is
	     //    platform-dependent.
	     //    If that fails, we also check if the name of the file ends in '/',
	     //    which is what Java's ZipFile implementation does.
	     var fileName = this.fileName();
	     return (this.externalAttributes() & 0x10 ? true : false) || (fileName.charAt(fileName.length - 1) === '/');
	 };
	 CentralDirectory.prototype.isFile = function isFile () { return !this.isDirectory(); };
	 CentralDirectory.prototype.useUTF8 = function useUTF8 () { return (this.flag() & 0x800) === 0x800; };
	 CentralDirectory.prototype.isEncrypted = function isEncrypted () { return (this.flag() & 0x1) === 0x1; };
	 CentralDirectory.prototype.getFileData = function getFileData () {
	     // Need to grab the header before we can figure out where the actual
	     // compressed data starts.
	     var start = this.headerRelativeOffset();
	     var header = new FileHeader(this.zipData.slice(start));
	     return new FileData(header, this, this.zipData.slice(start + header.totalSize()));
	 };
	 CentralDirectory.prototype.getData = function getData () {
	     return this.getFileData().decompress();
	 };
	 CentralDirectory.prototype.getRawData = function getRawData () {
	     return this.getFileData().getRawData();
	 };
	 CentralDirectory.prototype.getStats = function getStats () {
	     return new Stats(FileType.FILE, this.uncompressedSize(), 0x16D, new Date(), this.lastModFileTime());
	 };
	/**
	 * 4.3.16: end of central directory record
	 *  end of central dir signature    4 bytes  (0x06054b50)
	 *  number of this disk             2 bytes
	 *  number of the disk with the
	 *  start of the central directory  2 bytes
	 *  total number of entries in the
	 *  central directory on this disk  2 bytes
	 *  total number of entries in
	 *  the central directory           2 bytes
	 *  size of the central directory   4 bytes
	 *  offset of start of central
	 *  directory with respect to
	 *  the starting disk number        4 bytes
	 *  .ZIP file comment length        2 bytes
	 *  .ZIP file comment       (variable size)
	 */
	var EndOfCentralDirectory = function EndOfCentralDirectory(data) {
	     this.data = data;
	     if (this.data.readUInt32LE(0) !== 0x06054b50) {
	         throw new ApiError(ErrorCode.EINVAL, ("Invalid Zip file: End of central directory record has invalid signature: " + (this.data.readUInt32LE(0))));
	     }
	 };
	 EndOfCentralDirectory.prototype.diskNumber = function diskNumber () { return this.data.readUInt16LE(4); };
	 EndOfCentralDirectory.prototype.cdDiskNumber = function cdDiskNumber () { return this.data.readUInt16LE(6); };
	 EndOfCentralDirectory.prototype.cdDiskEntryCount = function cdDiskEntryCount () { return this.data.readUInt16LE(8); };
	 EndOfCentralDirectory.prototype.cdTotalEntryCount = function cdTotalEntryCount () { return this.data.readUInt16LE(10); };
	 EndOfCentralDirectory.prototype.cdSize = function cdSize () { return this.data.readUInt32LE(12); };
	 EndOfCentralDirectory.prototype.cdOffset = function cdOffset () { return this.data.readUInt32LE(16); };
	 EndOfCentralDirectory.prototype.cdZipCommentLength = function cdZipCommentLength () { return this.data.readUInt16LE(20); };
	 EndOfCentralDirectory.prototype.cdZipComment = function cdZipComment () {
	     // Assuming UTF-8. The specification doesn't specify.
	     return safeToString(this.data, true, 22, this.cdZipCommentLength());
	 };
	 EndOfCentralDirectory.prototype.rawCdZipComment = function rawCdZipComment () {
	     return this.data.slice(22, 22 + this.cdZipCommentLength());
	 };
	/**
	 * Contains the table of contents of a Zip file.
	 */
	var ZipTOC = function ZipTOC(index, directoryEntries, eocd, data) {
	     this.index = index;
	     this.directoryEntries = directoryEntries;
	     this.eocd = eocd;
	     this.data = data;
	 };
	/**
	 * Zip file-backed filesystem
	 * Implemented according to the standard:
	 * http://www.pkware.com/documents/casestudies/APPNOTE.TXT
	 *
	 * While there are a few zip libraries for JavaScript (e.g. JSZip and zip.js),
	 * they are not a good match for BrowserFS. In particular, these libraries
	 * perform a lot of unneeded data copying, and eagerly decompress every file
	 * in the zip file upon loading to check the CRC32. They also eagerly decode
	 * strings. Furthermore, these libraries duplicate functionality already present
	 * in BrowserFS (e.g. UTF-8 decoding and binary data manipulation).
	 *
	 * This filesystem takes advantage of BrowserFS's Buffer implementation, which
	 * efficiently represents the zip file in memory (in both ArrayBuffer-enabled
	 * browsers *and* non-ArrayBuffer browsers), and which can neatly be 'sliced'
	 * without copying data. Each struct defined in the standard is represented with
	 * a buffer slice pointing to an offset in the zip file, and has getters for
	 * each field. As we anticipate that this data will not be read often, we choose
	 * not to store each struct field in the JavaScript object; instead, to reduce
	 * memory consumption, we retrieve it directly from the binary data each time it
	 * is requested.
	 *
	 * When the filesystem is instantiated, we determine the directory structure
	 * of the zip file as quickly as possible. We lazily decompress and check the
	 * CRC32 of files. We do not cache decompressed files; if this is a desired
	 * feature, it is best implemented as a generic file system wrapper that can
	 * cache data from arbitrary file systems.
	 *
	 * For inflation, we use `pako`'s implementation:
	 * https://github.com/nodeca/pako
	 *
	 * Current limitations:
	 * * No encryption.
	 * * No ZIP64 support.
	 * * Read-only.
	 *   Write support would require that we:
	 *   - Keep track of changed/new files.
	 *   - Compress changed files, and generate appropriate metadata for each.
	 *   - Update file offsets for other files in the zip file.
	 *   - Stream it out to a location.
	 *   This isn't that bad, so we might do this at a later date.
	 */
	var ZipFS = (function (SynchronousFileSystem$$1) {
	   function ZipFS(input, name, deprecateMsg) {
	        if ( name === void 0 ) name = '';
	        if ( deprecateMsg === void 0 ) deprecateMsg = true;
	
	        SynchronousFileSystem$$1.call(this);
	        this.name = name;
	        this._index = new FileIndex();
	        this._directoryEntries = [];
	        this._eocd = null;
	        deprecationMessage(deprecateMsg, ZipFS.Name, { zipData: "zip data as a Buffer", name: name });
	        if (input instanceof ZipTOC) {
	            this._index = input.index;
	            this._directoryEntries = input.directoryEntries;
	            this._eocd = input.eocd;
	            this.data = input.data;
	        }
	        else {
	            this.data = input;
	            this.populateIndex();
	        }
	    }
	
	   if ( SynchronousFileSystem$$1 ) ZipFS.__proto__ = SynchronousFileSystem$$1;
	   ZipFS.prototype = Object.create( SynchronousFileSystem$$1 && SynchronousFileSystem$$1.prototype );
	   ZipFS.prototype.constructor = ZipFS;
	    /**
	     * Constructs a ZipFS instance with the given options.
	     */
	    ZipFS.Create = function Create (opts, cb) {
	        try {
	            ZipFS.computeIndex(opts.zipData, function (zipTOC) {
	                var fs = new ZipFS(zipTOC, opts.name, false);
	                cb(null, fs);
	            }, false);
	        }
	        catch (e) {
	            cb(e);
	        }
	    };
	    ZipFS.isAvailable = function isAvailable () { return true; };
	    ZipFS.RegisterDecompressionMethod = function RegisterDecompressionMethod (m, fcn) {
	        decompressionMethods[m] = fcn;
	    };
	    /**
	     * **Deprecated. Please use ZipFS.Create() method instead.**
	     */
	    ZipFS.computeIndex = function computeIndex (data, cb, deprecateMsg) {
	        if ( deprecateMsg === void 0 ) deprecateMsg = true;
	
	        // TODO: Refactor to plumb errors through. Right now, they throw.
	        if (deprecateMsg) {
	            console.warn("[ZipFS] ZipFS.computeIndex is now deprecated, and will be removed in the next major release. Please update your code to use 'ZipFS.Create({ zipData: zip file as a Buffer}, cb)' instead.");
	        }
	        var index = new FileIndex();
	        var eocd = ZipFS.getEOCD(data);
	        if (eocd.diskNumber() !== eocd.cdDiskNumber()) {
	            throw new ApiError(ErrorCode.EINVAL, "ZipFS does not support spanned zip files.");
	        }
	        var cdPtr = eocd.cdOffset();
	        if (cdPtr === 0xFFFFFFFF) {
	            throw new ApiError(ErrorCode.EINVAL, "ZipFS does not support Zip64.");
	        }
	        var cdEnd = cdPtr + eocd.cdSize();
	        ZipFS.computeIndexResponsive(data, index, cdPtr, cdEnd, cb, [], eocd);
	    };
	    /**
	     * Locates the end of central directory record at the end of the file.
	     * Throws an exception if it cannot be found.
	     */
	    ZipFS.getEOCD = function getEOCD (data) {
	        // Unfortunately, the comment is variable size and up to 64K in size.
	        // We assume that the magic signature does not appear in the comment, and
	        // in the bytes between the comment and the signature. Other ZIP
	        // implementations make this same assumption, since the alternative is to
	        // read thread every entry in the file to get to it. :(
	        // These are *negative* offsets from the end of the file.
	        var startOffset = 22;
	        var endOffset = Math.min(startOffset + 0xFFFF, data.length - 1);
	        // There's not even a byte alignment guarantee on the comment so we need to
	        // search byte by byte. *grumble grumble*
	        for (var i = startOffset; i < endOffset; i++) {
	            // Magic number: EOCD Signature
	            if (data.readUInt32LE(data.length - i) === 0x06054b50) {
	                return new EndOfCentralDirectory(data.slice(data.length - i));
	            }
	        }
	        throw new ApiError(ErrorCode.EINVAL, "Invalid ZIP file: Could not locate End of Central Directory signature.");
	    };
	    ZipFS.addToIndex = function addToIndex (cd, index) {
	        // Paths must be absolute, yet zip file paths are always relative to the
	        // zip root. So we append '/' and call it a day.
	        var filename = cd.fileName();
	        if (filename.charAt(0) === '/') {
	            throw new Error("WHY IS THIS ABSOLUTE");
	        }
	        // XXX: For the file index, strip the trailing '/'.
	        if (filename.charAt(filename.length - 1) === '/') {
	            filename = filename.substr(0, filename.length - 1);
	        }
	        if (cd.isDirectory()) {
	            index.addPathFast('/' + filename, new DirInode(cd));
	        }
	        else {
	            index.addPathFast('/' + filename, new FileInode(cd));
	        }
	    };
	    ZipFS.computeIndexResponsive = function computeIndexResponsive (data, index, cdPtr, cdEnd, cb, cdEntries, eocd) {
	        if (cdPtr < cdEnd) {
	            var count = 0;
	            while (count++ < 200 && cdPtr < cdEnd) {
	                var cd = new CentralDirectory(data, data.slice(cdPtr));
	                ZipFS.addToIndex(cd, index);
	                cdPtr += cd.totalSize();
	                cdEntries.push(cd);
	            }
	            setImmediate$3(function () {
	                ZipFS.computeIndexResponsive(data, index, cdPtr, cdEnd, cb, cdEntries, eocd);
	            });
	        }
	        else {
	            cb(new ZipTOC(index, cdEntries, eocd, data));
	        }
	    };
	    ZipFS.prototype.getName = function getName () {
	        return ZipFS.Name + (this.name !== '' ? (" " + (this.name)) : '');
	    };
	    /**
	     * Get the CentralDirectory object for the given path.
	     */
	    ZipFS.prototype.getCentralDirectoryEntry = function getCentralDirectoryEntry (path$$1) {
	        var inode = this._index.getInode(path$$1);
	        if (inode === null) {
	            throw ApiError.ENOENT(path$$1);
	        }
	        if (isFileInode(inode)) {
	            return inode.getData();
	        }
	        else if (isDirInode(inode)) {
	            return inode.getData();
	        }
	        else {
	            // Should never occur.
	            throw ApiError.EPERM(("Invalid inode: " + inode));
	        }
	    };
	    ZipFS.prototype.getCentralDirectoryEntryAt = function getCentralDirectoryEntryAt (index) {
	        var dirEntry = this._directoryEntries[index];
	        if (!dirEntry) {
	            throw new RangeError(("Invalid directory index: " + index + "."));
	        }
	        return dirEntry;
	    };
	    ZipFS.prototype.getNumberOfCentralDirectoryEntries = function getNumberOfCentralDirectoryEntries () {
	        return this._directoryEntries.length;
	    };
	    ZipFS.prototype.getEndOfCentralDirectory = function getEndOfCentralDirectory () {
	        return this._eocd;
	    };
	    ZipFS.prototype.diskSpace = function diskSpace (path$$1, cb) {
	        // Read-only file system.
	        cb(this.data.length, 0);
	    };
	    ZipFS.prototype.isReadOnly = function isReadOnly () {
	        return true;
	    };
	    ZipFS.prototype.supportsLinks = function supportsLinks () {
	        return false;
	    };
	    ZipFS.prototype.supportsProps = function supportsProps () {
	        return false;
	    };
	    ZipFS.prototype.supportsSynch = function supportsSynch () {
	        return true;
	    };
	    ZipFS.prototype.statSync = function statSync (path$$1, isLstat) {
	        var inode = this._index.getInode(path$$1);
	        if (inode === null) {
	            throw ApiError.ENOENT(path$$1);
	        }
	        var stats;
	        if (isFileInode(inode)) {
	            stats = inode.getData().getStats();
	        }
	        else if (isDirInode(inode)) {
	            stats = inode.getStats();
	        }
	        else {
	            throw new ApiError(ErrorCode.EINVAL, "Invalid inode.");
	        }
	        return stats;
	    };
	    ZipFS.prototype.openSync = function openSync (path$$1, flags, mode) {
	        // INVARIANT: Cannot write to RO file systems.
	        if (flags.isWriteable()) {
	            throw new ApiError(ErrorCode.EPERM, path$$1);
	        }
	        // Check if the path exists, and is a file.
	        var inode = this._index.getInode(path$$1);
	        if (!inode) {
	            throw ApiError.ENOENT(path$$1);
	        }
	        else if (isFileInode(inode)) {
	            var cdRecord = inode.getData();
	            var stats = cdRecord.getStats();
	            switch (flags.pathExistsAction()) {
	                case ActionType.THROW_EXCEPTION:
	                case ActionType.TRUNCATE_FILE:
	                    throw ApiError.EEXIST(path$$1);
	                case ActionType.NOP:
	                    return new NoSyncFile(this, path$$1, flags, stats, cdRecord.getData());
	                default:
	                    throw new ApiError(ErrorCode.EINVAL, 'Invalid FileMode object.');
	            }
	        }
	        else {
	            throw ApiError.EISDIR(path$$1);
	        }
	    };
	    ZipFS.prototype.readdirSync = function readdirSync (path$$1) {
	        // Check if it exists.
	        var inode = this._index.getInode(path$$1);
	        if (!inode) {
	            throw ApiError.ENOENT(path$$1);
	        }
	        else if (isDirInode(inode)) {
	            return inode.getListing();
	        }
	        else {
	            throw ApiError.ENOTDIR(path$$1);
	        }
	    };
	    /**
	     * Specially-optimized readfile.
	     */
	    ZipFS.prototype.readFileSync = function readFileSync (fname, encoding, flag) {
	        // Get file.
	        var fd = this.openSync(fname, flag, 0x1a4);
	        try {
	            var fdCast = fd;
	            var fdBuff = fdCast.getBuffer();
	            if (encoding === null) {
	                return copyingSlice(fdBuff);
	            }
	            return fdBuff.toString(encoding);
	        }
	        finally {
	            fd.closeSync();
	        }
	    };
	    ZipFS.prototype.populateIndex = function populateIndex () {
	        var this$1 = this;
	
	        var eocd = this._eocd = ZipFS.getEOCD(this.data);
	        if (eocd.diskNumber() !== eocd.cdDiskNumber()) {
	            throw new ApiError(ErrorCode.EINVAL, "ZipFS does not support spanned zip files.");
	        }
	        var cdPtr = eocd.cdOffset();
	        if (cdPtr === 0xFFFFFFFF) {
	            throw new ApiError(ErrorCode.EINVAL, "ZipFS does not support Zip64.");
	        }
	        var cdEnd = cdPtr + eocd.cdSize();
	        while (cdPtr < cdEnd) {
	            var cd = new CentralDirectory(this$1.data, this$1.data.slice(cdPtr));
	            cdPtr += cd.totalSize();
	            ZipFS.addToIndex(cd, this$1._index);
	            this$1._directoryEntries.push(cd);
	        }
	    };
	
	   return ZipFS;
	}(SynchronousFileSystem));
	
	ZipFS.Name = "ZipFS";
	ZipFS.Options = {
	    zipData: {
	        type: "object",
	        description: "The zip file as a Buffer object.",
	        validator: bufferValidator
	    },
	    name: {
	        type: "string",
	        optional: true,
	        description: "The name of the zip file (optional)."
	    }
	};
	ZipFS.CompressionMethod = CompressionMethod;
	ZipFS.RegisterDecompressionMethod(CompressionMethod.DEFLATE, function (data, compressedSize, uncompressedSize) {
	    return arrayish2Buffer(inflateRaw(data.slice(0, compressedSize), { chunkSize: uncompressedSize }));
	});
	ZipFS.RegisterDecompressionMethod(CompressionMethod.STORED, function (data, compressedSize, uncompressedSize) {
	    return copyingSlice(data, 0, uncompressedSize);
	});
	
	/**
	 * @hidden
	 */
	var rockRidgeIdentifier = "IEEE_P1282";
	/**
	 * @hidden
	 */
	function getASCIIString(data, startIndex, length) {
	    return data.toString('ascii', startIndex, startIndex + length).trim();
	}
	/**
	 * @hidden
	 */
	function getJolietString(data, startIndex, length) {
	    if (length === 1) {
	        // Special: Root, parent, current directory are still a single byte.
	        return String.fromCharCode(data[startIndex]);
	    }
	    // UTF16-BE, which isn't natively supported by NodeJS Buffers.
	    // Length should be even, but pessimistically floor just in case.
	    var pairs = Math.floor(length / 2);
	    var chars = new Array(pairs);
	    for (var i = 0; i < pairs; i++) {
	        var pos = startIndex + (i << 1);
	        chars[i] = String.fromCharCode(data[pos + 1] | (data[pos] << 8));
	    }
	    return chars.join('');
	}
	/**
	 * @hidden
	 */
	function getDate(data, startIndex) {
	    var year = parseInt(getASCIIString(data, startIndex, 4), 10);
	    var mon = parseInt(getASCIIString(data, startIndex + 4, 2), 10);
	    var day = parseInt(getASCIIString(data, startIndex + 6, 2), 10);
	    var hour = parseInt(getASCIIString(data, startIndex + 8, 2), 10);
	    var min = parseInt(getASCIIString(data, startIndex + 10, 2), 10);
	    var sec = parseInt(getASCIIString(data, startIndex + 12, 2), 10);
	    var hundrethsSec = parseInt(getASCIIString(data, startIndex + 14, 2), 10);
	    // Last is a time-zone offset, but JavaScript dates don't support time zones well.
	    return new Date(year, mon, day, hour, min, sec, hundrethsSec * 100);
	}
	/**
	 * @hidden
	 */
	function getShortFormDate(data, startIndex) {
	    var yearsSince1900 = data[startIndex];
	    var month = data[startIndex + 1];
	    var day = data[startIndex + 2];
	    var hour = data[startIndex + 3];
	    var minute = data[startIndex + 4];
	    var second = data[startIndex + 5];
	    // JavaScript's Date support isn't so great; ignore timezone.
	    // const offsetFromGMT = this._data[24];
	    return new Date(yearsSince1900, month - 1, day, hour, minute, second);
	}
	/**
	 * @hidden
	 */
	function constructSystemUseEntry(bigData, i) {
	    var data = bigData.slice(i);
	    var sue = new SystemUseEntry(data);
	    switch (sue.signatureWord()) {
	        case 17221 /* CE */:
	            return new CEEntry(data);
	        case 20548 /* PD */:
	            return new PDEntry(data);
	        case 21328 /* SP */:
	            return new SPEntry(data);
	        case 21332 /* ST */:
	            return new STEntry(data);
	        case 17746 /* ER */:
	            return new EREntry(data);
	        case 17747 /* ES */:
	            return new ESEntry(data);
	        case 20568 /* PX */:
	            return new PXEntry(data);
	        case 20558 /* PN */:
	            return new PNEntry(data);
	        case 21324 /* SL */:
	            return new SLEntry(data);
	        case 20045 /* NM */:
	            return new NMEntry(data);
	        case 17228 /* CL */:
	            return new CLEntry(data);
	        case 20556 /* PL */:
	            return new PLEntry(data);
	        case 21061 /* RE */:
	            return new REEntry(data);
	        case 21574 /* TF */:
	            return new TFEntry(data);
	        case 21318 /* SF */:
	            return new SFEntry(data);
	        case 21074 /* RR */:
	            return new RREntry(data);
	        default:
	            return sue;
	    }
	}
	/**
	 * @hidden
	 */
	function constructSystemUseEntries(data, i, len, isoData) {
	    // If the remaining allocated space following the last recorded System Use Entry in a System
	    // Use field or Continuation Area is less than four bytes long, it cannot contain a System
	    // Use Entry and shall be ignored
	    len = len - 4;
	    var entries = new Array();
	    while (i < len) {
	        var entry = constructSystemUseEntry(data, i);
	        var length = entry.length();
	        if (length === 0) {
	            // Invalid SU section; prevent infinite loop.
	            return entries;
	        }
	        i += length;
	        if (entry instanceof STEntry) {
	            // ST indicates the end of entries.
	            break;
	        }
	        if (entry instanceof CEEntry) {
	            entries = entries.concat(entry.getEntries(isoData));
	        }
	        else {
	            entries.push(entry);
	        }
	    }
	    return entries;
	}
	/**
	 * @hidden
	 */
	var VolumeDescriptor = function VolumeDescriptor(data) {
	    this._data = data;
	};
	VolumeDescriptor.prototype.type = function type () {
	    return this._data[0];
	};
	VolumeDescriptor.prototype.standardIdentifier = function standardIdentifier () {
	    return getASCIIString(this._data, 1, 5);
	};
	VolumeDescriptor.prototype.version = function version () {
	    return this._data[6];
	};
	VolumeDescriptor.prototype.data = function data () {
	    return this._data.slice(7, 2048);
	};
	/**
	 * @hidden
	 */
	var PrimaryOrSupplementaryVolumeDescriptor = (function (VolumeDescriptor) {
	    function PrimaryOrSupplementaryVolumeDescriptor(data) {
	        VolumeDescriptor.call(this, data);
	        this._root = null;
	    }
	
	    if ( VolumeDescriptor ) PrimaryOrSupplementaryVolumeDescriptor.__proto__ = VolumeDescriptor;
	    PrimaryOrSupplementaryVolumeDescriptor.prototype = Object.create( VolumeDescriptor && VolumeDescriptor.prototype );
	    PrimaryOrSupplementaryVolumeDescriptor.prototype.constructor = PrimaryOrSupplementaryVolumeDescriptor;
	    PrimaryOrSupplementaryVolumeDescriptor.prototype.systemIdentifier = function systemIdentifier () {
	        return this._getString32(8);
	    };
	    PrimaryOrSupplementaryVolumeDescriptor.prototype.volumeIdentifier = function volumeIdentifier () {
	        return this._getString32(40);
	    };
	    PrimaryOrSupplementaryVolumeDescriptor.prototype.volumeSpaceSize = function volumeSpaceSize () {
	        return this._data.readUInt32LE(80);
	    };
	    PrimaryOrSupplementaryVolumeDescriptor.prototype.volumeSetSize = function volumeSetSize () {
	        return this._data.readUInt16LE(120);
	    };
	    PrimaryOrSupplementaryVolumeDescriptor.prototype.volumeSequenceNumber = function volumeSequenceNumber () {
	        return this._data.readUInt16LE(124);
	    };
	    PrimaryOrSupplementaryVolumeDescriptor.prototype.logicalBlockSize = function logicalBlockSize () {
	        return this._data.readUInt16LE(128);
	    };
	    PrimaryOrSupplementaryVolumeDescriptor.prototype.pathTableSize = function pathTableSize () {
	        return this._data.readUInt32LE(132);
	    };
	    PrimaryOrSupplementaryVolumeDescriptor.prototype.locationOfTypeLPathTable = function locationOfTypeLPathTable () {
	        return this._data.readUInt32LE(140);
	    };
	    PrimaryOrSupplementaryVolumeDescriptor.prototype.locationOfOptionalTypeLPathTable = function locationOfOptionalTypeLPathTable () {
	        return this._data.readUInt32LE(144);
	    };
	    PrimaryOrSupplementaryVolumeDescriptor.prototype.locationOfTypeMPathTable = function locationOfTypeMPathTable () {
	        return this._data.readUInt32BE(148);
	    };
	    PrimaryOrSupplementaryVolumeDescriptor.prototype.locationOfOptionalTypeMPathTable = function locationOfOptionalTypeMPathTable () {
	        return this._data.readUInt32BE(152);
	    };
	    PrimaryOrSupplementaryVolumeDescriptor.prototype.rootDirectoryEntry = function rootDirectoryEntry (isoData) {
	        if (this._root === null) {
	            this._root = this._constructRootDirectoryRecord(this._data.slice(156));
	            this._root.rootCheckForRockRidge(isoData);
	        }
	        return this._root;
	    };
	    PrimaryOrSupplementaryVolumeDescriptor.prototype.volumeSetIdentifier = function volumeSetIdentifier () {
	        return this._getString(190, 128);
	    };
	    PrimaryOrSupplementaryVolumeDescriptor.prototype.publisherIdentifier = function publisherIdentifier () {
	        return this._getString(318, 128);
	    };
	    PrimaryOrSupplementaryVolumeDescriptor.prototype.dataPreparerIdentifier = function dataPreparerIdentifier () {
	        return this._getString(446, 128);
	    };
	    PrimaryOrSupplementaryVolumeDescriptor.prototype.applicationIdentifier = function applicationIdentifier () {
	        return this._getString(574, 128);
	    };
	    PrimaryOrSupplementaryVolumeDescriptor.prototype.copyrightFileIdentifier = function copyrightFileIdentifier () {
	        return this._getString(702, 38);
	    };
	    PrimaryOrSupplementaryVolumeDescriptor.prototype.abstractFileIdentifier = function abstractFileIdentifier () {
	        return this._getString(740, 36);
	    };
	    PrimaryOrSupplementaryVolumeDescriptor.prototype.bibliographicFileIdentifier = function bibliographicFileIdentifier () {
	        return this._getString(776, 37);
	    };
	    PrimaryOrSupplementaryVolumeDescriptor.prototype.volumeCreationDate = function volumeCreationDate () {
	        return getDate(this._data, 813);
	    };
	    PrimaryOrSupplementaryVolumeDescriptor.prototype.volumeModificationDate = function volumeModificationDate () {
	        return getDate(this._data, 830);
	    };
	    PrimaryOrSupplementaryVolumeDescriptor.prototype.volumeExpirationDate = function volumeExpirationDate () {
	        return getDate(this._data, 847);
	    };
	    PrimaryOrSupplementaryVolumeDescriptor.prototype.volumeEffectiveDate = function volumeEffectiveDate () {
	        return getDate(this._data, 864);
	    };
	    PrimaryOrSupplementaryVolumeDescriptor.prototype.fileStructureVersion = function fileStructureVersion () {
	        return this._data[881];
	    };
	    PrimaryOrSupplementaryVolumeDescriptor.prototype.applicationUsed = function applicationUsed () {
	        return this._data.slice(883, 883 + 512);
	    };
	    PrimaryOrSupplementaryVolumeDescriptor.prototype.reserved = function reserved () {
	        return this._data.slice(1395, 1395 + 653);
	    };
	    PrimaryOrSupplementaryVolumeDescriptor.prototype._getString32 = function _getString32 (idx) {
	        return this._getString(idx, 32);
	    };
	
	    return PrimaryOrSupplementaryVolumeDescriptor;
	}(VolumeDescriptor));
	/**
	 * @hidden
	 */
	var PrimaryVolumeDescriptor = (function (PrimaryOrSupplementaryVolumeDescriptor) {
	    function PrimaryVolumeDescriptor(data) {
	        PrimaryOrSupplementaryVolumeDescriptor.call(this, data);
	        if (this.type() !== 1 /* PrimaryVolumeDescriptor */) {
	            throw new ApiError(ErrorCode.EIO, "Invalid primary volume descriptor.");
	        }
	    }
	
	    if ( PrimaryOrSupplementaryVolumeDescriptor ) PrimaryVolumeDescriptor.__proto__ = PrimaryOrSupplementaryVolumeDescriptor;
	    PrimaryVolumeDescriptor.prototype = Object.create( PrimaryOrSupplementaryVolumeDescriptor && PrimaryOrSupplementaryVolumeDescriptor.prototype );
	    PrimaryVolumeDescriptor.prototype.constructor = PrimaryVolumeDescriptor;
	    PrimaryVolumeDescriptor.prototype.name = function name () {
	        return "ISO9660";
	    };
	    PrimaryVolumeDescriptor.prototype._constructRootDirectoryRecord = function _constructRootDirectoryRecord (data) {
	        return new ISODirectoryRecord(data, -1);
	    };
	    PrimaryVolumeDescriptor.prototype._getString = function _getString (idx, len) {
	        return this._getString(idx, len);
	    };
	
	    return PrimaryVolumeDescriptor;
	}(PrimaryOrSupplementaryVolumeDescriptor));
	/**
	 * @hidden
	 */
	var SupplementaryVolumeDescriptor = (function (PrimaryOrSupplementaryVolumeDescriptor) {
	    function SupplementaryVolumeDescriptor(data) {
	        PrimaryOrSupplementaryVolumeDescriptor.call(this, data);
	        if (this.type() !== 2 /* SupplementaryVolumeDescriptor */) {
	            throw new ApiError(ErrorCode.EIO, "Invalid supplementary volume descriptor.");
	        }
	        var escapeSequence = this.escapeSequence();
	        var third = escapeSequence[2];
	        // Third character identifies what 'level' of the UCS specification to follow.
	        // We ignore it.
	        if (escapeSequence[0] !== 0x25 || escapeSequence[1] !== 0x2F ||
	            (third !== 0x40 && third !== 0x43 && third !== 0x45)) {
	            throw new ApiError(ErrorCode.EIO, ("Unrecognized escape sequence for SupplementaryVolumeDescriptor: " + (escapeSequence.toString())));
	        }
	    }
	
	    if ( PrimaryOrSupplementaryVolumeDescriptor ) SupplementaryVolumeDescriptor.__proto__ = PrimaryOrSupplementaryVolumeDescriptor;
	    SupplementaryVolumeDescriptor.prototype = Object.create( PrimaryOrSupplementaryVolumeDescriptor && PrimaryOrSupplementaryVolumeDescriptor.prototype );
	    SupplementaryVolumeDescriptor.prototype.constructor = SupplementaryVolumeDescriptor;
	    SupplementaryVolumeDescriptor.prototype.name = function name () {
	        return "Joliet";
	    };
	    SupplementaryVolumeDescriptor.prototype.escapeSequence = function escapeSequence () {
	        return this._data.slice(88, 120);
	    };
	    SupplementaryVolumeDescriptor.prototype._constructRootDirectoryRecord = function _constructRootDirectoryRecord (data) {
	        return new JolietDirectoryRecord(data, -1);
	    };
	    SupplementaryVolumeDescriptor.prototype._getString = function _getString (idx, len) {
	        return getJolietString(this._data, idx, len);
	    };
	
	    return SupplementaryVolumeDescriptor;
	}(PrimaryOrSupplementaryVolumeDescriptor));
	/**
	 * @hidden
	 */
	var DirectoryRecord = function DirectoryRecord(data, rockRidgeOffset) {
	    this._suEntries = null;
	    this._fileOrDir = null;
	    this._data = data;
	    this._rockRidgeOffset = rockRidgeOffset;
	};
	DirectoryRecord.prototype.hasRockRidge = function hasRockRidge () {
	    return this._rockRidgeOffset > -1;
	};
	DirectoryRecord.prototype.getRockRidgeOffset = function getRockRidgeOffset () {
	    return this._rockRidgeOffset;
	};
	/**
	 * !!ONLY VALID ON ROOT NODE!!
	 * Checks if Rock Ridge is enabled, and sets the offset.
	 */
	DirectoryRecord.prototype.rootCheckForRockRidge = function rootCheckForRockRidge (isoData) {
	    var dir = this.getDirectory(isoData);
	    this._rockRidgeOffset = dir.getDotEntry(isoData)._getRockRidgeOffset(isoData);
	    if (this._rockRidgeOffset > -1) {
	        // Wipe out directory. Start over with RR knowledge.
	        this._fileOrDir = null;
	    }
	};
	DirectoryRecord.prototype.length = function length () {
	    return this._data[0];
	};
	DirectoryRecord.prototype.extendedAttributeRecordLength = function extendedAttributeRecordLength () {
	    return this._data[1];
	};
	DirectoryRecord.prototype.lba = function lba () {
	    return this._data.readUInt32LE(2) * 2048;
	};
	DirectoryRecord.prototype.dataLength = function dataLength () {
	    return this._data.readUInt32LE(10);
	};
	DirectoryRecord.prototype.recordingDate = function recordingDate () {
	    return getShortFormDate(this._data, 18);
	};
	DirectoryRecord.prototype.fileFlags = function fileFlags () {
	    return this._data[25];
	};
	DirectoryRecord.prototype.fileUnitSize = function fileUnitSize () {
	    return this._data[26];
	};
	DirectoryRecord.prototype.interleaveGapSize = function interleaveGapSize () {
	    return this._data[27];
	};
	DirectoryRecord.prototype.volumeSequenceNumber = function volumeSequenceNumber () {
	    return this._data.readUInt16LE(28);
	};
	DirectoryRecord.prototype.identifier = function identifier () {
	    return this._getString(33, this._data[32]);
	};
	DirectoryRecord.prototype.fileName = function fileName (isoData) {
	    if (this.hasRockRidge()) {
	        var fn = this._rockRidgeFilename(isoData);
	        if (fn !== null) {
	            return fn;
	        }
	    }
	    var ident = this.identifier();
	    if (this.isDirectory(isoData)) {
	        return ident;
	    }
	    // Files:
	    // - MUST have 0x2E (.) separating the name from the extension
	    // - MUST have 0x3B (;) separating the file name and extension from the version
	    // Gets expanded to two-byte char in Unicode directory records.
	    var versionSeparator = ident.indexOf(';');
	    if (versionSeparator === -1) {
	        // Some Joliet filenames lack the version separator, despite the standard
	        // specifying that it should be there.
	        return ident;
	    }
	    else if (ident[versionSeparator - 1] === '.') {
	        // Empty extension. Do not include '.' in the filename.
	        return ident.slice(0, versionSeparator - 1);
	    }
	    else {
	        // Include up to version separator.
	        return ident.slice(0, versionSeparator);
	    }
	};
	DirectoryRecord.prototype.isDirectory = function isDirectory (isoData) {
	    var rv = !!(this.fileFlags() & 2 /* Directory */);
	    // If it lacks the Directory flag, it may still be a directory if we've exceeded the directory
	    // depth limit. Rock Ridge marks these as files and adds a special attribute.
	    if (!rv && this.hasRockRidge()) {
	        rv = this.getSUEntries(isoData).filter(function (e) { return e instanceof CLEntry; }).length > 0;
	    }
	    return rv;
	};
	DirectoryRecord.prototype.isSymlink = function isSymlink (isoData) {
	    return this.hasRockRidge() && this.getSUEntries(isoData).filter(function (e) { return e instanceof SLEntry; }).length > 0;
	};
	DirectoryRecord.prototype.getSymlinkPath = function getSymlinkPath (isoData) {
	    var p = "";
	    var entries = this.getSUEntries(isoData);
	    var getStr = this._getGetString();
	    for (var i = 0, list = entries; i < list.length; i += 1) {
	        var entry = list[i];
	
	            if (entry instanceof SLEntry) {
	            var components = entry.componentRecords();
	            for (var i$1 = 0, list$1 = components; i$1 < list$1.length; i$1 += 1) {
	                var component = list$1[i$1];
	
	                    var flags = component.flags();
	                if (flags & 2 /* CURRENT */) {
	                    p += "./";
	                }
	                else if (flags & 4 /* PARENT */) {
	                    p += "../";
	                }
	                else if (flags & 8 /* ROOT */) {
	                    p += "/";
	                }
	                else {
	                    p += component.content(getStr);
	                    if (!(flags & 1 /* CONTINUE */)) {
	                        p += '/';
	                    }
	                }
	            }
	            if (!entry.continueFlag()) {
	                // We are done with this link.
	                break;
	            }
	        }
	    }
	    if (p.length > 1 && p[p.length - 1] === '/') {
	        // Trim trailing '/'.
	        return p.slice(0, p.length - 1);
	    }
	    else {
	        return p;
	    }
	};
	DirectoryRecord.prototype.getFile = function getFile (isoData) {
	    if (this.isDirectory(isoData)) {
	        throw new Error("Tried to get a File from a directory.");
	    }
	    if (this._fileOrDir === null) {
	        this._fileOrDir = isoData.slice(this.lba(), this.lba() + this.dataLength());
	    }
	    return this._fileOrDir;
	};
	DirectoryRecord.prototype.getDirectory = function getDirectory (isoData) {
	    if (!this.isDirectory(isoData)) {
	        throw new Error("Tried to get a Directory from a file.");
	    }
	    if (this._fileOrDir === null) {
	        this._fileOrDir = this._constructDirectory(isoData);
	    }
	    return this._fileOrDir;
	};
	DirectoryRecord.prototype.getSUEntries = function getSUEntries (isoData) {
	    if (!this._suEntries) {
	        this._constructSUEntries(isoData);
	    }
	    return this._suEntries;
	};
	DirectoryRecord.prototype._rockRidgeFilename = function _rockRidgeFilename (isoData) {
	    var nmEntries = this.getSUEntries(isoData).filter(function (e) { return e instanceof NMEntry; });
	    if (nmEntries.length === 0 || nmEntries[0].flags() & (2 /* CURRENT */ | 4 /* PARENT */)) {
	        return null;
	    }
	    var str = '';
	    var getString = this._getGetString();
	    for (var i = 0, list = nmEntries; i < list.length; i += 1) {
	        var e = list[i];
	
	            str += e.name(getString);
	        if (!(e.flags() & 1 /* CONTINUE */)) {
	            break;
	        }
	    }
	    return str;
	};
	DirectoryRecord.prototype._constructSUEntries = function _constructSUEntries (isoData) {
	    var i = 33 + this._data[32];
	    if (i % 2 === 1) {
	        // Skip padding field.
	        i++;
	    }
	    i += this._rockRidgeOffset;
	    this._suEntries = constructSystemUseEntries(this._data, i, this.length(), isoData);
	};
	/**
	 * !!ONLY VALID ON FIRST ENTRY OF ROOT DIRECTORY!!
	 * Returns -1 if rock ridge is not enabled. Otherwise, returns the offset
	 * at which system use fields begin.
	 */
	DirectoryRecord.prototype._getRockRidgeOffset = function _getRockRidgeOffset (isoData) {
	    // In the worst case, we get some garbage SU entries.
	    // Fudge offset to 0 before proceeding.
	    this._rockRidgeOffset = 0;
	    var suEntries = this.getSUEntries(isoData);
	    if (suEntries.length > 0) {
	        var spEntry = suEntries[0];
	        if (spEntry instanceof SPEntry && spEntry.checkBytesPass()) {
	            // SUSP is in use.
	            for (var i = 1; i < suEntries.length; i++) {
	                var entry = suEntries[i];
	                if (entry instanceof RREntry || (entry instanceof EREntry && entry.extensionIdentifier() === rockRidgeIdentifier)) {
	                    // Rock Ridge is in use!
	                    return spEntry.bytesSkipped();
	                }
	            }
	        }
	    }
	    // Failed.
	    this._rockRidgeOffset = -1;
	    return -1;
	};
	/**
	 * @hidden
	 */
	var ISODirectoryRecord = (function (DirectoryRecord) {
	    function ISODirectoryRecord(data, rockRidgeOffset) {
	        DirectoryRecord.call(this, data, rockRidgeOffset);
	    }
	
	    if ( DirectoryRecord ) ISODirectoryRecord.__proto__ = DirectoryRecord;
	    ISODirectoryRecord.prototype = Object.create( DirectoryRecord && DirectoryRecord.prototype );
	    ISODirectoryRecord.prototype.constructor = ISODirectoryRecord;
	    ISODirectoryRecord.prototype._getString = function _getString (i, len) {
	        return getASCIIString(this._data, i, len);
	    };
	    ISODirectoryRecord.prototype._constructDirectory = function _constructDirectory (isoData) {
	        return new ISODirectory(this, isoData);
	    };
	    ISODirectoryRecord.prototype._getGetString = function _getGetString () {
	        return getASCIIString;
	    };
	
	    return ISODirectoryRecord;
	}(DirectoryRecord));
	/**
	 * @hidden
	 */
	var JolietDirectoryRecord = (function (DirectoryRecord) {
	    function JolietDirectoryRecord(data, rockRidgeOffset) {
	        DirectoryRecord.call(this, data, rockRidgeOffset);
	    }
	
	    if ( DirectoryRecord ) JolietDirectoryRecord.__proto__ = DirectoryRecord;
	    JolietDirectoryRecord.prototype = Object.create( DirectoryRecord && DirectoryRecord.prototype );
	    JolietDirectoryRecord.prototype.constructor = JolietDirectoryRecord;
	    JolietDirectoryRecord.prototype._getString = function _getString (i, len) {
	        return getJolietString(this._data, i, len);
	    };
	    JolietDirectoryRecord.prototype._constructDirectory = function _constructDirectory (isoData) {
	        return new JolietDirectory(this, isoData);
	    };
	    JolietDirectoryRecord.prototype._getGetString = function _getGetString () {
	        return getJolietString;
	    };
	
	    return JolietDirectoryRecord;
	}(DirectoryRecord));
	/**
	 * @hidden
	 */
	var SystemUseEntry = function SystemUseEntry(data) {
	    this._data = data;
	};
	SystemUseEntry.prototype.signatureWord = function signatureWord () {
	    return this._data.readUInt16BE(0);
	};
	SystemUseEntry.prototype.signatureWordString = function signatureWordString () {
	    return getASCIIString(this._data, 0, 2);
	};
	SystemUseEntry.prototype.length = function length () {
	    return this._data[2];
	};
	SystemUseEntry.prototype.suVersion = function suVersion () {
	    return this._data[3];
	};
	/**
	 * Continuation entry.
	 * @hidden
	 */
	var CEEntry = (function (SystemUseEntry) {
	    function CEEntry(data) {
	        SystemUseEntry.call(this, data);
	        this._entries = null;
	    }
	
	    if ( SystemUseEntry ) CEEntry.__proto__ = SystemUseEntry;
	    CEEntry.prototype = Object.create( SystemUseEntry && SystemUseEntry.prototype );
	    CEEntry.prototype.constructor = CEEntry;
	    /**
	     * Logical block address of the continuation area.
	     */
	    CEEntry.prototype.continuationLba = function continuationLba () {
	        return this._data.readUInt32LE(4);
	    };
	    /**
	     * Offset into the logical block.
	     */
	    CEEntry.prototype.continuationLbaOffset = function continuationLbaOffset () {
	        return this._data.readUInt32LE(12);
	    };
	    /**
	     * Length of the continuation area.
	     */
	    CEEntry.prototype.continuationLength = function continuationLength () {
	        return this._data.readUInt32LE(20);
	    };
	    CEEntry.prototype.getEntries = function getEntries (isoData) {
	        if (!this._entries) {
	            var start = this.continuationLba() * 2048 + this.continuationLbaOffset();
	            this._entries = constructSystemUseEntries(isoData, start, this.continuationLength(), isoData);
	        }
	        return this._entries;
	    };
	
	    return CEEntry;
	}(SystemUseEntry));
	/**
	 * Padding entry.
	 * @hidden
	 */
	var PDEntry = (function (SystemUseEntry) {
	    function PDEntry(data) {
	        SystemUseEntry.call(this, data);
	    }
	
	    if ( SystemUseEntry ) PDEntry.__proto__ = SystemUseEntry;
	    PDEntry.prototype = Object.create( SystemUseEntry && SystemUseEntry.prototype );
	    PDEntry.prototype.constructor = PDEntry;
	
	    return PDEntry;
	}(SystemUseEntry));
	/**
	 * Identifies that SUSP is in-use.
	 * @hidden
	 */
	var SPEntry = (function (SystemUseEntry) {
	    function SPEntry(data) {
	        SystemUseEntry.call(this, data);
	    }
	
	    if ( SystemUseEntry ) SPEntry.__proto__ = SystemUseEntry;
	    SPEntry.prototype = Object.create( SystemUseEntry && SystemUseEntry.prototype );
	    SPEntry.prototype.constructor = SPEntry;
	    SPEntry.prototype.checkBytesPass = function checkBytesPass () {
	        return this._data[4] === 0xBE && this._data[5] === 0xEF;
	    };
	    SPEntry.prototype.bytesSkipped = function bytesSkipped () {
	        return this._data[6];
	    };
	
	    return SPEntry;
	}(SystemUseEntry));
	/**
	 * Identifies the end of the SUSP entries.
	 * @hidden
	 */
	var STEntry = (function (SystemUseEntry) {
	    function STEntry(data) {
	        SystemUseEntry.call(this, data);
	    }
	
	    if ( SystemUseEntry ) STEntry.__proto__ = SystemUseEntry;
	    STEntry.prototype = Object.create( SystemUseEntry && SystemUseEntry.prototype );
	    STEntry.prototype.constructor = STEntry;
	
	    return STEntry;
	}(SystemUseEntry));
	/**
	 * Specifies system-specific extensions to SUSP.
	 * @hidden
	 */
	var EREntry = (function (SystemUseEntry) {
	    function EREntry(data) {
	        SystemUseEntry.call(this, data);
	    }
	
	    if ( SystemUseEntry ) EREntry.__proto__ = SystemUseEntry;
	    EREntry.prototype = Object.create( SystemUseEntry && SystemUseEntry.prototype );
	    EREntry.prototype.constructor = EREntry;
	    EREntry.prototype.identifierLength = function identifierLength () {
	        return this._data[4];
	    };
	    EREntry.prototype.descriptorLength = function descriptorLength () {
	        return this._data[5];
	    };
	    EREntry.prototype.sourceLength = function sourceLength () {
	        return this._data[6];
	    };
	    EREntry.prototype.extensionVersion = function extensionVersion () {
	        return this._data[7];
	    };
	    EREntry.prototype.extensionIdentifier = function extensionIdentifier () {
	        return getASCIIString(this._data, 8, this.identifierLength());
	    };
	    EREntry.prototype.extensionDescriptor = function extensionDescriptor () {
	        return getASCIIString(this._data, 8 + this.identifierLength(), this.descriptorLength());
	    };
	    EREntry.prototype.extensionSource = function extensionSource () {
	        return getASCIIString(this._data, 8 + this.identifierLength() + this.descriptorLength(), this.sourceLength());
	    };
	
	    return EREntry;
	}(SystemUseEntry));
	/**
	 * @hidden
	 */
	var ESEntry = (function (SystemUseEntry) {
	    function ESEntry(data) {
	        SystemUseEntry.call(this, data);
	    }
	
	    if ( SystemUseEntry ) ESEntry.__proto__ = SystemUseEntry;
	    ESEntry.prototype = Object.create( SystemUseEntry && SystemUseEntry.prototype );
	    ESEntry.prototype.constructor = ESEntry;
	    ESEntry.prototype.extensionSequence = function extensionSequence () {
	        return this._data[4];
	    };
	
	    return ESEntry;
	}(SystemUseEntry));
	/**
	 * RockRidge: Marks that RockRidge is in use [deprecated]
	 * @hidden
	 */
	var RREntry = (function (SystemUseEntry) {
	    function RREntry(data) {
	        SystemUseEntry.call(this, data);
	    }
	
	    if ( SystemUseEntry ) RREntry.__proto__ = SystemUseEntry;
	    RREntry.prototype = Object.create( SystemUseEntry && SystemUseEntry.prototype );
	    RREntry.prototype.constructor = RREntry;
	
	    return RREntry;
	}(SystemUseEntry));
	/**
	 * RockRidge: Records POSIX file attributes.
	 * @hidden
	 */
	var PXEntry = (function (SystemUseEntry) {
	    function PXEntry(data) {
	        SystemUseEntry.call(this, data);
	    }
	
	    if ( SystemUseEntry ) PXEntry.__proto__ = SystemUseEntry;
	    PXEntry.prototype = Object.create( SystemUseEntry && SystemUseEntry.prototype );
	    PXEntry.prototype.constructor = PXEntry;
	    PXEntry.prototype.mode = function mode () {
	        return this._data.readUInt32LE(4);
	    };
	    PXEntry.prototype.fileLinks = function fileLinks () {
	        return this._data.readUInt32LE(12);
	    };
	    PXEntry.prototype.uid = function uid () {
	        return this._data.readUInt32LE(20);
	    };
	    PXEntry.prototype.gid = function gid () {
	        return this._data.readUInt32LE(28);
	    };
	    PXEntry.prototype.inode = function inode () {
	        return this._data.readUInt32LE(36);
	    };
	
	    return PXEntry;
	}(SystemUseEntry));
	/**
	 * RockRidge: Records POSIX device number.
	 * @hidden
	 */
	var PNEntry = (function (SystemUseEntry) {
	    function PNEntry(data) {
	        SystemUseEntry.call(this, data);
	    }
	
	    if ( SystemUseEntry ) PNEntry.__proto__ = SystemUseEntry;
	    PNEntry.prototype = Object.create( SystemUseEntry && SystemUseEntry.prototype );
	    PNEntry.prototype.constructor = PNEntry;
	    PNEntry.prototype.devTHigh = function devTHigh () {
	        return this._data.readUInt32LE(4);
	    };
	    PNEntry.prototype.devTLow = function devTLow () {
	        return this._data.readUInt32LE(12);
	    };
	
	    return PNEntry;
	}(SystemUseEntry));
	/**
	 * RockRidge: Records symbolic link
	 * @hidden
	 */
	var SLEntry = (function (SystemUseEntry) {
	    function SLEntry(data) {
	        SystemUseEntry.call(this, data);
	    }
	
	    if ( SystemUseEntry ) SLEntry.__proto__ = SystemUseEntry;
	    SLEntry.prototype = Object.create( SystemUseEntry && SystemUseEntry.prototype );
	    SLEntry.prototype.constructor = SLEntry;
	    SLEntry.prototype.flags = function flags () {
	        return this._data[4];
	    };
	    SLEntry.prototype.continueFlag = function continueFlag () {
	        return this.flags() & 0x1;
	    };
	    SLEntry.prototype.componentRecords = function componentRecords () {
	        var this$1 = this;
	
	        var records = new Array();
	        var i = 5;
	        while (i < this.length()) {
	            var record = new SLComponentRecord(this$1._data.slice(i));
	            records.push(record);
	            i += record.length();
	        }
	        return records;
	    };
	
	    return SLEntry;
	}(SystemUseEntry));
	/**
	 * @hidden
	 */
	var SLComponentRecord = function SLComponentRecord(data) {
	    this._data = data;
	};
	SLComponentRecord.prototype.flags = function flags () {
	    return this._data[0];
	};
	SLComponentRecord.prototype.length = function length () {
	    return 2 + this.componentLength();
	};
	SLComponentRecord.prototype.componentLength = function componentLength () {
	    return this._data[1];
	};
	SLComponentRecord.prototype.content = function content (getString) {
	    return getString(this._data, 2, this.componentLength());
	};
	/**
	 * RockRidge: Records alternate file name
	 * @hidden
	 */
	var NMEntry = (function (SystemUseEntry) {
	    function NMEntry(data) {
	        SystemUseEntry.call(this, data);
	    }
	
	    if ( SystemUseEntry ) NMEntry.__proto__ = SystemUseEntry;
	    NMEntry.prototype = Object.create( SystemUseEntry && SystemUseEntry.prototype );
	    NMEntry.prototype.constructor = NMEntry;
	    NMEntry.prototype.flags = function flags () {
	        return this._data[4];
	    };
	    NMEntry.prototype.name = function name (getString) {
	        return getString(this._data, 5, this.length() - 5);
	    };
	
	    return NMEntry;
	}(SystemUseEntry));
	/**
	 * RockRidge: Records child link
	 * @hidden
	 */
	var CLEntry = (function (SystemUseEntry) {
	    function CLEntry(data) {
	        SystemUseEntry.call(this, data);
	    }
	
	    if ( SystemUseEntry ) CLEntry.__proto__ = SystemUseEntry;
	    CLEntry.prototype = Object.create( SystemUseEntry && SystemUseEntry.prototype );
	    CLEntry.prototype.constructor = CLEntry;
	    CLEntry.prototype.childDirectoryLba = function childDirectoryLba () {
	        return this._data.readUInt32LE(4);
	    };
	
	    return CLEntry;
	}(SystemUseEntry));
	/**
	 * RockRidge: Records parent link.
	 * @hidden
	 */
	var PLEntry = (function (SystemUseEntry) {
	    function PLEntry(data) {
	        SystemUseEntry.call(this, data);
	    }
	
	    if ( SystemUseEntry ) PLEntry.__proto__ = SystemUseEntry;
	    PLEntry.prototype = Object.create( SystemUseEntry && SystemUseEntry.prototype );
	    PLEntry.prototype.constructor = PLEntry;
	    PLEntry.prototype.parentDirectoryLba = function parentDirectoryLba () {
	        return this._data.readUInt32LE(4);
	    };
	
	    return PLEntry;
	}(SystemUseEntry));
	/**
	 * RockRidge: Records relocated directory.
	 * @hidden
	 */
	var REEntry = (function (SystemUseEntry) {
	    function REEntry(data) {
	        SystemUseEntry.call(this, data);
	    }
	
	    if ( SystemUseEntry ) REEntry.__proto__ = SystemUseEntry;
	    REEntry.prototype = Object.create( SystemUseEntry && SystemUseEntry.prototype );
	    REEntry.prototype.constructor = REEntry;
	
	    return REEntry;
	}(SystemUseEntry));
	/**
	 * RockRidge: Records file timestamps
	 * @hidden
	 */
	var TFEntry = (function (SystemUseEntry) {
	    function TFEntry(data) {
	        SystemUseEntry.call(this, data);
	    }
	
	    if ( SystemUseEntry ) TFEntry.__proto__ = SystemUseEntry;
	    TFEntry.prototype = Object.create( SystemUseEntry && SystemUseEntry.prototype );
	    TFEntry.prototype.constructor = TFEntry;
	    TFEntry.prototype.flags = function flags () {
	        return this._data[4];
	    };
	    TFEntry.prototype.creation = function creation () {
	        if (this.flags() & 1 /* CREATION */) {
	            if (this._longFormDates()) {
	                return getDate(this._data, 5);
	            }
	            else {
	                return getShortFormDate(this._data, 5);
	            }
	        }
	        else {
	            return null;
	        }
	    };
	    TFEntry.prototype.modify = function modify () {
	        if (this.flags() & 2 /* MODIFY */) {
	            var previousDates = (this.flags() & 1 /* CREATION */) ? 1 : 0;
	            if (this._longFormDates) {
	                return getDate(this._data, 5 + (previousDates * 17));
	            }
	            else {
	                return getShortFormDate(this._data, 5 + (previousDates * 7));
	            }
	        }
	        else {
	            return null;
	        }
	    };
	    TFEntry.prototype.access = function access () {
	        if (this.flags() & 4 /* ACCESS */) {
	            var previousDates = (this.flags() & 1 /* CREATION */) ? 1 : 0;
	            previousDates += (this.flags() & 2 /* MODIFY */) ? 1 : 0;
	            if (this._longFormDates) {
	                return getDate(this._data, 5 + (previousDates * 17));
	            }
	            else {
	                return getShortFormDate(this._data, 5 + (previousDates * 7));
	            }
	        }
	        else {
	            return null;
	        }
	    };
	    TFEntry.prototype.backup = function backup () {
	        if (this.flags() & 16 /* BACKUP */) {
	            var previousDates = (this.flags() & 1 /* CREATION */) ? 1 : 0;
	            previousDates += (this.flags() & 2 /* MODIFY */) ? 1 : 0;
	            previousDates += (this.flags() & 4 /* ACCESS */) ? 1 : 0;
	            if (this._longFormDates) {
	                return getDate(this._data, 5 + (previousDates * 17));
	            }
	            else {
	                return getShortFormDate(this._data, 5 + (previousDates * 7));
	            }
	        }
	        else {
	            return null;
	        }
	    };
	    TFEntry.prototype.expiration = function expiration () {
	        if (this.flags() & 32 /* EXPIRATION */) {
	            var previousDates = (this.flags() & 1 /* CREATION */) ? 1 : 0;
	            previousDates += (this.flags() & 2 /* MODIFY */) ? 1 : 0;
	            previousDates += (this.flags() & 4 /* ACCESS */) ? 1 : 0;
	            previousDates += (this.flags() & 16 /* BACKUP */) ? 1 : 0;
	            if (this._longFormDates) {
	                return getDate(this._data, 5 + (previousDates * 17));
	            }
	            else {
	                return getShortFormDate(this._data, 5 + (previousDates * 7));
	            }
	        }
	        else {
	            return null;
	        }
	    };
	    TFEntry.prototype.effective = function effective () {
	        if (this.flags() & 64 /* EFFECTIVE */) {
	            var previousDates = (this.flags() & 1 /* CREATION */) ? 1 : 0;
	            previousDates += (this.flags() & 2 /* MODIFY */) ? 1 : 0;
	            previousDates += (this.flags() & 4 /* ACCESS */) ? 1 : 0;
	            previousDates += (this.flags() & 16 /* BACKUP */) ? 1 : 0;
	            previousDates += (this.flags() & 32 /* EXPIRATION */) ? 1 : 0;
	            if (this._longFormDates) {
	                return getDate(this._data, 5 + (previousDates * 17));
	            }
	            else {
	                return getShortFormDate(this._data, 5 + (previousDates * 7));
	            }
	        }
	        else {
	            return null;
	        }
	    };
	    TFEntry.prototype._longFormDates = function _longFormDates () {
	        return !!(this.flags() && 128 /* LONG_FORM */);
	    };
	
	    return TFEntry;
	}(SystemUseEntry));
	/**
	 * RockRidge: File data in sparse format.
	 * @hidden
	 */
	var SFEntry = (function (SystemUseEntry) {
	    function SFEntry(data) {
	        SystemUseEntry.call(this, data);
	    }
	
	    if ( SystemUseEntry ) SFEntry.__proto__ = SystemUseEntry;
	    SFEntry.prototype = Object.create( SystemUseEntry && SystemUseEntry.prototype );
	    SFEntry.prototype.constructor = SFEntry;
	    SFEntry.prototype.virtualSizeHigh = function virtualSizeHigh () {
	        return this._data.readUInt32LE(4);
	    };
	    SFEntry.prototype.virtualSizeLow = function virtualSizeLow () {
	        return this._data.readUInt32LE(12);
	    };
	    SFEntry.prototype.tableDepth = function tableDepth () {
	        return this._data[20];
	    };
	
	    return SFEntry;
	}(SystemUseEntry));
	/**
	 * @hidden
	 */
	var Directory = function Directory(record, isoData) {
	    var this$1 = this;
	
	    this._fileList = [];
	    this._fileMap = {};
	    this._record = record;
	    var i = record.lba();
	    var iLimit = i + record.dataLength();
	    if (!(record.fileFlags() & 2 /* Directory */)) {
	        // Must have a CL entry.
	        var cl = record.getSUEntries(isoData).filter(function (e) { return e instanceof CLEntry; })[0];
	        i = cl.childDirectoryLba() * 2048;
	        iLimit = Infinity;
	    }
	    while (i < iLimit) {
	        var len = isoData[i];
	        // Zero-padding between sectors.
	        // TODO: Could optimize this to seek to nearest-sector upon
	        // seeing a 0.
	        if (len === 0) {
	            i++;
	            continue;
	        }
	        var r = this$1._constructDirectoryRecord(isoData.slice(i));
	        var fname = r.fileName(isoData);
	        // Skip '.' and '..' entries.
	        if (fname !== '\u0000' && fname !== '\u0001') {
	            // Skip relocated entries.
	            if (!r.hasRockRidge() || r.getSUEntries(isoData).filter(function (e) { return e instanceof REEntry; }).length === 0) {
	                this$1._fileMap[fname] = r;
	                this$1._fileList.push(fname);
	            }
	        }
	        else if (iLimit === Infinity) {
	            // First entry contains needed data.
	            iLimit = i + r.dataLength();
	        }
	        i += r.length();
	    }
	};
	/**
	 * Get the record with the given name.
	 * Returns undefined if not present.
	 */
	Directory.prototype.getRecord = function getRecord (name) {
	    return this._fileMap[name];
	};
	Directory.prototype.getFileList = function getFileList () {
	    return this._fileList;
	};
	Directory.prototype.getDotEntry = function getDotEntry (isoData) {
	    return this._constructDirectoryRecord(isoData.slice(this._record.lba()));
	};
	/**
	 * @hidden
	 */
	var ISODirectory = (function (Directory) {
	    function ISODirectory(record, isoData) {
	        Directory.call(this, record, isoData);
	    }
	
	    if ( Directory ) ISODirectory.__proto__ = Directory;
	    ISODirectory.prototype = Object.create( Directory && Directory.prototype );
	    ISODirectory.prototype.constructor = ISODirectory;
	    ISODirectory.prototype._constructDirectoryRecord = function _constructDirectoryRecord (data) {
	        return new ISODirectoryRecord(data, this._record.getRockRidgeOffset());
	    };
	
	    return ISODirectory;
	}(Directory));
	/**
	 * @hidden
	 */
	var JolietDirectory = (function (Directory) {
	    function JolietDirectory(record, isoData) {
	        Directory.call(this, record, isoData);
	    }
	
	    if ( Directory ) JolietDirectory.__proto__ = Directory;
	    JolietDirectory.prototype = Object.create( Directory && Directory.prototype );
	    JolietDirectory.prototype.constructor = JolietDirectory;
	    JolietDirectory.prototype._constructDirectoryRecord = function _constructDirectoryRecord (data) {
	        return new JolietDirectoryRecord(data, this._record.getRockRidgeOffset());
	    };
	
	    return JolietDirectory;
	}(Directory));
	/**
	 * Mounts an ISO file as a read-only file system.
	 *
	 * Supports:
	 * * Vanilla ISO9660 ISOs
	 * * Microsoft Joliet and Rock Ridge extensions to the ISO9660 standard
	 */
	var IsoFS = (function (SynchronousFileSystem$$1) {
	    function IsoFS(data, name, deprecateMsg) {
	        var this$1 = this;
	        if ( name === void 0 ) name = "";
	        if ( deprecateMsg === void 0 ) deprecateMsg = true;
	
	        SynchronousFileSystem$$1.call(this);
	        this._data = data;
	        deprecationMessage(deprecateMsg, IsoFS.Name, { data: "ISO data as a Buffer", name: name });
	        // Skip first 16 sectors.
	        var vdTerminatorFound = false;
	        var i = 16 * 2048;
	        var candidateVDs = new Array();
	        while (!vdTerminatorFound) {
	            var slice = data.slice(i);
	            var vd = new VolumeDescriptor(slice);
	            switch (vd.type()) {
	                case 1 /* PrimaryVolumeDescriptor */:
	                    candidateVDs.push(new PrimaryVolumeDescriptor(slice));
	                    break;
	                case 2 /* SupplementaryVolumeDescriptor */:
	                    candidateVDs.push(new SupplementaryVolumeDescriptor(slice));
	                    break;
	                case 255 /* VolumeDescriptorSetTerminator */:
	                    vdTerminatorFound = true;
	                    break;
	            }
	            i += 2048;
	        }
	        if (candidateVDs.length === 0) {
	            throw new ApiError(ErrorCode.EIO, "Unable to find a suitable volume descriptor.");
	        }
	        candidateVDs.forEach(function (v) {
	            // Take an SVD over a PVD.
	            if (!this$1._pvd || this$1._pvd.type() !== 2 /* SupplementaryVolumeDescriptor */) {
	                this$1._pvd = v;
	            }
	        });
	        this._root = this._pvd.rootDirectoryEntry(data);
	        this._name = name;
	    }
	
	    if ( SynchronousFileSystem$$1 ) IsoFS.__proto__ = SynchronousFileSystem$$1;
	    IsoFS.prototype = Object.create( SynchronousFileSystem$$1 && SynchronousFileSystem$$1.prototype );
	    IsoFS.prototype.constructor = IsoFS;
	    /**
	     * Creates an IsoFS instance with the given options.
	     */
	    IsoFS.Create = function Create (opts, cb) {
	        var fs;
	        var e;
	        try {
	            fs = new IsoFS(opts.data, opts.name, false);
	        }
	        catch (e) {
	            e = e;
	        }
	        finally {
	            cb(e, fs);
	        }
	    };
	    IsoFS.isAvailable = function isAvailable () {
	        return true;
	    };
	    IsoFS.prototype.getName = function getName () {
	        var name = "IsoFS" + (this._name) + (this._pvd ? ("-" + (this._pvd.name())) : '');
	        if (this._root && this._root.hasRockRidge()) {
	            name += "-RockRidge";
	        }
	        return name;
	    };
	    IsoFS.prototype.diskSpace = function diskSpace (path$$1, cb) {
	        // Read-only file system.
	        cb(this._data.length, 0);
	    };
	    IsoFS.prototype.isReadOnly = function isReadOnly () {
	        return true;
	    };
	    IsoFS.prototype.supportsLinks = function supportsLinks () {
	        return false;
	    };
	    IsoFS.prototype.supportsProps = function supportsProps () {
	        return false;
	    };
	    IsoFS.prototype.supportsSynch = function supportsSynch () {
	        return true;
	    };
	    IsoFS.prototype.statSync = function statSync (p, isLstat) {
	        var record = this._getDirectoryRecord(p);
	        if (record === null) {
	            throw ApiError.ENOENT(p);
	        }
	        return this._getStats(p, record);
	    };
	    IsoFS.prototype.openSync = function openSync (p, flags, mode) {
	        // INVARIANT: Cannot write to RO file systems.
	        if (flags.isWriteable()) {
	            throw new ApiError(ErrorCode.EPERM, p);
	        }
	        // Check if the path exists, and is a file.
	        var record = this._getDirectoryRecord(p);
	        if (!record) {
	            throw ApiError.ENOENT(p);
	        }
	        else if (record.isSymlink(this._data)) {
	            return this.openSync(path.resolve(p, record.getSymlinkPath(this._data)), flags, mode);
	        }
	        else if (!record.isDirectory(this._data)) {
	            var data = record.getFile(this._data);
	            var stats = this._getStats(p, record);
	            switch (flags.pathExistsAction()) {
	                case ActionType.THROW_EXCEPTION:
	                case ActionType.TRUNCATE_FILE:
	                    throw ApiError.EEXIST(p);
	                case ActionType.NOP:
	                    return new NoSyncFile(this, p, flags, stats, data);
	                default:
	                    throw new ApiError(ErrorCode.EINVAL, 'Invalid FileMode object.');
	            }
	        }
	        else {
	            throw ApiError.EISDIR(p);
	        }
	    };
	    IsoFS.prototype.readdirSync = function readdirSync (path$$1) {
	        // Check if it exists.
	        var record = this._getDirectoryRecord(path$$1);
	        if (!record) {
	            throw ApiError.ENOENT(path$$1);
	        }
	        else if (record.isDirectory(this._data)) {
	            return record.getDirectory(this._data).getFileList().slice(0);
	        }
	        else {
	            throw ApiError.ENOTDIR(path$$1);
	        }
	    };
	    /**
	     * Specially-optimized readfile.
	     */
	    IsoFS.prototype.readFileSync = function readFileSync (fname, encoding, flag) {
	        // Get file.
	        var fd = this.openSync(fname, flag, 0x1a4);
	        try {
	            var fdCast = fd;
	            var fdBuff = fdCast.getBuffer();
	            if (encoding === null) {
	                return copyingSlice(fdBuff);
	            }
	            return fdBuff.toString(encoding);
	        }
	        finally {
	            fd.closeSync();
	        }
	    };
	    IsoFS.prototype._getDirectoryRecord = function _getDirectoryRecord (path$$1) {
	        var this$1 = this;
	
	        // Special case.
	        if (path$$1 === '/') {
	            return this._root;
	        }
	        var components = path$$1.split('/').slice(1);
	        var dir = this._root;
	        for (var i = 0, list = components; i < list.length; i += 1) {
	            var component = list[i];
	
	            if (dir.isDirectory(this$1._data)) {
	                dir = dir.getDirectory(this$1._data).getRecord(component);
	                if (!dir) {
	                    return null;
	                }
	            }
	            else {
	                return null;
	            }
	        }
	        return dir;
	    };
	    IsoFS.prototype._getStats = function _getStats (p, record) {
	        if (record.isSymlink(this._data)) {
	            var newP = path.resolve(p, record.getSymlinkPath(this._data));
	            var dirRec = this._getDirectoryRecord(newP);
	            if (!dirRec) {
	                return null;
	            }
	            return this._getStats(newP, dirRec);
	        }
	        else {
	            var len = record.dataLength();
	            var mode = 0x16D;
	            var date = record.recordingDate();
	            var atime = date;
	            var mtime = date;
	            var ctime = date;
	            if (record.hasRockRidge()) {
	                var entries = record.getSUEntries(this._data);
	                for (var i = 0, list = entries; i < list.length; i += 1) {
	                    var entry = list[i];
	
	                    if (entry instanceof PXEntry) {
	                        mode = entry.mode();
	                    }
	                    else if (entry instanceof TFEntry) {
	                        var flags = entry.flags();
	                        if (flags & 4 /* ACCESS */) {
	                            atime = entry.access();
	                        }
	                        if (flags & 2 /* MODIFY */) {
	                            mtime = entry.modify();
	                        }
	                        if (flags & 1 /* CREATION */) {
	                            ctime = entry.creation();
	                        }
	                    }
	                }
	            }
	            // Mask out writeable flags. This is a RO file system.
	            mode = mode & 0x16D;
	            return new Stats(record.isDirectory(this._data) ? FileType.DIRECTORY : FileType.FILE, len, mode, atime, mtime, ctime);
	        }
	    };
	
	    return IsoFS;
	}(SynchronousFileSystem));
	
	IsoFS.Name = "IsoFS";
	IsoFS.Options = {
	    data: {
	        type: "object",
	        description: "The ISO file in a buffer",
	        validator: bufferValidator
	    }
	};
	
	// Monkey-patch `Create` functions to check options before file system initialization.
	[AsyncMirror, DropboxFileSystem, EmscriptenFileSystem, FolderAdapter, HTML5FS, InMemoryFileSystem, IndexedDBFileSystem, IsoFS, LocalStorageFileSystem, MountableFileSystem, OverlayFS, WorkerFS, XmlHttpRequest, ZipFS].forEach(function (fsType) {
	    var create = fsType.Create;
	    fsType.Create = function (opts, cb) {
	        var oneArg = typeof (opts) === "function";
	        var normalizedCb = oneArg ? opts : cb;
	        var normalizedOpts = oneArg ? {} : opts;
	        function wrappedCb(e) {
	            if (e) {
	                normalizedCb(e);
	            }
	            else {
	                create.call(fsType, normalizedOpts, normalizedCb);
	            }
	        }
	        checkOptions(fsType, normalizedOpts, wrappedCb);
	    };
	});
	/**
	 * @hidden
	 */
	var Backends = { AsyncMirror: AsyncMirror, Dropbox: DropboxFileSystem, Emscripten: EmscriptenFileSystem, FolderAdapter: FolderAdapter, HTML5FS: HTML5FS, InMemory: InMemoryFileSystem, IndexedDB: IndexedDBFileSystem, IsoFS: IsoFS, LocalStorage: LocalStorageFileSystem, MountableFileSystem: MountableFileSystem, OverlayFS: OverlayFS, WorkerFS: WorkerFS, XmlHttpRequest: XmlHttpRequest, ZipFS: ZipFS };
	
	/**
	 * BrowserFS's main module. This is exposed in the browser via the BrowserFS global.
	 * Due to limitations in typedoc, we document these functions in ./typedoc.ts.
	 */
	if (process['initializeTTYs']) {
	    process['initializeTTYs']();
	}
	/**
	 * Installs BFSRequire as global `require`, a Node Buffer polyfill as the global `Buffer` variable,
	 * and a Node process polyfill as the global `process` variable.
	 */
	function install(obj) {
	    obj.Buffer = Buffer;
	    obj.process = process;
	    var oldRequire = obj.require ? obj.require : null;
	    // Monkey-patch require for Node-style code.
	    obj.require = function (arg) {
	        var rv = BFSRequire(arg);
	        if (!rv) {
	            return oldRequire.apply(null, Array.prototype.slice.call(arguments, 0));
	        }
	        else {
	            return rv;
	        }
	    };
	}
	/**
	 * @hidden
	 */
	function registerFileSystem(name, fs) {
	    Backends[name] = fs;
	}
	function BFSRequire(module) {
	    switch (module) {
	        case 'fs':
	            return _fsMock;
	        case 'path':
	            return path;
	        case 'buffer':
	            // The 'buffer' module has 'Buffer' as a property.
	            return buffer;
	        case 'process':
	            return process;
	        case 'bfs_utils':
	            return BFSUtils;
	        default:
	            return Backends[module];
	    }
	}
	/**
	 * Initializes BrowserFS with the given root file system.
	 */
	function initialize(rootfs) {
	    return _fsMock.initialize(rootfs);
	}
	/**
	 * Creates a file system with the given configuration, and initializes BrowserFS with it.
	 * See the FileSystemConfiguration type for more info on the configuration object.
	 */
	function configure(config, cb) {
	    getFileSystem(config, function (e, fs) {
	        if (fs) {
	            initialize(fs);
	            cb();
	        }
	        else {
	            cb(e);
	        }
	    });
	}
	/**
	 * Retrieve a file system with the given configuration.
	 * @param config A FileSystemConfiguration object. See FileSystemConfiguration for details.
	 * @param cb Called when the file system is constructed, or when an error occurs.
	 */
	function getFileSystem(config, cb) {
	    var fsName = config['fs'];
	    if (!fsName) {
	        return cb(new ApiError(ErrorCode.EPERM, 'Missing "fs" property on configuration object.'));
	    }
	    var options = config['options'];
	    var waitCount = 0;
	    var called = false;
	    function finish() {
	        if (!called) {
	            called = true;
	            var fsc = Backends[fsName];
	            if (!fsc) {
	                cb(new ApiError(ErrorCode.EPERM, ("File system " + fsName + " is not available in BrowserFS.")));
	            }
	            else {
	                fsc.Create(options, cb);
	            }
	        }
	    }
	    if (options !== null && typeof (options) === "object") {
	        var finishedIterating = false;
	        var props = Object.keys(options).filter(function (k) { return k !== 'fs'; });
	        // Check recursively if other fields have 'fs' properties.
	        props.forEach(function (p) {
	            var d = options[p];
	            if (d !== null && typeof (d) === "object" && d['fs']) {
	                waitCount++;
	                getFileSystem(d, function (e, fs) {
	                    waitCount--;
	                    if (e) {
	                        if (called) {
	                            return;
	                        }
	                        called = true;
	                        cb(e);
	                    }
	                    else {
	                        options[p] = fs;
	                        if (waitCount === 0 && finishedIterating) {
	                            finish();
	                        }
	                    }
	                });
	            }
	        });
	        finishedIterating = true;
	    }
	    if (waitCount === 0) {
	        finish();
	    }
	}
	
	/**
	 * BrowserFS's main entry point.
	 * It installs all of the needed polyfills, and requires() the main module.
	 */
	// IE substr does not support negative indices
	if ('ab'.substr(-1) !== 'b') {
	    String.prototype.substr = function (substr) {
	        return function (start, length) {
	            // did we get a negative start, calculate how much it is from the
	            // beginning of the string
	            if (start < 0) {
	                start = this.length + start;
	            }
	            // call the original function
	            return substr.call(this, start, length);
	        };
	    }(String.prototype.substr);
	}
	// Polyfill for Uint8Array.prototype.slice.
	// Safari and some other browsers do not define it.
	if (typeof (ArrayBuffer) !== 'undefined' && typeof (Uint8Array) !== 'undefined') {
	    if (!Uint8Array.prototype['slice']) {
	        Uint8Array.prototype.slice = function (start, end) {
	            if ( start === void 0 ) start = 0;
	            if ( end === void 0 ) end = this.length;
	
	            var self = this;
	            if (start < 0) {
	                start = this.length + start;
	                if (start < 0) {
	                    start = 0;
	                }
	            }
	            if (end < 0) {
	                end = this.length + end;
	                if (end < 0) {
	                    end = 0;
	                }
	            }
	            if (end < start) {
	                end = start;
	            }
	            return new Uint8Array(self.buffer, self.byteOffset + start, end - start);
	        };
	    }
	}
	
	exports.install = install;
	exports.registerFileSystem = registerFileSystem;
	exports.BFSRequire = BFSRequire;
	exports.initialize = initialize;
	exports.configure = configure;
	exports.getFileSystem = getFileSystem;
	exports.EmscriptenFS = BFSEmscriptenFS;
	exports.FileSystem = Backends;
	exports.Errors = api_error;
	exports.setImmediate = setImmediate$3;
	
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(1), (function() { return this; }()), __webpack_require__(5)(module), __webpack_require__(6)))

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(2).Buffer;


/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer) {/*!
	 * The buffer module from node.js, for the browser.
	 *
	 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
	 * @license  MIT
	 */
	/* eslint-disable no-proto */
	
	'use strict'
	
	var base64 = __webpack_require__(3)
	var ieee754 = __webpack_require__(4)
	
	exports.Buffer = Buffer
	exports.SlowBuffer = SlowBuffer
	exports.INSPECT_MAX_BYTES = 50
	
	var K_MAX_LENGTH = 0x7fffffff
	exports.kMaxLength = K_MAX_LENGTH
	
	/**
	 * If `Buffer.TYPED_ARRAY_SUPPORT`:
	 *   === true    Use Uint8Array implementation (fastest)
	 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
	 *               implementation (most compatible, even IE6)
	 *
	 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
	 * Opera 11.6+, iOS 4.2+.
	 *
	 * We report that the browser does not support typed arrays if the are not subclassable
	 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
	 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
	 * for __proto__ and has a buggy typed array implementation.
	 */
	Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()
	
	if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
	    typeof console.error === 'function') {
	  console.error(
	    'This browser lacks typed array (Uint8Array) support which is required by ' +
	    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
	  )
	}
	
	function typedArraySupport () {
	  // Can typed array instances can be augmented?
	  try {
	    var arr = new Uint8Array(1)
	    arr.__proto__ = {__proto__: Uint8Array.prototype, foo: function () { return 42 }}
	    return arr.foo() === 42
	  } catch (e) {
	    return false
	  }
	}
	
	function createBuffer (length) {
	  if (length > K_MAX_LENGTH) {
	    throw new RangeError('Invalid typed array length')
	  }
	  // Return an augmented `Uint8Array` instance
	  var buf = new Uint8Array(length)
	  buf.__proto__ = Buffer.prototype
	  return buf
	}
	
	/**
	 * The Buffer constructor returns instances of `Uint8Array` that have their
	 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
	 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
	 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
	 * returns a single octet.
	 *
	 * The `Uint8Array` prototype remains unmodified.
	 */
	
	function Buffer (arg, encodingOrOffset, length) {
	  // Common case.
	  if (typeof arg === 'number') {
	    if (typeof encodingOrOffset === 'string') {
	      throw new Error(
	        'If encoding is specified then the first argument must be a string'
	      )
	    }
	    return allocUnsafe(arg)
	  }
	  return from(arg, encodingOrOffset, length)
	}
	
	// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
	if (typeof Symbol !== 'undefined' && Symbol.species &&
	    Buffer[Symbol.species] === Buffer) {
	  Object.defineProperty(Buffer, Symbol.species, {
	    value: null,
	    configurable: true,
	    enumerable: false,
	    writable: false
	  })
	}
	
	Buffer.poolSize = 8192 // not used by this implementation
	
	function from (value, encodingOrOffset, length) {
	  if (typeof value === 'number') {
	    throw new TypeError('"value" argument must not be a number')
	  }
	
	  if (isArrayBuffer(value)) {
	    return fromArrayBuffer(value, encodingOrOffset, length)
	  }
	
	  if (typeof value === 'string') {
	    return fromString(value, encodingOrOffset)
	  }
	
	  return fromObject(value)
	}
	
	/**
	 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
	 * if value is a number.
	 * Buffer.from(str[, encoding])
	 * Buffer.from(array)
	 * Buffer.from(buffer)
	 * Buffer.from(arrayBuffer[, byteOffset[, length]])
	 **/
	Buffer.from = function (value, encodingOrOffset, length) {
	  return from(value, encodingOrOffset, length)
	}
	
	// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
	// https://github.com/feross/buffer/pull/148
	Buffer.prototype.__proto__ = Uint8Array.prototype
	Buffer.__proto__ = Uint8Array
	
	function assertSize (size) {
	  if (typeof size !== 'number') {
	    throw new TypeError('"size" argument must be a number')
	  } else if (size < 0) {
	    throw new RangeError('"size" argument must not be negative')
	  }
	}
	
	function alloc (size, fill, encoding) {
	  assertSize(size)
	  if (size <= 0) {
	    return createBuffer(size)
	  }
	  if (fill !== undefined) {
	    // Only pay attention to encoding if it's a string. This
	    // prevents accidentally sending in a number that would
	    // be interpretted as a start offset.
	    return typeof encoding === 'string'
	      ? createBuffer(size).fill(fill, encoding)
	      : createBuffer(size).fill(fill)
	  }
	  return createBuffer(size)
	}
	
	/**
	 * Creates a new filled Buffer instance.
	 * alloc(size[, fill[, encoding]])
	 **/
	Buffer.alloc = function (size, fill, encoding) {
	  return alloc(size, fill, encoding)
	}
	
	function allocUnsafe (size) {
	  assertSize(size)
	  return createBuffer(size < 0 ? 0 : checked(size) | 0)
	}
	
	/**
	 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
	 * */
	Buffer.allocUnsafe = function (size) {
	  return allocUnsafe(size)
	}
	/**
	 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
	 */
	Buffer.allocUnsafeSlow = function (size) {
	  return allocUnsafe(size)
	}
	
	function fromString (string, encoding) {
	  if (typeof encoding !== 'string' || encoding === '') {
	    encoding = 'utf8'
	  }
	
	  if (!Buffer.isEncoding(encoding)) {
	    throw new TypeError('"encoding" must be a valid string encoding')
	  }
	
	  var length = byteLength(string, encoding) | 0
	  var buf = createBuffer(length)
	
	  var actual = buf.write(string, encoding)
	
	  if (actual !== length) {
	    // Writing a hex string, for example, that contains invalid characters will
	    // cause everything after the first invalid character to be ignored. (e.g.
	    // 'abxxcd' will be treated as 'ab')
	    buf = buf.slice(0, actual)
	  }
	
	  return buf
	}
	
	function fromArrayLike (array) {
	  var length = array.length < 0 ? 0 : checked(array.length) | 0
	  var buf = createBuffer(length)
	  for (var i = 0; i < length; i += 1) {
	    buf[i] = array[i] & 255
	  }
	  return buf
	}
	
	function fromArrayBuffer (array, byteOffset, length) {
	  if (byteOffset < 0 || array.byteLength < byteOffset) {
	    throw new RangeError('\'offset\' is out of bounds')
	  }
	
	  if (array.byteLength < byteOffset + (length || 0)) {
	    throw new RangeError('\'length\' is out of bounds')
	  }
	
	  var buf
	  if (byteOffset === undefined && length === undefined) {
	    buf = new Uint8Array(array)
	  } else if (length === undefined) {
	    buf = new Uint8Array(array, byteOffset)
	  } else {
	    buf = new Uint8Array(array, byteOffset, length)
	  }
	
	  // Return an augmented `Uint8Array` instance
	  buf.__proto__ = Buffer.prototype
	  return buf
	}
	
	function fromObject (obj) {
	  if (Buffer.isBuffer(obj)) {
	    var len = checked(obj.length) | 0
	    var buf = createBuffer(len)
	
	    if (buf.length === 0) {
	      return buf
	    }
	
	    obj.copy(buf, 0, 0, len)
	    return buf
	  }
	
	  if (obj) {
	    if (isArrayBufferView(obj) || 'length' in obj) {
	      if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
	        return createBuffer(0)
	      }
	      return fromArrayLike(obj)
	    }
	
	    if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
	      return fromArrayLike(obj.data)
	    }
	  }
	
	  throw new TypeError('First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.')
	}
	
	function checked (length) {
	  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
	  // length is NaN (which is otherwise coerced to zero.)
	  if (length >= K_MAX_LENGTH) {
	    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
	                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
	  }
	  return length | 0
	}
	
	function SlowBuffer (length) {
	  if (+length != length) { // eslint-disable-line eqeqeq
	    length = 0
	  }
	  return Buffer.alloc(+length)
	}
	
	Buffer.isBuffer = function isBuffer (b) {
	  return b != null && b._isBuffer === true
	}
	
	Buffer.compare = function compare (a, b) {
	  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
	    throw new TypeError('Arguments must be Buffers')
	  }
	
	  if (a === b) return 0
	
	  var x = a.length
	  var y = b.length
	
	  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
	    if (a[i] !== b[i]) {
	      x = a[i]
	      y = b[i]
	      break
	    }
	  }
	
	  if (x < y) return -1
	  if (y < x) return 1
	  return 0
	}
	
	Buffer.isEncoding = function isEncoding (encoding) {
	  switch (String(encoding).toLowerCase()) {
	    case 'hex':
	    case 'utf8':
	    case 'utf-8':
	    case 'ascii':
	    case 'latin1':
	    case 'binary':
	    case 'base64':
	    case 'ucs2':
	    case 'ucs-2':
	    case 'utf16le':
	    case 'utf-16le':
	      return true
	    default:
	      return false
	  }
	}
	
	Buffer.concat = function concat (list, length) {
	  if (!Array.isArray(list)) {
	    throw new TypeError('"list" argument must be an Array of Buffers')
	  }
	
	  if (list.length === 0) {
	    return Buffer.alloc(0)
	  }
	
	  var i
	  if (length === undefined) {
	    length = 0
	    for (i = 0; i < list.length; ++i) {
	      length += list[i].length
	    }
	  }
	
	  var buffer = Buffer.allocUnsafe(length)
	  var pos = 0
	  for (i = 0; i < list.length; ++i) {
	    var buf = list[i]
	    if (!Buffer.isBuffer(buf)) {
	      throw new TypeError('"list" argument must be an Array of Buffers')
	    }
	    buf.copy(buffer, pos)
	    pos += buf.length
	  }
	  return buffer
	}
	
	function byteLength (string, encoding) {
	  if (Buffer.isBuffer(string)) {
	    return string.length
	  }
	  if (isArrayBufferView(string) || isArrayBuffer(string)) {
	    return string.byteLength
	  }
	  if (typeof string !== 'string') {
	    string = '' + string
	  }
	
	  var len = string.length
	  if (len === 0) return 0
	
	  // Use a for loop to avoid recursion
	  var loweredCase = false
	  for (;;) {
	    switch (encoding) {
	      case 'ascii':
	      case 'latin1':
	      case 'binary':
	        return len
	      case 'utf8':
	      case 'utf-8':
	      case undefined:
	        return utf8ToBytes(string).length
	      case 'ucs2':
	      case 'ucs-2':
	      case 'utf16le':
	      case 'utf-16le':
	        return len * 2
	      case 'hex':
	        return len >>> 1
	      case 'base64':
	        return base64ToBytes(string).length
	      default:
	        if (loweredCase) return utf8ToBytes(string).length // assume utf8
	        encoding = ('' + encoding).toLowerCase()
	        loweredCase = true
	    }
	  }
	}
	Buffer.byteLength = byteLength
	
	function slowToString (encoding, start, end) {
	  var loweredCase = false
	
	  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
	  // property of a typed array.
	
	  // This behaves neither like String nor Uint8Array in that we set start/end
	  // to their upper/lower bounds if the value passed is out of range.
	  // undefined is handled specially as per ECMA-262 6th Edition,
	  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
	  if (start === undefined || start < 0) {
	    start = 0
	  }
	  // Return early if start > this.length. Done here to prevent potential uint32
	  // coercion fail below.
	  if (start > this.length) {
	    return ''
	  }
	
	  if (end === undefined || end > this.length) {
	    end = this.length
	  }
	
	  if (end <= 0) {
	    return ''
	  }
	
	  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
	  end >>>= 0
	  start >>>= 0
	
	  if (end <= start) {
	    return ''
	  }
	
	  if (!encoding) encoding = 'utf8'
	
	  while (true) {
	    switch (encoding) {
	      case 'hex':
	        return hexSlice(this, start, end)
	
	      case 'utf8':
	      case 'utf-8':
	        return utf8Slice(this, start, end)
	
	      case 'ascii':
	        return asciiSlice(this, start, end)
	
	      case 'latin1':
	      case 'binary':
	        return latin1Slice(this, start, end)
	
	      case 'base64':
	        return base64Slice(this, start, end)
	
	      case 'ucs2':
	      case 'ucs-2':
	      case 'utf16le':
	      case 'utf-16le':
	        return utf16leSlice(this, start, end)
	
	      default:
	        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
	        encoding = (encoding + '').toLowerCase()
	        loweredCase = true
	    }
	  }
	}
	
	// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
	// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
	// reliably in a browserify context because there could be multiple different
	// copies of the 'buffer' package in use. This method works even for Buffer
	// instances that were created from another copy of the `buffer` package.
	// See: https://github.com/feross/buffer/issues/154
	Buffer.prototype._isBuffer = true
	
	function swap (b, n, m) {
	  var i = b[n]
	  b[n] = b[m]
	  b[m] = i
	}
	
	Buffer.prototype.swap16 = function swap16 () {
	  var len = this.length
	  if (len % 2 !== 0) {
	    throw new RangeError('Buffer size must be a multiple of 16-bits')
	  }
	  for (var i = 0; i < len; i += 2) {
	    swap(this, i, i + 1)
	  }
	  return this
	}
	
	Buffer.prototype.swap32 = function swap32 () {
	  var len = this.length
	  if (len % 4 !== 0) {
	    throw new RangeError('Buffer size must be a multiple of 32-bits')
	  }
	  for (var i = 0; i < len; i += 4) {
	    swap(this, i, i + 3)
	    swap(this, i + 1, i + 2)
	  }
	  return this
	}
	
	Buffer.prototype.swap64 = function swap64 () {
	  var len = this.length
	  if (len % 8 !== 0) {
	    throw new RangeError('Buffer size must be a multiple of 64-bits')
	  }
	  for (var i = 0; i < len; i += 8) {
	    swap(this, i, i + 7)
	    swap(this, i + 1, i + 6)
	    swap(this, i + 2, i + 5)
	    swap(this, i + 3, i + 4)
	  }
	  return this
	}
	
	Buffer.prototype.toString = function toString () {
	  var length = this.length
	  if (length === 0) return ''
	  if (arguments.length === 0) return utf8Slice(this, 0, length)
	  return slowToString.apply(this, arguments)
	}
	
	Buffer.prototype.equals = function equals (b) {
	  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
	  if (this === b) return true
	  return Buffer.compare(this, b) === 0
	}
	
	Buffer.prototype.inspect = function inspect () {
	  var str = ''
	  var max = exports.INSPECT_MAX_BYTES
	  if (this.length > 0) {
	    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
	    if (this.length > max) str += ' ... '
	  }
	  return '<Buffer ' + str + '>'
	}
	
	Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
	  if (!Buffer.isBuffer(target)) {
	    throw new TypeError('Argument must be a Buffer')
	  }
	
	  if (start === undefined) {
	    start = 0
	  }
	  if (end === undefined) {
	    end = target ? target.length : 0
	  }
	  if (thisStart === undefined) {
	    thisStart = 0
	  }
	  if (thisEnd === undefined) {
	    thisEnd = this.length
	  }
	
	  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
	    throw new RangeError('out of range index')
	  }
	
	  if (thisStart >= thisEnd && start >= end) {
	    return 0
	  }
	  if (thisStart >= thisEnd) {
	    return -1
	  }
	  if (start >= end) {
	    return 1
	  }
	
	  start >>>= 0
	  end >>>= 0
	  thisStart >>>= 0
	  thisEnd >>>= 0
	
	  if (this === target) return 0
	
	  var x = thisEnd - thisStart
	  var y = end - start
	  var len = Math.min(x, y)
	
	  var thisCopy = this.slice(thisStart, thisEnd)
	  var targetCopy = target.slice(start, end)
	
	  for (var i = 0; i < len; ++i) {
	    if (thisCopy[i] !== targetCopy[i]) {
	      x = thisCopy[i]
	      y = targetCopy[i]
	      break
	    }
	  }
	
	  if (x < y) return -1
	  if (y < x) return 1
	  return 0
	}
	
	// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
	// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
	//
	// Arguments:
	// - buffer - a Buffer to search
	// - val - a string, Buffer, or number
	// - byteOffset - an index into `buffer`; will be clamped to an int32
	// - encoding - an optional encoding, relevant is val is a string
	// - dir - true for indexOf, false for lastIndexOf
	function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
	  // Empty buffer means no match
	  if (buffer.length === 0) return -1
	
	  // Normalize byteOffset
	  if (typeof byteOffset === 'string') {
	    encoding = byteOffset
	    byteOffset = 0
	  } else if (byteOffset > 0x7fffffff) {
	    byteOffset = 0x7fffffff
	  } else if (byteOffset < -0x80000000) {
	    byteOffset = -0x80000000
	  }
	  byteOffset = +byteOffset  // Coerce to Number.
	  if (numberIsNaN(byteOffset)) {
	    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
	    byteOffset = dir ? 0 : (buffer.length - 1)
	  }
	
	  // Normalize byteOffset: negative offsets start from the end of the buffer
	  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
	  if (byteOffset >= buffer.length) {
	    if (dir) return -1
	    else byteOffset = buffer.length - 1
	  } else if (byteOffset < 0) {
	    if (dir) byteOffset = 0
	    else return -1
	  }
	
	  // Normalize val
	  if (typeof val === 'string') {
	    val = Buffer.from(val, encoding)
	  }
	
	  // Finally, search either indexOf (if dir is true) or lastIndexOf
	  if (Buffer.isBuffer(val)) {
	    // Special case: looking for empty string/buffer always fails
	    if (val.length === 0) {
	      return -1
	    }
	    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
	  } else if (typeof val === 'number') {
	    val = val & 0xFF // Search for a byte value [0-255]
	    if (typeof Uint8Array.prototype.indexOf === 'function') {
	      if (dir) {
	        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
	      } else {
	        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
	      }
	    }
	    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
	  }
	
	  throw new TypeError('val must be string, number or Buffer')
	}
	
	function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
	  var indexSize = 1
	  var arrLength = arr.length
	  var valLength = val.length
	
	  if (encoding !== undefined) {
	    encoding = String(encoding).toLowerCase()
	    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
	        encoding === 'utf16le' || encoding === 'utf-16le') {
	      if (arr.length < 2 || val.length < 2) {
	        return -1
	      }
	      indexSize = 2
	      arrLength /= 2
	      valLength /= 2
	      byteOffset /= 2
	    }
	  }
	
	  function read (buf, i) {
	    if (indexSize === 1) {
	      return buf[i]
	    } else {
	      return buf.readUInt16BE(i * indexSize)
	    }
	  }
	
	  var i
	  if (dir) {
	    var foundIndex = -1
	    for (i = byteOffset; i < arrLength; i++) {
	      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
	        if (foundIndex === -1) foundIndex = i
	        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
	      } else {
	        if (foundIndex !== -1) i -= i - foundIndex
	        foundIndex = -1
	      }
	    }
	  } else {
	    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
	    for (i = byteOffset; i >= 0; i--) {
	      var found = true
	      for (var j = 0; j < valLength; j++) {
	        if (read(arr, i + j) !== read(val, j)) {
	          found = false
	          break
	        }
	      }
	      if (found) return i
	    }
	  }
	
	  return -1
	}
	
	Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
	  return this.indexOf(val, byteOffset, encoding) !== -1
	}
	
	Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
	  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
	}
	
	Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
	  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
	}
	
	function hexWrite (buf, string, offset, length) {
	  offset = Number(offset) || 0
	  var remaining = buf.length - offset
	  if (!length) {
	    length = remaining
	  } else {
	    length = Number(length)
	    if (length > remaining) {
	      length = remaining
	    }
	  }
	
	  // must be an even number of digits
	  var strLen = string.length
	  if (strLen % 2 !== 0) throw new TypeError('Invalid hex string')
	
	  if (length > strLen / 2) {
	    length = strLen / 2
	  }
	  for (var i = 0; i < length; ++i) {
	    var parsed = parseInt(string.substr(i * 2, 2), 16)
	    if (numberIsNaN(parsed)) return i
	    buf[offset + i] = parsed
	  }
	  return i
	}
	
	function utf8Write (buf, string, offset, length) {
	  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
	}
	
	function asciiWrite (buf, string, offset, length) {
	  return blitBuffer(asciiToBytes(string), buf, offset, length)
	}
	
	function latin1Write (buf, string, offset, length) {
	  return asciiWrite(buf, string, offset, length)
	}
	
	function base64Write (buf, string, offset, length) {
	  return blitBuffer(base64ToBytes(string), buf, offset, length)
	}
	
	function ucs2Write (buf, string, offset, length) {
	  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
	}
	
	Buffer.prototype.write = function write (string, offset, length, encoding) {
	  // Buffer#write(string)
	  if (offset === undefined) {
	    encoding = 'utf8'
	    length = this.length
	    offset = 0
	  // Buffer#write(string, encoding)
	  } else if (length === undefined && typeof offset === 'string') {
	    encoding = offset
	    length = this.length
	    offset = 0
	  // Buffer#write(string, offset[, length][, encoding])
	  } else if (isFinite(offset)) {
	    offset = offset >>> 0
	    if (isFinite(length)) {
	      length = length >>> 0
	      if (encoding === undefined) encoding = 'utf8'
	    } else {
	      encoding = length
	      length = undefined
	    }
	  } else {
	    throw new Error(
	      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
	    )
	  }
	
	  var remaining = this.length - offset
	  if (length === undefined || length > remaining) length = remaining
	
	  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
	    throw new RangeError('Attempt to write outside buffer bounds')
	  }
	
	  if (!encoding) encoding = 'utf8'
	
	  var loweredCase = false
	  for (;;) {
	    switch (encoding) {
	      case 'hex':
	        return hexWrite(this, string, offset, length)
	
	      case 'utf8':
	      case 'utf-8':
	        return utf8Write(this, string, offset, length)
	
	      case 'ascii':
	        return asciiWrite(this, string, offset, length)
	
	      case 'latin1':
	      case 'binary':
	        return latin1Write(this, string, offset, length)
	
	      case 'base64':
	        // Warning: maxLength not taken into account in base64Write
	        return base64Write(this, string, offset, length)
	
	      case 'ucs2':
	      case 'ucs-2':
	      case 'utf16le':
	      case 'utf-16le':
	        return ucs2Write(this, string, offset, length)
	
	      default:
	        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
	        encoding = ('' + encoding).toLowerCase()
	        loweredCase = true
	    }
	  }
	}
	
	Buffer.prototype.toJSON = function toJSON () {
	  return {
	    type: 'Buffer',
	    data: Array.prototype.slice.call(this._arr || this, 0)
	  }
	}
	
	function base64Slice (buf, start, end) {
	  if (start === 0 && end === buf.length) {
	    return base64.fromByteArray(buf)
	  } else {
	    return base64.fromByteArray(buf.slice(start, end))
	  }
	}
	
	function utf8Slice (buf, start, end) {
	  end = Math.min(buf.length, end)
	  var res = []
	
	  var i = start
	  while (i < end) {
	    var firstByte = buf[i]
	    var codePoint = null
	    var bytesPerSequence = (firstByte > 0xEF) ? 4
	      : (firstByte > 0xDF) ? 3
	      : (firstByte > 0xBF) ? 2
	      : 1
	
	    if (i + bytesPerSequence <= end) {
	      var secondByte, thirdByte, fourthByte, tempCodePoint
	
	      switch (bytesPerSequence) {
	        case 1:
	          if (firstByte < 0x80) {
	            codePoint = firstByte
	          }
	          break
	        case 2:
	          secondByte = buf[i + 1]
	          if ((secondByte & 0xC0) === 0x80) {
	            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
	            if (tempCodePoint > 0x7F) {
	              codePoint = tempCodePoint
	            }
	          }
	          break
	        case 3:
	          secondByte = buf[i + 1]
	          thirdByte = buf[i + 2]
	          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
	            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
	            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
	              codePoint = tempCodePoint
	            }
	          }
	          break
	        case 4:
	          secondByte = buf[i + 1]
	          thirdByte = buf[i + 2]
	          fourthByte = buf[i + 3]
	          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
	            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
	            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
	              codePoint = tempCodePoint
	            }
	          }
	      }
	    }
	
	    if (codePoint === null) {
	      // we did not generate a valid codePoint so insert a
	      // replacement char (U+FFFD) and advance only 1 byte
	      codePoint = 0xFFFD
	      bytesPerSequence = 1
	    } else if (codePoint > 0xFFFF) {
	      // encode to utf16 (surrogate pair dance)
	      codePoint -= 0x10000
	      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
	      codePoint = 0xDC00 | codePoint & 0x3FF
	    }
	
	    res.push(codePoint)
	    i += bytesPerSequence
	  }
	
	  return decodeCodePointsArray(res)
	}
	
	// Based on http://stackoverflow.com/a/22747272/680742, the browser with
	// the lowest limit is Chrome, with 0x10000 args.
	// We go 1 magnitude less, for safety
	var MAX_ARGUMENTS_LENGTH = 0x1000
	
	function decodeCodePointsArray (codePoints) {
	  var len = codePoints.length
	  if (len <= MAX_ARGUMENTS_LENGTH) {
	    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
	  }
	
	  // Decode in chunks to avoid "call stack size exceeded".
	  var res = ''
	  var i = 0
	  while (i < len) {
	    res += String.fromCharCode.apply(
	      String,
	      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
	    )
	  }
	  return res
	}
	
	function asciiSlice (buf, start, end) {
	  var ret = ''
	  end = Math.min(buf.length, end)
	
	  for (var i = start; i < end; ++i) {
	    ret += String.fromCharCode(buf[i] & 0x7F)
	  }
	  return ret
	}
	
	function latin1Slice (buf, start, end) {
	  var ret = ''
	  end = Math.min(buf.length, end)
	
	  for (var i = start; i < end; ++i) {
	    ret += String.fromCharCode(buf[i])
	  }
	  return ret
	}
	
	function hexSlice (buf, start, end) {
	  var len = buf.length
	
	  if (!start || start < 0) start = 0
	  if (!end || end < 0 || end > len) end = len
	
	  var out = ''
	  for (var i = start; i < end; ++i) {
	    out += toHex(buf[i])
	  }
	  return out
	}
	
	function utf16leSlice (buf, start, end) {
	  var bytes = buf.slice(start, end)
	  var res = ''
	  for (var i = 0; i < bytes.length; i += 2) {
	    res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
	  }
	  return res
	}
	
	Buffer.prototype.slice = function slice (start, end) {
	  var len = this.length
	  start = ~~start
	  end = end === undefined ? len : ~~end
	
	  if (start < 0) {
	    start += len
	    if (start < 0) start = 0
	  } else if (start > len) {
	    start = len
	  }
	
	  if (end < 0) {
	    end += len
	    if (end < 0) end = 0
	  } else if (end > len) {
	    end = len
	  }
	
	  if (end < start) end = start
	
	  var newBuf = this.subarray(start, end)
	  // Return an augmented `Uint8Array` instance
	  newBuf.__proto__ = Buffer.prototype
	  return newBuf
	}
	
	/*
	 * Need to make sure that buffer isn't trying to write out of bounds.
	 */
	function checkOffset (offset, ext, length) {
	  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
	  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
	}
	
	Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
	  offset = offset >>> 0
	  byteLength = byteLength >>> 0
	  if (!noAssert) checkOffset(offset, byteLength, this.length)
	
	  var val = this[offset]
	  var mul = 1
	  var i = 0
	  while (++i < byteLength && (mul *= 0x100)) {
	    val += this[offset + i] * mul
	  }
	
	  return val
	}
	
	Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
	  offset = offset >>> 0
	  byteLength = byteLength >>> 0
	  if (!noAssert) {
	    checkOffset(offset, byteLength, this.length)
	  }
	
	  var val = this[offset + --byteLength]
	  var mul = 1
	  while (byteLength > 0 && (mul *= 0x100)) {
	    val += this[offset + --byteLength] * mul
	  }
	
	  return val
	}
	
	Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
	  offset = offset >>> 0
	  if (!noAssert) checkOffset(offset, 1, this.length)
	  return this[offset]
	}
	
	Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
	  offset = offset >>> 0
	  if (!noAssert) checkOffset(offset, 2, this.length)
	  return this[offset] | (this[offset + 1] << 8)
	}
	
	Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
	  offset = offset >>> 0
	  if (!noAssert) checkOffset(offset, 2, this.length)
	  return (this[offset] << 8) | this[offset + 1]
	}
	
	Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
	  offset = offset >>> 0
	  if (!noAssert) checkOffset(offset, 4, this.length)
	
	  return ((this[offset]) |
	      (this[offset + 1] << 8) |
	      (this[offset + 2] << 16)) +
	      (this[offset + 3] * 0x1000000)
	}
	
	Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
	  offset = offset >>> 0
	  if (!noAssert) checkOffset(offset, 4, this.length)
	
	  return (this[offset] * 0x1000000) +
	    ((this[offset + 1] << 16) |
	    (this[offset + 2] << 8) |
	    this[offset + 3])
	}
	
	Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
	  offset = offset >>> 0
	  byteLength = byteLength >>> 0
	  if (!noAssert) checkOffset(offset, byteLength, this.length)
	
	  var val = this[offset]
	  var mul = 1
	  var i = 0
	  while (++i < byteLength && (mul *= 0x100)) {
	    val += this[offset + i] * mul
	  }
	  mul *= 0x80
	
	  if (val >= mul) val -= Math.pow(2, 8 * byteLength)
	
	  return val
	}
	
	Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
	  offset = offset >>> 0
	  byteLength = byteLength >>> 0
	  if (!noAssert) checkOffset(offset, byteLength, this.length)
	
	  var i = byteLength
	  var mul = 1
	  var val = this[offset + --i]
	  while (i > 0 && (mul *= 0x100)) {
	    val += this[offset + --i] * mul
	  }
	  mul *= 0x80
	
	  if (val >= mul) val -= Math.pow(2, 8 * byteLength)
	
	  return val
	}
	
	Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
	  offset = offset >>> 0
	  if (!noAssert) checkOffset(offset, 1, this.length)
	  if (!(this[offset] & 0x80)) return (this[offset])
	  return ((0xff - this[offset] + 1) * -1)
	}
	
	Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
	  offset = offset >>> 0
	  if (!noAssert) checkOffset(offset, 2, this.length)
	  var val = this[offset] | (this[offset + 1] << 8)
	  return (val & 0x8000) ? val | 0xFFFF0000 : val
	}
	
	Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
	  offset = offset >>> 0
	  if (!noAssert) checkOffset(offset, 2, this.length)
	  var val = this[offset + 1] | (this[offset] << 8)
	  return (val & 0x8000) ? val | 0xFFFF0000 : val
	}
	
	Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
	  offset = offset >>> 0
	  if (!noAssert) checkOffset(offset, 4, this.length)
	
	  return (this[offset]) |
	    (this[offset + 1] << 8) |
	    (this[offset + 2] << 16) |
	    (this[offset + 3] << 24)
	}
	
	Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
	  offset = offset >>> 0
	  if (!noAssert) checkOffset(offset, 4, this.length)
	
	  return (this[offset] << 24) |
	    (this[offset + 1] << 16) |
	    (this[offset + 2] << 8) |
	    (this[offset + 3])
	}
	
	Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
	  offset = offset >>> 0
	  if (!noAssert) checkOffset(offset, 4, this.length)
	  return ieee754.read(this, offset, true, 23, 4)
	}
	
	Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
	  offset = offset >>> 0
	  if (!noAssert) checkOffset(offset, 4, this.length)
	  return ieee754.read(this, offset, false, 23, 4)
	}
	
	Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
	  offset = offset >>> 0
	  if (!noAssert) checkOffset(offset, 8, this.length)
	  return ieee754.read(this, offset, true, 52, 8)
	}
	
	Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
	  offset = offset >>> 0
	  if (!noAssert) checkOffset(offset, 8, this.length)
	  return ieee754.read(this, offset, false, 52, 8)
	}
	
	function checkInt (buf, value, offset, ext, max, min) {
	  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
	  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
	  if (offset + ext > buf.length) throw new RangeError('Index out of range')
	}
	
	Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
	  value = +value
	  offset = offset >>> 0
	  byteLength = byteLength >>> 0
	  if (!noAssert) {
	    var maxBytes = Math.pow(2, 8 * byteLength) - 1
	    checkInt(this, value, offset, byteLength, maxBytes, 0)
	  }
	
	  var mul = 1
	  var i = 0
	  this[offset] = value & 0xFF
	  while (++i < byteLength && (mul *= 0x100)) {
	    this[offset + i] = (value / mul) & 0xFF
	  }
	
	  return offset + byteLength
	}
	
	Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
	  value = +value
	  offset = offset >>> 0
	  byteLength = byteLength >>> 0
	  if (!noAssert) {
	    var maxBytes = Math.pow(2, 8 * byteLength) - 1
	    checkInt(this, value, offset, byteLength, maxBytes, 0)
	  }
	
	  var i = byteLength - 1
	  var mul = 1
	  this[offset + i] = value & 0xFF
	  while (--i >= 0 && (mul *= 0x100)) {
	    this[offset + i] = (value / mul) & 0xFF
	  }
	
	  return offset + byteLength
	}
	
	Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
	  value = +value
	  offset = offset >>> 0
	  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
	  this[offset] = (value & 0xff)
	  return offset + 1
	}
	
	Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
	  value = +value
	  offset = offset >>> 0
	  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
	  this[offset] = (value & 0xff)
	  this[offset + 1] = (value >>> 8)
	  return offset + 2
	}
	
	Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
	  value = +value
	  offset = offset >>> 0
	  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
	  this[offset] = (value >>> 8)
	  this[offset + 1] = (value & 0xff)
	  return offset + 2
	}
	
	Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
	  value = +value
	  offset = offset >>> 0
	  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
	  this[offset + 3] = (value >>> 24)
	  this[offset + 2] = (value >>> 16)
	  this[offset + 1] = (value >>> 8)
	  this[offset] = (value & 0xff)
	  return offset + 4
	}
	
	Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
	  value = +value
	  offset = offset >>> 0
	  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
	  this[offset] = (value >>> 24)
	  this[offset + 1] = (value >>> 16)
	  this[offset + 2] = (value >>> 8)
	  this[offset + 3] = (value & 0xff)
	  return offset + 4
	}
	
	Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
	  value = +value
	  offset = offset >>> 0
	  if (!noAssert) {
	    var limit = Math.pow(2, (8 * byteLength) - 1)
	
	    checkInt(this, value, offset, byteLength, limit - 1, -limit)
	  }
	
	  var i = 0
	  var mul = 1
	  var sub = 0
	  this[offset] = value & 0xFF
	  while (++i < byteLength && (mul *= 0x100)) {
	    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
	      sub = 1
	    }
	    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
	  }
	
	  return offset + byteLength
	}
	
	Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
	  value = +value
	  offset = offset >>> 0
	  if (!noAssert) {
	    var limit = Math.pow(2, (8 * byteLength) - 1)
	
	    checkInt(this, value, offset, byteLength, limit - 1, -limit)
	  }
	
	  var i = byteLength - 1
	  var mul = 1
	  var sub = 0
	  this[offset + i] = value & 0xFF
	  while (--i >= 0 && (mul *= 0x100)) {
	    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
	      sub = 1
	    }
	    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
	  }
	
	  return offset + byteLength
	}
	
	Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
	  value = +value
	  offset = offset >>> 0
	  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
	  if (value < 0) value = 0xff + value + 1
	  this[offset] = (value & 0xff)
	  return offset + 1
	}
	
	Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
	  value = +value
	  offset = offset >>> 0
	  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
	  this[offset] = (value & 0xff)
	  this[offset + 1] = (value >>> 8)
	  return offset + 2
	}
	
	Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
	  value = +value
	  offset = offset >>> 0
	  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
	  this[offset] = (value >>> 8)
	  this[offset + 1] = (value & 0xff)
	  return offset + 2
	}
	
	Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
	  value = +value
	  offset = offset >>> 0
	  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
	  this[offset] = (value & 0xff)
	  this[offset + 1] = (value >>> 8)
	  this[offset + 2] = (value >>> 16)
	  this[offset + 3] = (value >>> 24)
	  return offset + 4
	}
	
	Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
	  value = +value
	  offset = offset >>> 0
	  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
	  if (value < 0) value = 0xffffffff + value + 1
	  this[offset] = (value >>> 24)
	  this[offset + 1] = (value >>> 16)
	  this[offset + 2] = (value >>> 8)
	  this[offset + 3] = (value & 0xff)
	  return offset + 4
	}
	
	function checkIEEE754 (buf, value, offset, ext, max, min) {
	  if (offset + ext > buf.length) throw new RangeError('Index out of range')
	  if (offset < 0) throw new RangeError('Index out of range')
	}
	
	function writeFloat (buf, value, offset, littleEndian, noAssert) {
	  value = +value
	  offset = offset >>> 0
	  if (!noAssert) {
	    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
	  }
	  ieee754.write(buf, value, offset, littleEndian, 23, 4)
	  return offset + 4
	}
	
	Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
	  return writeFloat(this, value, offset, true, noAssert)
	}
	
	Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
	  return writeFloat(this, value, offset, false, noAssert)
	}
	
	function writeDouble (buf, value, offset, littleEndian, noAssert) {
	  value = +value
	  offset = offset >>> 0
	  if (!noAssert) {
	    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
	  }
	  ieee754.write(buf, value, offset, littleEndian, 52, 8)
	  return offset + 8
	}
	
	Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
	  return writeDouble(this, value, offset, true, noAssert)
	}
	
	Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
	  return writeDouble(this, value, offset, false, noAssert)
	}
	
	// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
	Buffer.prototype.copy = function copy (target, targetStart, start, end) {
	  if (!start) start = 0
	  if (!end && end !== 0) end = this.length
	  if (targetStart >= target.length) targetStart = target.length
	  if (!targetStart) targetStart = 0
	  if (end > 0 && end < start) end = start
	
	  // Copy 0 bytes; we're done
	  if (end === start) return 0
	  if (target.length === 0 || this.length === 0) return 0
	
	  // Fatal error conditions
	  if (targetStart < 0) {
	    throw new RangeError('targetStart out of bounds')
	  }
	  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
	  if (end < 0) throw new RangeError('sourceEnd out of bounds')
	
	  // Are we oob?
	  if (end > this.length) end = this.length
	  if (target.length - targetStart < end - start) {
	    end = target.length - targetStart + start
	  }
	
	  var len = end - start
	  var i
	
	  if (this === target && start < targetStart && targetStart < end) {
	    // descending copy from end
	    for (i = len - 1; i >= 0; --i) {
	      target[i + targetStart] = this[i + start]
	    }
	  } else if (len < 1000) {
	    // ascending copy from start
	    for (i = 0; i < len; ++i) {
	      target[i + targetStart] = this[i + start]
	    }
	  } else {
	    Uint8Array.prototype.set.call(
	      target,
	      this.subarray(start, start + len),
	      targetStart
	    )
	  }
	
	  return len
	}
	
	// Usage:
	//    buffer.fill(number[, offset[, end]])
	//    buffer.fill(buffer[, offset[, end]])
	//    buffer.fill(string[, offset[, end]][, encoding])
	Buffer.prototype.fill = function fill (val, start, end, encoding) {
	  // Handle string cases:
	  if (typeof val === 'string') {
	    if (typeof start === 'string') {
	      encoding = start
	      start = 0
	      end = this.length
	    } else if (typeof end === 'string') {
	      encoding = end
	      end = this.length
	    }
	    if (val.length === 1) {
	      var code = val.charCodeAt(0)
	      if (code < 256) {
	        val = code
	      }
	    }
	    if (encoding !== undefined && typeof encoding !== 'string') {
	      throw new TypeError('encoding must be a string')
	    }
	    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
	      throw new TypeError('Unknown encoding: ' + encoding)
	    }
	  } else if (typeof val === 'number') {
	    val = val & 255
	  }
	
	  // Invalid ranges are not set to a default, so can range check early.
	  if (start < 0 || this.length < start || this.length < end) {
	    throw new RangeError('Out of range index')
	  }
	
	  if (end <= start) {
	    return this
	  }
	
	  start = start >>> 0
	  end = end === undefined ? this.length : end >>> 0
	
	  if (!val) val = 0
	
	  var i
	  if (typeof val === 'number') {
	    for (i = start; i < end; ++i) {
	      this[i] = val
	    }
	  } else {
	    var bytes = Buffer.isBuffer(val)
	      ? val
	      : new Buffer(val, encoding)
	    var len = bytes.length
	    for (i = 0; i < end - start; ++i) {
	      this[i + start] = bytes[i % len]
	    }
	  }
	
	  return this
	}
	
	// HELPER FUNCTIONS
	// ================
	
	var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g
	
	function base64clean (str) {
	  // Node strips out invalid characters like \n and \t from the string, base64-js does not
	  str = str.trim().replace(INVALID_BASE64_RE, '')
	  // Node converts strings with length < 2 to ''
	  if (str.length < 2) return ''
	  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
	  while (str.length % 4 !== 0) {
	    str = str + '='
	  }
	  return str
	}
	
	function toHex (n) {
	  if (n < 16) return '0' + n.toString(16)
	  return n.toString(16)
	}
	
	function utf8ToBytes (string, units) {
	  units = units || Infinity
	  var codePoint
	  var length = string.length
	  var leadSurrogate = null
	  var bytes = []
	
	  for (var i = 0; i < length; ++i) {
	    codePoint = string.charCodeAt(i)
	
	    // is surrogate component
	    if (codePoint > 0xD7FF && codePoint < 0xE000) {
	      // last char was a lead
	      if (!leadSurrogate) {
	        // no lead yet
	        if (codePoint > 0xDBFF) {
	          // unexpected trail
	          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
	          continue
	        } else if (i + 1 === length) {
	          // unpaired lead
	          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
	          continue
	        }
	
	        // valid lead
	        leadSurrogate = codePoint
	
	        continue
	      }
	
	      // 2 leads in a row
	      if (codePoint < 0xDC00) {
	        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
	        leadSurrogate = codePoint
	        continue
	      }
	
	      // valid surrogate pair
	      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
	    } else if (leadSurrogate) {
	      // valid bmp char, but last char was a lead
	      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
	    }
	
	    leadSurrogate = null
	
	    // encode utf8
	    if (codePoint < 0x80) {
	      if ((units -= 1) < 0) break
	      bytes.push(codePoint)
	    } else if (codePoint < 0x800) {
	      if ((units -= 2) < 0) break
	      bytes.push(
	        codePoint >> 0x6 | 0xC0,
	        codePoint & 0x3F | 0x80
	      )
	    } else if (codePoint < 0x10000) {
	      if ((units -= 3) < 0) break
	      bytes.push(
	        codePoint >> 0xC | 0xE0,
	        codePoint >> 0x6 & 0x3F | 0x80,
	        codePoint & 0x3F | 0x80
	      )
	    } else if (codePoint < 0x110000) {
	      if ((units -= 4) < 0) break
	      bytes.push(
	        codePoint >> 0x12 | 0xF0,
	        codePoint >> 0xC & 0x3F | 0x80,
	        codePoint >> 0x6 & 0x3F | 0x80,
	        codePoint & 0x3F | 0x80
	      )
	    } else {
	      throw new Error('Invalid code point')
	    }
	  }
	
	  return bytes
	}
	
	function asciiToBytes (str) {
	  var byteArray = []
	  for (var i = 0; i < str.length; ++i) {
	    // Node's code seems to be doing this and not & 0x7F..
	    byteArray.push(str.charCodeAt(i) & 0xFF)
	  }
	  return byteArray
	}
	
	function utf16leToBytes (str, units) {
	  var c, hi, lo
	  var byteArray = []
	  for (var i = 0; i < str.length; ++i) {
	    if ((units -= 2) < 0) break
	
	    c = str.charCodeAt(i)
	    hi = c >> 8
	    lo = c % 256
	    byteArray.push(lo)
	    byteArray.push(hi)
	  }
	
	  return byteArray
	}
	
	function base64ToBytes (str) {
	  return base64.toByteArray(base64clean(str))
	}
	
	function blitBuffer (src, dst, offset, length) {
	  for (var i = 0; i < length; ++i) {
	    if ((i + offset >= dst.length) || (i >= src.length)) break
	    dst[i + offset] = src[i]
	  }
	  return i
	}
	
	// ArrayBuffers from another context (i.e. an iframe) do not pass the `instanceof` check
	// but they should be treated as valid. See: https://github.com/feross/buffer/issues/166
	function isArrayBuffer (obj) {
	  return obj instanceof ArrayBuffer ||
	    (obj != null && obj.constructor != null && obj.constructor.name === 'ArrayBuffer' &&
	      typeof obj.byteLength === 'number')
	}
	
	// Node 0.10 supports `ArrayBuffer` but lacks `ArrayBuffer.isView`
	function isArrayBufferView (obj) {
	  return (typeof ArrayBuffer.isView === 'function') && ArrayBuffer.isView(obj)
	}
	
	function numberIsNaN (obj) {
	  return obj !== obj // eslint-disable-line no-self-compare
	}
	
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(1)))

/***/ },
/* 3 */
/***/ function(module, exports) {

	'use strict'
	
	exports.byteLength = byteLength
	exports.toByteArray = toByteArray
	exports.fromByteArray = fromByteArray
	
	var lookup = []
	var revLookup = []
	var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array
	
	var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
	for (var i = 0, len = code.length; i < len; ++i) {
	  lookup[i] = code[i]
	  revLookup[code.charCodeAt(i)] = i
	}
	
	revLookup['-'.charCodeAt(0)] = 62
	revLookup['_'.charCodeAt(0)] = 63
	
	function placeHoldersCount (b64) {
	  var len = b64.length
	  if (len % 4 > 0) {
	    throw new Error('Invalid string. Length must be a multiple of 4')
	  }
	
	  // the number of equal signs (place holders)
	  // if there are two placeholders, than the two characters before it
	  // represent one byte
	  // if there is only one, then the three characters before it represent 2 bytes
	  // this is just a cheap hack to not do indexOf twice
	  return b64[len - 2] === '=' ? 2 : b64[len - 1] === '=' ? 1 : 0
	}
	
	function byteLength (b64) {
	  // base64 is 4/3 + up to two characters of the original data
	  return b64.length * 3 / 4 - placeHoldersCount(b64)
	}
	
	function toByteArray (b64) {
	  var i, j, l, tmp, placeHolders, arr
	  var len = b64.length
	  placeHolders = placeHoldersCount(b64)
	
	  arr = new Arr(len * 3 / 4 - placeHolders)
	
	  // if there are placeholders, only get up to the last complete 4 chars
	  l = placeHolders > 0 ? len - 4 : len
	
	  var L = 0
	
	  for (i = 0, j = 0; i < l; i += 4, j += 3) {
	    tmp = (revLookup[b64.charCodeAt(i)] << 18) | (revLookup[b64.charCodeAt(i + 1)] << 12) | (revLookup[b64.charCodeAt(i + 2)] << 6) | revLookup[b64.charCodeAt(i + 3)]
	    arr[L++] = (tmp >> 16) & 0xFF
	    arr[L++] = (tmp >> 8) & 0xFF
	    arr[L++] = tmp & 0xFF
	  }
	
	  if (placeHolders === 2) {
	    tmp = (revLookup[b64.charCodeAt(i)] << 2) | (revLookup[b64.charCodeAt(i + 1)] >> 4)
	    arr[L++] = tmp & 0xFF
	  } else if (placeHolders === 1) {
	    tmp = (revLookup[b64.charCodeAt(i)] << 10) | (revLookup[b64.charCodeAt(i + 1)] << 4) | (revLookup[b64.charCodeAt(i + 2)] >> 2)
	    arr[L++] = (tmp >> 8) & 0xFF
	    arr[L++] = tmp & 0xFF
	  }
	
	  return arr
	}
	
	function tripletToBase64 (num) {
	  return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F]
	}
	
	function encodeChunk (uint8, start, end) {
	  var tmp
	  var output = []
	  for (var i = start; i < end; i += 3) {
	    tmp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
	    output.push(tripletToBase64(tmp))
	  }
	  return output.join('')
	}
	
	function fromByteArray (uint8) {
	  var tmp
	  var len = uint8.length
	  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
	  var output = ''
	  var parts = []
	  var maxChunkLength = 16383 // must be multiple of 3
	
	  // go through the array every three bytes, we'll deal with trailing stuff later
	  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
	    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
	  }
	
	  // pad the end with zeros, but make sure to not forget the extra bytes
	  if (extraBytes === 1) {
	    tmp = uint8[len - 1]
	    output += lookup[tmp >> 2]
	    output += lookup[(tmp << 4) & 0x3F]
	    output += '=='
	  } else if (extraBytes === 2) {
	    tmp = (uint8[len - 2] << 8) + (uint8[len - 1])
	    output += lookup[tmp >> 10]
	    output += lookup[(tmp >> 4) & 0x3F]
	    output += lookup[(tmp << 2) & 0x3F]
	    output += '='
	  }
	
	  parts.push(output)
	
	  return parts.join('')
	}


/***/ },
/* 4 */
/***/ function(module, exports) {

	exports.read = function (buffer, offset, isLE, mLen, nBytes) {
	  var e, m
	  var eLen = nBytes * 8 - mLen - 1
	  var eMax = (1 << eLen) - 1
	  var eBias = eMax >> 1
	  var nBits = -7
	  var i = isLE ? (nBytes - 1) : 0
	  var d = isLE ? -1 : 1
	  var s = buffer[offset + i]
	
	  i += d
	
	  e = s & ((1 << (-nBits)) - 1)
	  s >>= (-nBits)
	  nBits += eLen
	  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}
	
	  m = e & ((1 << (-nBits)) - 1)
	  e >>= (-nBits)
	  nBits += mLen
	  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}
	
	  if (e === 0) {
	    e = 1 - eBias
	  } else if (e === eMax) {
	    return m ? NaN : ((s ? -1 : 1) * Infinity)
	  } else {
	    m = m + Math.pow(2, mLen)
	    e = e - eBias
	  }
	  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
	}
	
	exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
	  var e, m, c
	  var eLen = nBytes * 8 - mLen - 1
	  var eMax = (1 << eLen) - 1
	  var eBias = eMax >> 1
	  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
	  var i = isLE ? 0 : (nBytes - 1)
	  var d = isLE ? 1 : -1
	  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0
	
	  value = Math.abs(value)
	
	  if (isNaN(value) || value === Infinity) {
	    m = isNaN(value) ? 1 : 0
	    e = eMax
	  } else {
	    e = Math.floor(Math.log(value) / Math.LN2)
	    if (value * (c = Math.pow(2, -e)) < 1) {
	      e--
	      c *= 2
	    }
	    if (e + eBias >= 1) {
	      value += rt / c
	    } else {
	      value += rt * Math.pow(2, 1 - eBias)
	    }
	    if (value * c >= 2) {
	      e++
	      c /= 2
	    }
	
	    if (e + eBias >= eMax) {
	      m = 0
	      e = eMax
	    } else if (e + eBias >= 1) {
	      m = (value * c - 1) * Math.pow(2, mLen)
	      e = e + eBias
	    } else {
	      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
	      e = 0
	    }
	  }
	
	  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}
	
	  e = (e << mLen) | m
	  eLen += mLen
	  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}
	
	  buffer[offset + i - d] |= s * 128
	}


/***/ },
/* 5 */
/***/ function(module, exports) {

	module.exports = function(module) {
		if(!module.webpackPolyfill) {
			module.deprecate = function() {};
			module.paths = [];
			// module.parent = undefined by default
			module.children = [];
			module.webpackPolyfill = 1;
		}
		return module;
	}


/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var Process = __webpack_require__(7);
	var process = new Process(), processProxy = {};
	function defineKey(key) {
	    if (processProxy[key]) {
	        // Probably a builtin Object property we don't care about.
	        return;
	    }
	    if (typeof process[key] === 'function') {
	        processProxy[key] = function () {
	            return process[key].apply(process, arguments);
	        };
	    }
	    else {
	        processProxy[key] = process[key];
	    }
	}
	for (var key in process) {
	    // Don't check if process.hasOwnProperty; we want to also expose objects
	    // up the prototype hierarchy.
	    defineKey(key);
	}
	// Special key: Ensure we update public-facing values of stdin/stdout/stderr.
	processProxy.initializeTTYs = function () {
	    if (process.stdin === null) {
	        process.initializeTTYs();
	        processProxy.stdin = process.stdin;
	        processProxy.stdout = process.stdout;
	        processProxy.stderr = process.stderr;
	    }
	};
	process.nextTick(function () {
	    processProxy.initializeTTYs();
	});
	module.exports = processProxy;


/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(__dirname) {"use strict";
	var __extends = (this && this.__extends) || function (d, b) {
	    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	};
	var events = __webpack_require__(8);
	// Path depends on process. Avoid a circular reference by dynamically including path when we need it.
	var path = null;
	var Item = (function () {
	    function Item(fun, array) {
	        this.fun = fun;
	        this.array = array;
	    }
	    Item.prototype.run = function () {
	        this.fun.apply(null, this.array);
	    };
	    return Item;
	}());
	/**
	 * Contains a queue of Items for process.nextTick.
	 * Inspired by node-process: https://github.com/defunctzombie/node-process
	 */
	var NextTickQueue = (function () {
	    function NextTickQueue() {
	        this._queue = [];
	        this._draining = false;
	        // Used/assigned by the drainQueue function.
	        this._currentQueue = null;
	        this._queueIndex = -1;
	    }
	    NextTickQueue.prototype.push = function (item) {
	        var _this = this;
	        if (this._queue.push(item) === 1 && !this._draining) {
	            setTimeout(function () { return _this._drainQueue(); }, 0);
	        }
	    };
	    NextTickQueue.prototype._cleanUpNextTick = function () {
	        this._draining = false;
	        if (this._currentQueue && this._currentQueue.length) {
	            this._queue = this._currentQueue.concat(this._queue);
	        }
	        else {
	            this._queueIndex = -1;
	        }
	        if (this._queue.length) {
	            this._drainQueue();
	        }
	    };
	    NextTickQueue.prototype._drainQueue = function () {
	        var _this = this;
	        if (this._draining) {
	            return;
	        }
	        // If an Item throws an unhandled exception, this function will clean things up.
	        var timeout = setTimeout(function () { return _this._cleanUpNextTick(); });
	        this._draining = true;
	        var len = this._queue.length;
	        while (len) {
	            this._currentQueue = this._queue;
	            this._queue = [];
	            while (++this._queueIndex < len) {
	                if (this._currentQueue) {
	                    this._currentQueue[this._queueIndex].run();
	                }
	            }
	            this._queueIndex = -1;
	            len = this._queue.length;
	        }
	        this._currentQueue = null;
	        this._draining = false;
	        clearTimeout(timeout);
	    };
	    return NextTickQueue;
	}());
	/**
	 * Partial implementation of Node's `process` module.
	 * We implement the portions that are relevant for the filesystem.
	 * @see http://nodejs.org/api/process.html
	 * @class
	 */
	var Process = (function (_super) {
	    __extends(Process, _super);
	    function Process() {
	        _super.apply(this, arguments);
	        this.startTime = Date.now();
	        this._cwd = '/';
	        /**
	         * Returns what platform you are running on.
	         * @return [String]
	         */
	        this.platform = 'browser';
	        this.argv = [];
	        this.execArgv = [];
	        this.stdout = null;
	        this.stderr = null;
	        this.stdin = null;
	        this.domain = null;
	        this._queue = new NextTickQueue();
	        this.execPath = __dirname;
	        this.env = {};
	        this.exitCode = 0;
	        this._gid = 1;
	        this._uid = 1;
	        this.version = 'v5.0';
	        this.versions = {
	            http_parser: '0.0',
	            node: '5.0',
	            v8: '0.0',
	            uv: '0.0',
	            zlib: '0.0',
	            ares: '0.0',
	            icu: '0.0',
	            modules: '0',
	            openssl: '0.0'
	        };
	        this.config = {
	            target_defaults: { cflags: [],
	                default_configuration: 'Release',
	                defines: [],
	                include_dirs: [],
	                libraries: [] },
	            variables: { clang: 0,
	                host_arch: 'x32',
	                node_install_npm: false,
	                node_install_waf: false,
	                node_prefix: '',
	                node_shared_cares: false,
	                node_shared_http_parser: false,
	                node_shared_libuv: false,
	                node_shared_zlib: false,
	                node_shared_v8: false,
	                node_use_dtrace: false,
	                node_use_etw: false,
	                node_use_openssl: false,
	                node_shared_openssl: false,
	                strict_aliasing: false,
	                target_arch: 'x32',
	                v8_use_snapshot: false,
	                v8_no_strict_aliasing: 0,
	                visibility: '' } };
	        this.pid = (Math.random() * 1000) | 0;
	        this.title = 'node';
	        this.arch = 'x32';
	        this._mask = 18;
	        // Undefined in main thread. Worker-only.
	        this.connected = undefined;
	    }
	    /**
	     * Changes the current working directory.
	     *
	     * **Note**: BrowserFS does not validate that the directory actually exists.
	     *
	     * @example Usage example
	     *   console.log('Starting directory: ' + process.cwd());
	     *   process.chdir('/tmp');
	     *   console.log('New directory: ' + process.cwd());
	     * @param [String] dir The directory to change to.
	     */
	    Process.prototype.chdir = function (dir) {
	        // XXX: Circular dependency hack.
	        if (path === null) {
	            path = __webpack_require__(9);
	        }
	        this._cwd = path.resolve(dir);
	    };
	    /**
	     * Returns the current working directory.
	     * @example Usage example
	     *   console.log('Current directory: ' + process.cwd());
	     * @return [String] The current working directory.
	     */
	    Process.prototype.cwd = function () {
	        return this._cwd;
	    };
	    /**
	     * Number of seconds BrowserFS has been running.
	     * @return [Number]
	     */
	    Process.prototype.uptime = function () {
	        return ((Date.now() - this.startTime) / 1000) | 0;
	    };
	    Process.prototype.nextTick = function (fun) {
	        var args = [];
	        for (var _i = 1; _i < arguments.length; _i++) {
	            args[_i - 1] = arguments[_i];
	        }
	        this._queue.push(new Item(fun, args));
	    };
	    Process.prototype.abort = function () {
	        this.emit('abort');
	    };
	    Process.prototype.exit = function (code) {
	        this.exitCode = code;
	        this.emit('exit', [code]);
	    };
	    Process.prototype.getgid = function () {
	        return this._gid;
	    };
	    Process.prototype.setgid = function (gid) {
	        if (typeof gid === 'number') {
	            this._gid = gid;
	        }
	        else {
	            this._gid = 1;
	        }
	    };
	    Process.prototype.getuid = function () {
	        return this._uid;
	    };
	    Process.prototype.setuid = function (uid) {
	        if (typeof uid === 'number') {
	            this._uid = uid;
	        }
	        else {
	            this._uid = 1;
	        }
	    };
	    Process.prototype.kill = function (pid, signal) {
	        this.emit('kill', [pid, signal]);
	    };
	    Process.prototype.memoryUsage = function () {
	        return { rss: 0, heapTotal: 0, heapUsed: 0 };
	    };
	    Process.prototype.umask = function (mask) {
	        if (mask === void 0) { mask = this._mask; }
	        var oldMask = this._mask;
	        this._mask = mask;
	        this.emit('umask', [mask]);
	        return oldMask;
	    };
	    Process.prototype.hrtime = function () {
	        var timeinfo;
	        if (typeof performance !== 'undefined') {
	            timeinfo = performance.now();
	        }
	        else if (Date['now']) {
	            timeinfo = Date.now();
	        }
	        else {
	            timeinfo = (new Date()).getTime();
	        }
	        var secs = (timeinfo / 1000) | 0;
	        timeinfo -= secs * 1000;
	        timeinfo = (timeinfo * 1000000) | 0;
	        return [secs, timeinfo];
	    };
	    /**
	     * [BFS only] Initialize the TTY devices.
	     */
	    Process.prototype.initializeTTYs = function () {
	        // Guard against multiple invocations.
	        if (this.stdout === null) {
	            var TTY = __webpack_require__(10);
	            this.stdout = new TTY();
	            this.stderr = new TTY();
	            this.stdin = new TTY();
	        }
	    };
	    /**
	     * Worker-only function; irrelevant here.
	     */
	    Process.prototype.disconnect = function () {
	    };
	    return Process;
	}(events.EventEmitter));
	module.exports = Process;
	
	/* WEBPACK VAR INJECTION */}.call(exports, "/"))

/***/ },
/* 8 */
/***/ function(module, exports) {

	// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.
	
	function EventEmitter() {
	  this._events = this._events || {};
	  this._maxListeners = this._maxListeners || undefined;
	}
	module.exports = EventEmitter;
	
	// Backwards-compat with node 0.10.x
	EventEmitter.EventEmitter = EventEmitter;
	
	EventEmitter.prototype._events = undefined;
	EventEmitter.prototype._maxListeners = undefined;
	
	// By default EventEmitters will print a warning if more than 10 listeners are
	// added to it. This is a useful default which helps finding memory leaks.
	EventEmitter.defaultMaxListeners = 10;
	
	// Obviously not all Emitters should be limited to 10. This function allows
	// that to be increased. Set to zero for unlimited.
	EventEmitter.prototype.setMaxListeners = function(n) {
	  if (!isNumber(n) || n < 0 || isNaN(n))
	    throw TypeError('n must be a positive number');
	  this._maxListeners = n;
	  return this;
	};
	
	EventEmitter.prototype.emit = function(type) {
	  var er, handler, len, args, i, listeners;
	
	  if (!this._events)
	    this._events = {};
	
	  // If there is no 'error' event listener then throw.
	  if (type === 'error') {
	    if (!this._events.error ||
	        (isObject(this._events.error) && !this._events.error.length)) {
	      er = arguments[1];
	      if (er instanceof Error) {
	        throw er; // Unhandled 'error' event
	      } else {
	        // At least give some kind of context to the user
	        var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
	        err.context = er;
	        throw err;
	      }
	    }
	  }
	
	  handler = this._events[type];
	
	  if (isUndefined(handler))
	    return false;
	
	  if (isFunction(handler)) {
	    switch (arguments.length) {
	      // fast cases
	      case 1:
	        handler.call(this);
	        break;
	      case 2:
	        handler.call(this, arguments[1]);
	        break;
	      case 3:
	        handler.call(this, arguments[1], arguments[2]);
	        break;
	      // slower
	      default:
	        args = Array.prototype.slice.call(arguments, 1);
	        handler.apply(this, args);
	    }
	  } else if (isObject(handler)) {
	    args = Array.prototype.slice.call(arguments, 1);
	    listeners = handler.slice();
	    len = listeners.length;
	    for (i = 0; i < len; i++)
	      listeners[i].apply(this, args);
	  }
	
	  return true;
	};
	
	EventEmitter.prototype.addListener = function(type, listener) {
	  var m;
	
	  if (!isFunction(listener))
	    throw TypeError('listener must be a function');
	
	  if (!this._events)
	    this._events = {};
	
	  // To avoid recursion in the case that type === "newListener"! Before
	  // adding it to the listeners, first emit "newListener".
	  if (this._events.newListener)
	    this.emit('newListener', type,
	              isFunction(listener.listener) ?
	              listener.listener : listener);
	
	  if (!this._events[type])
	    // Optimize the case of one listener. Don't need the extra array object.
	    this._events[type] = listener;
	  else if (isObject(this._events[type]))
	    // If we've already got an array, just append.
	    this._events[type].push(listener);
	  else
	    // Adding the second element, need to change to array.
	    this._events[type] = [this._events[type], listener];
	
	  // Check for listener leak
	  if (isObject(this._events[type]) && !this._events[type].warned) {
	    if (!isUndefined(this._maxListeners)) {
	      m = this._maxListeners;
	    } else {
	      m = EventEmitter.defaultMaxListeners;
	    }
	
	    if (m && m > 0 && this._events[type].length > m) {
	      this._events[type].warned = true;
	      console.error('(node) warning: possible EventEmitter memory ' +
	                    'leak detected. %d listeners added. ' +
	                    'Use emitter.setMaxListeners() to increase limit.',
	                    this._events[type].length);
	      if (typeof console.trace === 'function') {
	        // not supported in IE 10
	        console.trace();
	      }
	    }
	  }
	
	  return this;
	};
	
	EventEmitter.prototype.on = EventEmitter.prototype.addListener;
	
	EventEmitter.prototype.once = function(type, listener) {
	  if (!isFunction(listener))
	    throw TypeError('listener must be a function');
	
	  var fired = false;
	
	  function g() {
	    this.removeListener(type, g);
	
	    if (!fired) {
	      fired = true;
	      listener.apply(this, arguments);
	    }
	  }
	
	  g.listener = listener;
	  this.on(type, g);
	
	  return this;
	};
	
	// emits a 'removeListener' event iff the listener was removed
	EventEmitter.prototype.removeListener = function(type, listener) {
	  var list, position, length, i;
	
	  if (!isFunction(listener))
	    throw TypeError('listener must be a function');
	
	  if (!this._events || !this._events[type])
	    return this;
	
	  list = this._events[type];
	  length = list.length;
	  position = -1;
	
	  if (list === listener ||
	      (isFunction(list.listener) && list.listener === listener)) {
	    delete this._events[type];
	    if (this._events.removeListener)
	      this.emit('removeListener', type, listener);
	
	  } else if (isObject(list)) {
	    for (i = length; i-- > 0;) {
	      if (list[i] === listener ||
	          (list[i].listener && list[i].listener === listener)) {
	        position = i;
	        break;
	      }
	    }
	
	    if (position < 0)
	      return this;
	
	    if (list.length === 1) {
	      list.length = 0;
	      delete this._events[type];
	    } else {
	      list.splice(position, 1);
	    }
	
	    if (this._events.removeListener)
	      this.emit('removeListener', type, listener);
	  }
	
	  return this;
	};
	
	EventEmitter.prototype.removeAllListeners = function(type) {
	  var key, listeners;
	
	  if (!this._events)
	    return this;
	
	  // not listening for removeListener, no need to emit
	  if (!this._events.removeListener) {
	    if (arguments.length === 0)
	      this._events = {};
	    else if (this._events[type])
	      delete this._events[type];
	    return this;
	  }
	
	  // emit removeListener for all listeners on all events
	  if (arguments.length === 0) {
	    for (key in this._events) {
	      if (key === 'removeListener') continue;
	      this.removeAllListeners(key);
	    }
	    this.removeAllListeners('removeListener');
	    this._events = {};
	    return this;
	  }
	
	  listeners = this._events[type];
	
	  if (isFunction(listeners)) {
	    this.removeListener(type, listeners);
	  } else if (listeners) {
	    // LIFO order
	    while (listeners.length)
	      this.removeListener(type, listeners[listeners.length - 1]);
	  }
	  delete this._events[type];
	
	  return this;
	};
	
	EventEmitter.prototype.listeners = function(type) {
	  var ret;
	  if (!this._events || !this._events[type])
	    ret = [];
	  else if (isFunction(this._events[type]))
	    ret = [this._events[type]];
	  else
	    ret = this._events[type].slice();
	  return ret;
	};
	
	EventEmitter.prototype.listenerCount = function(type) {
	  if (this._events) {
	    var evlistener = this._events[type];
	
	    if (isFunction(evlistener))
	      return 1;
	    else if (evlistener)
	      return evlistener.length;
	  }
	  return 0;
	};
	
	EventEmitter.listenerCount = function(emitter, type) {
	  return emitter.listenerCount(type);
	};
	
	function isFunction(arg) {
	  return typeof arg === 'function';
	}
	
	function isNumber(arg) {
	  return typeof arg === 'number';
	}
	
	function isObject(arg) {
	  return typeof arg === 'object' && arg !== null;
	}
	
	function isUndefined(arg) {
	  return arg === void 0;
	}


/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {"use strict";
	// Split a filename into [root, dir, basename, ext], unix version
	// 'root' is just a slash, or nothing.
	var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
	function posixSplitPath(filename) {
	    var out = splitPathRe.exec(filename);
	    out.shift();
	    return out;
	}
	/**
	 * Emulates Node's `path` module. This module contains utilities for handling and
	 * transforming file paths. **All** of these methods perform only string
	 * transformations. The file system is not consulted to check whether paths are
	 * valid.
	 * @see http://nodejs.org/api/path.html
	 * @class
	 */
	var path = (function () {
	    function path() {
	    }
	    /**
	     * Normalize a string path, taking care of '..' and '.' parts.
	     *
	     * When multiple slashes are found, they're replaced by a single one; when the path contains a trailing slash, it is preserved. On Windows backslashes are used.
	     * @example Usage example
	     *   path.normalize('/foo/bar//baz/asdf/quux/..')
	     *   // returns
	     *   '/foo/bar/baz/asdf'
	     * @param [String] p The path to normalize.
	     * @return [String]
	     */
	    path.normalize = function (p) {
	        // Special case: '' -> '.'
	        if (p === '') {
	            p = '.';
	        }
	        // It's very important to know if the path is relative or not, since it
	        // changes how we process .. and reconstruct the split string.
	        var absolute = p.charAt(0) === path.sep;
	        // Remove repeated //s
	        p = path._removeDuplicateSeps(p);
	        // Try to remove as many '../' as possible, and remove '.' completely.
	        var components = p.split(path.sep);
	        var goodComponents = [];
	        for (var idx = 0; idx < components.length; idx++) {
	            var c = components[idx];
	            if (c === '.') {
	                continue;
	            }
	            else if (c === '..' && (absolute || (!absolute && goodComponents.length > 0 && goodComponents[0] !== '..'))) {
	                // In the absolute case: Path is relative to root, so we may pop even if
	                // goodComponents is empty (e.g. /../ => /)
	                // In the relative case: We're getting rid of a directory that preceded
	                // it (e.g. /foo/../bar -> /bar)
	                goodComponents.pop();
	            }
	            else {
	                goodComponents.push(c);
	            }
	        }
	        // Add in '.' when it's a relative path with no other nonempty components.
	        // Possible results: '.' and './' (input: [''] or [])
	        // @todo Can probably simplify this logic.
	        if (!absolute && goodComponents.length < 2) {
	            switch (goodComponents.length) {
	                case 1:
	                    if (goodComponents[0] === '') {
	                        goodComponents.unshift('.');
	                    }
	                    break;
	                default:
	                    goodComponents.push('.');
	            }
	        }
	        p = goodComponents.join(path.sep);
	        if (absolute && p.charAt(0) !== path.sep) {
	            p = path.sep + p;
	        }
	        return p;
	    };
	    /**
	     * Join all arguments together and normalize the resulting path.
	     *
	     * Arguments must be strings.
	     * @example Usage
	     *   path.join('/foo', 'bar', 'baz/asdf', 'quux', '..')
	     *   // returns
	     *   '/foo/bar/baz/asdf'
	     *
	     *   path.join('foo', {}, 'bar')
	     *   // throws exception
	     *   TypeError: Arguments to path.join must be strings
	     * @param [String,...] paths Each component of the path
	     * @return [String]
	     */
	    path.join = function () {
	        var paths = [];
	        for (var _i = 0; _i < arguments.length; _i++) {
	            paths[_i - 0] = arguments[_i];
	        }
	        // Required: Prune any non-strings from the path. I also prune empty segments
	        // so we can do a simple join of the array.
	        var processed = [];
	        for (var i = 0; i < paths.length; i++) {
	            var segment = paths[i];
	            if (typeof segment !== 'string') {
	                throw new TypeError("Invalid argument type to path.join: " + (typeof segment));
	            }
	            else if (segment !== '') {
	                processed.push(segment);
	            }
	        }
	        return path.normalize(processed.join(path.sep));
	    };
	    /**
	     * Resolves to to an absolute path.
	     *
	     * If to isn't already absolute from arguments are prepended in right to left
	     * order, until an absolute path is found. If after using all from paths still
	     * no absolute path is found, the current working directory is used as well.
	     * The resulting path is normalized, and trailing slashes are removed unless
	     * the path gets resolved to the root directory. Non-string arguments are
	     * ignored.
	     *
	     * Another way to think of it is as a sequence of cd commands in a shell.
	     *
	     *     path.resolve('foo/bar', '/tmp/file/', '..', 'a/../subfile')
	     *
	     * Is similar to:
	     *
	     *     cd foo/bar
	     *     cd /tmp/file/
	     *     cd ..
	     *     cd a/../subfile
	     *     pwd
	     *
	     * The difference is that the different paths don't need to exist and may also
	     * be files.
	     * @example Usage example
	     *   path.resolve('/foo/bar', './baz')
	     *   // returns
	     *   '/foo/bar/baz'
	     *
	     *   path.resolve('/foo/bar', '/tmp/file/')
	     *   // returns
	     *   '/tmp/file'
	     *
	     *   path.resolve('wwwroot', 'static_files/png/', '../gif/image.gif')
	     *   // if currently in /home/myself/node, it returns
	     *   '/home/myself/node/wwwroot/static_files/gif/image.gif'
	     * @param [String,...] paths
	     * @return [String]
	     */
	    path.resolve = function () {
	        var paths = [];
	        for (var _i = 0; _i < arguments.length; _i++) {
	            paths[_i - 0] = arguments[_i];
	        }
	        // Monitor for invalid paths, throw out empty paths, and look for the *last*
	        // absolute path that we see.
	        var processed = [];
	        for (var i = 0; i < paths.length; i++) {
	            var p = paths[i];
	            if (typeof p !== 'string') {
	                throw new TypeError("Invalid argument type to path.join: " + (typeof p));
	            }
	            else if (p !== '') {
	                // Remove anything that has occurred before this absolute path, as it
	                // doesn't matter.
	                if (p.charAt(0) === path.sep) {
	                    processed = [];
	                }
	                processed.push(p);
	            }
	        }
	        // Special: Remove trailing slash unless it's the root
	        var resolved = path.normalize(processed.join(path.sep));
	        if (resolved.length > 1 && resolved.charAt(resolved.length - 1) === path.sep) {
	            return resolved.substr(0, resolved.length - 1);
	        }
	        // Special: If it doesn't start with '/', it's relative and we need to append
	        // the current directory.
	        if (resolved.charAt(0) !== path.sep) {
	            // Remove ./, since we're going to append the current directory.
	            if (resolved.charAt(0) === '.' && (resolved.length === 1 || resolved.charAt(1) === path.sep)) {
	                resolved = resolved.length === 1 ? '' : resolved.substr(2);
	            }
	            // Append the current directory, which *must* be an absolute path.
	            var cwd = process.cwd();
	            if (resolved !== '') {
	                // cwd will never end in a /... unless it's the root.
	                resolved = this.normalize(cwd + (cwd !== '/' ? path.sep : '') + resolved);
	            }
	            else {
	                resolved = cwd;
	            }
	        }
	        return resolved;
	    };
	    /**
	     * Solve the relative path from from to to.
	     *
	     * At times we have two absolute paths, and we need to derive the relative path
	     * from one to the other. This is actually the reverse transform of
	     * path.resolve, which means we see that:
	     *
	     *    path.resolve(from, path.relative(from, to)) == path.resolve(to)
	     *
	     * @example Usage example
	     *   path.relative('C:\\orandea\\test\\aaa', 'C:\\orandea\\impl\\bbb')
	     *   // returns
	     *   '..\\..\\impl\\bbb'
	     *
	     *   path.relative('/data/orandea/test/aaa', '/data/orandea/impl/bbb')
	     *   // returns
	     *   '../../impl/bbb'
	     * @param [String] from
	     * @param [String] to
	     * @return [String]
	     */
	    path.relative = function (from, to) {
	        var i;
	        // Alright. Let's resolve these two to absolute paths and remove any
	        // weirdness.
	        from = path.resolve(from);
	        to = path.resolve(to);
	        var fromSegs = from.split(path.sep);
	        var toSegs = to.split(path.sep);
	        // Remove the first segment on both, as it's '' (both are absolute paths)
	        toSegs.shift();
	        fromSegs.shift();
	        // There are two segments to this path:
	        // * Going *up* the directory hierarchy with '..'
	        // * Going *down* the directory hierarchy with foo/baz/bat.
	        var upCount = 0;
	        var downSegs = [];
	        // Figure out how many things in 'from' are shared with 'to'.
	        for (i = 0; i < fromSegs.length; i++) {
	            var seg = fromSegs[i];
	            if (seg === toSegs[i]) {
	                continue;
	            }
	            // The rest of 'from', including the current element, indicates how many
	            // directories we need to go up.
	            upCount = fromSegs.length - i;
	            break;
	        }
	        // The rest of 'to' indicates where we need to change to. We place this
	        // outside of the loop, as toSegs.length may be greater than fromSegs.length.
	        downSegs = toSegs.slice(i);
	        // Special case: If 'from' is '/'
	        if (fromSegs.length === 1 && fromSegs[0] === '') {
	            upCount = 0;
	        }
	        // upCount can't be greater than the number of fromSegs
	        // (cd .. from / is still /)
	        if (upCount > fromSegs.length) {
	            upCount = fromSegs.length;
	        }
	        // Create the final string!
	        var rv = '';
	        for (i = 0; i < upCount; i++) {
	            rv += '../';
	        }
	        rv += downSegs.join(path.sep);
	        // Special case: Remove trailing '/'. Happens if it's all up and no down.
	        if (rv.length > 1 && rv.charAt(rv.length - 1) === path.sep) {
	            rv = rv.substr(0, rv.length - 1);
	        }
	        return rv;
	    };
	    /**
	     * Return the directory name of a path. Similar to the Unix `dirname` command.
	     *
	     * Note that BrowserFS does not validate if the path is actually a valid
	     * directory.
	     * @example Usage example
	     *   path.dirname('/foo/bar/baz/asdf/quux')
	     *   // returns
	     *   '/foo/bar/baz/asdf'
	     * @param [String] p The path to get the directory name of.
	     * @return [String]
	     */
	    path.dirname = function (p) {
	        // We get rid of //, but we don't modify anything else (e.g. any extraneous .
	        // and ../ are kept intact)
	        p = path._removeDuplicateSeps(p);
	        var absolute = p.charAt(0) === path.sep;
	        var sections = p.split(path.sep);
	        // Do 1 if it's /foo/bar, 2 if it's /foo/bar/
	        if (sections.pop() === '' && sections.length > 0) {
	            sections.pop();
	        }
	        // # of sections needs to be > 1 if absolute, since the first section is '' for '/'.
	        // If not absolute, the first section is the first part of the path, and is OK
	        // to return.
	        if (sections.length > 1 || (sections.length === 1 && !absolute)) {
	            return sections.join(path.sep);
	        }
	        else if (absolute) {
	            return path.sep;
	        }
	        else {
	            return '.';
	        }
	    };
	    /**
	     * Return the last portion of a path. Similar to the Unix basename command.
	     * @example Usage example
	     *   path.basename('/foo/bar/baz/asdf/quux.html')
	     *   // returns
	     *   'quux.html'
	     *
	     *   path.basename('/foo/bar/baz/asdf/quux.html', '.html')
	     *   // returns
	     *   'quux'
	     * @param [String] p
	     * @param [String?] ext
	     * @return [String]
	     */
	    path.basename = function (p, ext) {
	        if (ext === void 0) { ext = ""; }
	        // Special case: Normalize will modify this to '.'
	        if (p === '') {
	            return p;
	        }
	        // Normalize the string first to remove any weirdness.
	        p = path.normalize(p);
	        // Get the last part of the string.
	        var sections = p.split(path.sep);
	        var lastPart = sections[sections.length - 1];
	        // Special case: If it's empty, then we have a string like so: foo/
	        // Meaning, 'foo' is guaranteed to be a directory.
	        if (lastPart === '' && sections.length > 1) {
	            return sections[sections.length - 2];
	        }
	        // Remove the extension, if need be.
	        if (ext.length > 0) {
	            var lastPartExt = lastPart.substr(lastPart.length - ext.length);
	            if (lastPartExt === ext) {
	                return lastPart.substr(0, lastPart.length - ext.length);
	            }
	        }
	        return lastPart;
	    };
	    /**
	     * Return the extension of the path, from the last '.' to end of string in the
	     * last portion of the path. If there is no '.' in the last portion of the path
	     * or the first character of it is '.', then it returns an empty string.
	     * @example Usage example
	     *   path.extname('index.html')
	     *   // returns
	     *   '.html'
	     *
	     *   path.extname('index.')
	     *   // returns
	     *   '.'
	     *
	     *   path.extname('index')
	     *   // returns
	     *   ''
	     * @param [String] p
	     * @return [String]
	     */
	    path.extname = function (p) {
	        p = path.normalize(p);
	        var sections = p.split(path.sep);
	        p = sections.pop();
	        // Special case: foo/file.ext/ should return '.ext'
	        if (p === '' && sections.length > 0) {
	            p = sections.pop();
	        }
	        if (p === '..') {
	            return '';
	        }
	        var i = p.lastIndexOf('.');
	        if (i === -1 || i === 0) {
	            return '';
	        }
	        return p.substr(i);
	    };
	    /**
	     * Checks if the given path is an absolute path.
	     *
	     * Despite not being documented, this is a tested part of Node's path API.
	     * @param [String] p
	     * @return [Boolean] True if the path appears to be an absolute path.
	     */
	    path.isAbsolute = function (p) {
	        return p.length > 0 && p.charAt(0) === path.sep;
	    };
	    /**
	     * Unknown. Undocumented.
	     */
	    path._makeLong = function (p) {
	        return p;
	    };
	    /**
	     * Returns an object from a path string.
	     */
	    path.parse = function (p) {
	        var allParts = posixSplitPath(p);
	        return {
	            root: allParts[0],
	            dir: allParts[0] + allParts[1].slice(0, -1),
	            base: allParts[2],
	            ext: allParts[3],
	            name: allParts[2].slice(0, allParts[2].length - allParts[3].length)
	        };
	    };
	    path.format = function (pathObject) {
	        if (pathObject === null || typeof pathObject !== 'object') {
	            throw new TypeError("Parameter 'pathObject' must be an object, not " + typeof pathObject);
	        }
	        var root = pathObject.root || '';
	        if (typeof root !== 'string') {
	            throw new TypeError("'pathObject.root' must be a string or undefined, not " +
	                typeof pathObject.root);
	        }
	        var dir = pathObject.dir ? pathObject.dir + path.sep : '';
	        var base = pathObject.base || '';
	        return dir + base;
	    };
	    path._removeDuplicateSeps = function (p) {
	        p = p.replace(this._replaceRegex, this.sep);
	        return p;
	    };
	    // The platform-specific file separator. BrowserFS uses `/`.
	    path.sep = '/';
	    path._replaceRegex = new RegExp("//+", 'g');
	    // The platform-specific path delimiter. BrowserFS uses `:`.
	    path.delimiter = ':';
	    path.posix = path;
	    // XXX: Typing hack. We don't actually support win32.
	    path.win32 = path;
	    return path;
	}());
	var _ = path;
	module.exports = path;
	
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(6)))

/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer) {"use strict";
	var __extends = (this && this.__extends) || function (d, b) {
	    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	};
	var stream = __webpack_require__(11);
	var TTY = (function (_super) {
	    __extends(TTY, _super);
	    function TTY() {
	        _super.call(this);
	        this.isRaw = false;
	        this.columns = 80;
	        this.rows = 120;
	        this.isTTY = true;
	        this._bufferedWrites = [];
	        this._waitingForWrites = false;
	    }
	    /**
	     * Toggle raw mode.
	     */
	    TTY.prototype.setRawMode = function (mode) {
	        if (this.isRaw !== mode) {
	            this.isRaw = mode;
	            // [BFS] TTY implementations can use this to change their event emitting
	            //       patterns.
	            this.emit('modeChange');
	        }
	    };
	    /**
	     * [BFS] Update the number of columns available on the terminal.
	     */
	    TTY.prototype.changeColumns = function (columns) {
	        if (columns !== this.columns) {
	            this.columns = columns;
	            // Resize event.
	            this.emit('resize');
	        }
	    };
	    /**
	     * [BFS] Update the number of rows available on the terminal.
	     */
	    TTY.prototype.changeRows = function (rows) {
	        if (rows !== this.rows) {
	            this.rows = rows;
	            // Resize event.
	            this.emit('resize');
	        }
	    };
	    /**
	     * Returns 'true' if the given object is a TTY.
	     */
	    TTY.isatty = function (fd) {
	        return fd && fd instanceof TTY;
	    };
	    TTY.prototype._write = function (chunk, encoding, cb) {
	        var error;
	        try {
	            var data;
	            if (typeof (chunk) === 'string') {
	                data = new Buffer(chunk, encoding);
	            }
	            else {
	                data = chunk;
	            }
	            this._bufferedWrites.push(data);
	            if (this._waitingForWrites) {
	                this._read(1024);
	            }
	        }
	        catch (e) {
	            error = e;
	        }
	        finally {
	            cb(error);
	        }
	    };
	    TTY.prototype._read = function (size) {
	        // Size is advisory -- we can ignore it.
	        if (this._bufferedWrites.length === 0) {
	            this._waitingForWrites = true;
	        }
	        else {
	            while (this._bufferedWrites.length > 0) {
	                this._waitingForWrites = this.push(this._bufferedWrites.shift());
	                if (!this._waitingForWrites) {
	                    break;
	                }
	            }
	        }
	    };
	    return TTY;
	}(stream.Duplex));
	module.exports = TTY;
	
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(1)))

/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.
	
	module.exports = Stream;
	
	var EE = __webpack_require__(8).EventEmitter;
	var inherits = __webpack_require__(12);
	
	inherits(Stream, EE);
	Stream.Readable = __webpack_require__(13);
	Stream.Writable = __webpack_require__(27);
	Stream.Duplex = __webpack_require__(28);
	Stream.Transform = __webpack_require__(29);
	Stream.PassThrough = __webpack_require__(30);
	
	// Backwards-compat with node 0.4.x
	Stream.Stream = Stream;
	
	
	
	// old-style streams.  Note that the pipe method (the only relevant
	// part of this class) is overridden in the Readable class.
	
	function Stream() {
	  EE.call(this);
	}
	
	Stream.prototype.pipe = function(dest, options) {
	  var source = this;
	
	  function ondata(chunk) {
	    if (dest.writable) {
	      if (false === dest.write(chunk) && source.pause) {
	        source.pause();
	      }
	    }
	  }
	
	  source.on('data', ondata);
	
	  function ondrain() {
	    if (source.readable && source.resume) {
	      source.resume();
	    }
	  }
	
	  dest.on('drain', ondrain);
	
	  // If the 'end' option is not supplied, dest.end() will be called when
	  // source gets the 'end' or 'close' events.  Only dest.end() once.
	  if (!dest._isStdio && (!options || options.end !== false)) {
	    source.on('end', onend);
	    source.on('close', onclose);
	  }
	
	  var didOnEnd = false;
	  function onend() {
	    if (didOnEnd) return;
	    didOnEnd = true;
	
	    dest.end();
	  }
	
	
	  function onclose() {
	    if (didOnEnd) return;
	    didOnEnd = true;
	
	    if (typeof dest.destroy === 'function') dest.destroy();
	  }
	
	  // don't leave dangling pipes when there are errors.
	  function onerror(er) {
	    cleanup();
	    if (EE.listenerCount(this, 'error') === 0) {
	      throw er; // Unhandled stream error in pipe.
	    }
	  }
	
	  source.on('error', onerror);
	  dest.on('error', onerror);
	
	  // remove all the event listeners that were added.
	  function cleanup() {
	    source.removeListener('data', ondata);
	    dest.removeListener('drain', ondrain);
	
	    source.removeListener('end', onend);
	    source.removeListener('close', onclose);
	
	    source.removeListener('error', onerror);
	    dest.removeListener('error', onerror);
	
	    source.removeListener('end', cleanup);
	    source.removeListener('close', cleanup);
	
	    dest.removeListener('close', cleanup);
	  }
	
	  source.on('end', cleanup);
	  source.on('close', cleanup);
	
	  dest.on('close', cleanup);
	
	  dest.emit('pipe', source);
	
	  // Allow for unix-like usage: A.pipe(B).pipe(C)
	  return dest;
	};


/***/ },
/* 12 */
/***/ function(module, exports) {

	if (typeof Object.create === 'function') {
	  // implementation from standard node.js 'util' module
	  module.exports = function inherits(ctor, superCtor) {
	    ctor.super_ = superCtor
	    ctor.prototype = Object.create(superCtor.prototype, {
	      constructor: {
	        value: ctor,
	        enumerable: false,
	        writable: true,
	        configurable: true
	      }
	    });
	  };
	} else {
	  // old school shim for old browsers
	  module.exports = function inherits(ctor, superCtor) {
	    ctor.super_ = superCtor
	    var TempCtor = function () {}
	    TempCtor.prototype = superCtor.prototype
	    ctor.prototype = new TempCtor()
	    ctor.prototype.constructor = ctor
	  }
	}


/***/ },
/* 13 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {var Stream = (function (){
	  try {
	    return __webpack_require__(11); // hack to fix a circular dependency issue when used with browserify
	  } catch(_){}
	}());
	exports = module.exports = __webpack_require__(14);
	exports.Stream = Stream || exports;
	exports.Readable = exports;
	exports.Writable = __webpack_require__(22);
	exports.Duplex = __webpack_require__(21);
	exports.Transform = __webpack_require__(25);
	exports.PassThrough = __webpack_require__(26);
	
	if (!process.browser && process.env.READABLE_STREAM === 'disable' && Stream) {
	  module.exports = Stream;
	}
	
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(6)))

/***/ },
/* 14 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {'use strict';
	
	module.exports = Readable;
	
	/*<replacement>*/
	var processNextTick = __webpack_require__(15);
	/*</replacement>*/
	
	/*<replacement>*/
	var isArray = __webpack_require__(16);
	/*</replacement>*/
	
	/*<replacement>*/
	var Duplex;
	/*</replacement>*/
	
	Readable.ReadableState = ReadableState;
	
	/*<replacement>*/
	var EE = __webpack_require__(8).EventEmitter;
	
	var EElistenerCount = function (emitter, type) {
	  return emitter.listeners(type).length;
	};
	/*</replacement>*/
	
	/*<replacement>*/
	var Stream;
	(function () {
	  try {
	    Stream = __webpack_require__(11);
	  } catch (_) {} finally {
	    if (!Stream) Stream = __webpack_require__(8).EventEmitter;
	  }
	})();
	/*</replacement>*/
	
	var Buffer = __webpack_require__(2).Buffer;
	/*<replacement>*/
	var bufferShim = __webpack_require__(17);
	/*</replacement>*/
	
	/*<replacement>*/
	var util = __webpack_require__(18);
	util.inherits = __webpack_require__(12);
	/*</replacement>*/
	
	/*<replacement>*/
	var debugUtil = __webpack_require__(19);
	var debug = void 0;
	if (debugUtil && debugUtil.debuglog) {
	  debug = debugUtil.debuglog('stream');
	} else {
	  debug = function () {};
	}
	/*</replacement>*/
	
	var BufferList = __webpack_require__(20);
	var StringDecoder;
	
	util.inherits(Readable, Stream);
	
	function prependListener(emitter, event, fn) {
	  // Sadly this is not cacheable as some libraries bundle their own
	  // event emitter implementation with them.
	  if (typeof emitter.prependListener === 'function') {
	    return emitter.prependListener(event, fn);
	  } else {
	    // This is a hack to make sure that our error handler is attached before any
	    // userland ones.  NEVER DO THIS. This is here only because this code needs
	    // to continue to work with older versions of Node.js that do not include
	    // the prependListener() method. The goal is to eventually remove this hack.
	    if (!emitter._events || !emitter._events[event]) emitter.on(event, fn);else if (isArray(emitter._events[event])) emitter._events[event].unshift(fn);else emitter._events[event] = [fn, emitter._events[event]];
	  }
	}
	
	function ReadableState(options, stream) {
	  Duplex = Duplex || __webpack_require__(21);
	
	  options = options || {};
	
	  // object stream flag. Used to make read(n) ignore n and to
	  // make all the buffer merging and length checks go away
	  this.objectMode = !!options.objectMode;
	
	  if (stream instanceof Duplex) this.objectMode = this.objectMode || !!options.readableObjectMode;
	
	  // the point at which it stops calling _read() to fill the buffer
	  // Note: 0 is a valid value, means "don't call _read preemptively ever"
	  var hwm = options.highWaterMark;
	  var defaultHwm = this.objectMode ? 16 : 16 * 1024;
	  this.highWaterMark = hwm || hwm === 0 ? hwm : defaultHwm;
	
	  // cast to ints.
	  this.highWaterMark = ~~this.highWaterMark;
	
	  // A linked list is used to store data chunks instead of an array because the
	  // linked list can remove elements from the beginning faster than
	  // array.shift()
	  this.buffer = new BufferList();
	  this.length = 0;
	  this.pipes = null;
	  this.pipesCount = 0;
	  this.flowing = null;
	  this.ended = false;
	  this.endEmitted = false;
	  this.reading = false;
	
	  // a flag to be able to tell if the onwrite cb is called immediately,
	  // or on a later tick.  We set this to true at first, because any
	  // actions that shouldn't happen until "later" should generally also
	  // not happen before the first write call.
	  this.sync = true;
	
	  // whenever we return null, then we set a flag to say
	  // that we're awaiting a 'readable' event emission.
	  this.needReadable = false;
	  this.emittedReadable = false;
	  this.readableListening = false;
	  this.resumeScheduled = false;
	
	  // Crypto is kind of old and crusty.  Historically, its default string
	  // encoding is 'binary' so we have to make this configurable.
	  // Everything else in the universe uses 'utf8', though.
	  this.defaultEncoding = options.defaultEncoding || 'utf8';
	
	  // when piping, we only care about 'readable' events that happen
	  // after read()ing all the bytes and not getting any pushback.
	  this.ranOut = false;
	
	  // the number of writers that are awaiting a drain event in .pipe()s
	  this.awaitDrain = 0;
	
	  // if true, a maybeReadMore has been scheduled
	  this.readingMore = false;
	
	  this.decoder = null;
	  this.encoding = null;
	  if (options.encoding) {
	    if (!StringDecoder) StringDecoder = __webpack_require__(24).StringDecoder;
	    this.decoder = new StringDecoder(options.encoding);
	    this.encoding = options.encoding;
	  }
	}
	
	function Readable(options) {
	  Duplex = Duplex || __webpack_require__(21);
	
	  if (!(this instanceof Readable)) return new Readable(options);
	
	  this._readableState = new ReadableState(options, this);
	
	  // legacy
	  this.readable = true;
	
	  if (options && typeof options.read === 'function') this._read = options.read;
	
	  Stream.call(this);
	}
	
	// Manually shove something into the read() buffer.
	// This returns true if the highWaterMark has not been hit yet,
	// similar to how Writable.write() returns true if you should
	// write() some more.
	Readable.prototype.push = function (chunk, encoding) {
	  var state = this._readableState;
	
	  if (!state.objectMode && typeof chunk === 'string') {
	    encoding = encoding || state.defaultEncoding;
	    if (encoding !== state.encoding) {
	      chunk = bufferShim.from(chunk, encoding);
	      encoding = '';
	    }
	  }
	
	  return readableAddChunk(this, state, chunk, encoding, false);
	};
	
	// Unshift should *always* be something directly out of read()
	Readable.prototype.unshift = function (chunk) {
	  var state = this._readableState;
	  return readableAddChunk(this, state, chunk, '', true);
	};
	
	Readable.prototype.isPaused = function () {
	  return this._readableState.flowing === false;
	};
	
	function readableAddChunk(stream, state, chunk, encoding, addToFront) {
	  var er = chunkInvalid(state, chunk);
	  if (er) {
	    stream.emit('error', er);
	  } else if (chunk === null) {
	    state.reading = false;
	    onEofChunk(stream, state);
	  } else if (state.objectMode || chunk && chunk.length > 0) {
	    if (state.ended && !addToFront) {
	      var e = new Error('stream.push() after EOF');
	      stream.emit('error', e);
	    } else if (state.endEmitted && addToFront) {
	      var _e = new Error('stream.unshift() after end event');
	      stream.emit('error', _e);
	    } else {
	      var skipAdd;
	      if (state.decoder && !addToFront && !encoding) {
	        chunk = state.decoder.write(chunk);
	        skipAdd = !state.objectMode && chunk.length === 0;
	      }
	
	      if (!addToFront) state.reading = false;
	
	      // Don't add to the buffer if we've decoded to an empty string chunk and
	      // we're not in object mode
	      if (!skipAdd) {
	        // if we want the data now, just emit it.
	        if (state.flowing && state.length === 0 && !state.sync) {
	          stream.emit('data', chunk);
	          stream.read(0);
	        } else {
	          // update the buffer info.
	          state.length += state.objectMode ? 1 : chunk.length;
	          if (addToFront) state.buffer.unshift(chunk);else state.buffer.push(chunk);
	
	          if (state.needReadable) emitReadable(stream);
	        }
	      }
	
	      maybeReadMore(stream, state);
	    }
	  } else if (!addToFront) {
	    state.reading = false;
	  }
	
	  return needMoreData(state);
	}
	
	// if it's past the high water mark, we can push in some more.
	// Also, if we have no data yet, we can stand some
	// more bytes.  This is to work around cases where hwm=0,
	// such as the repl.  Also, if the push() triggered a
	// readable event, and the user called read(largeNumber) such that
	// needReadable was set, then we ought to push more, so that another
	// 'readable' event will be triggered.
	function needMoreData(state) {
	  return !state.ended && (state.needReadable || state.length < state.highWaterMark || state.length === 0);
	}
	
	// backwards compatibility.
	Readable.prototype.setEncoding = function (enc) {
	  if (!StringDecoder) StringDecoder = __webpack_require__(24).StringDecoder;
	  this._readableState.decoder = new StringDecoder(enc);
	  this._readableState.encoding = enc;
	  return this;
	};
	
	// Don't raise the hwm > 8MB
	var MAX_HWM = 0x800000;
	function computeNewHighWaterMark(n) {
	  if (n >= MAX_HWM) {
	    n = MAX_HWM;
	  } else {
	    // Get the next highest power of 2 to prevent increasing hwm excessively in
	    // tiny amounts
	    n--;
	    n |= n >>> 1;
	    n |= n >>> 2;
	    n |= n >>> 4;
	    n |= n >>> 8;
	    n |= n >>> 16;
	    n++;
	  }
	  return n;
	}
	
	// This function is designed to be inlinable, so please take care when making
	// changes to the function body.
	function howMuchToRead(n, state) {
	  if (n <= 0 || state.length === 0 && state.ended) return 0;
	  if (state.objectMode) return 1;
	  if (n !== n) {
	    // Only flow one buffer at a time
	    if (state.flowing && state.length) return state.buffer.head.data.length;else return state.length;
	  }
	  // If we're asking for more than the current hwm, then raise the hwm.
	  if (n > state.highWaterMark) state.highWaterMark = computeNewHighWaterMark(n);
	  if (n <= state.length) return n;
	  // Don't have enough
	  if (!state.ended) {
	    state.needReadable = true;
	    return 0;
	  }
	  return state.length;
	}
	
	// you can override either this method, or the async _read(n) below.
	Readable.prototype.read = function (n) {
	  debug('read', n);
	  n = parseInt(n, 10);
	  var state = this._readableState;
	  var nOrig = n;
	
	  if (n !== 0) state.emittedReadable = false;
	
	  // if we're doing read(0) to trigger a readable event, but we
	  // already have a bunch of data in the buffer, then just trigger
	  // the 'readable' event and move on.
	  if (n === 0 && state.needReadable && (state.length >= state.highWaterMark || state.ended)) {
	    debug('read: emitReadable', state.length, state.ended);
	    if (state.length === 0 && state.ended) endReadable(this);else emitReadable(this);
	    return null;
	  }
	
	  n = howMuchToRead(n, state);
	
	  // if we've ended, and we're now clear, then finish it up.
	  if (n === 0 && state.ended) {
	    if (state.length === 0) endReadable(this);
	    return null;
	  }
	
	  // All the actual chunk generation logic needs to be
	  // *below* the call to _read.  The reason is that in certain
	  // synthetic stream cases, such as passthrough streams, _read
	  // may be a completely synchronous operation which may change
	  // the state of the read buffer, providing enough data when
	  // before there was *not* enough.
	  //
	  // So, the steps are:
	  // 1. Figure out what the state of things will be after we do
	  // a read from the buffer.
	  //
	  // 2. If that resulting state will trigger a _read, then call _read.
	  // Note that this may be asynchronous, or synchronous.  Yes, it is
	  // deeply ugly to write APIs this way, but that still doesn't mean
	  // that the Readable class should behave improperly, as streams are
	  // designed to be sync/async agnostic.
	  // Take note if the _read call is sync or async (ie, if the read call
	  // has returned yet), so that we know whether or not it's safe to emit
	  // 'readable' etc.
	  //
	  // 3. Actually pull the requested chunks out of the buffer and return.
	
	  // if we need a readable event, then we need to do some reading.
	  var doRead = state.needReadable;
	  debug('need readable', doRead);
	
	  // if we currently have less than the highWaterMark, then also read some
	  if (state.length === 0 || state.length - n < state.highWaterMark) {
	    doRead = true;
	    debug('length less than watermark', doRead);
	  }
	
	  // however, if we've ended, then there's no point, and if we're already
	  // reading, then it's unnecessary.
	  if (state.ended || state.reading) {
	    doRead = false;
	    debug('reading or ended', doRead);
	  } else if (doRead) {
	    debug('do read');
	    state.reading = true;
	    state.sync = true;
	    // if the length is currently zero, then we *need* a readable event.
	    if (state.length === 0) state.needReadable = true;
	    // call internal read method
	    this._read(state.highWaterMark);
	    state.sync = false;
	    // If _read pushed data synchronously, then `reading` will be false,
	    // and we need to re-evaluate how much data we can return to the user.
	    if (!state.reading) n = howMuchToRead(nOrig, state);
	  }
	
	  var ret;
	  if (n > 0) ret = fromList(n, state);else ret = null;
	
	  if (ret === null) {
	    state.needReadable = true;
	    n = 0;
	  } else {
	    state.length -= n;
	  }
	
	  if (state.length === 0) {
	    // If we have nothing in the buffer, then we want to know
	    // as soon as we *do* get something into the buffer.
	    if (!state.ended) state.needReadable = true;
	
	    // If we tried to read() past the EOF, then emit end on the next tick.
	    if (nOrig !== n && state.ended) endReadable(this);
	  }
	
	  if (ret !== null) this.emit('data', ret);
	
	  return ret;
	};
	
	function chunkInvalid(state, chunk) {
	  var er = null;
	  if (!Buffer.isBuffer(chunk) && typeof chunk !== 'string' && chunk !== null && chunk !== undefined && !state.objectMode) {
	    er = new TypeError('Invalid non-string/buffer chunk');
	  }
	  return er;
	}
	
	function onEofChunk(stream, state) {
	  if (state.ended) return;
	  if (state.decoder) {
	    var chunk = state.decoder.end();
	    if (chunk && chunk.length) {
	      state.buffer.push(chunk);
	      state.length += state.objectMode ? 1 : chunk.length;
	    }
	  }
	  state.ended = true;
	
	  // emit 'readable' now to make sure it gets picked up.
	  emitReadable(stream);
	}
	
	// Don't emit readable right away in sync mode, because this can trigger
	// another read() call => stack overflow.  This way, it might trigger
	// a nextTick recursion warning, but that's not so bad.
	function emitReadable(stream) {
	  var state = stream._readableState;
	  state.needReadable = false;
	  if (!state.emittedReadable) {
	    debug('emitReadable', state.flowing);
	    state.emittedReadable = true;
	    if (state.sync) processNextTick(emitReadable_, stream);else emitReadable_(stream);
	  }
	}
	
	function emitReadable_(stream) {
	  debug('emit readable');
	  stream.emit('readable');
	  flow(stream);
	}
	
	// at this point, the user has presumably seen the 'readable' event,
	// and called read() to consume some data.  that may have triggered
	// in turn another _read(n) call, in which case reading = true if
	// it's in progress.
	// However, if we're not ended, or reading, and the length < hwm,
	// then go ahead and try to read some more preemptively.
	function maybeReadMore(stream, state) {
	  if (!state.readingMore) {
	    state.readingMore = true;
	    processNextTick(maybeReadMore_, stream, state);
	  }
	}
	
	function maybeReadMore_(stream, state) {
	  var len = state.length;
	  while (!state.reading && !state.flowing && !state.ended && state.length < state.highWaterMark) {
	    debug('maybeReadMore read 0');
	    stream.read(0);
	    if (len === state.length)
	      // didn't get any data, stop spinning.
	      break;else len = state.length;
	  }
	  state.readingMore = false;
	}
	
	// abstract method.  to be overridden in specific implementation classes.
	// call cb(er, data) where data is <= n in length.
	// for virtual (non-string, non-buffer) streams, "length" is somewhat
	// arbitrary, and perhaps not very meaningful.
	Readable.prototype._read = function (n) {
	  this.emit('error', new Error('_read() is not implemented'));
	};
	
	Readable.prototype.pipe = function (dest, pipeOpts) {
	  var src = this;
	  var state = this._readableState;
	
	  switch (state.pipesCount) {
	    case 0:
	      state.pipes = dest;
	      break;
	    case 1:
	      state.pipes = [state.pipes, dest];
	      break;
	    default:
	      state.pipes.push(dest);
	      break;
	  }
	  state.pipesCount += 1;
	  debug('pipe count=%d opts=%j', state.pipesCount, pipeOpts);
	
	  var doEnd = (!pipeOpts || pipeOpts.end !== false) && dest !== process.stdout && dest !== process.stderr;
	
	  var endFn = doEnd ? onend : cleanup;
	  if (state.endEmitted) processNextTick(endFn);else src.once('end', endFn);
	
	  dest.on('unpipe', onunpipe);
	  function onunpipe(readable) {
	    debug('onunpipe');
	    if (readable === src) {
	      cleanup();
	    }
	  }
	
	  function onend() {
	    debug('onend');
	    dest.end();
	  }
	
	  // when the dest drains, it reduces the awaitDrain counter
	  // on the source.  This would be more elegant with a .once()
	  // handler in flow(), but adding and removing repeatedly is
	  // too slow.
	  var ondrain = pipeOnDrain(src);
	  dest.on('drain', ondrain);
	
	  var cleanedUp = false;
	  function cleanup() {
	    debug('cleanup');
	    // cleanup event handlers once the pipe is broken
	    dest.removeListener('close', onclose);
	    dest.removeListener('finish', onfinish);
	    dest.removeListener('drain', ondrain);
	    dest.removeListener('error', onerror);
	    dest.removeListener('unpipe', onunpipe);
	    src.removeListener('end', onend);
	    src.removeListener('end', cleanup);
	    src.removeListener('data', ondata);
	
	    cleanedUp = true;
	
	    // if the reader is waiting for a drain event from this
	    // specific writer, then it would cause it to never start
	    // flowing again.
	    // So, if this is awaiting a drain, then we just call it now.
	    // If we don't know, then assume that we are waiting for one.
	    if (state.awaitDrain && (!dest._writableState || dest._writableState.needDrain)) ondrain();
	  }
	
	  // If the user pushes more data while we're writing to dest then we'll end up
	  // in ondata again. However, we only want to increase awaitDrain once because
	  // dest will only emit one 'drain' event for the multiple writes.
	  // => Introduce a guard on increasing awaitDrain.
	  var increasedAwaitDrain = false;
	  src.on('data', ondata);
	  function ondata(chunk) {
	    debug('ondata');
	    increasedAwaitDrain = false;
	    var ret = dest.write(chunk);
	    if (false === ret && !increasedAwaitDrain) {
	      // If the user unpiped during `dest.write()`, it is possible
	      // to get stuck in a permanently paused state if that write
	      // also returned false.
	      // => Check whether `dest` is still a piping destination.
	      if ((state.pipesCount === 1 && state.pipes === dest || state.pipesCount > 1 && indexOf(state.pipes, dest) !== -1) && !cleanedUp) {
	        debug('false write response, pause', src._readableState.awaitDrain);
	        src._readableState.awaitDrain++;
	        increasedAwaitDrain = true;
	      }
	      src.pause();
	    }
	  }
	
	  // if the dest has an error, then stop piping into it.
	  // however, don't suppress the throwing behavior for this.
	  function onerror(er) {
	    debug('onerror', er);
	    unpipe();
	    dest.removeListener('error', onerror);
	    if (EElistenerCount(dest, 'error') === 0) dest.emit('error', er);
	  }
	
	  // Make sure our error handler is attached before userland ones.
	  prependListener(dest, 'error', onerror);
	
	  // Both close and finish should trigger unpipe, but only once.
	  function onclose() {
	    dest.removeListener('finish', onfinish);
	    unpipe();
	  }
	  dest.once('close', onclose);
	  function onfinish() {
	    debug('onfinish');
	    dest.removeListener('close', onclose);
	    unpipe();
	  }
	  dest.once('finish', onfinish);
	
	  function unpipe() {
	    debug('unpipe');
	    src.unpipe(dest);
	  }
	
	  // tell the dest that it's being piped to
	  dest.emit('pipe', src);
	
	  // start the flow if it hasn't been started already.
	  if (!state.flowing) {
	    debug('pipe resume');
	    src.resume();
	  }
	
	  return dest;
	};
	
	function pipeOnDrain(src) {
	  return function () {
	    var state = src._readableState;
	    debug('pipeOnDrain', state.awaitDrain);
	    if (state.awaitDrain) state.awaitDrain--;
	    if (state.awaitDrain === 0 && EElistenerCount(src, 'data')) {
	      state.flowing = true;
	      flow(src);
	    }
	  };
	}
	
	Readable.prototype.unpipe = function (dest) {
	  var state = this._readableState;
	
	  // if we're not piping anywhere, then do nothing.
	  if (state.pipesCount === 0) return this;
	
	  // just one destination.  most common case.
	  if (state.pipesCount === 1) {
	    // passed in one, but it's not the right one.
	    if (dest && dest !== state.pipes) return this;
	
	    if (!dest) dest = state.pipes;
	
	    // got a match.
	    state.pipes = null;
	    state.pipesCount = 0;
	    state.flowing = false;
	    if (dest) dest.emit('unpipe', this);
	    return this;
	  }
	
	  // slow case. multiple pipe destinations.
	
	  if (!dest) {
	    // remove all.
	    var dests = state.pipes;
	    var len = state.pipesCount;
	    state.pipes = null;
	    state.pipesCount = 0;
	    state.flowing = false;
	
	    for (var i = 0; i < len; i++) {
	      dests[i].emit('unpipe', this);
	    }return this;
	  }
	
	  // try to find the right one.
	  var index = indexOf(state.pipes, dest);
	  if (index === -1) return this;
	
	  state.pipes.splice(index, 1);
	  state.pipesCount -= 1;
	  if (state.pipesCount === 1) state.pipes = state.pipes[0];
	
	  dest.emit('unpipe', this);
	
	  return this;
	};
	
	// set up data events if they are asked for
	// Ensure readable listeners eventually get something
	Readable.prototype.on = function (ev, fn) {
	  var res = Stream.prototype.on.call(this, ev, fn);
	
	  if (ev === 'data') {
	    // Start flowing on next tick if stream isn't explicitly paused
	    if (this._readableState.flowing !== false) this.resume();
	  } else if (ev === 'readable') {
	    var state = this._readableState;
	    if (!state.endEmitted && !state.readableListening) {
	      state.readableListening = state.needReadable = true;
	      state.emittedReadable = false;
	      if (!state.reading) {
	        processNextTick(nReadingNextTick, this);
	      } else if (state.length) {
	        emitReadable(this, state);
	      }
	    }
	  }
	
	  return res;
	};
	Readable.prototype.addListener = Readable.prototype.on;
	
	function nReadingNextTick(self) {
	  debug('readable nexttick read 0');
	  self.read(0);
	}
	
	// pause() and resume() are remnants of the legacy readable stream API
	// If the user uses them, then switch into old mode.
	Readable.prototype.resume = function () {
	  var state = this._readableState;
	  if (!state.flowing) {
	    debug('resume');
	    state.flowing = true;
	    resume(this, state);
	  }
	  return this;
	};
	
	function resume(stream, state) {
	  if (!state.resumeScheduled) {
	    state.resumeScheduled = true;
	    processNextTick(resume_, stream, state);
	  }
	}
	
	function resume_(stream, state) {
	  if (!state.reading) {
	    debug('resume read 0');
	    stream.read(0);
	  }
	
	  state.resumeScheduled = false;
	  state.awaitDrain = 0;
	  stream.emit('resume');
	  flow(stream);
	  if (state.flowing && !state.reading) stream.read(0);
	}
	
	Readable.prototype.pause = function () {
	  debug('call pause flowing=%j', this._readableState.flowing);
	  if (false !== this._readableState.flowing) {
	    debug('pause');
	    this._readableState.flowing = false;
	    this.emit('pause');
	  }
	  return this;
	};
	
	function flow(stream) {
	  var state = stream._readableState;
	  debug('flow', state.flowing);
	  while (state.flowing && stream.read() !== null) {}
	}
	
	// wrap an old-style stream as the async data source.
	// This is *not* part of the readable stream interface.
	// It is an ugly unfortunate mess of history.
	Readable.prototype.wrap = function (stream) {
	  var state = this._readableState;
	  var paused = false;
	
	  var self = this;
	  stream.on('end', function () {
	    debug('wrapped end');
	    if (state.decoder && !state.ended) {
	      var chunk = state.decoder.end();
	      if (chunk && chunk.length) self.push(chunk);
	    }
	
	    self.push(null);
	  });
	
	  stream.on('data', function (chunk) {
	    debug('wrapped data');
	    if (state.decoder) chunk = state.decoder.write(chunk);
	
	    // don't skip over falsy values in objectMode
	    if (state.objectMode && (chunk === null || chunk === undefined)) return;else if (!state.objectMode && (!chunk || !chunk.length)) return;
	
	    var ret = self.push(chunk);
	    if (!ret) {
	      paused = true;
	      stream.pause();
	    }
	  });
	
	  // proxy all the other methods.
	  // important when wrapping filters and duplexes.
	  for (var i in stream) {
	    if (this[i] === undefined && typeof stream[i] === 'function') {
	      this[i] = function (method) {
	        return function () {
	          return stream[method].apply(stream, arguments);
	        };
	      }(i);
	    }
	  }
	
	  // proxy certain important events.
	  var events = ['error', 'close', 'destroy', 'pause', 'resume'];
	  forEach(events, function (ev) {
	    stream.on(ev, self.emit.bind(self, ev));
	  });
	
	  // when we try to consume some more bytes, simply unpause the
	  // underlying stream.
	  self._read = function (n) {
	    debug('wrapped _read', n);
	    if (paused) {
	      paused = false;
	      stream.resume();
	    }
	  };
	
	  return self;
	};
	
	// exposed for testing purposes only.
	Readable._fromList = fromList;
	
	// Pluck off n bytes from an array of buffers.
	// Length is the combined lengths of all the buffers in the list.
	// This function is designed to be inlinable, so please take care when making
	// changes to the function body.
	function fromList(n, state) {
	  // nothing buffered
	  if (state.length === 0) return null;
	
	  var ret;
	  if (state.objectMode) ret = state.buffer.shift();else if (!n || n >= state.length) {
	    // read it all, truncate the list
	    if (state.decoder) ret = state.buffer.join('');else if (state.buffer.length === 1) ret = state.buffer.head.data;else ret = state.buffer.concat(state.length);
	    state.buffer.clear();
	  } else {
	    // read part of list
	    ret = fromListPartial(n, state.buffer, state.decoder);
	  }
	
	  return ret;
	}
	
	// Extracts only enough buffered data to satisfy the amount requested.
	// This function is designed to be inlinable, so please take care when making
	// changes to the function body.
	function fromListPartial(n, list, hasStrings) {
	  var ret;
	  if (n < list.head.data.length) {
	    // slice is the same for buffers and strings
	    ret = list.head.data.slice(0, n);
	    list.head.data = list.head.data.slice(n);
	  } else if (n === list.head.data.length) {
	    // first chunk is a perfect match
	    ret = list.shift();
	  } else {
	    // result spans more than one buffer
	    ret = hasStrings ? copyFromBufferString(n, list) : copyFromBuffer(n, list);
	  }
	  return ret;
	}
	
	// Copies a specified amount of characters from the list of buffered data
	// chunks.
	// This function is designed to be inlinable, so please take care when making
	// changes to the function body.
	function copyFromBufferString(n, list) {
	  var p = list.head;
	  var c = 1;
	  var ret = p.data;
	  n -= ret.length;
	  while (p = p.next) {
	    var str = p.data;
	    var nb = n > str.length ? str.length : n;
	    if (nb === str.length) ret += str;else ret += str.slice(0, n);
	    n -= nb;
	    if (n === 0) {
	      if (nb === str.length) {
	        ++c;
	        if (p.next) list.head = p.next;else list.head = list.tail = null;
	      } else {
	        list.head = p;
	        p.data = str.slice(nb);
	      }
	      break;
	    }
	    ++c;
	  }
	  list.length -= c;
	  return ret;
	}
	
	// Copies a specified amount of bytes from the list of buffered data chunks.
	// This function is designed to be inlinable, so please take care when making
	// changes to the function body.
	function copyFromBuffer(n, list) {
	  var ret = bufferShim.allocUnsafe(n);
	  var p = list.head;
	  var c = 1;
	  p.data.copy(ret);
	  n -= p.data.length;
	  while (p = p.next) {
	    var buf = p.data;
	    var nb = n > buf.length ? buf.length : n;
	    buf.copy(ret, ret.length - n, 0, nb);
	    n -= nb;
	    if (n === 0) {
	      if (nb === buf.length) {
	        ++c;
	        if (p.next) list.head = p.next;else list.head = list.tail = null;
	      } else {
	        list.head = p;
	        p.data = buf.slice(nb);
	      }
	      break;
	    }
	    ++c;
	  }
	  list.length -= c;
	  return ret;
	}
	
	function endReadable(stream) {
	  var state = stream._readableState;
	
	  // If we get here before consuming all the bytes, then that is a
	  // bug in node.  Should never happen.
	  if (state.length > 0) throw new Error('"endReadable()" called on non-empty stream');
	
	  if (!state.endEmitted) {
	    state.ended = true;
	    processNextTick(endReadableNT, state, stream);
	  }
	}
	
	function endReadableNT(state, stream) {
	  // Check that we didn't get one last unshift.
	  if (!state.endEmitted && state.length === 0) {
	    state.endEmitted = true;
	    stream.readable = false;
	    stream.emit('end');
	  }
	}
	
	function forEach(xs, f) {
	  for (var i = 0, l = xs.length; i < l; i++) {
	    f(xs[i], i);
	  }
	}
	
	function indexOf(xs, x) {
	  for (var i = 0, l = xs.length; i < l; i++) {
	    if (xs[i] === x) return i;
	  }
	  return -1;
	}
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(6)))

/***/ },
/* 15 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {'use strict';
	
	if (!process.version ||
	    process.version.indexOf('v0.') === 0 ||
	    process.version.indexOf('v1.') === 0 && process.version.indexOf('v1.8.') !== 0) {
	  module.exports = nextTick;
	} else {
	  module.exports = process.nextTick;
	}
	
	function nextTick(fn, arg1, arg2, arg3) {
	  if (typeof fn !== 'function') {
	    throw new TypeError('"callback" argument must be a function');
	  }
	  var len = arguments.length;
	  var args, i;
	  switch (len) {
	  case 0:
	  case 1:
	    return process.nextTick(fn);
	  case 2:
	    return process.nextTick(function afterTickOne() {
	      fn.call(null, arg1);
	    });
	  case 3:
	    return process.nextTick(function afterTickTwo() {
	      fn.call(null, arg1, arg2);
	    });
	  case 4:
	    return process.nextTick(function afterTickThree() {
	      fn.call(null, arg1, arg2, arg3);
	    });
	  default:
	    args = new Array(len - 1);
	    i = 0;
	    while (i < args.length) {
	      args[i++] = arguments[i];
	    }
	    return process.nextTick(function afterTick() {
	      fn.apply(null, args);
	    });
	  }
	}
	
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(6)))

/***/ },
/* 16 */
/***/ function(module, exports) {

	var toString = {}.toString;
	
	module.exports = Array.isArray || function (arr) {
	  return toString.call(arr) == '[object Array]';
	};


/***/ },
/* 17 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global) {'use strict';
	
	var buffer = __webpack_require__(2);
	var Buffer = buffer.Buffer;
	var SlowBuffer = buffer.SlowBuffer;
	var MAX_LEN = buffer.kMaxLength || 2147483647;
	exports.alloc = function alloc(size, fill, encoding) {
	  if (typeof Buffer.alloc === 'function') {
	    return Buffer.alloc(size, fill, encoding);
	  }
	  if (typeof encoding === 'number') {
	    throw new TypeError('encoding must not be number');
	  }
	  if (typeof size !== 'number') {
	    throw new TypeError('size must be a number');
	  }
	  if (size > MAX_LEN) {
	    throw new RangeError('size is too large');
	  }
	  var enc = encoding;
	  var _fill = fill;
	  if (_fill === undefined) {
	    enc = undefined;
	    _fill = 0;
	  }
	  var buf = new Buffer(size);
	  if (typeof _fill === 'string') {
	    var fillBuf = new Buffer(_fill, enc);
	    var flen = fillBuf.length;
	    var i = -1;
	    while (++i < size) {
	      buf[i] = fillBuf[i % flen];
	    }
	  } else {
	    buf.fill(_fill);
	  }
	  return buf;
	}
	exports.allocUnsafe = function allocUnsafe(size) {
	  if (typeof Buffer.allocUnsafe === 'function') {
	    return Buffer.allocUnsafe(size);
	  }
	  if (typeof size !== 'number') {
	    throw new TypeError('size must be a number');
	  }
	  if (size > MAX_LEN) {
	    throw new RangeError('size is too large');
	  }
	  return new Buffer(size);
	}
	exports.from = function from(value, encodingOrOffset, length) {
	  if (typeof Buffer.from === 'function' && (!global.Uint8Array || Uint8Array.from !== Buffer.from)) {
	    return Buffer.from(value, encodingOrOffset, length);
	  }
	  if (typeof value === 'number') {
	    throw new TypeError('"value" argument must not be a number');
	  }
	  if (typeof value === 'string') {
	    return new Buffer(value, encodingOrOffset);
	  }
	  if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) {
	    var offset = encodingOrOffset;
	    if (arguments.length === 1) {
	      return new Buffer(value);
	    }
	    if (typeof offset === 'undefined') {
	      offset = 0;
	    }
	    var len = length;
	    if (typeof len === 'undefined') {
	      len = value.byteLength - offset;
	    }
	    if (offset >= value.byteLength) {
	      throw new RangeError('\'offset\' is out of bounds');
	    }
	    if (len > value.byteLength - offset) {
	      throw new RangeError('\'length\' is out of bounds');
	    }
	    return new Buffer(value.slice(offset, offset + len));
	  }
	  if (Buffer.isBuffer(value)) {
	    var out = new Buffer(value.length);
	    value.copy(out, 0, 0, value.length);
	    return out;
	  }
	  if (value) {
	    if (Array.isArray(value) || (typeof ArrayBuffer !== 'undefined' && value.buffer instanceof ArrayBuffer) || 'length' in value) {
	      return new Buffer(value);
	    }
	    if (value.type === 'Buffer' && Array.isArray(value.data)) {
	      return new Buffer(value.data);
	    }
	  }
	
	  throw new TypeError('First argument must be a string, Buffer, ' + 'ArrayBuffer, Array, or array-like object.');
	}
	exports.allocUnsafeSlow = function allocUnsafeSlow(size) {
	  if (typeof Buffer.allocUnsafeSlow === 'function') {
	    return Buffer.allocUnsafeSlow(size);
	  }
	  if (typeof size !== 'number') {
	    throw new TypeError('size must be a number');
	  }
	  if (size >= MAX_LEN) {
	    throw new RangeError('size is too large');
	  }
	  return new SlowBuffer(size);
	}
	
	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 18 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer) {// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.
	
	// NOTE: These type checking functions intentionally don't use `instanceof`
	// because it is fragile and can be easily faked with `Object.create()`.
	
	function isArray(arg) {
	  if (Array.isArray) {
	    return Array.isArray(arg);
	  }
	  return objectToString(arg) === '[object Array]';
	}
	exports.isArray = isArray;
	
	function isBoolean(arg) {
	  return typeof arg === 'boolean';
	}
	exports.isBoolean = isBoolean;
	
	function isNull(arg) {
	  return arg === null;
	}
	exports.isNull = isNull;
	
	function isNullOrUndefined(arg) {
	  return arg == null;
	}
	exports.isNullOrUndefined = isNullOrUndefined;
	
	function isNumber(arg) {
	  return typeof arg === 'number';
	}
	exports.isNumber = isNumber;
	
	function isString(arg) {
	  return typeof arg === 'string';
	}
	exports.isString = isString;
	
	function isSymbol(arg) {
	  return typeof arg === 'symbol';
	}
	exports.isSymbol = isSymbol;
	
	function isUndefined(arg) {
	  return arg === void 0;
	}
	exports.isUndefined = isUndefined;
	
	function isRegExp(re) {
	  return objectToString(re) === '[object RegExp]';
	}
	exports.isRegExp = isRegExp;
	
	function isObject(arg) {
	  return typeof arg === 'object' && arg !== null;
	}
	exports.isObject = isObject;
	
	function isDate(d) {
	  return objectToString(d) === '[object Date]';
	}
	exports.isDate = isDate;
	
	function isError(e) {
	  return (objectToString(e) === '[object Error]' || e instanceof Error);
	}
	exports.isError = isError;
	
	function isFunction(arg) {
	  return typeof arg === 'function';
	}
	exports.isFunction = isFunction;
	
	function isPrimitive(arg) {
	  return arg === null ||
	         typeof arg === 'boolean' ||
	         typeof arg === 'number' ||
	         typeof arg === 'string' ||
	         typeof arg === 'symbol' ||  // ES6 symbol
	         typeof arg === 'undefined';
	}
	exports.isPrimitive = isPrimitive;
	
	exports.isBuffer = Buffer.isBuffer;
	
	function objectToString(o) {
	  return Object.prototype.toString.call(o);
	}
	
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(1)))

/***/ },
/* 19 */
/***/ function(module, exports) {

	/* (ignored) */

/***/ },
/* 20 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var Buffer = __webpack_require__(2).Buffer;
	/*<replacement>*/
	var bufferShim = __webpack_require__(17);
	/*</replacement>*/
	
	module.exports = BufferList;
	
	function BufferList() {
	  this.head = null;
	  this.tail = null;
	  this.length = 0;
	}
	
	BufferList.prototype.push = function (v) {
	  var entry = { data: v, next: null };
	  if (this.length > 0) this.tail.next = entry;else this.head = entry;
	  this.tail = entry;
	  ++this.length;
	};
	
	BufferList.prototype.unshift = function (v) {
	  var entry = { data: v, next: this.head };
	  if (this.length === 0) this.tail = entry;
	  this.head = entry;
	  ++this.length;
	};
	
	BufferList.prototype.shift = function () {
	  if (this.length === 0) return;
	  var ret = this.head.data;
	  if (this.length === 1) this.head = this.tail = null;else this.head = this.head.next;
	  --this.length;
	  return ret;
	};
	
	BufferList.prototype.clear = function () {
	  this.head = this.tail = null;
	  this.length = 0;
	};
	
	BufferList.prototype.join = function (s) {
	  if (this.length === 0) return '';
	  var p = this.head;
	  var ret = '' + p.data;
	  while (p = p.next) {
	    ret += s + p.data;
	  }return ret;
	};
	
	BufferList.prototype.concat = function (n) {
	  if (this.length === 0) return bufferShim.alloc(0);
	  if (this.length === 1) return this.head.data;
	  var ret = bufferShim.allocUnsafe(n >>> 0);
	  var p = this.head;
	  var i = 0;
	  while (p) {
	    p.data.copy(ret, i);
	    i += p.data.length;
	    p = p.next;
	  }
	  return ret;
	};

/***/ },
/* 21 */
/***/ function(module, exports, __webpack_require__) {

	// a duplex stream is just a stream that is both readable and writable.
	// Since JS doesn't have multiple prototypal inheritance, this class
	// prototypally inherits from Readable, and then parasitically from
	// Writable.
	
	'use strict';
	
	/*<replacement>*/
	
	var objectKeys = Object.keys || function (obj) {
	  var keys = [];
	  for (var key in obj) {
	    keys.push(key);
	  }return keys;
	};
	/*</replacement>*/
	
	module.exports = Duplex;
	
	/*<replacement>*/
	var processNextTick = __webpack_require__(15);
	/*</replacement>*/
	
	/*<replacement>*/
	var util = __webpack_require__(18);
	util.inherits = __webpack_require__(12);
	/*</replacement>*/
	
	var Readable = __webpack_require__(14);
	var Writable = __webpack_require__(22);
	
	util.inherits(Duplex, Readable);
	
	var keys = objectKeys(Writable.prototype);
	for (var v = 0; v < keys.length; v++) {
	  var method = keys[v];
	  if (!Duplex.prototype[method]) Duplex.prototype[method] = Writable.prototype[method];
	}
	
	function Duplex(options) {
	  if (!(this instanceof Duplex)) return new Duplex(options);
	
	  Readable.call(this, options);
	  Writable.call(this, options);
	
	  if (options && options.readable === false) this.readable = false;
	
	  if (options && options.writable === false) this.writable = false;
	
	  this.allowHalfOpen = true;
	  if (options && options.allowHalfOpen === false) this.allowHalfOpen = false;
	
	  this.once('end', onend);
	}
	
	// the no-half-open enforcer
	function onend() {
	  // if we allow half-open state, or if the writable side ended,
	  // then we're ok.
	  if (this.allowHalfOpen || this._writableState.ended) return;
	
	  // no more data can be written.
	  // But allow more writes to happen in this tick.
	  processNextTick(onEndNT, this);
	}
	
	function onEndNT(self) {
	  self.end();
	}
	
	function forEach(xs, f) {
	  for (var i = 0, l = xs.length; i < l; i++) {
	    f(xs[i], i);
	  }
	}

/***/ },
/* 22 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {// A bit simpler than readable streams.
	// Implement an async ._write(chunk, encoding, cb), and it'll handle all
	// the drain event emission and buffering.
	
	'use strict';
	
	module.exports = Writable;
	
	/*<replacement>*/
	var processNextTick = __webpack_require__(15);
	/*</replacement>*/
	
	/*<replacement>*/
	var asyncWrite = !process.browser && ['v0.10', 'v0.9.'].indexOf(process.version.slice(0, 5)) > -1 ? setImmediate : processNextTick;
	/*</replacement>*/
	
	/*<replacement>*/
	var Duplex;
	/*</replacement>*/
	
	Writable.WritableState = WritableState;
	
	/*<replacement>*/
	var util = __webpack_require__(18);
	util.inherits = __webpack_require__(12);
	/*</replacement>*/
	
	/*<replacement>*/
	var internalUtil = {
	  deprecate: __webpack_require__(23)
	};
	/*</replacement>*/
	
	/*<replacement>*/
	var Stream;
	(function () {
	  try {
	    Stream = __webpack_require__(11);
	  } catch (_) {} finally {
	    if (!Stream) Stream = __webpack_require__(8).EventEmitter;
	  }
	})();
	/*</replacement>*/
	
	var Buffer = __webpack_require__(2).Buffer;
	/*<replacement>*/
	var bufferShim = __webpack_require__(17);
	/*</replacement>*/
	
	util.inherits(Writable, Stream);
	
	function nop() {}
	
	function WriteReq(chunk, encoding, cb) {
	  this.chunk = chunk;
	  this.encoding = encoding;
	  this.callback = cb;
	  this.next = null;
	}
	
	function WritableState(options, stream) {
	  Duplex = Duplex || __webpack_require__(21);
	
	  options = options || {};
	
	  // object stream flag to indicate whether or not this stream
	  // contains buffers or objects.
	  this.objectMode = !!options.objectMode;
	
	  if (stream instanceof Duplex) this.objectMode = this.objectMode || !!options.writableObjectMode;
	
	  // the point at which write() starts returning false
	  // Note: 0 is a valid value, means that we always return false if
	  // the entire buffer is not flushed immediately on write()
	  var hwm = options.highWaterMark;
	  var defaultHwm = this.objectMode ? 16 : 16 * 1024;
	  this.highWaterMark = hwm || hwm === 0 ? hwm : defaultHwm;
	
	  // cast to ints.
	  this.highWaterMark = ~~this.highWaterMark;
	
	  // drain event flag.
	  this.needDrain = false;
	  // at the start of calling end()
	  this.ending = false;
	  // when end() has been called, and returned
	  this.ended = false;
	  // when 'finish' is emitted
	  this.finished = false;
	
	  // should we decode strings into buffers before passing to _write?
	  // this is here so that some node-core streams can optimize string
	  // handling at a lower level.
	  var noDecode = options.decodeStrings === false;
	  this.decodeStrings = !noDecode;
	
	  // Crypto is kind of old and crusty.  Historically, its default string
	  // encoding is 'binary' so we have to make this configurable.
	  // Everything else in the universe uses 'utf8', though.
	  this.defaultEncoding = options.defaultEncoding || 'utf8';
	
	  // not an actual buffer we keep track of, but a measurement
	  // of how much we're waiting to get pushed to some underlying
	  // socket or file.
	  this.length = 0;
	
	  // a flag to see when we're in the middle of a write.
	  this.writing = false;
	
	  // when true all writes will be buffered until .uncork() call
	  this.corked = 0;
	
	  // a flag to be able to tell if the onwrite cb is called immediately,
	  // or on a later tick.  We set this to true at first, because any
	  // actions that shouldn't happen until "later" should generally also
	  // not happen before the first write call.
	  this.sync = true;
	
	  // a flag to know if we're processing previously buffered items, which
	  // may call the _write() callback in the same tick, so that we don't
	  // end up in an overlapped onwrite situation.
	  this.bufferProcessing = false;
	
	  // the callback that's passed to _write(chunk,cb)
	  this.onwrite = function (er) {
	    onwrite(stream, er);
	  };
	
	  // the callback that the user supplies to write(chunk,encoding,cb)
	  this.writecb = null;
	
	  // the amount that is being written when _write is called.
	  this.writelen = 0;
	
	  this.bufferedRequest = null;
	  this.lastBufferedRequest = null;
	
	  // number of pending user-supplied write callbacks
	  // this must be 0 before 'finish' can be emitted
	  this.pendingcb = 0;
	
	  // emit prefinish if the only thing we're waiting for is _write cbs
	  // This is relevant for synchronous Transform streams
	  this.prefinished = false;
	
	  // True if the error was already emitted and should not be thrown again
	  this.errorEmitted = false;
	
	  // count buffered requests
	  this.bufferedRequestCount = 0;
	
	  // allocate the first CorkedRequest, there is always
	  // one allocated and free to use, and we maintain at most two
	  this.corkedRequestsFree = new CorkedRequest(this);
	}
	
	WritableState.prototype.getBuffer = function getBuffer() {
	  var current = this.bufferedRequest;
	  var out = [];
	  while (current) {
	    out.push(current);
	    current = current.next;
	  }
	  return out;
	};
	
	(function () {
	  try {
	    Object.defineProperty(WritableState.prototype, 'buffer', {
	      get: internalUtil.deprecate(function () {
	        return this.getBuffer();
	      }, '_writableState.buffer is deprecated. Use _writableState.getBuffer ' + 'instead.')
	    });
	  } catch (_) {}
	})();
	
	// Test _writableState for inheritance to account for Duplex streams,
	// whose prototype chain only points to Readable.
	var realHasInstance;
	if (typeof Symbol === 'function' && Symbol.hasInstance && typeof Function.prototype[Symbol.hasInstance] === 'function') {
	  realHasInstance = Function.prototype[Symbol.hasInstance];
	  Object.defineProperty(Writable, Symbol.hasInstance, {
	    value: function (object) {
	      if (realHasInstance.call(this, object)) return true;
	
	      return object && object._writableState instanceof WritableState;
	    }
	  });
	} else {
	  realHasInstance = function (object) {
	    return object instanceof this;
	  };
	}
	
	function Writable(options) {
	  Duplex = Duplex || __webpack_require__(21);
	
	  // Writable ctor is applied to Duplexes, too.
	  // `realHasInstance` is necessary because using plain `instanceof`
	  // would return false, as no `_writableState` property is attached.
	
	  // Trying to use the custom `instanceof` for Writable here will also break the
	  // Node.js LazyTransform implementation, which has a non-trivial getter for
	  // `_writableState` that would lead to infinite recursion.
	  if (!realHasInstance.call(Writable, this) && !(this instanceof Duplex)) {
	    return new Writable(options);
	  }
	
	  this._writableState = new WritableState(options, this);
	
	  // legacy.
	  this.writable = true;
	
	  if (options) {
	    if (typeof options.write === 'function') this._write = options.write;
	
	    if (typeof options.writev === 'function') this._writev = options.writev;
	  }
	
	  Stream.call(this);
	}
	
	// Otherwise people can pipe Writable streams, which is just wrong.
	Writable.prototype.pipe = function () {
	  this.emit('error', new Error('Cannot pipe, not readable'));
	};
	
	function writeAfterEnd(stream, cb) {
	  var er = new Error('write after end');
	  // TODO: defer error events consistently everywhere, not just the cb
	  stream.emit('error', er);
	  processNextTick(cb, er);
	}
	
	// Checks that a user-supplied chunk is valid, especially for the particular
	// mode the stream is in. Currently this means that `null` is never accepted
	// and undefined/non-string values are only allowed in object mode.
	function validChunk(stream, state, chunk, cb) {
	  var valid = true;
	  var er = false;
	
	  if (chunk === null) {
	    er = new TypeError('May not write null values to stream');
	  } else if (typeof chunk !== 'string' && chunk !== undefined && !state.objectMode) {
	    er = new TypeError('Invalid non-string/buffer chunk');
	  }
	  if (er) {
	    stream.emit('error', er);
	    processNextTick(cb, er);
	    valid = false;
	  }
	  return valid;
	}
	
	Writable.prototype.write = function (chunk, encoding, cb) {
	  var state = this._writableState;
	  var ret = false;
	  var isBuf = Buffer.isBuffer(chunk);
	
	  if (typeof encoding === 'function') {
	    cb = encoding;
	    encoding = null;
	  }
	
	  if (isBuf) encoding = 'buffer';else if (!encoding) encoding = state.defaultEncoding;
	
	  if (typeof cb !== 'function') cb = nop;
	
	  if (state.ended) writeAfterEnd(this, cb);else if (isBuf || validChunk(this, state, chunk, cb)) {
	    state.pendingcb++;
	    ret = writeOrBuffer(this, state, isBuf, chunk, encoding, cb);
	  }
	
	  return ret;
	};
	
	Writable.prototype.cork = function () {
	  var state = this._writableState;
	
	  state.corked++;
	};
	
	Writable.prototype.uncork = function () {
	  var state = this._writableState;
	
	  if (state.corked) {
	    state.corked--;
	
	    if (!state.writing && !state.corked && !state.finished && !state.bufferProcessing && state.bufferedRequest) clearBuffer(this, state);
	  }
	};
	
	Writable.prototype.setDefaultEncoding = function setDefaultEncoding(encoding) {
	  // node::ParseEncoding() requires lower case.
	  if (typeof encoding === 'string') encoding = encoding.toLowerCase();
	  if (!(['hex', 'utf8', 'utf-8', 'ascii', 'binary', 'base64', 'ucs2', 'ucs-2', 'utf16le', 'utf-16le', 'raw'].indexOf((encoding + '').toLowerCase()) > -1)) throw new TypeError('Unknown encoding: ' + encoding);
	  this._writableState.defaultEncoding = encoding;
	  return this;
	};
	
	function decodeChunk(state, chunk, encoding) {
	  if (!state.objectMode && state.decodeStrings !== false && typeof chunk === 'string') {
	    chunk = bufferShim.from(chunk, encoding);
	  }
	  return chunk;
	}
	
	// if we're already writing something, then just put this
	// in the queue, and wait our turn.  Otherwise, call _write
	// If we return false, then we need a drain event, so set that flag.
	function writeOrBuffer(stream, state, isBuf, chunk, encoding, cb) {
	  if (!isBuf) {
	    chunk = decodeChunk(state, chunk, encoding);
	    if (Buffer.isBuffer(chunk)) encoding = 'buffer';
	  }
	  var len = state.objectMode ? 1 : chunk.length;
	
	  state.length += len;
	
	  var ret = state.length < state.highWaterMark;
	  // we must ensure that previous needDrain will not be reset to false.
	  if (!ret) state.needDrain = true;
	
	  if (state.writing || state.corked) {
	    var last = state.lastBufferedRequest;
	    state.lastBufferedRequest = new WriteReq(chunk, encoding, cb);
	    if (last) {
	      last.next = state.lastBufferedRequest;
	    } else {
	      state.bufferedRequest = state.lastBufferedRequest;
	    }
	    state.bufferedRequestCount += 1;
	  } else {
	    doWrite(stream, state, false, len, chunk, encoding, cb);
	  }
	
	  return ret;
	}
	
	function doWrite(stream, state, writev, len, chunk, encoding, cb) {
	  state.writelen = len;
	  state.writecb = cb;
	  state.writing = true;
	  state.sync = true;
	  if (writev) stream._writev(chunk, state.onwrite);else stream._write(chunk, encoding, state.onwrite);
	  state.sync = false;
	}
	
	function onwriteError(stream, state, sync, er, cb) {
	  --state.pendingcb;
	  if (sync) processNextTick(cb, er);else cb(er);
	
	  stream._writableState.errorEmitted = true;
	  stream.emit('error', er);
	}
	
	function onwriteStateUpdate(state) {
	  state.writing = false;
	  state.writecb = null;
	  state.length -= state.writelen;
	  state.writelen = 0;
	}
	
	function onwrite(stream, er) {
	  var state = stream._writableState;
	  var sync = state.sync;
	  var cb = state.writecb;
	
	  onwriteStateUpdate(state);
	
	  if (er) onwriteError(stream, state, sync, er, cb);else {
	    // Check if we're actually ready to finish, but don't emit yet
	    var finished = needFinish(state);
	
	    if (!finished && !state.corked && !state.bufferProcessing && state.bufferedRequest) {
	      clearBuffer(stream, state);
	    }
	
	    if (sync) {
	      /*<replacement>*/
	      asyncWrite(afterWrite, stream, state, finished, cb);
	      /*</replacement>*/
	    } else {
	      afterWrite(stream, state, finished, cb);
	    }
	  }
	}
	
	function afterWrite(stream, state, finished, cb) {
	  if (!finished) onwriteDrain(stream, state);
	  state.pendingcb--;
	  cb();
	  finishMaybe(stream, state);
	}
	
	// Must force callback to be called on nextTick, so that we don't
	// emit 'drain' before the write() consumer gets the 'false' return
	// value, and has a chance to attach a 'drain' listener.
	function onwriteDrain(stream, state) {
	  if (state.length === 0 && state.needDrain) {
	    state.needDrain = false;
	    stream.emit('drain');
	  }
	}
	
	// if there's something in the buffer waiting, then process it
	function clearBuffer(stream, state) {
	  state.bufferProcessing = true;
	  var entry = state.bufferedRequest;
	
	  if (stream._writev && entry && entry.next) {
	    // Fast case, write everything using _writev()
	    var l = state.bufferedRequestCount;
	    var buffer = new Array(l);
	    var holder = state.corkedRequestsFree;
	    holder.entry = entry;
	
	    var count = 0;
	    while (entry) {
	      buffer[count] = entry;
	      entry = entry.next;
	      count += 1;
	    }
	
	    doWrite(stream, state, true, state.length, buffer, '', holder.finish);
	
	    // doWrite is almost always async, defer these to save a bit of time
	    // as the hot path ends with doWrite
	    state.pendingcb++;
	    state.lastBufferedRequest = null;
	    if (holder.next) {
	      state.corkedRequestsFree = holder.next;
	      holder.next = null;
	    } else {
	      state.corkedRequestsFree = new CorkedRequest(state);
	    }
	  } else {
	    // Slow case, write chunks one-by-one
	    while (entry) {
	      var chunk = entry.chunk;
	      var encoding = entry.encoding;
	      var cb = entry.callback;
	      var len = state.objectMode ? 1 : chunk.length;
	
	      doWrite(stream, state, false, len, chunk, encoding, cb);
	      entry = entry.next;
	      // if we didn't call the onwrite immediately, then
	      // it means that we need to wait until it does.
	      // also, that means that the chunk and cb are currently
	      // being processed, so move the buffer counter past them.
	      if (state.writing) {
	        break;
	      }
	    }
	
	    if (entry === null) state.lastBufferedRequest = null;
	  }
	
	  state.bufferedRequestCount = 0;
	  state.bufferedRequest = entry;
	  state.bufferProcessing = false;
	}
	
	Writable.prototype._write = function (chunk, encoding, cb) {
	  cb(new Error('_write() is not implemented'));
	};
	
	Writable.prototype._writev = null;
	
	Writable.prototype.end = function (chunk, encoding, cb) {
	  var state = this._writableState;
	
	  if (typeof chunk === 'function') {
	    cb = chunk;
	    chunk = null;
	    encoding = null;
	  } else if (typeof encoding === 'function') {
	    cb = encoding;
	    encoding = null;
	  }
	
	  if (chunk !== null && chunk !== undefined) this.write(chunk, encoding);
	
	  // .end() fully uncorks
	  if (state.corked) {
	    state.corked = 1;
	    this.uncork();
	  }
	
	  // ignore unnecessary end() calls.
	  if (!state.ending && !state.finished) endWritable(this, state, cb);
	};
	
	function needFinish(state) {
	  return state.ending && state.length === 0 && state.bufferedRequest === null && !state.finished && !state.writing;
	}
	
	function prefinish(stream, state) {
	  if (!state.prefinished) {
	    state.prefinished = true;
	    stream.emit('prefinish');
	  }
	}
	
	function finishMaybe(stream, state) {
	  var need = needFinish(state);
	  if (need) {
	    if (state.pendingcb === 0) {
	      prefinish(stream, state);
	      state.finished = true;
	      stream.emit('finish');
	    } else {
	      prefinish(stream, state);
	    }
	  }
	  return need;
	}
	
	function endWritable(stream, state, cb) {
	  state.ending = true;
	  finishMaybe(stream, state);
	  if (cb) {
	    if (state.finished) processNextTick(cb);else stream.once('finish', cb);
	  }
	  state.ended = true;
	  stream.writable = false;
	}
	
	// It seems a linked list but it is not
	// there will be only 2 of these for each stream
	function CorkedRequest(state) {
	  var _this = this;
	
	  this.next = null;
	  this.entry = null;
	  this.finish = function (err) {
	    var entry = _this.entry;
	    _this.entry = null;
	    while (entry) {
	      var cb = entry.callback;
	      state.pendingcb--;
	      cb(err);
	      entry = entry.next;
	    }
	    if (state.corkedRequestsFree) {
	      state.corkedRequestsFree.next = _this;
	    } else {
	      state.corkedRequestsFree = _this;
	    }
	  };
	}
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(6)))

/***/ },
/* 23 */
/***/ function(module, exports) {

	/* WEBPACK VAR INJECTION */(function(global) {
	/**
	 * Module exports.
	 */
	
	module.exports = deprecate;
	
	/**
	 * Mark that a method should not be used.
	 * Returns a modified function which warns once by default.
	 *
	 * If `localStorage.noDeprecation = true` is set, then it is a no-op.
	 *
	 * If `localStorage.throwDeprecation = true` is set, then deprecated functions
	 * will throw an Error when invoked.
	 *
	 * If `localStorage.traceDeprecation = true` is set, then deprecated functions
	 * will invoke `console.trace()` instead of `console.error()`.
	 *
	 * @param {Function} fn - the function to deprecate
	 * @param {String} msg - the string to print to the console when `fn` is invoked
	 * @returns {Function} a new "deprecated" version of `fn`
	 * @api public
	 */
	
	function deprecate (fn, msg) {
	  if (config('noDeprecation')) {
	    return fn;
	  }
	
	  var warned = false;
	  function deprecated() {
	    if (!warned) {
	      if (config('throwDeprecation')) {
	        throw new Error(msg);
	      } else if (config('traceDeprecation')) {
	        console.trace(msg);
	      } else {
	        console.warn(msg);
	      }
	      warned = true;
	    }
	    return fn.apply(this, arguments);
	  }
	
	  return deprecated;
	}
	
	/**
	 * Checks `localStorage` for boolean values for the given `name`.
	 *
	 * @param {String} name
	 * @returns {Boolean}
	 * @api private
	 */
	
	function config (name) {
	  // accessing global.localStorage can trigger a DOMException in sandboxed iframes
	  try {
	    if (!global.localStorage) return false;
	  } catch (_) {
	    return false;
	  }
	  var val = global.localStorage[name];
	  if (null == val) return false;
	  return String(val).toLowerCase() === 'true';
	}
	
	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 24 */
/***/ function(module, exports, __webpack_require__) {

	// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.
	
	var Buffer = __webpack_require__(2).Buffer;
	
	var isBufferEncoding = Buffer.isEncoding
	  || function(encoding) {
	       switch (encoding && encoding.toLowerCase()) {
	         case 'hex': case 'utf8': case 'utf-8': case 'ascii': case 'binary': case 'base64': case 'ucs2': case 'ucs-2': case 'utf16le': case 'utf-16le': case 'raw': return true;
	         default: return false;
	       }
	     }
	
	
	function assertEncoding(encoding) {
	  if (encoding && !isBufferEncoding(encoding)) {
	    throw new Error('Unknown encoding: ' + encoding);
	  }
	}
	
	// StringDecoder provides an interface for efficiently splitting a series of
	// buffers into a series of JS strings without breaking apart multi-byte
	// characters. CESU-8 is handled as part of the UTF-8 encoding.
	//
	// @TODO Handling all encodings inside a single object makes it very difficult
	// to reason about this code, so it should be split up in the future.
	// @TODO There should be a utf8-strict encoding that rejects invalid UTF-8 code
	// points as used by CESU-8.
	var StringDecoder = exports.StringDecoder = function(encoding) {
	  this.encoding = (encoding || 'utf8').toLowerCase().replace(/[-_]/, '');
	  assertEncoding(encoding);
	  switch (this.encoding) {
	    case 'utf8':
	      // CESU-8 represents each of Surrogate Pair by 3-bytes
	      this.surrogateSize = 3;
	      break;
	    case 'ucs2':
	    case 'utf16le':
	      // UTF-16 represents each of Surrogate Pair by 2-bytes
	      this.surrogateSize = 2;
	      this.detectIncompleteChar = utf16DetectIncompleteChar;
	      break;
	    case 'base64':
	      // Base-64 stores 3 bytes in 4 chars, and pads the remainder.
	      this.surrogateSize = 3;
	      this.detectIncompleteChar = base64DetectIncompleteChar;
	      break;
	    default:
	      this.write = passThroughWrite;
	      return;
	  }
	
	  // Enough space to store all bytes of a single character. UTF-8 needs 4
	  // bytes, but CESU-8 may require up to 6 (3 bytes per surrogate).
	  this.charBuffer = new Buffer(6);
	  // Number of bytes received for the current incomplete multi-byte character.
	  this.charReceived = 0;
	  // Number of bytes expected for the current incomplete multi-byte character.
	  this.charLength = 0;
	};
	
	
	// write decodes the given buffer and returns it as JS string that is
	// guaranteed to not contain any partial multi-byte characters. Any partial
	// character found at the end of the buffer is buffered up, and will be
	// returned when calling write again with the remaining bytes.
	//
	// Note: Converting a Buffer containing an orphan surrogate to a String
	// currently works, but converting a String to a Buffer (via `new Buffer`, or
	// Buffer#write) will replace incomplete surrogates with the unicode
	// replacement character. See https://codereview.chromium.org/121173009/ .
	StringDecoder.prototype.write = function(buffer) {
	  var charStr = '';
	  // if our last write ended with an incomplete multibyte character
	  while (this.charLength) {
	    // determine how many remaining bytes this buffer has to offer for this char
	    var available = (buffer.length >= this.charLength - this.charReceived) ?
	        this.charLength - this.charReceived :
	        buffer.length;
	
	    // add the new bytes to the char buffer
	    buffer.copy(this.charBuffer, this.charReceived, 0, available);
	    this.charReceived += available;
	
	    if (this.charReceived < this.charLength) {
	      // still not enough chars in this buffer? wait for more ...
	      return '';
	    }
	
	    // remove bytes belonging to the current character from the buffer
	    buffer = buffer.slice(available, buffer.length);
	
	    // get the character that was split
	    charStr = this.charBuffer.slice(0, this.charLength).toString(this.encoding);
	
	    // CESU-8: lead surrogate (D800-DBFF) is also the incomplete character
	    var charCode = charStr.charCodeAt(charStr.length - 1);
	    if (charCode >= 0xD800 && charCode <= 0xDBFF) {
	      this.charLength += this.surrogateSize;
	      charStr = '';
	      continue;
	    }
	    this.charReceived = this.charLength = 0;
	
	    // if there are no more bytes in this buffer, just emit our char
	    if (buffer.length === 0) {
	      return charStr;
	    }
	    break;
	  }
	
	  // determine and set charLength / charReceived
	  this.detectIncompleteChar(buffer);
	
	  var end = buffer.length;
	  if (this.charLength) {
	    // buffer the incomplete character bytes we got
	    buffer.copy(this.charBuffer, 0, buffer.length - this.charReceived, end);
	    end -= this.charReceived;
	  }
	
	  charStr += buffer.toString(this.encoding, 0, end);
	
	  var end = charStr.length - 1;
	  var charCode = charStr.charCodeAt(end);
	  // CESU-8: lead surrogate (D800-DBFF) is also the incomplete character
	  if (charCode >= 0xD800 && charCode <= 0xDBFF) {
	    var size = this.surrogateSize;
	    this.charLength += size;
	    this.charReceived += size;
	    this.charBuffer.copy(this.charBuffer, size, 0, size);
	    buffer.copy(this.charBuffer, 0, 0, size);
	    return charStr.substring(0, end);
	  }
	
	  // or just emit the charStr
	  return charStr;
	};
	
	// detectIncompleteChar determines if there is an incomplete UTF-8 character at
	// the end of the given buffer. If so, it sets this.charLength to the byte
	// length that character, and sets this.charReceived to the number of bytes
	// that are available for this character.
	StringDecoder.prototype.detectIncompleteChar = function(buffer) {
	  // determine how many bytes we have to check at the end of this buffer
	  var i = (buffer.length >= 3) ? 3 : buffer.length;
	
	  // Figure out if one of the last i bytes of our buffer announces an
	  // incomplete char.
	  for (; i > 0; i--) {
	    var c = buffer[buffer.length - i];
	
	    // See http://en.wikipedia.org/wiki/UTF-8#Description
	
	    // 110XXXXX
	    if (i == 1 && c >> 5 == 0x06) {
	      this.charLength = 2;
	      break;
	    }
	
	    // 1110XXXX
	    if (i <= 2 && c >> 4 == 0x0E) {
	      this.charLength = 3;
	      break;
	    }
	
	    // 11110XXX
	    if (i <= 3 && c >> 3 == 0x1E) {
	      this.charLength = 4;
	      break;
	    }
	  }
	  this.charReceived = i;
	};
	
	StringDecoder.prototype.end = function(buffer) {
	  var res = '';
	  if (buffer && buffer.length)
	    res = this.write(buffer);
	
	  if (this.charReceived) {
	    var cr = this.charReceived;
	    var buf = this.charBuffer;
	    var enc = this.encoding;
	    res += buf.slice(0, cr).toString(enc);
	  }
	
	  return res;
	};
	
	function passThroughWrite(buffer) {
	  return buffer.toString(this.encoding);
	}
	
	function utf16DetectIncompleteChar(buffer) {
	  this.charReceived = buffer.length % 2;
	  this.charLength = this.charReceived ? 2 : 0;
	}
	
	function base64DetectIncompleteChar(buffer) {
	  this.charReceived = buffer.length % 3;
	  this.charLength = this.charReceived ? 3 : 0;
	}


/***/ },
/* 25 */
/***/ function(module, exports, __webpack_require__) {

	// a transform stream is a readable/writable stream where you do
	// something with the data.  Sometimes it's called a "filter",
	// but that's not a great name for it, since that implies a thing where
	// some bits pass through, and others are simply ignored.  (That would
	// be a valid example of a transform, of course.)
	//
	// While the output is causally related to the input, it's not a
	// necessarily symmetric or synchronous transformation.  For example,
	// a zlib stream might take multiple plain-text writes(), and then
	// emit a single compressed chunk some time in the future.
	//
	// Here's how this works:
	//
	// The Transform stream has all the aspects of the readable and writable
	// stream classes.  When you write(chunk), that calls _write(chunk,cb)
	// internally, and returns false if there's a lot of pending writes
	// buffered up.  When you call read(), that calls _read(n) until
	// there's enough pending readable data buffered up.
	//
	// In a transform stream, the written data is placed in a buffer.  When
	// _read(n) is called, it transforms the queued up data, calling the
	// buffered _write cb's as it consumes chunks.  If consuming a single
	// written chunk would result in multiple output chunks, then the first
	// outputted bit calls the readcb, and subsequent chunks just go into
	// the read buffer, and will cause it to emit 'readable' if necessary.
	//
	// This way, back-pressure is actually determined by the reading side,
	// since _read has to be called to start processing a new chunk.  However,
	// a pathological inflate type of transform can cause excessive buffering
	// here.  For example, imagine a stream where every byte of input is
	// interpreted as an integer from 0-255, and then results in that many
	// bytes of output.  Writing the 4 bytes {ff,ff,ff,ff} would result in
	// 1kb of data being output.  In this case, you could write a very small
	// amount of input, and end up with a very large amount of output.  In
	// such a pathological inflating mechanism, there'd be no way to tell
	// the system to stop doing the transform.  A single 4MB write could
	// cause the system to run out of memory.
	//
	// However, even in such a pathological case, only a single written chunk
	// would be consumed, and then the rest would wait (un-transformed) until
	// the results of the previous transformed chunk were consumed.
	
	'use strict';
	
	module.exports = Transform;
	
	var Duplex = __webpack_require__(21);
	
	/*<replacement>*/
	var util = __webpack_require__(18);
	util.inherits = __webpack_require__(12);
	/*</replacement>*/
	
	util.inherits(Transform, Duplex);
	
	function TransformState(stream) {
	  this.afterTransform = function (er, data) {
	    return afterTransform(stream, er, data);
	  };
	
	  this.needTransform = false;
	  this.transforming = false;
	  this.writecb = null;
	  this.writechunk = null;
	  this.writeencoding = null;
	}
	
	function afterTransform(stream, er, data) {
	  var ts = stream._transformState;
	  ts.transforming = false;
	
	  var cb = ts.writecb;
	
	  if (!cb) return stream.emit('error', new Error('no writecb in Transform class'));
	
	  ts.writechunk = null;
	  ts.writecb = null;
	
	  if (data !== null && data !== undefined) stream.push(data);
	
	  cb(er);
	
	  var rs = stream._readableState;
	  rs.reading = false;
	  if (rs.needReadable || rs.length < rs.highWaterMark) {
	    stream._read(rs.highWaterMark);
	  }
	}
	
	function Transform(options) {
	  if (!(this instanceof Transform)) return new Transform(options);
	
	  Duplex.call(this, options);
	
	  this._transformState = new TransformState(this);
	
	  var stream = this;
	
	  // start out asking for a readable event once data is transformed.
	  this._readableState.needReadable = true;
	
	  // we have implemented the _read method, and done the other things
	  // that Readable wants before the first _read call, so unset the
	  // sync guard flag.
	  this._readableState.sync = false;
	
	  if (options) {
	    if (typeof options.transform === 'function') this._transform = options.transform;
	
	    if (typeof options.flush === 'function') this._flush = options.flush;
	  }
	
	  // When the writable side finishes, then flush out anything remaining.
	  this.once('prefinish', function () {
	    if (typeof this._flush === 'function') this._flush(function (er, data) {
	      done(stream, er, data);
	    });else done(stream);
	  });
	}
	
	Transform.prototype.push = function (chunk, encoding) {
	  this._transformState.needTransform = false;
	  return Duplex.prototype.push.call(this, chunk, encoding);
	};
	
	// This is the part where you do stuff!
	// override this function in implementation classes.
	// 'chunk' is an input chunk.
	//
	// Call `push(newChunk)` to pass along transformed output
	// to the readable side.  You may call 'push' zero or more times.
	//
	// Call `cb(err)` when you are done with this chunk.  If you pass
	// an error, then that'll put the hurt on the whole operation.  If you
	// never call cb(), then you'll never get another chunk.
	Transform.prototype._transform = function (chunk, encoding, cb) {
	  throw new Error('_transform() is not implemented');
	};
	
	Transform.prototype._write = function (chunk, encoding, cb) {
	  var ts = this._transformState;
	  ts.writecb = cb;
	  ts.writechunk = chunk;
	  ts.writeencoding = encoding;
	  if (!ts.transforming) {
	    var rs = this._readableState;
	    if (ts.needTransform || rs.needReadable || rs.length < rs.highWaterMark) this._read(rs.highWaterMark);
	  }
	};
	
	// Doesn't matter what the args are here.
	// _transform does all the work.
	// That we got here means that the readable side wants more data.
	Transform.prototype._read = function (n) {
	  var ts = this._transformState;
	
	  if (ts.writechunk !== null && ts.writecb && !ts.transforming) {
	    ts.transforming = true;
	    this._transform(ts.writechunk, ts.writeencoding, ts.afterTransform);
	  } else {
	    // mark that we need a transform, so that any data that comes in
	    // will get processed, now that we've asked for it.
	    ts.needTransform = true;
	  }
	};
	
	function done(stream, er, data) {
	  if (er) return stream.emit('error', er);
	
	  if (data !== null && data !== undefined) stream.push(data);
	
	  // if there's nothing in the write buffer, then that means
	  // that nothing more will ever be provided
	  var ws = stream._writableState;
	  var ts = stream._transformState;
	
	  if (ws.length) throw new Error('Calling transform done when ws.length != 0');
	
	  if (ts.transforming) throw new Error('Calling transform done when still transforming');
	
	  return stream.push(null);
	}

/***/ },
/* 26 */
/***/ function(module, exports, __webpack_require__) {

	// a passthrough stream.
	// basically just the most minimal sort of Transform stream.
	// Every written chunk gets output as-is.
	
	'use strict';
	
	module.exports = PassThrough;
	
	var Transform = __webpack_require__(25);
	
	/*<replacement>*/
	var util = __webpack_require__(18);
	util.inherits = __webpack_require__(12);
	/*</replacement>*/
	
	util.inherits(PassThrough, Transform);
	
	function PassThrough(options) {
	  if (!(this instanceof PassThrough)) return new PassThrough(options);
	
	  Transform.call(this, options);
	}
	
	PassThrough.prototype._transform = function (chunk, encoding, cb) {
	  cb(null, chunk);
	};

/***/ },
/* 27 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(22)


/***/ },
/* 28 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(21)


/***/ },
/* 29 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(25)


/***/ },
/* 30 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(26)


/***/ },
/* 31 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	
	var zlib_inflate = __webpack_require__(32);
	var utils        = __webpack_require__(33);
	var strings      = __webpack_require__(38);
	var c            = __webpack_require__(39);
	var msg          = __webpack_require__(40);
	var ZStream      = __webpack_require__(41);
	var GZheader     = __webpack_require__(42);
	
	var toString = Object.prototype.toString;
	
	/**
	 * class Inflate
	 *
	 * Generic JS-style wrapper for zlib calls. If you don't need
	 * streaming behaviour - use more simple functions: [[inflate]]
	 * and [[inflateRaw]].
	 **/
	
	/* internal
	 * inflate.chunks -> Array
	 *
	 * Chunks of output data, if [[Inflate#onData]] not overriden.
	 **/
	
	/**
	 * Inflate.result -> Uint8Array|Array|String
	 *
	 * Uncompressed result, generated by default [[Inflate#onData]]
	 * and [[Inflate#onEnd]] handlers. Filled after you push last chunk
	 * (call [[Inflate#push]] with `Z_FINISH` / `true` param) or if you
	 * push a chunk with explicit flush (call [[Inflate#push]] with
	 * `Z_SYNC_FLUSH` param).
	 **/
	
	/**
	 * Inflate.err -> Number
	 *
	 * Error code after inflate finished. 0 (Z_OK) on success.
	 * Should be checked if broken data possible.
	 **/
	
	/**
	 * Inflate.msg -> String
	 *
	 * Error message, if [[Inflate.err]] != 0
	 **/
	
	
	/**
	 * new Inflate(options)
	 * - options (Object): zlib inflate options.
	 *
	 * Creates new inflator instance with specified params. Throws exception
	 * on bad params. Supported options:
	 *
	 * - `windowBits`
	 * - `dictionary`
	 *
	 * [http://zlib.net/manual.html#Advanced](http://zlib.net/manual.html#Advanced)
	 * for more information on these.
	 *
	 * Additional options, for internal needs:
	 *
	 * - `chunkSize` - size of generated data chunks (16K by default)
	 * - `raw` (Boolean) - do raw inflate
	 * - `to` (String) - if equal to 'string', then result will be converted
	 *   from utf8 to utf16 (javascript) string. When string output requested,
	 *   chunk length can differ from `chunkSize`, depending on content.
	 *
	 * By default, when no options set, autodetect deflate/gzip data format via
	 * wrapper header.
	 *
	 * ##### Example:
	 *
	 * ```javascript
	 * var pako = require('pako')
	 *   , chunk1 = Uint8Array([1,2,3,4,5,6,7,8,9])
	 *   , chunk2 = Uint8Array([10,11,12,13,14,15,16,17,18,19]);
	 *
	 * var inflate = new pako.Inflate({ level: 3});
	 *
	 * inflate.push(chunk1, false);
	 * inflate.push(chunk2, true);  // true -> last chunk
	 *
	 * if (inflate.err) { throw new Error(inflate.err); }
	 *
	 * console.log(inflate.result);
	 * ```
	 **/
	function Inflate(options) {
	  if (!(this instanceof Inflate)) return new Inflate(options);
	
	  this.options = utils.assign({
	    chunkSize: 16384,
	    windowBits: 0,
	    to: ''
	  }, options || {});
	
	  var opt = this.options;
	
	  // Force window size for `raw` data, if not set directly,
	  // because we have no header for autodetect.
	  if (opt.raw && (opt.windowBits >= 0) && (opt.windowBits < 16)) {
	    opt.windowBits = -opt.windowBits;
	    if (opt.windowBits === 0) { opt.windowBits = -15; }
	  }
	
	  // If `windowBits` not defined (and mode not raw) - set autodetect flag for gzip/deflate
	  if ((opt.windowBits >= 0) && (opt.windowBits < 16) &&
	      !(options && options.windowBits)) {
	    opt.windowBits += 32;
	  }
	
	  // Gzip header has no info about windows size, we can do autodetect only
	  // for deflate. So, if window size not set, force it to max when gzip possible
	  if ((opt.windowBits > 15) && (opt.windowBits < 48)) {
	    // bit 3 (16) -> gzipped data
	    // bit 4 (32) -> autodetect gzip/deflate
	    if ((opt.windowBits & 15) === 0) {
	      opt.windowBits |= 15;
	    }
	  }
	
	  this.err    = 0;      // error code, if happens (0 = Z_OK)
	  this.msg    = '';     // error message
	  this.ended  = false;  // used to avoid multiple onEnd() calls
	  this.chunks = [];     // chunks of compressed data
	
	  this.strm   = new ZStream();
	  this.strm.avail_out = 0;
	
	  var status  = zlib_inflate.inflateInit2(
	    this.strm,
	    opt.windowBits
	  );
	
	  if (status !== c.Z_OK) {
	    throw new Error(msg[status]);
	  }
	
	  this.header = new GZheader();
	
	  zlib_inflate.inflateGetHeader(this.strm, this.header);
	}
	
	/**
	 * Inflate#push(data[, mode]) -> Boolean
	 * - data (Uint8Array|Array|ArrayBuffer|String): input data
	 * - mode (Number|Boolean): 0..6 for corresponding Z_NO_FLUSH..Z_TREE modes.
	 *   See constants. Skipped or `false` means Z_NO_FLUSH, `true` meansh Z_FINISH.
	 *
	 * Sends input data to inflate pipe, generating [[Inflate#onData]] calls with
	 * new output chunks. Returns `true` on success. The last data block must have
	 * mode Z_FINISH (or `true`). That will flush internal pending buffers and call
	 * [[Inflate#onEnd]]. For interim explicit flushes (without ending the stream) you
	 * can use mode Z_SYNC_FLUSH, keeping the decompression context.
	 *
	 * On fail call [[Inflate#onEnd]] with error code and return false.
	 *
	 * We strongly recommend to use `Uint8Array` on input for best speed (output
	 * format is detected automatically). Also, don't skip last param and always
	 * use the same type in your code (boolean or number). That will improve JS speed.
	 *
	 * For regular `Array`-s make sure all elements are [0..255].
	 *
	 * ##### Example
	 *
	 * ```javascript
	 * push(chunk, false); // push one of data chunks
	 * ...
	 * push(chunk, true);  // push last chunk
	 * ```
	 **/
	Inflate.prototype.push = function (data, mode) {
	  var strm = this.strm;
	  var chunkSize = this.options.chunkSize;
	  var dictionary = this.options.dictionary;
	  var status, _mode;
	  var next_out_utf8, tail, utf8str;
	  var dict;
	
	  // Flag to properly process Z_BUF_ERROR on testing inflate call
	  // when we check that all output data was flushed.
	  var allowBufError = false;
	
	  if (this.ended) { return false; }
	  _mode = (mode === ~~mode) ? mode : ((mode === true) ? c.Z_FINISH : c.Z_NO_FLUSH);
	
	  // Convert data if needed
	  if (typeof data === 'string') {
	    // Only binary strings can be decompressed on practice
	    strm.input = strings.binstring2buf(data);
	  } else if (toString.call(data) === '[object ArrayBuffer]') {
	    strm.input = new Uint8Array(data);
	  } else {
	    strm.input = data;
	  }
	
	  strm.next_in = 0;
	  strm.avail_in = strm.input.length;
	
	  do {
	    if (strm.avail_out === 0) {
	      strm.output = new utils.Buf8(chunkSize);
	      strm.next_out = 0;
	      strm.avail_out = chunkSize;
	    }
	
	    status = zlib_inflate.inflate(strm, c.Z_NO_FLUSH);    /* no bad return value */
	
	    if (status === c.Z_NEED_DICT && dictionary) {
	      // Convert data if needed
	      if (typeof dictionary === 'string') {
	        dict = strings.string2buf(dictionary);
	      } else if (toString.call(dictionary) === '[object ArrayBuffer]') {
	        dict = new Uint8Array(dictionary);
	      } else {
	        dict = dictionary;
	      }
	
	      status = zlib_inflate.inflateSetDictionary(this.strm, dict);
	
	    }
	
	    if (status === c.Z_BUF_ERROR && allowBufError === true) {
	      status = c.Z_OK;
	      allowBufError = false;
	    }
	
	    if (status !== c.Z_STREAM_END && status !== c.Z_OK) {
	      this.onEnd(status);
	      this.ended = true;
	      return false;
	    }
	
	    if (strm.next_out) {
	      if (strm.avail_out === 0 || status === c.Z_STREAM_END || (strm.avail_in === 0 && (_mode === c.Z_FINISH || _mode === c.Z_SYNC_FLUSH))) {
	
	        if (this.options.to === 'string') {
	
	          next_out_utf8 = strings.utf8border(strm.output, strm.next_out);
	
	          tail = strm.next_out - next_out_utf8;
	          utf8str = strings.buf2string(strm.output, next_out_utf8);
	
	          // move tail
	          strm.next_out = tail;
	          strm.avail_out = chunkSize - tail;
	          if (tail) { utils.arraySet(strm.output, strm.output, next_out_utf8, tail, 0); }
	
	          this.onData(utf8str);
	
	        } else {
	          this.onData(utils.shrinkBuf(strm.output, strm.next_out));
	        }
	      }
	    }
	
	    // When no more input data, we should check that internal inflate buffers
	    // are flushed. The only way to do it when avail_out = 0 - run one more
	    // inflate pass. But if output data not exists, inflate return Z_BUF_ERROR.
	    // Here we set flag to process this error properly.
	    //
	    // NOTE. Deflate does not return error in this case and does not needs such
	    // logic.
	    if (strm.avail_in === 0 && strm.avail_out === 0) {
	      allowBufError = true;
	    }
	
	  } while ((strm.avail_in > 0 || strm.avail_out === 0) && status !== c.Z_STREAM_END);
	
	  if (status === c.Z_STREAM_END) {
	    _mode = c.Z_FINISH;
	  }
	
	  // Finalize on the last chunk.
	  if (_mode === c.Z_FINISH) {
	    status = zlib_inflate.inflateEnd(this.strm);
	    this.onEnd(status);
	    this.ended = true;
	    return status === c.Z_OK;
	  }
	
	  // callback interim results if Z_SYNC_FLUSH.
	  if (_mode === c.Z_SYNC_FLUSH) {
	    this.onEnd(c.Z_OK);
	    strm.avail_out = 0;
	    return true;
	  }
	
	  return true;
	};
	
	
	/**
	 * Inflate#onData(chunk) -> Void
	 * - chunk (Uint8Array|Array|String): ouput data. Type of array depends
	 *   on js engine support. When string output requested, each chunk
	 *   will be string.
	 *
	 * By default, stores data blocks in `chunks[]` property and glue
	 * those in `onEnd`. Override this handler, if you need another behaviour.
	 **/
	Inflate.prototype.onData = function (chunk) {
	  this.chunks.push(chunk);
	};
	
	
	/**
	 * Inflate#onEnd(status) -> Void
	 * - status (Number): inflate status. 0 (Z_OK) on success,
	 *   other if not.
	 *
	 * Called either after you tell inflate that the input stream is
	 * complete (Z_FINISH) or should be flushed (Z_SYNC_FLUSH)
	 * or if an error happened. By default - join collected chunks,
	 * free memory and fill `results` / `err` properties.
	 **/
	Inflate.prototype.onEnd = function (status) {
	  // On success - join
	  if (status === c.Z_OK) {
	    if (this.options.to === 'string') {
	      // Glue & convert here, until we teach pako to send
	      // utf8 alligned strings to onData
	      this.result = this.chunks.join('');
	    } else {
	      this.result = utils.flattenChunks(this.chunks);
	    }
	  }
	  this.chunks = [];
	  this.err = status;
	  this.msg = this.strm.msg;
	};
	
	
	/**
	 * inflate(data[, options]) -> Uint8Array|Array|String
	 * - data (Uint8Array|Array|String): input data to decompress.
	 * - options (Object): zlib inflate options.
	 *
	 * Decompress `data` with inflate/ungzip and `options`. Autodetect
	 * format via wrapper header by default. That's why we don't provide
	 * separate `ungzip` method.
	 *
	 * Supported options are:
	 *
	 * - windowBits
	 *
	 * [http://zlib.net/manual.html#Advanced](http://zlib.net/manual.html#Advanced)
	 * for more information.
	 *
	 * Sugar (options):
	 *
	 * - `raw` (Boolean) - say that we work with raw stream, if you don't wish to specify
	 *   negative windowBits implicitly.
	 * - `to` (String) - if equal to 'string', then result will be converted
	 *   from utf8 to utf16 (javascript) string. When string output requested,
	 *   chunk length can differ from `chunkSize`, depending on content.
	 *
	 *
	 * ##### Example:
	 *
	 * ```javascript
	 * var pako = require('pako')
	 *   , input = pako.deflate([1,2,3,4,5,6,7,8,9])
	 *   , output;
	 *
	 * try {
	 *   output = pako.inflate(input);
	 * } catch (err)
	 *   console.log(err);
	 * }
	 * ```
	 **/
	function inflate(input, options) {
	  var inflator = new Inflate(options);
	
	  inflator.push(input, true);
	
	  // That will never happens, if you don't cheat with options :)
	  if (inflator.err) { throw inflator.msg || msg[inflator.err]; }
	
	  return inflator.result;
	}
	
	
	/**
	 * inflateRaw(data[, options]) -> Uint8Array|Array|String
	 * - data (Uint8Array|Array|String): input data to decompress.
	 * - options (Object): zlib inflate options.
	 *
	 * The same as [[inflate]], but creates raw data, without wrapper
	 * (header and adler32 crc).
	 **/
	function inflateRaw(input, options) {
	  options = options || {};
	  options.raw = true;
	  return inflate(input, options);
	}
	
	
	/**
	 * ungzip(data[, options]) -> Uint8Array|Array|String
	 * - data (Uint8Array|Array|String): input data to decompress.
	 * - options (Object): zlib inflate options.
	 *
	 * Just shortcut to [[inflate]], because it autodetects format
	 * by header.content. Done for convenience.
	 **/
	
	
	exports.Inflate = Inflate;
	exports.inflate = inflate;
	exports.inflateRaw = inflateRaw;
	exports.ungzip  = inflate;


/***/ },
/* 32 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	
	var utils         = __webpack_require__(33);
	var adler32       = __webpack_require__(34);
	var crc32         = __webpack_require__(35);
	var inflate_fast  = __webpack_require__(36);
	var inflate_table = __webpack_require__(37);
	
	var CODES = 0;
	var LENS = 1;
	var DISTS = 2;
	
	/* Public constants ==========================================================*/
	/* ===========================================================================*/
	
	
	/* Allowed flush values; see deflate() and inflate() below for details */
	//var Z_NO_FLUSH      = 0;
	//var Z_PARTIAL_FLUSH = 1;
	//var Z_SYNC_FLUSH    = 2;
	//var Z_FULL_FLUSH    = 3;
	var Z_FINISH        = 4;
	var Z_BLOCK         = 5;
	var Z_TREES         = 6;
	
	
	/* Return codes for the compression/decompression functions. Negative values
	 * are errors, positive values are used for special but normal events.
	 */
	var Z_OK            = 0;
	var Z_STREAM_END    = 1;
	var Z_NEED_DICT     = 2;
	//var Z_ERRNO         = -1;
	var Z_STREAM_ERROR  = -2;
	var Z_DATA_ERROR    = -3;
	var Z_MEM_ERROR     = -4;
	var Z_BUF_ERROR     = -5;
	//var Z_VERSION_ERROR = -6;
	
	/* The deflate compression method */
	var Z_DEFLATED  = 8;
	
	
	/* STATES ====================================================================*/
	/* ===========================================================================*/
	
	
	var    HEAD = 1;       /* i: waiting for magic header */
	var    FLAGS = 2;      /* i: waiting for method and flags (gzip) */
	var    TIME = 3;       /* i: waiting for modification time (gzip) */
	var    OS = 4;         /* i: waiting for extra flags and operating system (gzip) */
	var    EXLEN = 5;      /* i: waiting for extra length (gzip) */
	var    EXTRA = 6;      /* i: waiting for extra bytes (gzip) */
	var    NAME = 7;       /* i: waiting for end of file name (gzip) */
	var    COMMENT = 8;    /* i: waiting for end of comment (gzip) */
	var    HCRC = 9;       /* i: waiting for header crc (gzip) */
	var    DICTID = 10;    /* i: waiting for dictionary check value */
	var    DICT = 11;      /* waiting for inflateSetDictionary() call */
	var        TYPE = 12;      /* i: waiting for type bits, including last-flag bit */
	var        TYPEDO = 13;    /* i: same, but skip check to exit inflate on new block */
	var        STORED = 14;    /* i: waiting for stored size (length and complement) */
	var        COPY_ = 15;     /* i/o: same as COPY below, but only first time in */
	var        COPY = 16;      /* i/o: waiting for input or output to copy stored block */
	var        TABLE = 17;     /* i: waiting for dynamic block table lengths */
	var        LENLENS = 18;   /* i: waiting for code length code lengths */
	var        CODELENS = 19;  /* i: waiting for length/lit and distance code lengths */
	var            LEN_ = 20;      /* i: same as LEN below, but only first time in */
	var            LEN = 21;       /* i: waiting for length/lit/eob code */
	var            LENEXT = 22;    /* i: waiting for length extra bits */
	var            DIST = 23;      /* i: waiting for distance code */
	var            DISTEXT = 24;   /* i: waiting for distance extra bits */
	var            MATCH = 25;     /* o: waiting for output space to copy string */
	var            LIT = 26;       /* o: waiting for output space to write literal */
	var    CHECK = 27;     /* i: waiting for 32-bit check value */
	var    LENGTH = 28;    /* i: waiting for 32-bit length (gzip) */
	var    DONE = 29;      /* finished check, done -- remain here until reset */
	var    BAD = 30;       /* got a data error -- remain here until reset */
	var    MEM = 31;       /* got an inflate() memory error -- remain here until reset */
	var    SYNC = 32;      /* looking for synchronization bytes to restart inflate() */
	
	/* ===========================================================================*/
	
	
	
	var ENOUGH_LENS = 852;
	var ENOUGH_DISTS = 592;
	//var ENOUGH =  (ENOUGH_LENS+ENOUGH_DISTS);
	
	var MAX_WBITS = 15;
	/* 32K LZ77 window */
	var DEF_WBITS = MAX_WBITS;
	
	
	function zswap32(q) {
	  return  (((q >>> 24) & 0xff) +
	          ((q >>> 8) & 0xff00) +
	          ((q & 0xff00) << 8) +
	          ((q & 0xff) << 24));
	}
	
	
	function InflateState() {
	  this.mode = 0;             /* current inflate mode */
	  this.last = false;          /* true if processing last block */
	  this.wrap = 0;              /* bit 0 true for zlib, bit 1 true for gzip */
	  this.havedict = false;      /* true if dictionary provided */
	  this.flags = 0;             /* gzip header method and flags (0 if zlib) */
	  this.dmax = 0;              /* zlib header max distance (INFLATE_STRICT) */
	  this.check = 0;             /* protected copy of check value */
	  this.total = 0;             /* protected copy of output count */
	  // TODO: may be {}
	  this.head = null;           /* where to save gzip header information */
	
	  /* sliding window */
	  this.wbits = 0;             /* log base 2 of requested window size */
	  this.wsize = 0;             /* window size or zero if not using window */
	  this.whave = 0;             /* valid bytes in the window */
	  this.wnext = 0;             /* window write index */
	  this.window = null;         /* allocated sliding window, if needed */
	
	  /* bit accumulator */
	  this.hold = 0;              /* input bit accumulator */
	  this.bits = 0;              /* number of bits in "in" */
	
	  /* for string and stored block copying */
	  this.length = 0;            /* literal or length of data to copy */
	  this.offset = 0;            /* distance back to copy string from */
	
	  /* for table and code decoding */
	  this.extra = 0;             /* extra bits needed */
	
	  /* fixed and dynamic code tables */
	  this.lencode = null;          /* starting table for length/literal codes */
	  this.distcode = null;         /* starting table for distance codes */
	  this.lenbits = 0;           /* index bits for lencode */
	  this.distbits = 0;          /* index bits for distcode */
	
	  /* dynamic table building */
	  this.ncode = 0;             /* number of code length code lengths */
	  this.nlen = 0;              /* number of length code lengths */
	  this.ndist = 0;             /* number of distance code lengths */
	  this.have = 0;              /* number of code lengths in lens[] */
	  this.next = null;              /* next available space in codes[] */
	
	  this.lens = new utils.Buf16(320); /* temporary storage for code lengths */
	  this.work = new utils.Buf16(288); /* work area for code table building */
	
	  /*
	   because we don't have pointers in js, we use lencode and distcode directly
	   as buffers so we don't need codes
	  */
	  //this.codes = new utils.Buf32(ENOUGH);       /* space for code tables */
	  this.lendyn = null;              /* dynamic table for length/literal codes (JS specific) */
	  this.distdyn = null;             /* dynamic table for distance codes (JS specific) */
	  this.sane = 0;                   /* if false, allow invalid distance too far */
	  this.back = 0;                   /* bits back of last unprocessed length/lit */
	  this.was = 0;                    /* initial length of match */
	}
	
	function inflateResetKeep(strm) {
	  var state;
	
	  if (!strm || !strm.state) { return Z_STREAM_ERROR; }
	  state = strm.state;
	  strm.total_in = strm.total_out = state.total = 0;
	  strm.msg = ''; /*Z_NULL*/
	  if (state.wrap) {       /* to support ill-conceived Java test suite */
	    strm.adler = state.wrap & 1;
	  }
	  state.mode = HEAD;
	  state.last = 0;
	  state.havedict = 0;
	  state.dmax = 32768;
	  state.head = null/*Z_NULL*/;
	  state.hold = 0;
	  state.bits = 0;
	  //state.lencode = state.distcode = state.next = state.codes;
	  state.lencode = state.lendyn = new utils.Buf32(ENOUGH_LENS);
	  state.distcode = state.distdyn = new utils.Buf32(ENOUGH_DISTS);
	
	  state.sane = 1;
	  state.back = -1;
	  //Tracev((stderr, "inflate: reset\n"));
	  return Z_OK;
	}
	
	function inflateReset(strm) {
	  var state;
	
	  if (!strm || !strm.state) { return Z_STREAM_ERROR; }
	  state = strm.state;
	  state.wsize = 0;
	  state.whave = 0;
	  state.wnext = 0;
	  return inflateResetKeep(strm);
	
	}
	
	function inflateReset2(strm, windowBits) {
	  var wrap;
	  var state;
	
	  /* get the state */
	  if (!strm || !strm.state) { return Z_STREAM_ERROR; }
	  state = strm.state;
	
	  /* extract wrap request from windowBits parameter */
	  if (windowBits < 0) {
	    wrap = 0;
	    windowBits = -windowBits;
	  }
	  else {
	    wrap = (windowBits >> 4) + 1;
	    if (windowBits < 48) {
	      windowBits &= 15;
	    }
	  }
	
	  /* set number of window bits, free window if different */
	  if (windowBits && (windowBits < 8 || windowBits > 15)) {
	    return Z_STREAM_ERROR;
	  }
	  if (state.window !== null && state.wbits !== windowBits) {
	    state.window = null;
	  }
	
	  /* update state and reset the rest of it */
	  state.wrap = wrap;
	  state.wbits = windowBits;
	  return inflateReset(strm);
	}
	
	function inflateInit2(strm, windowBits) {
	  var ret;
	  var state;
	
	  if (!strm) { return Z_STREAM_ERROR; }
	  //strm.msg = Z_NULL;                 /* in case we return an error */
	
	  state = new InflateState();
	
	  //if (state === Z_NULL) return Z_MEM_ERROR;
	  //Tracev((stderr, "inflate: allocated\n"));
	  strm.state = state;
	  state.window = null/*Z_NULL*/;
	  ret = inflateReset2(strm, windowBits);
	  if (ret !== Z_OK) {
	    strm.state = null/*Z_NULL*/;
	  }
	  return ret;
	}
	
	function inflateInit(strm) {
	  return inflateInit2(strm, DEF_WBITS);
	}
	
	
	/*
	 Return state with length and distance decoding tables and index sizes set to
	 fixed code decoding.  Normally this returns fixed tables from inffixed.h.
	 If BUILDFIXED is defined, then instead this routine builds the tables the
	 first time it's called, and returns those tables the first time and
	 thereafter.  This reduces the size of the code by about 2K bytes, in
	 exchange for a little execution time.  However, BUILDFIXED should not be
	 used for threaded applications, since the rewriting of the tables and virgin
	 may not be thread-safe.
	 */
	var virgin = true;
	
	var lenfix, distfix; // We have no pointers in JS, so keep tables separate
	
	function fixedtables(state) {
	  /* build fixed huffman tables if first call (may not be thread safe) */
	  if (virgin) {
	    var sym;
	
	    lenfix = new utils.Buf32(512);
	    distfix = new utils.Buf32(32);
	
	    /* literal/length table */
	    sym = 0;
	    while (sym < 144) { state.lens[sym++] = 8; }
	    while (sym < 256) { state.lens[sym++] = 9; }
	    while (sym < 280) { state.lens[sym++] = 7; }
	    while (sym < 288) { state.lens[sym++] = 8; }
	
	    inflate_table(LENS,  state.lens, 0, 288, lenfix,   0, state.work, { bits: 9 });
	
	    /* distance table */
	    sym = 0;
	    while (sym < 32) { state.lens[sym++] = 5; }
	
	    inflate_table(DISTS, state.lens, 0, 32,   distfix, 0, state.work, { bits: 5 });
	
	    /* do this just once */
	    virgin = false;
	  }
	
	  state.lencode = lenfix;
	  state.lenbits = 9;
	  state.distcode = distfix;
	  state.distbits = 5;
	}
	
	
	/*
	 Update the window with the last wsize (normally 32K) bytes written before
	 returning.  If window does not exist yet, create it.  This is only called
	 when a window is already in use, or when output has been written during this
	 inflate call, but the end of the deflate stream has not been reached yet.
	 It is also called to create a window for dictionary data when a dictionary
	 is loaded.
	
	 Providing output buffers larger than 32K to inflate() should provide a speed
	 advantage, since only the last 32K of output is copied to the sliding window
	 upon return from inflate(), and since all distances after the first 32K of
	 output will fall in the output data, making match copies simpler and faster.
	 The advantage may be dependent on the size of the processor's data caches.
	 */
	function updatewindow(strm, src, end, copy) {
	  var dist;
	  var state = strm.state;
	
	  /* if it hasn't been done already, allocate space for the window */
	  if (state.window === null) {
	    state.wsize = 1 << state.wbits;
	    state.wnext = 0;
	    state.whave = 0;
	
	    state.window = new utils.Buf8(state.wsize);
	  }
	
	  /* copy state->wsize or less output bytes into the circular window */
	  if (copy >= state.wsize) {
	    utils.arraySet(state.window, src, end - state.wsize, state.wsize, 0);
	    state.wnext = 0;
	    state.whave = state.wsize;
	  }
	  else {
	    dist = state.wsize - state.wnext;
	    if (dist > copy) {
	      dist = copy;
	    }
	    //zmemcpy(state->window + state->wnext, end - copy, dist);
	    utils.arraySet(state.window, src, end - copy, dist, state.wnext);
	    copy -= dist;
	    if (copy) {
	      //zmemcpy(state->window, end - copy, copy);
	      utils.arraySet(state.window, src, end - copy, copy, 0);
	      state.wnext = copy;
	      state.whave = state.wsize;
	    }
	    else {
	      state.wnext += dist;
	      if (state.wnext === state.wsize) { state.wnext = 0; }
	      if (state.whave < state.wsize) { state.whave += dist; }
	    }
	  }
	  return 0;
	}
	
	function inflate(strm, flush) {
	  var state;
	  var input, output;          // input/output buffers
	  var next;                   /* next input INDEX */
	  var put;                    /* next output INDEX */
	  var have, left;             /* available input and output */
	  var hold;                   /* bit buffer */
	  var bits;                   /* bits in bit buffer */
	  var _in, _out;              /* save starting available input and output */
	  var copy;                   /* number of stored or match bytes to copy */
	  var from;                   /* where to copy match bytes from */
	  var from_source;
	  var here = 0;               /* current decoding table entry */
	  var here_bits, here_op, here_val; // paked "here" denormalized (JS specific)
	  //var last;                   /* parent table entry */
	  var last_bits, last_op, last_val; // paked "last" denormalized (JS specific)
	  var len;                    /* length to copy for repeats, bits to drop */
	  var ret;                    /* return code */
	  var hbuf = new utils.Buf8(4);    /* buffer for gzip header crc calculation */
	  var opts;
	
	  var n; // temporary var for NEED_BITS
	
	  var order = /* permutation of code lengths */
	    [ 16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15 ];
	
	
	  if (!strm || !strm.state || !strm.output ||
	      (!strm.input && strm.avail_in !== 0)) {
	    return Z_STREAM_ERROR;
	  }
	
	  state = strm.state;
	  if (state.mode === TYPE) { state.mode = TYPEDO; }    /* skip check */
	
	
	  //--- LOAD() ---
	  put = strm.next_out;
	  output = strm.output;
	  left = strm.avail_out;
	  next = strm.next_in;
	  input = strm.input;
	  have = strm.avail_in;
	  hold = state.hold;
	  bits = state.bits;
	  //---
	
	  _in = have;
	  _out = left;
	  ret = Z_OK;
	
	  inf_leave: // goto emulation
	  for (;;) {
	    switch (state.mode) {
	    case HEAD:
	      if (state.wrap === 0) {
	        state.mode = TYPEDO;
	        break;
	      }
	      //=== NEEDBITS(16);
	      while (bits < 16) {
	        if (have === 0) { break inf_leave; }
	        have--;
	        hold += input[next++] << bits;
	        bits += 8;
	      }
	      //===//
	      if ((state.wrap & 2) && hold === 0x8b1f) {  /* gzip header */
	        state.check = 0/*crc32(0L, Z_NULL, 0)*/;
	        //=== CRC2(state.check, hold);
	        hbuf[0] = hold & 0xff;
	        hbuf[1] = (hold >>> 8) & 0xff;
	        state.check = crc32(state.check, hbuf, 2, 0);
	        //===//
	
	        //=== INITBITS();
	        hold = 0;
	        bits = 0;
	        //===//
	        state.mode = FLAGS;
	        break;
	      }
	      state.flags = 0;           /* expect zlib header */
	      if (state.head) {
	        state.head.done = false;
	      }
	      if (!(state.wrap & 1) ||   /* check if zlib header allowed */
	        (((hold & 0xff)/*BITS(8)*/ << 8) + (hold >> 8)) % 31) {
	        strm.msg = 'incorrect header check';
	        state.mode = BAD;
	        break;
	      }
	      if ((hold & 0x0f)/*BITS(4)*/ !== Z_DEFLATED) {
	        strm.msg = 'unknown compression method';
	        state.mode = BAD;
	        break;
	      }
	      //--- DROPBITS(4) ---//
	      hold >>>= 4;
	      bits -= 4;
	      //---//
	      len = (hold & 0x0f)/*BITS(4)*/ + 8;
	      if (state.wbits === 0) {
	        state.wbits = len;
	      }
	      else if (len > state.wbits) {
	        strm.msg = 'invalid window size';
	        state.mode = BAD;
	        break;
	      }
	      state.dmax = 1 << len;
	      //Tracev((stderr, "inflate:   zlib header ok\n"));
	      strm.adler = state.check = 1/*adler32(0L, Z_NULL, 0)*/;
	      state.mode = hold & 0x200 ? DICTID : TYPE;
	      //=== INITBITS();
	      hold = 0;
	      bits = 0;
	      //===//
	      break;
	    case FLAGS:
	      //=== NEEDBITS(16); */
	      while (bits < 16) {
	        if (have === 0) { break inf_leave; }
	        have--;
	        hold += input[next++] << bits;
	        bits += 8;
	      }
	      //===//
	      state.flags = hold;
	      if ((state.flags & 0xff) !== Z_DEFLATED) {
	        strm.msg = 'unknown compression method';
	        state.mode = BAD;
	        break;
	      }
	      if (state.flags & 0xe000) {
	        strm.msg = 'unknown header flags set';
	        state.mode = BAD;
	        break;
	      }
	      if (state.head) {
	        state.head.text = ((hold >> 8) & 1);
	      }
	      if (state.flags & 0x0200) {
	        //=== CRC2(state.check, hold);
	        hbuf[0] = hold & 0xff;
	        hbuf[1] = (hold >>> 8) & 0xff;
	        state.check = crc32(state.check, hbuf, 2, 0);
	        //===//
	      }
	      //=== INITBITS();
	      hold = 0;
	      bits = 0;
	      //===//
	      state.mode = TIME;
	      /* falls through */
	    case TIME:
	      //=== NEEDBITS(32); */
	      while (bits < 32) {
	        if (have === 0) { break inf_leave; }
	        have--;
	        hold += input[next++] << bits;
	        bits += 8;
	      }
	      //===//
	      if (state.head) {
	        state.head.time = hold;
	      }
	      if (state.flags & 0x0200) {
	        //=== CRC4(state.check, hold)
	        hbuf[0] = hold & 0xff;
	        hbuf[1] = (hold >>> 8) & 0xff;
	        hbuf[2] = (hold >>> 16) & 0xff;
	        hbuf[3] = (hold >>> 24) & 0xff;
	        state.check = crc32(state.check, hbuf, 4, 0);
	        //===
	      }
	      //=== INITBITS();
	      hold = 0;
	      bits = 0;
	      //===//
	      state.mode = OS;
	      /* falls through */
	    case OS:
	      //=== NEEDBITS(16); */
	      while (bits < 16) {
	        if (have === 0) { break inf_leave; }
	        have--;
	        hold += input[next++] << bits;
	        bits += 8;
	      }
	      //===//
	      if (state.head) {
	        state.head.xflags = (hold & 0xff);
	        state.head.os = (hold >> 8);
	      }
	      if (state.flags & 0x0200) {
	        //=== CRC2(state.check, hold);
	        hbuf[0] = hold & 0xff;
	        hbuf[1] = (hold >>> 8) & 0xff;
	        state.check = crc32(state.check, hbuf, 2, 0);
	        //===//
	      }
	      //=== INITBITS();
	      hold = 0;
	      bits = 0;
	      //===//
	      state.mode = EXLEN;
	      /* falls through */
	    case EXLEN:
	      if (state.flags & 0x0400) {
	        //=== NEEDBITS(16); */
	        while (bits < 16) {
	          if (have === 0) { break inf_leave; }
	          have--;
	          hold += input[next++] << bits;
	          bits += 8;
	        }
	        //===//
	        state.length = hold;
	        if (state.head) {
	          state.head.extra_len = hold;
	        }
	        if (state.flags & 0x0200) {
	          //=== CRC2(state.check, hold);
	          hbuf[0] = hold & 0xff;
	          hbuf[1] = (hold >>> 8) & 0xff;
	          state.check = crc32(state.check, hbuf, 2, 0);
	          //===//
	        }
	        //=== INITBITS();
	        hold = 0;
	        bits = 0;
	        //===//
	      }
	      else if (state.head) {
	        state.head.extra = null/*Z_NULL*/;
	      }
	      state.mode = EXTRA;
	      /* falls through */
	    case EXTRA:
	      if (state.flags & 0x0400) {
	        copy = state.length;
	        if (copy > have) { copy = have; }
	        if (copy) {
	          if (state.head) {
	            len = state.head.extra_len - state.length;
	            if (!state.head.extra) {
	              // Use untyped array for more conveniend processing later
	              state.head.extra = new Array(state.head.extra_len);
	            }
	            utils.arraySet(
	              state.head.extra,
	              input,
	              next,
	              // extra field is limited to 65536 bytes
	              // - no need for additional size check
	              copy,
	              /*len + copy > state.head.extra_max - len ? state.head.extra_max : copy,*/
	              len
	            );
	            //zmemcpy(state.head.extra + len, next,
	            //        len + copy > state.head.extra_max ?
	            //        state.head.extra_max - len : copy);
	          }
	          if (state.flags & 0x0200) {
	            state.check = crc32(state.check, input, copy, next);
	          }
	          have -= copy;
	          next += copy;
	          state.length -= copy;
	        }
	        if (state.length) { break inf_leave; }
	      }
	      state.length = 0;
	      state.mode = NAME;
	      /* falls through */
	    case NAME:
	      if (state.flags & 0x0800) {
	        if (have === 0) { break inf_leave; }
	        copy = 0;
	        do {
	          // TODO: 2 or 1 bytes?
	          len = input[next + copy++];
	          /* use constant limit because in js we should not preallocate memory */
	          if (state.head && len &&
	              (state.length < 65536 /*state.head.name_max*/)) {
	            state.head.name += String.fromCharCode(len);
	          }
	        } while (len && copy < have);
	
	        if (state.flags & 0x0200) {
	          state.check = crc32(state.check, input, copy, next);
	        }
	        have -= copy;
	        next += copy;
	        if (len) { break inf_leave; }
	      }
	      else if (state.head) {
	        state.head.name = null;
	      }
	      state.length = 0;
	      state.mode = COMMENT;
	      /* falls through */
	    case COMMENT:
	      if (state.flags & 0x1000) {
	        if (have === 0) { break inf_leave; }
	        copy = 0;
	        do {
	          len = input[next + copy++];
	          /* use constant limit because in js we should not preallocate memory */
	          if (state.head && len &&
	              (state.length < 65536 /*state.head.comm_max*/)) {
	            state.head.comment += String.fromCharCode(len);
	          }
	        } while (len && copy < have);
	        if (state.flags & 0x0200) {
	          state.check = crc32(state.check, input, copy, next);
	        }
	        have -= copy;
	        next += copy;
	        if (len) { break inf_leave; }
	      }
	      else if (state.head) {
	        state.head.comment = null;
	      }
	      state.mode = HCRC;
	      /* falls through */
	    case HCRC:
	      if (state.flags & 0x0200) {
	        //=== NEEDBITS(16); */
	        while (bits < 16) {
	          if (have === 0) { break inf_leave; }
	          have--;
	          hold += input[next++] << bits;
	          bits += 8;
	        }
	        //===//
	        if (hold !== (state.check & 0xffff)) {
	          strm.msg = 'header crc mismatch';
	          state.mode = BAD;
	          break;
	        }
	        //=== INITBITS();
	        hold = 0;
	        bits = 0;
	        //===//
	      }
	      if (state.head) {
	        state.head.hcrc = ((state.flags >> 9) & 1);
	        state.head.done = true;
	      }
	      strm.adler = state.check = 0;
	      state.mode = TYPE;
	      break;
	    case DICTID:
	      //=== NEEDBITS(32); */
	      while (bits < 32) {
	        if (have === 0) { break inf_leave; }
	        have--;
	        hold += input[next++] << bits;
	        bits += 8;
	      }
	      //===//
	      strm.adler = state.check = zswap32(hold);
	      //=== INITBITS();
	      hold = 0;
	      bits = 0;
	      //===//
	      state.mode = DICT;
	      /* falls through */
	    case DICT:
	      if (state.havedict === 0) {
	        //--- RESTORE() ---
	        strm.next_out = put;
	        strm.avail_out = left;
	        strm.next_in = next;
	        strm.avail_in = have;
	        state.hold = hold;
	        state.bits = bits;
	        //---
	        return Z_NEED_DICT;
	      }
	      strm.adler = state.check = 1/*adler32(0L, Z_NULL, 0)*/;
	      state.mode = TYPE;
	      /* falls through */
	    case TYPE:
	      if (flush === Z_BLOCK || flush === Z_TREES) { break inf_leave; }
	      /* falls through */
	    case TYPEDO:
	      if (state.last) {
	        //--- BYTEBITS() ---//
	        hold >>>= bits & 7;
	        bits -= bits & 7;
	        //---//
	        state.mode = CHECK;
	        break;
	      }
	      //=== NEEDBITS(3); */
	      while (bits < 3) {
	        if (have === 0) { break inf_leave; }
	        have--;
	        hold += input[next++] << bits;
	        bits += 8;
	      }
	      //===//
	      state.last = (hold & 0x01)/*BITS(1)*/;
	      //--- DROPBITS(1) ---//
	      hold >>>= 1;
	      bits -= 1;
	      //---//
	
	      switch ((hold & 0x03)/*BITS(2)*/) {
	      case 0:                             /* stored block */
	        //Tracev((stderr, "inflate:     stored block%s\n",
	        //        state.last ? " (last)" : ""));
	        state.mode = STORED;
	        break;
	      case 1:                             /* fixed block */
	        fixedtables(state);
	        //Tracev((stderr, "inflate:     fixed codes block%s\n",
	        //        state.last ? " (last)" : ""));
	        state.mode = LEN_;             /* decode codes */
	        if (flush === Z_TREES) {
	          //--- DROPBITS(2) ---//
	          hold >>>= 2;
	          bits -= 2;
	          //---//
	          break inf_leave;
	        }
	        break;
	      case 2:                             /* dynamic block */
	        //Tracev((stderr, "inflate:     dynamic codes block%s\n",
	        //        state.last ? " (last)" : ""));
	        state.mode = TABLE;
	        break;
	      case 3:
	        strm.msg = 'invalid block type';
	        state.mode = BAD;
	      }
	      //--- DROPBITS(2) ---//
	      hold >>>= 2;
	      bits -= 2;
	      //---//
	      break;
	    case STORED:
	      //--- BYTEBITS() ---// /* go to byte boundary */
	      hold >>>= bits & 7;
	      bits -= bits & 7;
	      //---//
	      //=== NEEDBITS(32); */
	      while (bits < 32) {
	        if (have === 0) { break inf_leave; }
	        have--;
	        hold += input[next++] << bits;
	        bits += 8;
	      }
	      //===//
	      if ((hold & 0xffff) !== ((hold >>> 16) ^ 0xffff)) {
	        strm.msg = 'invalid stored block lengths';
	        state.mode = BAD;
	        break;
	      }
	      state.length = hold & 0xffff;
	      //Tracev((stderr, "inflate:       stored length %u\n",
	      //        state.length));
	      //=== INITBITS();
	      hold = 0;
	      bits = 0;
	      //===//
	      state.mode = COPY_;
	      if (flush === Z_TREES) { break inf_leave; }
	      /* falls through */
	    case COPY_:
	      state.mode = COPY;
	      /* falls through */
	    case COPY:
	      copy = state.length;
	      if (copy) {
	        if (copy > have) { copy = have; }
	        if (copy > left) { copy = left; }
	        if (copy === 0) { break inf_leave; }
	        //--- zmemcpy(put, next, copy); ---
	        utils.arraySet(output, input, next, copy, put);
	        //---//
	        have -= copy;
	        next += copy;
	        left -= copy;
	        put += copy;
	        state.length -= copy;
	        break;
	      }
	      //Tracev((stderr, "inflate:       stored end\n"));
	      state.mode = TYPE;
	      break;
	    case TABLE:
	      //=== NEEDBITS(14); */
	      while (bits < 14) {
	        if (have === 0) { break inf_leave; }
	        have--;
	        hold += input[next++] << bits;
	        bits += 8;
	      }
	      //===//
	      state.nlen = (hold & 0x1f)/*BITS(5)*/ + 257;
	      //--- DROPBITS(5) ---//
	      hold >>>= 5;
	      bits -= 5;
	      //---//
	      state.ndist = (hold & 0x1f)/*BITS(5)*/ + 1;
	      //--- DROPBITS(5) ---//
	      hold >>>= 5;
	      bits -= 5;
	      //---//
	      state.ncode = (hold & 0x0f)/*BITS(4)*/ + 4;
	      //--- DROPBITS(4) ---//
	      hold >>>= 4;
	      bits -= 4;
	      //---//
	//#ifndef PKZIP_BUG_WORKAROUND
	      if (state.nlen > 286 || state.ndist > 30) {
	        strm.msg = 'too many length or distance symbols';
	        state.mode = BAD;
	        break;
	      }
	//#endif
	      //Tracev((stderr, "inflate:       table sizes ok\n"));
	      state.have = 0;
	      state.mode = LENLENS;
	      /* falls through */
	    case LENLENS:
	      while (state.have < state.ncode) {
	        //=== NEEDBITS(3);
	        while (bits < 3) {
	          if (have === 0) { break inf_leave; }
	          have--;
	          hold += input[next++] << bits;
	          bits += 8;
	        }
	        //===//
	        state.lens[order[state.have++]] = (hold & 0x07);//BITS(3);
	        //--- DROPBITS(3) ---//
	        hold >>>= 3;
	        bits -= 3;
	        //---//
	      }
	      while (state.have < 19) {
	        state.lens[order[state.have++]] = 0;
	      }
	      // We have separate tables & no pointers. 2 commented lines below not needed.
	      //state.next = state.codes;
	      //state.lencode = state.next;
	      // Switch to use dynamic table
	      state.lencode = state.lendyn;
	      state.lenbits = 7;
	
	      opts = { bits: state.lenbits };
	      ret = inflate_table(CODES, state.lens, 0, 19, state.lencode, 0, state.work, opts);
	      state.lenbits = opts.bits;
	
	      if (ret) {
	        strm.msg = 'invalid code lengths set';
	        state.mode = BAD;
	        break;
	      }
	      //Tracev((stderr, "inflate:       code lengths ok\n"));
	      state.have = 0;
	      state.mode = CODELENS;
	      /* falls through */
	    case CODELENS:
	      while (state.have < state.nlen + state.ndist) {
	        for (;;) {
	          here = state.lencode[hold & ((1 << state.lenbits) - 1)];/*BITS(state.lenbits)*/
	          here_bits = here >>> 24;
	          here_op = (here >>> 16) & 0xff;
	          here_val = here & 0xffff;
	
	          if ((here_bits) <= bits) { break; }
	          //--- PULLBYTE() ---//
	          if (have === 0) { break inf_leave; }
	          have--;
	          hold += input[next++] << bits;
	          bits += 8;
	          //---//
	        }
	        if (here_val < 16) {
	          //--- DROPBITS(here.bits) ---//
	          hold >>>= here_bits;
	          bits -= here_bits;
	          //---//
	          state.lens[state.have++] = here_val;
	        }
	        else {
	          if (here_val === 16) {
	            //=== NEEDBITS(here.bits + 2);
	            n = here_bits + 2;
	            while (bits < n) {
	              if (have === 0) { break inf_leave; }
	              have--;
	              hold += input[next++] << bits;
	              bits += 8;
	            }
	            //===//
	            //--- DROPBITS(here.bits) ---//
	            hold >>>= here_bits;
	            bits -= here_bits;
	            //---//
	            if (state.have === 0) {
	              strm.msg = 'invalid bit length repeat';
	              state.mode = BAD;
	              break;
	            }
	            len = state.lens[state.have - 1];
	            copy = 3 + (hold & 0x03);//BITS(2);
	            //--- DROPBITS(2) ---//
	            hold >>>= 2;
	            bits -= 2;
	            //---//
	          }
	          else if (here_val === 17) {
	            //=== NEEDBITS(here.bits + 3);
	            n = here_bits + 3;
	            while (bits < n) {
	              if (have === 0) { break inf_leave; }
	              have--;
	              hold += input[next++] << bits;
	              bits += 8;
	            }
	            //===//
	            //--- DROPBITS(here.bits) ---//
	            hold >>>= here_bits;
	            bits -= here_bits;
	            //---//
	            len = 0;
	            copy = 3 + (hold & 0x07);//BITS(3);
	            //--- DROPBITS(3) ---//
	            hold >>>= 3;
	            bits -= 3;
	            //---//
	          }
	          else {
	            //=== NEEDBITS(here.bits + 7);
	            n = here_bits + 7;
	            while (bits < n) {
	              if (have === 0) { break inf_leave; }
	              have--;
	              hold += input[next++] << bits;
	              bits += 8;
	            }
	            //===//
	            //--- DROPBITS(here.bits) ---//
	            hold >>>= here_bits;
	            bits -= here_bits;
	            //---//
	            len = 0;
	            copy = 11 + (hold & 0x7f);//BITS(7);
	            //--- DROPBITS(7) ---//
	            hold >>>= 7;
	            bits -= 7;
	            //---//
	          }
	          if (state.have + copy > state.nlen + state.ndist) {
	            strm.msg = 'invalid bit length repeat';
	            state.mode = BAD;
	            break;
	          }
	          while (copy--) {
	            state.lens[state.have++] = len;
	          }
	        }
	      }
	
	      /* handle error breaks in while */
	      if (state.mode === BAD) { break; }
	
	      /* check for end-of-block code (better have one) */
	      if (state.lens[256] === 0) {
	        strm.msg = 'invalid code -- missing end-of-block';
	        state.mode = BAD;
	        break;
	      }
	
	      /* build code tables -- note: do not change the lenbits or distbits
	         values here (9 and 6) without reading the comments in inftrees.h
	         concerning the ENOUGH constants, which depend on those values */
	      state.lenbits = 9;
	
	      opts = { bits: state.lenbits };
	      ret = inflate_table(LENS, state.lens, 0, state.nlen, state.lencode, 0, state.work, opts);
	      // We have separate tables & no pointers. 2 commented lines below not needed.
	      // state.next_index = opts.table_index;
	      state.lenbits = opts.bits;
	      // state.lencode = state.next;
	
	      if (ret) {
	        strm.msg = 'invalid literal/lengths set';
	        state.mode = BAD;
	        break;
	      }
	
	      state.distbits = 6;
	      //state.distcode.copy(state.codes);
	      // Switch to use dynamic table
	      state.distcode = state.distdyn;
	      opts = { bits: state.distbits };
	      ret = inflate_table(DISTS, state.lens, state.nlen, state.ndist, state.distcode, 0, state.work, opts);
	      // We have separate tables & no pointers. 2 commented lines below not needed.
	      // state.next_index = opts.table_index;
	      state.distbits = opts.bits;
	      // state.distcode = state.next;
	
	      if (ret) {
	        strm.msg = 'invalid distances set';
	        state.mode = BAD;
	        break;
	      }
	      //Tracev((stderr, 'inflate:       codes ok\n'));
	      state.mode = LEN_;
	      if (flush === Z_TREES) { break inf_leave; }
	      /* falls through */
	    case LEN_:
	      state.mode = LEN;
	      /* falls through */
	    case LEN:
	      if (have >= 6 && left >= 258) {
	        //--- RESTORE() ---
	        strm.next_out = put;
	        strm.avail_out = left;
	        strm.next_in = next;
	        strm.avail_in = have;
	        state.hold = hold;
	        state.bits = bits;
	        //---
	        inflate_fast(strm, _out);
	        //--- LOAD() ---
	        put = strm.next_out;
	        output = strm.output;
	        left = strm.avail_out;
	        next = strm.next_in;
	        input = strm.input;
	        have = strm.avail_in;
	        hold = state.hold;
	        bits = state.bits;
	        //---
	
	        if (state.mode === TYPE) {
	          state.back = -1;
	        }
	        break;
	      }
	      state.back = 0;
	      for (;;) {
	        here = state.lencode[hold & ((1 << state.lenbits) - 1)];  /*BITS(state.lenbits)*/
	        here_bits = here >>> 24;
	        here_op = (here >>> 16) & 0xff;
	        here_val = here & 0xffff;
	
	        if (here_bits <= bits) { break; }
	        //--- PULLBYTE() ---//
	        if (have === 0) { break inf_leave; }
	        have--;
	        hold += input[next++] << bits;
	        bits += 8;
	        //---//
	      }
	      if (here_op && (here_op & 0xf0) === 0) {
	        last_bits = here_bits;
	        last_op = here_op;
	        last_val = here_val;
	        for (;;) {
	          here = state.lencode[last_val +
	                  ((hold & ((1 << (last_bits + last_op)) - 1))/*BITS(last.bits + last.op)*/ >> last_bits)];
	          here_bits = here >>> 24;
	          here_op = (here >>> 16) & 0xff;
	          here_val = here & 0xffff;
	
	          if ((last_bits + here_bits) <= bits) { break; }
	          //--- PULLBYTE() ---//
	          if (have === 0) { break inf_leave; }
	          have--;
	          hold += input[next++] << bits;
	          bits += 8;
	          //---//
	        }
	        //--- DROPBITS(last.bits) ---//
	        hold >>>= last_bits;
	        bits -= last_bits;
	        //---//
	        state.back += last_bits;
	      }
	      //--- DROPBITS(here.bits) ---//
	      hold >>>= here_bits;
	      bits -= here_bits;
	      //---//
	      state.back += here_bits;
	      state.length = here_val;
	      if (here_op === 0) {
	        //Tracevv((stderr, here.val >= 0x20 && here.val < 0x7f ?
	        //        "inflate:         literal '%c'\n" :
	        //        "inflate:         literal 0x%02x\n", here.val));
	        state.mode = LIT;
	        break;
	      }
	      if (here_op & 32) {
	        //Tracevv((stderr, "inflate:         end of block\n"));
	        state.back = -1;
	        state.mode = TYPE;
	        break;
	      }
	      if (here_op & 64) {
	        strm.msg = 'invalid literal/length code';
	        state.mode = BAD;
	        break;
	      }
	      state.extra = here_op & 15;
	      state.mode = LENEXT;
	      /* falls through */
	    case LENEXT:
	      if (state.extra) {
	        //=== NEEDBITS(state.extra);
	        n = state.extra;
	        while (bits < n) {
	          if (have === 0) { break inf_leave; }
	          have--;
	          hold += input[next++] << bits;
	          bits += 8;
	        }
	        //===//
	        state.length += hold & ((1 << state.extra) - 1)/*BITS(state.extra)*/;
	        //--- DROPBITS(state.extra) ---//
	        hold >>>= state.extra;
	        bits -= state.extra;
	        //---//
	        state.back += state.extra;
	      }
	      //Tracevv((stderr, "inflate:         length %u\n", state.length));
	      state.was = state.length;
	      state.mode = DIST;
	      /* falls through */
	    case DIST:
	      for (;;) {
	        here = state.distcode[hold & ((1 << state.distbits) - 1)];/*BITS(state.distbits)*/
	        here_bits = here >>> 24;
	        here_op = (here >>> 16) & 0xff;
	        here_val = here & 0xffff;
	
	        if ((here_bits) <= bits) { break; }
	        //--- PULLBYTE() ---//
	        if (have === 0) { break inf_leave; }
	        have--;
	        hold += input[next++] << bits;
	        bits += 8;
	        //---//
	      }
	      if ((here_op & 0xf0) === 0) {
	        last_bits = here_bits;
	        last_op = here_op;
	        last_val = here_val;
	        for (;;) {
	          here = state.distcode[last_val +
	                  ((hold & ((1 << (last_bits + last_op)) - 1))/*BITS(last.bits + last.op)*/ >> last_bits)];
	          here_bits = here >>> 24;
	          here_op = (here >>> 16) & 0xff;
	          here_val = here & 0xffff;
	
	          if ((last_bits + here_bits) <= bits) { break; }
	          //--- PULLBYTE() ---//
	          if (have === 0) { break inf_leave; }
	          have--;
	          hold += input[next++] << bits;
	          bits += 8;
	          //---//
	        }
	        //--- DROPBITS(last.bits) ---//
	        hold >>>= last_bits;
	        bits -= last_bits;
	        //---//
	        state.back += last_bits;
	      }
	      //--- DROPBITS(here.bits) ---//
	      hold >>>= here_bits;
	      bits -= here_bits;
	      //---//
	      state.back += here_bits;
	      if (here_op & 64) {
	        strm.msg = 'invalid distance code';
	        state.mode = BAD;
	        break;
	      }
	      state.offset = here_val;
	      state.extra = (here_op) & 15;
	      state.mode = DISTEXT;
	      /* falls through */
	    case DISTEXT:
	      if (state.extra) {
	        //=== NEEDBITS(state.extra);
	        n = state.extra;
	        while (bits < n) {
	          if (have === 0) { break inf_leave; }
	          have--;
	          hold += input[next++] << bits;
	          bits += 8;
	        }
	        //===//
	        state.offset += hold & ((1 << state.extra) - 1)/*BITS(state.extra)*/;
	        //--- DROPBITS(state.extra) ---//
	        hold >>>= state.extra;
	        bits -= state.extra;
	        //---//
	        state.back += state.extra;
	      }
	//#ifdef INFLATE_STRICT
	      if (state.offset > state.dmax) {
	        strm.msg = 'invalid distance too far back';
	        state.mode = BAD;
	        break;
	      }
	//#endif
	      //Tracevv((stderr, "inflate:         distance %u\n", state.offset));
	      state.mode = MATCH;
	      /* falls through */
	    case MATCH:
	      if (left === 0) { break inf_leave; }
	      copy = _out - left;
	      if (state.offset > copy) {         /* copy from window */
	        copy = state.offset - copy;
	        if (copy > state.whave) {
	          if (state.sane) {
	            strm.msg = 'invalid distance too far back';
	            state.mode = BAD;
	            break;
	          }
	// (!) This block is disabled in zlib defailts,
	// don't enable it for binary compatibility
	//#ifdef INFLATE_ALLOW_INVALID_DISTANCE_TOOFAR_ARRR
	//          Trace((stderr, "inflate.c too far\n"));
	//          copy -= state.whave;
	//          if (copy > state.length) { copy = state.length; }
	//          if (copy > left) { copy = left; }
	//          left -= copy;
	//          state.length -= copy;
	//          do {
	//            output[put++] = 0;
	//          } while (--copy);
	//          if (state.length === 0) { state.mode = LEN; }
	//          break;
	//#endif
	        }
	        if (copy > state.wnext) {
	          copy -= state.wnext;
	          from = state.wsize - copy;
	        }
	        else {
	          from = state.wnext - copy;
	        }
	        if (copy > state.length) { copy = state.length; }
	        from_source = state.window;
	      }
	      else {                              /* copy from output */
	        from_source = output;
	        from = put - state.offset;
	        copy = state.length;
	      }
	      if (copy > left) { copy = left; }
	      left -= copy;
	      state.length -= copy;
	      do {
	        output[put++] = from_source[from++];
	      } while (--copy);
	      if (state.length === 0) { state.mode = LEN; }
	      break;
	    case LIT:
	      if (left === 0) { break inf_leave; }
	      output[put++] = state.length;
	      left--;
	      state.mode = LEN;
	      break;
	    case CHECK:
	      if (state.wrap) {
	        //=== NEEDBITS(32);
	        while (bits < 32) {
	          if (have === 0) { break inf_leave; }
	          have--;
	          // Use '|' insdead of '+' to make sure that result is signed
	          hold |= input[next++] << bits;
	          bits += 8;
	        }
	        //===//
	        _out -= left;
	        strm.total_out += _out;
	        state.total += _out;
	        if (_out) {
	          strm.adler = state.check =
	              /*UPDATE(state.check, put - _out, _out);*/
	              (state.flags ? crc32(state.check, output, _out, put - _out) : adler32(state.check, output, _out, put - _out));
	
	        }
	        _out = left;
	        // NB: crc32 stored as signed 32-bit int, zswap32 returns signed too
	        if ((state.flags ? hold : zswap32(hold)) !== state.check) {
	          strm.msg = 'incorrect data check';
	          state.mode = BAD;
	          break;
	        }
	        //=== INITBITS();
	        hold = 0;
	        bits = 0;
	        //===//
	        //Tracev((stderr, "inflate:   check matches trailer\n"));
	      }
	      state.mode = LENGTH;
	      /* falls through */
	    case LENGTH:
	      if (state.wrap && state.flags) {
	        //=== NEEDBITS(32);
	        while (bits < 32) {
	          if (have === 0) { break inf_leave; }
	          have--;
	          hold += input[next++] << bits;
	          bits += 8;
	        }
	        //===//
	        if (hold !== (state.total & 0xffffffff)) {
	          strm.msg = 'incorrect length check';
	          state.mode = BAD;
	          break;
	        }
	        //=== INITBITS();
	        hold = 0;
	        bits = 0;
	        //===//
	        //Tracev((stderr, "inflate:   length matches trailer\n"));
	      }
	      state.mode = DONE;
	      /* falls through */
	    case DONE:
	      ret = Z_STREAM_END;
	      break inf_leave;
	    case BAD:
	      ret = Z_DATA_ERROR;
	      break inf_leave;
	    case MEM:
	      return Z_MEM_ERROR;
	    case SYNC:
	      /* falls through */
	    default:
	      return Z_STREAM_ERROR;
	    }
	  }
	
	  // inf_leave <- here is real place for "goto inf_leave", emulated via "break inf_leave"
	
	  /*
	     Return from inflate(), updating the total counts and the check value.
	     If there was no progress during the inflate() call, return a buffer
	     error.  Call updatewindow() to create and/or update the window state.
	     Note: a memory error from inflate() is non-recoverable.
	   */
	
	  //--- RESTORE() ---
	  strm.next_out = put;
	  strm.avail_out = left;
	  strm.next_in = next;
	  strm.avail_in = have;
	  state.hold = hold;
	  state.bits = bits;
	  //---
	
	  if (state.wsize || (_out !== strm.avail_out && state.mode < BAD &&
	                      (state.mode < CHECK || flush !== Z_FINISH))) {
	    if (updatewindow(strm, strm.output, strm.next_out, _out - strm.avail_out)) {
	      state.mode = MEM;
	      return Z_MEM_ERROR;
	    }
	  }
	  _in -= strm.avail_in;
	  _out -= strm.avail_out;
	  strm.total_in += _in;
	  strm.total_out += _out;
	  state.total += _out;
	  if (state.wrap && _out) {
	    strm.adler = state.check = /*UPDATE(state.check, strm.next_out - _out, _out);*/
	      (state.flags ? crc32(state.check, output, _out, strm.next_out - _out) : adler32(state.check, output, _out, strm.next_out - _out));
	  }
	  strm.data_type = state.bits + (state.last ? 64 : 0) +
	                    (state.mode === TYPE ? 128 : 0) +
	                    (state.mode === LEN_ || state.mode === COPY_ ? 256 : 0);
	  if (((_in === 0 && _out === 0) || flush === Z_FINISH) && ret === Z_OK) {
	    ret = Z_BUF_ERROR;
	  }
	  return ret;
	}
	
	function inflateEnd(strm) {
	
	  if (!strm || !strm.state /*|| strm->zfree == (free_func)0*/) {
	    return Z_STREAM_ERROR;
	  }
	
	  var state = strm.state;
	  if (state.window) {
	    state.window = null;
	  }
	  strm.state = null;
	  return Z_OK;
	}
	
	function inflateGetHeader(strm, head) {
	  var state;
	
	  /* check state */
	  if (!strm || !strm.state) { return Z_STREAM_ERROR; }
	  state = strm.state;
	  if ((state.wrap & 2) === 0) { return Z_STREAM_ERROR; }
	
	  /* save header structure */
	  state.head = head;
	  head.done = false;
	  return Z_OK;
	}
	
	function inflateSetDictionary(strm, dictionary) {
	  var dictLength = dictionary.length;
	
	  var state;
	  var dictid;
	  var ret;
	
	  /* check state */
	  if (!strm /* == Z_NULL */ || !strm.state /* == Z_NULL */) { return Z_STREAM_ERROR; }
	  state = strm.state;
	
	  if (state.wrap !== 0 && state.mode !== DICT) {
	    return Z_STREAM_ERROR;
	  }
	
	  /* check for correct dictionary identifier */
	  if (state.mode === DICT) {
	    dictid = 1; /* adler32(0, null, 0)*/
	    /* dictid = adler32(dictid, dictionary, dictLength); */
	    dictid = adler32(dictid, dictionary, dictLength, 0);
	    if (dictid !== state.check) {
	      return Z_DATA_ERROR;
	    }
	  }
	  /* copy dictionary to window using updatewindow(), which will amend the
	   existing dictionary if appropriate */
	  ret = updatewindow(strm, dictionary, dictLength, dictLength);
	  if (ret) {
	    state.mode = MEM;
	    return Z_MEM_ERROR;
	  }
	  state.havedict = 1;
	  // Tracev((stderr, "inflate:   dictionary set\n"));
	  return Z_OK;
	}
	
	exports.inflateReset = inflateReset;
	exports.inflateReset2 = inflateReset2;
	exports.inflateResetKeep = inflateResetKeep;
	exports.inflateInit = inflateInit;
	exports.inflateInit2 = inflateInit2;
	exports.inflate = inflate;
	exports.inflateEnd = inflateEnd;
	exports.inflateGetHeader = inflateGetHeader;
	exports.inflateSetDictionary = inflateSetDictionary;
	exports.inflateInfo = 'pako inflate (from Nodeca project)';
	
	/* Not implemented
	exports.inflateCopy = inflateCopy;
	exports.inflateGetDictionary = inflateGetDictionary;
	exports.inflateMark = inflateMark;
	exports.inflatePrime = inflatePrime;
	exports.inflateSync = inflateSync;
	exports.inflateSyncPoint = inflateSyncPoint;
	exports.inflateUndermine = inflateUndermine;
	*/


/***/ },
/* 33 */
/***/ function(module, exports) {

	'use strict';
	
	
	var TYPED_OK =  (typeof Uint8Array !== 'undefined') &&
	                (typeof Uint16Array !== 'undefined') &&
	                (typeof Int32Array !== 'undefined');
	
	
	exports.assign = function (obj /*from1, from2, from3, ...*/) {
	  var sources = Array.prototype.slice.call(arguments, 1);
	  while (sources.length) {
	    var source = sources.shift();
	    if (!source) { continue; }
	
	    if (typeof source !== 'object') {
	      throw new TypeError(source + 'must be non-object');
	    }
	
	    for (var p in source) {
	      if (source.hasOwnProperty(p)) {
	        obj[p] = source[p];
	      }
	    }
	  }
	
	  return obj;
	};
	
	
	// reduce buffer size, avoiding mem copy
	exports.shrinkBuf = function (buf, size) {
	  if (buf.length === size) { return buf; }
	  if (buf.subarray) { return buf.subarray(0, size); }
	  buf.length = size;
	  return buf;
	};
	
	
	var fnTyped = {
	  arraySet: function (dest, src, src_offs, len, dest_offs) {
	    if (src.subarray && dest.subarray) {
	      dest.set(src.subarray(src_offs, src_offs + len), dest_offs);
	      return;
	    }
	    // Fallback to ordinary array
	    for (var i = 0; i < len; i++) {
	      dest[dest_offs + i] = src[src_offs + i];
	    }
	  },
	  // Join array of chunks to single array.
	  flattenChunks: function (chunks) {
	    var i, l, len, pos, chunk, result;
	
	    // calculate data length
	    len = 0;
	    for (i = 0, l = chunks.length; i < l; i++) {
	      len += chunks[i].length;
	    }
	
	    // join chunks
	    result = new Uint8Array(len);
	    pos = 0;
	    for (i = 0, l = chunks.length; i < l; i++) {
	      chunk = chunks[i];
	      result.set(chunk, pos);
	      pos += chunk.length;
	    }
	
	    return result;
	  }
	};
	
	var fnUntyped = {
	  arraySet: function (dest, src, src_offs, len, dest_offs) {
	    for (var i = 0; i < len; i++) {
	      dest[dest_offs + i] = src[src_offs + i];
	    }
	  },
	  // Join array of chunks to single array.
	  flattenChunks: function (chunks) {
	    return [].concat.apply([], chunks);
	  }
	};
	
	
	// Enable/Disable typed arrays use, for testing
	//
	exports.setTyped = function (on) {
	  if (on) {
	    exports.Buf8  = Uint8Array;
	    exports.Buf16 = Uint16Array;
	    exports.Buf32 = Int32Array;
	    exports.assign(exports, fnTyped);
	  } else {
	    exports.Buf8  = Array;
	    exports.Buf16 = Array;
	    exports.Buf32 = Array;
	    exports.assign(exports, fnUntyped);
	  }
	};
	
	exports.setTyped(TYPED_OK);


/***/ },
/* 34 */
/***/ function(module, exports) {

	'use strict';
	
	// Note: adler32 takes 12% for level 0 and 2% for level 6.
	// It doesn't worth to make additional optimizationa as in original.
	// Small size is preferable.
	
	function adler32(adler, buf, len, pos) {
	  var s1 = (adler & 0xffff) |0,
	      s2 = ((adler >>> 16) & 0xffff) |0,
	      n = 0;
	
	  while (len !== 0) {
	    // Set limit ~ twice less than 5552, to keep
	    // s2 in 31-bits, because we force signed ints.
	    // in other case %= will fail.
	    n = len > 2000 ? 2000 : len;
	    len -= n;
	
	    do {
	      s1 = (s1 + buf[pos++]) |0;
	      s2 = (s2 + s1) |0;
	    } while (--n);
	
	    s1 %= 65521;
	    s2 %= 65521;
	  }
	
	  return (s1 | (s2 << 16)) |0;
	}
	
	
	module.exports = adler32;


/***/ },
/* 35 */
/***/ function(module, exports) {

	'use strict';
	
	// Note: we can't get significant speed boost here.
	// So write code to minimize size - no pregenerated tables
	// and array tools dependencies.
	
	
	// Use ordinary array, since untyped makes no boost here
	function makeTable() {
	  var c, table = [];
	
	  for (var n = 0; n < 256; n++) {
	    c = n;
	    for (var k = 0; k < 8; k++) {
	      c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
	    }
	    table[n] = c;
	  }
	
	  return table;
	}
	
	// Create table on load. Just 255 signed longs. Not a problem.
	var crcTable = makeTable();
	
	
	function crc32(crc, buf, len, pos) {
	  var t = crcTable,
	      end = pos + len;
	
	  crc ^= -1;
	
	  for (var i = pos; i < end; i++) {
	    crc = (crc >>> 8) ^ t[(crc ^ buf[i]) & 0xFF];
	  }
	
	  return (crc ^ (-1)); // >>> 0;
	}
	
	
	module.exports = crc32;


/***/ },
/* 36 */
/***/ function(module, exports) {

	'use strict';
	
	// See state defs from inflate.js
	var BAD = 30;       /* got a data error -- remain here until reset */
	var TYPE = 12;      /* i: waiting for type bits, including last-flag bit */
	
	/*
	   Decode literal, length, and distance codes and write out the resulting
	   literal and match bytes until either not enough input or output is
	   available, an end-of-block is encountered, or a data error is encountered.
	   When large enough input and output buffers are supplied to inflate(), for
	   example, a 16K input buffer and a 64K output buffer, more than 95% of the
	   inflate execution time is spent in this routine.
	
	   Entry assumptions:
	
	        state.mode === LEN
	        strm.avail_in >= 6
	        strm.avail_out >= 258
	        start >= strm.avail_out
	        state.bits < 8
	
	   On return, state.mode is one of:
	
	        LEN -- ran out of enough output space or enough available input
	        TYPE -- reached end of block code, inflate() to interpret next block
	        BAD -- error in block data
	
	   Notes:
	
	    - The maximum input bits used by a length/distance pair is 15 bits for the
	      length code, 5 bits for the length extra, 15 bits for the distance code,
	      and 13 bits for the distance extra.  This totals 48 bits, or six bytes.
	      Therefore if strm.avail_in >= 6, then there is enough input to avoid
	      checking for available input while decoding.
	
	    - The maximum bytes that a single length/distance pair can output is 258
	      bytes, which is the maximum length that can be coded.  inflate_fast()
	      requires strm.avail_out >= 258 for each loop to avoid checking for
	      output space.
	 */
	module.exports = function inflate_fast(strm, start) {
	  var state;
	  var _in;                    /* local strm.input */
	  var last;                   /* have enough input while in < last */
	  var _out;                   /* local strm.output */
	  var beg;                    /* inflate()'s initial strm.output */
	  var end;                    /* while out < end, enough space available */
	//#ifdef INFLATE_STRICT
	  var dmax;                   /* maximum distance from zlib header */
	//#endif
	  var wsize;                  /* window size or zero if not using window */
	  var whave;                  /* valid bytes in the window */
	  var wnext;                  /* window write index */
	  // Use `s_window` instead `window`, avoid conflict with instrumentation tools
	  var s_window;               /* allocated sliding window, if wsize != 0 */
	  var hold;                   /* local strm.hold */
	  var bits;                   /* local strm.bits */
	  var lcode;                  /* local strm.lencode */
	  var dcode;                  /* local strm.distcode */
	  var lmask;                  /* mask for first level of length codes */
	  var dmask;                  /* mask for first level of distance codes */
	  var here;                   /* retrieved table entry */
	  var op;                     /* code bits, operation, extra bits, or */
	                              /*  window position, window bytes to copy */
	  var len;                    /* match length, unused bytes */
	  var dist;                   /* match distance */
	  var from;                   /* where to copy match from */
	  var from_source;
	
	
	  var input, output; // JS specific, because we have no pointers
	
	  /* copy state to local variables */
	  state = strm.state;
	  //here = state.here;
	  _in = strm.next_in;
	  input = strm.input;
	  last = _in + (strm.avail_in - 5);
	  _out = strm.next_out;
	  output = strm.output;
	  beg = _out - (start - strm.avail_out);
	  end = _out + (strm.avail_out - 257);
	//#ifdef INFLATE_STRICT
	  dmax = state.dmax;
	//#endif
	  wsize = state.wsize;
	  whave = state.whave;
	  wnext = state.wnext;
	  s_window = state.window;
	  hold = state.hold;
	  bits = state.bits;
	  lcode = state.lencode;
	  dcode = state.distcode;
	  lmask = (1 << state.lenbits) - 1;
	  dmask = (1 << state.distbits) - 1;
	
	
	  /* decode literals and length/distances until end-of-block or not enough
	     input data or output space */
	
	  top:
	  do {
	    if (bits < 15) {
	      hold += input[_in++] << bits;
	      bits += 8;
	      hold += input[_in++] << bits;
	      bits += 8;
	    }
	
	    here = lcode[hold & lmask];
	
	    dolen:
	    for (;;) { // Goto emulation
	      op = here >>> 24/*here.bits*/;
	      hold >>>= op;
	      bits -= op;
	      op = (here >>> 16) & 0xff/*here.op*/;
	      if (op === 0) {                          /* literal */
	        //Tracevv((stderr, here.val >= 0x20 && here.val < 0x7f ?
	        //        "inflate:         literal '%c'\n" :
	        //        "inflate:         literal 0x%02x\n", here.val));
	        output[_out++] = here & 0xffff/*here.val*/;
	      }
	      else if (op & 16) {                     /* length base */
	        len = here & 0xffff/*here.val*/;
	        op &= 15;                           /* number of extra bits */
	        if (op) {
	          if (bits < op) {
	            hold += input[_in++] << bits;
	            bits += 8;
	          }
	          len += hold & ((1 << op) - 1);
	          hold >>>= op;
	          bits -= op;
	        }
	        //Tracevv((stderr, "inflate:         length %u\n", len));
	        if (bits < 15) {
	          hold += input[_in++] << bits;
	          bits += 8;
	          hold += input[_in++] << bits;
	          bits += 8;
	        }
	        here = dcode[hold & dmask];
	
	        dodist:
	        for (;;) { // goto emulation
	          op = here >>> 24/*here.bits*/;
	          hold >>>= op;
	          bits -= op;
	          op = (here >>> 16) & 0xff/*here.op*/;
	
	          if (op & 16) {                      /* distance base */
	            dist = here & 0xffff/*here.val*/;
	            op &= 15;                       /* number of extra bits */
	            if (bits < op) {
	              hold += input[_in++] << bits;
	              bits += 8;
	              if (bits < op) {
	                hold += input[_in++] << bits;
	                bits += 8;
	              }
	            }
	            dist += hold & ((1 << op) - 1);
	//#ifdef INFLATE_STRICT
	            if (dist > dmax) {
	              strm.msg = 'invalid distance too far back';
	              state.mode = BAD;
	              break top;
	            }
	//#endif
	            hold >>>= op;
	            bits -= op;
	            //Tracevv((stderr, "inflate:         distance %u\n", dist));
	            op = _out - beg;                /* max distance in output */
	            if (dist > op) {                /* see if copy from window */
	              op = dist - op;               /* distance back in window */
	              if (op > whave) {
	                if (state.sane) {
	                  strm.msg = 'invalid distance too far back';
	                  state.mode = BAD;
	                  break top;
	                }
	
	// (!) This block is disabled in zlib defailts,
	// don't enable it for binary compatibility
	//#ifdef INFLATE_ALLOW_INVALID_DISTANCE_TOOFAR_ARRR
	//                if (len <= op - whave) {
	//                  do {
	//                    output[_out++] = 0;
	//                  } while (--len);
	//                  continue top;
	//                }
	//                len -= op - whave;
	//                do {
	//                  output[_out++] = 0;
	//                } while (--op > whave);
	//                if (op === 0) {
	//                  from = _out - dist;
	//                  do {
	//                    output[_out++] = output[from++];
	//                  } while (--len);
	//                  continue top;
	//                }
	//#endif
	              }
	              from = 0; // window index
	              from_source = s_window;
	              if (wnext === 0) {           /* very common case */
	                from += wsize - op;
	                if (op < len) {         /* some from window */
	                  len -= op;
	                  do {
	                    output[_out++] = s_window[from++];
	                  } while (--op);
	                  from = _out - dist;  /* rest from output */
	                  from_source = output;
	                }
	              }
	              else if (wnext < op) {      /* wrap around window */
	                from += wsize + wnext - op;
	                op -= wnext;
	                if (op < len) {         /* some from end of window */
	                  len -= op;
	                  do {
	                    output[_out++] = s_window[from++];
	                  } while (--op);
	                  from = 0;
	                  if (wnext < len) {  /* some from start of window */
	                    op = wnext;
	                    len -= op;
	                    do {
	                      output[_out++] = s_window[from++];
	                    } while (--op);
	                    from = _out - dist;      /* rest from output */
	                    from_source = output;
	                  }
	                }
	              }
	              else {                      /* contiguous in window */
	                from += wnext - op;
	                if (op < len) {         /* some from window */
	                  len -= op;
	                  do {
	                    output[_out++] = s_window[from++];
	                  } while (--op);
	                  from = _out - dist;  /* rest from output */
	                  from_source = output;
	                }
	              }
	              while (len > 2) {
	                output[_out++] = from_source[from++];
	                output[_out++] = from_source[from++];
	                output[_out++] = from_source[from++];
	                len -= 3;
	              }
	              if (len) {
	                output[_out++] = from_source[from++];
	                if (len > 1) {
	                  output[_out++] = from_source[from++];
	                }
	              }
	            }
	            else {
	              from = _out - dist;          /* copy direct from output */
	              do {                        /* minimum length is three */
	                output[_out++] = output[from++];
	                output[_out++] = output[from++];
	                output[_out++] = output[from++];
	                len -= 3;
	              } while (len > 2);
	              if (len) {
	                output[_out++] = output[from++];
	                if (len > 1) {
	                  output[_out++] = output[from++];
	                }
	              }
	            }
	          }
	          else if ((op & 64) === 0) {          /* 2nd level distance code */
	            here = dcode[(here & 0xffff)/*here.val*/ + (hold & ((1 << op) - 1))];
	            continue dodist;
	          }
	          else {
	            strm.msg = 'invalid distance code';
	            state.mode = BAD;
	            break top;
	          }
	
	          break; // need to emulate goto via "continue"
	        }
	      }
	      else if ((op & 64) === 0) {              /* 2nd level length code */
	        here = lcode[(here & 0xffff)/*here.val*/ + (hold & ((1 << op) - 1))];
	        continue dolen;
	      }
	      else if (op & 32) {                     /* end-of-block */
	        //Tracevv((stderr, "inflate:         end of block\n"));
	        state.mode = TYPE;
	        break top;
	      }
	      else {
	        strm.msg = 'invalid literal/length code';
	        state.mode = BAD;
	        break top;
	      }
	
	      break; // need to emulate goto via "continue"
	    }
	  } while (_in < last && _out < end);
	
	  /* return unused bytes (on entry, bits < 8, so in won't go too far back) */
	  len = bits >> 3;
	  _in -= len;
	  bits -= len << 3;
	  hold &= (1 << bits) - 1;
	
	  /* update state and return */
	  strm.next_in = _in;
	  strm.next_out = _out;
	  strm.avail_in = (_in < last ? 5 + (last - _in) : 5 - (_in - last));
	  strm.avail_out = (_out < end ? 257 + (end - _out) : 257 - (_out - end));
	  state.hold = hold;
	  state.bits = bits;
	  return;
	};


/***/ },
/* 37 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	
	var utils = __webpack_require__(33);
	
	var MAXBITS = 15;
	var ENOUGH_LENS = 852;
	var ENOUGH_DISTS = 592;
	//var ENOUGH = (ENOUGH_LENS+ENOUGH_DISTS);
	
	var CODES = 0;
	var LENS = 1;
	var DISTS = 2;
	
	var lbase = [ /* Length codes 257..285 base */
	  3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31,
	  35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258, 0, 0
	];
	
	var lext = [ /* Length codes 257..285 extra */
	  16, 16, 16, 16, 16, 16, 16, 16, 17, 17, 17, 17, 18, 18, 18, 18,
	  19, 19, 19, 19, 20, 20, 20, 20, 21, 21, 21, 21, 16, 72, 78
	];
	
	var dbase = [ /* Distance codes 0..29 base */
	  1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193,
	  257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145,
	  8193, 12289, 16385, 24577, 0, 0
	];
	
	var dext = [ /* Distance codes 0..29 extra */
	  16, 16, 16, 16, 17, 17, 18, 18, 19, 19, 20, 20, 21, 21, 22, 22,
	  23, 23, 24, 24, 25, 25, 26, 26, 27, 27,
	  28, 28, 29, 29, 64, 64
	];
	
	module.exports = function inflate_table(type, lens, lens_index, codes, table, table_index, work, opts)
	{
	  var bits = opts.bits;
	      //here = opts.here; /* table entry for duplication */
	
	  var len = 0;               /* a code's length in bits */
	  var sym = 0;               /* index of code symbols */
	  var min = 0, max = 0;          /* minimum and maximum code lengths */
	  var root = 0;              /* number of index bits for root table */
	  var curr = 0;              /* number of index bits for current table */
	  var drop = 0;              /* code bits to drop for sub-table */
	  var left = 0;                   /* number of prefix codes available */
	  var used = 0;              /* code entries in table used */
	  var huff = 0;              /* Huffman code */
	  var incr;              /* for incrementing code, index */
	  var fill;              /* index for replicating entries */
	  var low;               /* low bits for current root entry */
	  var mask;              /* mask for low root bits */
	  var next;             /* next available space in table */
	  var base = null;     /* base value table to use */
	  var base_index = 0;
	//  var shoextra;    /* extra bits table to use */
	  var end;                    /* use base and extra for symbol > end */
	  var count = new utils.Buf16(MAXBITS + 1); //[MAXBITS+1];    /* number of codes of each length */
	  var offs = new utils.Buf16(MAXBITS + 1); //[MAXBITS+1];     /* offsets in table for each length */
	  var extra = null;
	  var extra_index = 0;
	
	  var here_bits, here_op, here_val;
	
	  /*
	   Process a set of code lengths to create a canonical Huffman code.  The
	   code lengths are lens[0..codes-1].  Each length corresponds to the
	   symbols 0..codes-1.  The Huffman code is generated by first sorting the
	   symbols by length from short to long, and retaining the symbol order
	   for codes with equal lengths.  Then the code starts with all zero bits
	   for the first code of the shortest length, and the codes are integer
	   increments for the same length, and zeros are appended as the length
	   increases.  For the deflate format, these bits are stored backwards
	   from their more natural integer increment ordering, and so when the
	   decoding tables are built in the large loop below, the integer codes
	   are incremented backwards.
	
	   This routine assumes, but does not check, that all of the entries in
	   lens[] are in the range 0..MAXBITS.  The caller must assure this.
	   1..MAXBITS is interpreted as that code length.  zero means that that
	   symbol does not occur in this code.
	
	   The codes are sorted by computing a count of codes for each length,
	   creating from that a table of starting indices for each length in the
	   sorted table, and then entering the symbols in order in the sorted
	   table.  The sorted table is work[], with that space being provided by
	   the caller.
	
	   The length counts are used for other purposes as well, i.e. finding
	   the minimum and maximum length codes, determining if there are any
	   codes at all, checking for a valid set of lengths, and looking ahead
	   at length counts to determine sub-table sizes when building the
	   decoding tables.
	   */
	
	  /* accumulate lengths for codes (assumes lens[] all in 0..MAXBITS) */
	  for (len = 0; len <= MAXBITS; len++) {
	    count[len] = 0;
	  }
	  for (sym = 0; sym < codes; sym++) {
	    count[lens[lens_index + sym]]++;
	  }
	
	  /* bound code lengths, force root to be within code lengths */
	  root = bits;
	  for (max = MAXBITS; max >= 1; max--) {
	    if (count[max] !== 0) { break; }
	  }
	  if (root > max) {
	    root = max;
	  }
	  if (max === 0) {                     /* no symbols to code at all */
	    //table.op[opts.table_index] = 64;  //here.op = (var char)64;    /* invalid code marker */
	    //table.bits[opts.table_index] = 1;   //here.bits = (var char)1;
	    //table.val[opts.table_index++] = 0;   //here.val = (var short)0;
	    table[table_index++] = (1 << 24) | (64 << 16) | 0;
	
	
	    //table.op[opts.table_index] = 64;
	    //table.bits[opts.table_index] = 1;
	    //table.val[opts.table_index++] = 0;
	    table[table_index++] = (1 << 24) | (64 << 16) | 0;
	
	    opts.bits = 1;
	    return 0;     /* no symbols, but wait for decoding to report error */
	  }
	  for (min = 1; min < max; min++) {
	    if (count[min] !== 0) { break; }
	  }
	  if (root < min) {
	    root = min;
	  }
	
	  /* check for an over-subscribed or incomplete set of lengths */
	  left = 1;
	  for (len = 1; len <= MAXBITS; len++) {
	    left <<= 1;
	    left -= count[len];
	    if (left < 0) {
	      return -1;
	    }        /* over-subscribed */
	  }
	  if (left > 0 && (type === CODES || max !== 1)) {
	    return -1;                      /* incomplete set */
	  }
	
	  /* generate offsets into symbol table for each length for sorting */
	  offs[1] = 0;
	  for (len = 1; len < MAXBITS; len++) {
	    offs[len + 1] = offs[len] + count[len];
	  }
	
	  /* sort symbols by length, by symbol order within each length */
	  for (sym = 0; sym < codes; sym++) {
	    if (lens[lens_index + sym] !== 0) {
	      work[offs[lens[lens_index + sym]]++] = sym;
	    }
	  }
	
	  /*
	   Create and fill in decoding tables.  In this loop, the table being
	   filled is at next and has curr index bits.  The code being used is huff
	   with length len.  That code is converted to an index by dropping drop
	   bits off of the bottom.  For codes where len is less than drop + curr,
	   those top drop + curr - len bits are incremented through all values to
	   fill the table with replicated entries.
	
	   root is the number of index bits for the root table.  When len exceeds
	   root, sub-tables are created pointed to by the root entry with an index
	   of the low root bits of huff.  This is saved in low to check for when a
	   new sub-table should be started.  drop is zero when the root table is
	   being filled, and drop is root when sub-tables are being filled.
	
	   When a new sub-table is needed, it is necessary to look ahead in the
	   code lengths to determine what size sub-table is needed.  The length
	   counts are used for this, and so count[] is decremented as codes are
	   entered in the tables.
	
	   used keeps track of how many table entries have been allocated from the
	   provided *table space.  It is checked for LENS and DIST tables against
	   the constants ENOUGH_LENS and ENOUGH_DISTS to guard against changes in
	   the initial root table size constants.  See the comments in inftrees.h
	   for more information.
	
	   sym increments through all symbols, and the loop terminates when
	   all codes of length max, i.e. all codes, have been processed.  This
	   routine permits incomplete codes, so another loop after this one fills
	   in the rest of the decoding tables with invalid code markers.
	   */
	
	  /* set up for code type */
	  // poor man optimization - use if-else instead of switch,
	  // to avoid deopts in old v8
	  if (type === CODES) {
	    base = extra = work;    /* dummy value--not used */
	    end = 19;
	
	  } else if (type === LENS) {
	    base = lbase;
	    base_index -= 257;
	    extra = lext;
	    extra_index -= 257;
	    end = 256;
	
	  } else {                    /* DISTS */
	    base = dbase;
	    extra = dext;
	    end = -1;
	  }
	
	  /* initialize opts for loop */
	  huff = 0;                   /* starting code */
	  sym = 0;                    /* starting code symbol */
	  len = min;                  /* starting code length */
	  next = table_index;              /* current table to fill in */
	  curr = root;                /* current table index bits */
	  drop = 0;                   /* current bits to drop from code for index */
	  low = -1;                   /* trigger new sub-table when len > root */
	  used = 1 << root;          /* use root table entries */
	  mask = used - 1;            /* mask for comparing low */
	
	  /* check available table space */
	  if ((type === LENS && used > ENOUGH_LENS) ||
	    (type === DISTS && used > ENOUGH_DISTS)) {
	    return 1;
	  }
	
	  /* process all codes and make table entries */
	  for (;;) {
	    /* create table entry */
	    here_bits = len - drop;
	    if (work[sym] < end) {
	      here_op = 0;
	      here_val = work[sym];
	    }
	    else if (work[sym] > end) {
	      here_op = extra[extra_index + work[sym]];
	      here_val = base[base_index + work[sym]];
	    }
	    else {
	      here_op = 32 + 64;         /* end of block */
	      here_val = 0;
	    }
	
	    /* replicate for those indices with low len bits equal to huff */
	    incr = 1 << (len - drop);
	    fill = 1 << curr;
	    min = fill;                 /* save offset to next table */
	    do {
	      fill -= incr;
	      table[next + (huff >> drop) + fill] = (here_bits << 24) | (here_op << 16) | here_val |0;
	    } while (fill !== 0);
	
	    /* backwards increment the len-bit code huff */
	    incr = 1 << (len - 1);
	    while (huff & incr) {
	      incr >>= 1;
	    }
	    if (incr !== 0) {
	      huff &= incr - 1;
	      huff += incr;
	    } else {
	      huff = 0;
	    }
	
	    /* go to next symbol, update count, len */
	    sym++;
	    if (--count[len] === 0) {
	      if (len === max) { break; }
	      len = lens[lens_index + work[sym]];
	    }
	
	    /* create new sub-table if needed */
	    if (len > root && (huff & mask) !== low) {
	      /* if first time, transition to sub-tables */
	      if (drop === 0) {
	        drop = root;
	      }
	
	      /* increment past last table */
	      next += min;            /* here min is 1 << curr */
	
	      /* determine length of next table */
	      curr = len - drop;
	      left = 1 << curr;
	      while (curr + drop < max) {
	        left -= count[curr + drop];
	        if (left <= 0) { break; }
	        curr++;
	        left <<= 1;
	      }
	
	      /* check for enough space */
	      used += 1 << curr;
	      if ((type === LENS && used > ENOUGH_LENS) ||
	        (type === DISTS && used > ENOUGH_DISTS)) {
	        return 1;
	      }
	
	      /* point entry in root table to sub-table */
	      low = huff & mask;
	      /*table.op[low] = curr;
	      table.bits[low] = root;
	      table.val[low] = next - opts.table_index;*/
	      table[low] = (root << 24) | (curr << 16) | (next - table_index) |0;
	    }
	  }
	
	  /* fill in remaining table entry if code is incomplete (guaranteed to have
	   at most one remaining entry, since if the code is incomplete, the
	   maximum code length that was allowed to get this far is one bit) */
	  if (huff !== 0) {
	    //table.op[next + huff] = 64;            /* invalid code marker */
	    //table.bits[next + huff] = len - drop;
	    //table.val[next + huff] = 0;
	    table[next + huff] = ((len - drop) << 24) | (64 << 16) |0;
	  }
	
	  /* set return parameters */
	  //opts.table_index += used;
	  opts.bits = root;
	  return 0;
	};


/***/ },
/* 38 */
/***/ function(module, exports, __webpack_require__) {

	// String encode/decode helpers
	'use strict';
	
	
	var utils = __webpack_require__(33);
	
	
	// Quick check if we can use fast array to bin string conversion
	//
	// - apply(Array) can fail on Android 2.2
	// - apply(Uint8Array) can fail on iOS 5.1 Safary
	//
	var STR_APPLY_OK = true;
	var STR_APPLY_UIA_OK = true;
	
	try { String.fromCharCode.apply(null, [ 0 ]); } catch (__) { STR_APPLY_OK = false; }
	try { String.fromCharCode.apply(null, new Uint8Array(1)); } catch (__) { STR_APPLY_UIA_OK = false; }
	
	
	// Table with utf8 lengths (calculated by first byte of sequence)
	// Note, that 5 & 6-byte values and some 4-byte values can not be represented in JS,
	// because max possible codepoint is 0x10ffff
	var _utf8len = new utils.Buf8(256);
	for (var q = 0; q < 256; q++) {
	  _utf8len[q] = (q >= 252 ? 6 : q >= 248 ? 5 : q >= 240 ? 4 : q >= 224 ? 3 : q >= 192 ? 2 : 1);
	}
	_utf8len[254] = _utf8len[254] = 1; // Invalid sequence start
	
	
	// convert string to array (typed, when possible)
	exports.string2buf = function (str) {
	  var buf, c, c2, m_pos, i, str_len = str.length, buf_len = 0;
	
	  // count binary size
	  for (m_pos = 0; m_pos < str_len; m_pos++) {
	    c = str.charCodeAt(m_pos);
	    if ((c & 0xfc00) === 0xd800 && (m_pos + 1 < str_len)) {
	      c2 = str.charCodeAt(m_pos + 1);
	      if ((c2 & 0xfc00) === 0xdc00) {
	        c = 0x10000 + ((c - 0xd800) << 10) + (c2 - 0xdc00);
	        m_pos++;
	      }
	    }
	    buf_len += c < 0x80 ? 1 : c < 0x800 ? 2 : c < 0x10000 ? 3 : 4;
	  }
	
	  // allocate buffer
	  buf = new utils.Buf8(buf_len);
	
	  // convert
	  for (i = 0, m_pos = 0; i < buf_len; m_pos++) {
	    c = str.charCodeAt(m_pos);
	    if ((c & 0xfc00) === 0xd800 && (m_pos + 1 < str_len)) {
	      c2 = str.charCodeAt(m_pos + 1);
	      if ((c2 & 0xfc00) === 0xdc00) {
	        c = 0x10000 + ((c - 0xd800) << 10) + (c2 - 0xdc00);
	        m_pos++;
	      }
	    }
	    if (c < 0x80) {
	      /* one byte */
	      buf[i++] = c;
	    } else if (c < 0x800) {
	      /* two bytes */
	      buf[i++] = 0xC0 | (c >>> 6);
	      buf[i++] = 0x80 | (c & 0x3f);
	    } else if (c < 0x10000) {
	      /* three bytes */
	      buf[i++] = 0xE0 | (c >>> 12);
	      buf[i++] = 0x80 | (c >>> 6 & 0x3f);
	      buf[i++] = 0x80 | (c & 0x3f);
	    } else {
	      /* four bytes */
	      buf[i++] = 0xf0 | (c >>> 18);
	      buf[i++] = 0x80 | (c >>> 12 & 0x3f);
	      buf[i++] = 0x80 | (c >>> 6 & 0x3f);
	      buf[i++] = 0x80 | (c & 0x3f);
	    }
	  }
	
	  return buf;
	};
	
	// Helper (used in 2 places)
	function buf2binstring(buf, len) {
	  // use fallback for big arrays to avoid stack overflow
	  if (len < 65537) {
	    if ((buf.subarray && STR_APPLY_UIA_OK) || (!buf.subarray && STR_APPLY_OK)) {
	      return String.fromCharCode.apply(null, utils.shrinkBuf(buf, len));
	    }
	  }
	
	  var result = '';
	  for (var i = 0; i < len; i++) {
	    result += String.fromCharCode(buf[i]);
	  }
	  return result;
	}
	
	
	// Convert byte array to binary string
	exports.buf2binstring = function (buf) {
	  return buf2binstring(buf, buf.length);
	};
	
	
	// Convert binary string (typed, when possible)
	exports.binstring2buf = function (str) {
	  var buf = new utils.Buf8(str.length);
	  for (var i = 0, len = buf.length; i < len; i++) {
	    buf[i] = str.charCodeAt(i);
	  }
	  return buf;
	};
	
	
	// convert array to string
	exports.buf2string = function (buf, max) {
	  var i, out, c, c_len;
	  var len = max || buf.length;
	
	  // Reserve max possible length (2 words per char)
	  // NB: by unknown reasons, Array is significantly faster for
	  //     String.fromCharCode.apply than Uint16Array.
	  var utf16buf = new Array(len * 2);
	
	  for (out = 0, i = 0; i < len;) {
	    c = buf[i++];
	    // quick process ascii
	    if (c < 0x80) { utf16buf[out++] = c; continue; }
	
	    c_len = _utf8len[c];
	    // skip 5 & 6 byte codes
	    if (c_len > 4) { utf16buf[out++] = 0xfffd; i += c_len - 1; continue; }
	
	    // apply mask on first byte
	    c &= c_len === 2 ? 0x1f : c_len === 3 ? 0x0f : 0x07;
	    // join the rest
	    while (c_len > 1 && i < len) {
	      c = (c << 6) | (buf[i++] & 0x3f);
	      c_len--;
	    }
	
	    // terminated by end of string?
	    if (c_len > 1) { utf16buf[out++] = 0xfffd; continue; }
	
	    if (c < 0x10000) {
	      utf16buf[out++] = c;
	    } else {
	      c -= 0x10000;
	      utf16buf[out++] = 0xd800 | ((c >> 10) & 0x3ff);
	      utf16buf[out++] = 0xdc00 | (c & 0x3ff);
	    }
	  }
	
	  return buf2binstring(utf16buf, out);
	};
	
	
	// Calculate max possible position in utf8 buffer,
	// that will not break sequence. If that's not possible
	// - (very small limits) return max size as is.
	//
	// buf[] - utf8 bytes array
	// max   - length limit (mandatory);
	exports.utf8border = function (buf, max) {
	  var pos;
	
	  max = max || buf.length;
	  if (max > buf.length) { max = buf.length; }
	
	  // go back from last position, until start of sequence found
	  pos = max - 1;
	  while (pos >= 0 && (buf[pos] & 0xC0) === 0x80) { pos--; }
	
	  // Fuckup - very small and broken sequence,
	  // return max, because we should return something anyway.
	  if (pos < 0) { return max; }
	
	  // If we came to start of buffer - that means vuffer is too small,
	  // return max too.
	  if (pos === 0) { return max; }
	
	  return (pos + _utf8len[buf[pos]] > max) ? pos : max;
	};


/***/ },
/* 39 */
/***/ function(module, exports) {

	'use strict';
	
	
	module.exports = {
	
	  /* Allowed flush values; see deflate() and inflate() below for details */
	  Z_NO_FLUSH:         0,
	  Z_PARTIAL_FLUSH:    1,
	  Z_SYNC_FLUSH:       2,
	  Z_FULL_FLUSH:       3,
	  Z_FINISH:           4,
	  Z_BLOCK:            5,
	  Z_TREES:            6,
	
	  /* Return codes for the compression/decompression functions. Negative values
	  * are errors, positive values are used for special but normal events.
	  */
	  Z_OK:               0,
	  Z_STREAM_END:       1,
	  Z_NEED_DICT:        2,
	  Z_ERRNO:           -1,
	  Z_STREAM_ERROR:    -2,
	  Z_DATA_ERROR:      -3,
	  //Z_MEM_ERROR:     -4,
	  Z_BUF_ERROR:       -5,
	  //Z_VERSION_ERROR: -6,
	
	  /* compression levels */
	  Z_NO_COMPRESSION:         0,
	  Z_BEST_SPEED:             1,
	  Z_BEST_COMPRESSION:       9,
	  Z_DEFAULT_COMPRESSION:   -1,
	
	
	  Z_FILTERED:               1,
	  Z_HUFFMAN_ONLY:           2,
	  Z_RLE:                    3,
	  Z_FIXED:                  4,
	  Z_DEFAULT_STRATEGY:       0,
	
	  /* Possible values of the data_type field (though see inflate()) */
	  Z_BINARY:                 0,
	  Z_TEXT:                   1,
	  //Z_ASCII:                1, // = Z_TEXT (deprecated)
	  Z_UNKNOWN:                2,
	
	  /* The deflate compression method */
	  Z_DEFLATED:               8
	  //Z_NULL:                 null // Use -1 or null inline, depending on var type
	};


/***/ },
/* 40 */
/***/ function(module, exports) {

	'use strict';
	
	module.exports = {
	  2:      'need dictionary',     /* Z_NEED_DICT       2  */
	  1:      'stream end',          /* Z_STREAM_END      1  */
	  0:      '',                    /* Z_OK              0  */
	  '-1':   'file error',          /* Z_ERRNO         (-1) */
	  '-2':   'stream error',        /* Z_STREAM_ERROR  (-2) */
	  '-3':   'data error',          /* Z_DATA_ERROR    (-3) */
	  '-4':   'insufficient memory', /* Z_MEM_ERROR     (-4) */
	  '-5':   'buffer error',        /* Z_BUF_ERROR     (-5) */
	  '-6':   'incompatible version' /* Z_VERSION_ERROR (-6) */
	};


/***/ },
/* 41 */
/***/ function(module, exports) {

	'use strict';
	
	
	function ZStream() {
	  /* next input byte */
	  this.input = null; // JS specific, because we have no pointers
	  this.next_in = 0;
	  /* number of bytes available at input */
	  this.avail_in = 0;
	  /* total number of input bytes read so far */
	  this.total_in = 0;
	  /* next output byte should be put there */
	  this.output = null; // JS specific, because we have no pointers
	  this.next_out = 0;
	  /* remaining free space at output */
	  this.avail_out = 0;
	  /* total number of bytes output so far */
	  this.total_out = 0;
	  /* last error message, NULL if no error */
	  this.msg = ''/*Z_NULL*/;
	  /* not visible by applications */
	  this.state = null;
	  /* best guess about the data type: binary or text */
	  this.data_type = 2/*Z_UNKNOWN*/;
	  /* adler32 value of the uncompressed data */
	  this.adler = 0;
	}
	
	module.exports = ZStream;


/***/ },
/* 42 */
/***/ function(module, exports) {

	'use strict';
	
	
	function GZheader() {
	  /* true if compressed data believed to be text */
	  this.text       = 0;
	  /* modification time */
	  this.time       = 0;
	  /* extra flags (not used when writing a gzip file) */
	  this.xflags     = 0;
	  /* operating system */
	  this.os         = 0;
	  /* pointer to extra field or Z_NULL if none */
	  this.extra      = null;
	  /* extra field length (valid if extra != Z_NULL) */
	  this.extra_len  = 0; // Actually, we don't need it in JS,
	                       // but leave for few code modifications
	
	  //
	  // Setup limits is not necessary because in js we should not preallocate memory
	  // for inflate use constant limit in 65536 bytes
	  //
	
	  /* space at extra (only when reading header) */
	  // this.extra_max  = 0;
	  /* pointer to zero-terminated file name or Z_NULL */
	  this.name       = '';
	  /* space at name (only when reading header) */
	  // this.name_max   = 0;
	  /* pointer to zero-terminated comment or Z_NULL */
	  this.comment    = '';
	  /* space at comment (only when reading header) */
	  // this.comm_max   = 0;
	  /* true if there was or will be a header crc */
	  this.hcrc       = 0;
	  /* true when done reading gzip header (not used when writing a gzip file) */
	  this.done       = false;
	}
	
	module.exports = GZheader;


/***/ }
/******/ ])
});
;
//# sourceMappingURL=browserfs.js.map