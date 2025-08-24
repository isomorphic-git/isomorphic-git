/**
 * drived from ~ v1.5 https://raw.githubusercontent.com/mozilla/webextension-polyfill/refs/heads/master/src/browser-polyfill.js
 */

// https://raw.githubusercontent.com/mozilla/webextension-polyfill/refs/heads/master/api-metadata.json
import apiMetadataJson from './api-metadata.json' with { type: "json" };

if (Object.keys(apiMetadataJson).length === 0) {
  throw new Error("api-metadata.json has not been included in browser-polyfill");
}

if (!(globalThis.chrome && globalThis.chrome.runtime && globalThis.chrome.runtime.id)) {
  throw new Error("This script should only be loaded in a browser extension.");
}

const CHROME_SEND_MESSAGE_CALLBACK_NO_RESPONSE_MESSAGE = "The message port closed before a response was received.";
const extensionAPIs = chrome;

/**
 * A WeakMap subclass which creates and stores a value for any key which does
 * not exist when accessed, but behaves exactly as an ordinary WeakMap
 * otherwise.
 *
 * @param {function} createItem
 *        A function which will be called in order to create the value for any
 *        key which does not exist, the first time it is accessed. The
 *        function receives, as its only argument, the key being created.
 */
class DefaultWeakMap extends WeakMap {
  constructor(createItem, items = undefined) {
    super(items);
    this.createItem = createItem;
  }

  get(key) {
    if (!this.has(key)) {
      this.set(key, this.createItem(key));
    }

    return super.get(key);
  }
}

/**
 * Returns true if the given object is an object with a `then` method, and can
 * therefore be assumed to behave as a Promise.
 *
 * @param {*} value The value to test.
 * @returns {boolean} True if the value is thenable.
 */
const isThenable = value => {
  return value && typeof value === "object" && typeof value.then === "function";
};

/**
 * Creates and returns a function which, when called, will resolve or reject
 * the given promise based on how it is called:
 *
 * - If, when called, `chrome.runtime.lastError` contains a non-null object,
 *   the promise is rejected with that value.
 * - If the function is called with exactly one argument, the promise is
 *   resolved to that value.
 * - Otherwise, the promise is resolved to an array containing all of the
 *   function's arguments.
 *
 * @param {object} promise
 *        An object containing the resolution and rejection functions of a
 *        promise.
 * @param {function} promise.resolve
 *        The promise's resolution function.
 * @param {function} promise.reject
 *        The promise's rejection function.
 * @param {object} metadata
 *        Metadata about the wrapped method which has created the callback.
 * @param {boolean} metadata.singleCallbackArg
 *        Whether or not the promise is resolved with only the first
 *        argument of the callback, alternatively an array of all the
 *        callback arguments is resolved. By default, if the callback
 *        function is invoked with only a single argument, that will be
 *        resolved to the promise, while all arguments will be resolved as
 *        an array if multiple are given.
 *
 * @returns {function}
 *        The generated callback function.
 */
const makeCallback = (promise, metadata) => {
  return (...callbackArgs) => {
    if (extensionAPIs.runtime.lastError) {
      promise.reject(new Error(extensionAPIs.runtime.lastError.message));
    } else if (metadata.singleCallbackArg ||
               (callbackArgs.length <= 1 && metadata.singleCallbackArg !== false)) {
      promise.resolve(callbackArgs[0]);
    } else {
      promise.resolve(callbackArgs);
    }
  };
};

const pluralizeArguments = (numArgs) => numArgs == 1 ? "argument" : "arguments";

/**
 * Creates a wrapper function for a method with the given name and metadata.
 *
 * @param {string} name
 *        The name of the method which is being wrapped.
 * @param {object} metadata
 *        Metadata about the method being wrapped.
 * @param {integer} metadata.minArgs
 *        The minimum number of arguments which must be passed to the
 *        function. If called with fewer than this number of arguments, the
 *        wrapper will raise an exception.
 * @param {integer} metadata.maxArgs
 *        The maximum number of arguments which may be passed to the
 *        function. If called with more than this number of arguments, the
 *        wrapper will raise an exception.
 * @param {boolean} metadata.singleCallbackArg
 *        Whether or not the promise is resolved with only the first
 *        argument of the callback, alternatively an array of all the
 *        callback arguments is resolved. By default, if the callback
 *        function is invoked with only a single argument, that will be
 *        resolved to the promise, while all arguments will be resolved as
 *        an array if multiple are given.
 *
 * @returns {function(object, ...*)}
 *       The generated wrapper function.
 */
const wrapAsyncFunction = (name, metadata) => {
  return function asyncFunctionWrapper(target, ...args) {
    if (args.length < metadata.minArgs) {
      throw new Error(`Expected at least ${metadata.minArgs} ${pluralizeArguments(metadata.minArgs)} for ${name}(), got ${args.length}`);
    }

    if (args.length > metadata.maxArgs) {
      throw new Error(`Expected at most ${metadata.maxArgs} ${pluralizeArguments(metadata.maxArgs)} for ${name}(), got ${args.length}`);
    }

    return new Promise((resolve, reject) => {
      if (metadata.fallbackToNoCallback) {
        // This API method has currently no callback on Chrome, but it return a promise on Firefox,
        // and so the polyfill will try to call it with a callback first, and it will fallback
        // to not passing the callback if the first call fails.
        try {
          target[name](...args, makeCallback({resolve, reject}, metadata));
        } catch (cbError) {
          console.warn(`${name} API method doesn't seem to support the callback parameter, ` +
                       "falling back to call it without a callback: ", cbError);

          target[name](...args);

          // Update the API method metadata, so that the next API calls will not try to
          // use the unsupported callback anymore.
          metadata.fallbackToNoCallback = false;
          metadata.noCallback = true;

          resolve();
        }
      } else if (metadata.noCallback) {
        target[name](...args);
        resolve();
      } else {
        target[name](...args, makeCallback({resolve, reject}, metadata));
      }
    });
  };
};

/**
 * Wraps an existing method of the target object, so that calls to it are
 * intercepted by the given wrapper function. The wrapper function receives,
 * as its first argument, the original `target` object, followed by each of
 * the arguments passed to the original method.
 *
 * @param {object} target
 *        The original target object that the wrapped method belongs to.
 * @param {function} method
 *        The method being wrapped. This is used as the target of the Proxy
 *        object which is created to wrap the method.
 * @param {function} wrapper
 *        The wrapper function which is called in place of a direct invocation
 *        of the wrapped method.
 *
 * @returns {Proxy<function>}
 *        A Proxy object for the given method, which invokes the given wrapper
 *        method in its place.
 */
const wrapMethod = (target, method, wrapper) => {
  return new Proxy(method, {
    apply(targetMethod, thisObj, args) {
      return wrapper.call(thisObj, target, ...args);
    },
  });
};

let hasOwnProperty = Function.call.bind(Object.prototype.hasOwnProperty);

/**
 * Wraps an object in a Proxy which intercepts and wraps certain methods
 * based on the given `wrappers` and `metadata` objects.
 *
 * @param {object} target
 *        The target object to wrap.
 *
 * @param {object} [wrappers = {}]
 *        An object tree containing wrapper functions for special cases. Any
 *        function present in this object tree is called in place of the
 *        method in the same location in the `target` object tree. These
 *        wrapper methods are invoked as described in {@see wrapMethod}.
 *
 * @param {object} [metadata = {}]
 *        An object tree containing metadata used to automatically generate
 *        Promise-based wrapper functions for asynchronous. Any function in
 *        the `target` object tree which has a corresponding metadata object
 *        in the same location in the `metadata` tree is replaced with an
 *        automatically-generated wrapper function, as described in
 *        {@see wrapAsyncFunction}
 *
 * @returns {Proxy<object>}
 */
const wrapObject = (target, wrappers = {}, metadata = {}) => {
  let cache = Object.create(null);
  let handlers = {
    has(proxyTarget, prop) {
      return prop in target || prop in cache;
    },

    get(proxyTarget, prop, receiver) {
      if (prop in cache) {
        return cache[prop];
      }

      if (!(prop in target)) {
        return undefined;
      }

      let value = target[prop];

      if (typeof value === "function") {
        // This is a method on the underlying object. Check if we need to do
        // any wrapping.

        if (typeof wrappers[prop] === "function") {
          // We have a special-case wrapper for this method.
          value = wrapMethod(target, target[prop], wrappers[prop]);
        } else if (hasOwnProperty(metadata, prop)) {
          // This is an async method that we have metadata for. Create a
          // Promise wrapper for it.
          let wrapper = wrapAsyncFunction(prop, metadata[prop]);
          value = wrapMethod(target, target[prop], wrapper);
        } else {
          // This is a method that we don't know or care about. Return the
          // original method, bound to the underlying object.
          value = value.bind(target);
        }
      } else if (typeof value === "object" && value !== null &&
                 (hasOwnProperty(wrappers, prop) ||
                  hasOwnProperty(metadata, prop))) {
        // This is an object that we need to do some wrapping for the children
        // of. Create a sub-object wrapper for it with the appropriate child
        // metadata.
        value = wrapObject(value, wrappers[prop], metadata[prop]);
      } else if (hasOwnProperty(metadata, "*")) {
        // Wrap all properties in * namespace.
        value = wrapObject(value, wrappers[prop], metadata["*"]);
      } else {
        // We don't need to do any wrapping for this property,
        // so just forward all access to the underlying object.
        Object.defineProperty(cache, prop, {
          configurable: true,
          enumerable: true,
          get() {
            return target[prop];
          },
          set(value) {
            target[prop] = value;
          },
        });

        return value;
      }

      cache[prop] = value;
      return value;
    },

    set(proxyTarget, prop, value, receiver) {
      if (prop in cache) {
        cache[prop] = value;
      } else {
        target[prop] = value;
      }
      return true;
    },

    defineProperty(proxyTarget, prop, desc) {
      return Reflect.defineProperty(cache, prop, desc);
    },

    deleteProperty(proxyTarget, prop) {
      return Reflect.deleteProperty(cache, prop);
    },
  };

  // Per contract of the Proxy API, the "get" proxy handler must return the
  // original value of the target if that value is declared read-only and
  // non-configurable. For this reason, we create an object with the
  // prototype set to `target` instead of using `target` directly.
  // Otherwise we cannot return a custom object for APIs that
  // are declared read-only and non-configurable, such as `chrome.devtools`.
  //
  // The proxy handlers themselves will still use the original `target`
  // instead of the `proxyTarget`, so that the methods and properties are
  // dereferenced via the original targets.
  let proxyTarget = Object.create(target);
  return new Proxy(proxyTarget, handlers);
};

/**
 * Creates a set of wrapper functions for an event object, which handles
 * wrapping of listener functions that those messages are passed.
 *
 * A single wrapper is created for each listener function, and stored in a
 * map. Subsequent calls to `addListener`, `hasListener`, or `removeListener`
 * retrieve the original wrapper, so that  attempts to remove a
 * previously-added listener work as expected.
 *
 * @param {DefaultWeakMap<function, function>} wrapperMap
 *        A DefaultWeakMap object which will create the appropriate wrapper
 *        for a given listener function when one does not exist, and retrieve
 *        an existing one when it does.
 *
 * @returns {object}
 */
const wrapEvent = wrapperMap => ({
  addListener(target, listener, ...args) {
    target.addListener(wrapperMap.get(listener), ...args);
  },

  hasListener(target, listener) {
    return target.hasListener(wrapperMap.get(listener));
  },

  removeListener(target, listener) {
    target.removeListener(wrapperMap.get(listener));
  },
});

const onRequestFinishedWrappers = new DefaultWeakMap(listener => {
  if (typeof listener !== "function") {
    return listener;
  }

  /**
   * Wraps an onRequestFinished listener function so that it will return a
   * `getContent()` property which returns a `Promise` rather than using a
   * callback API.
   *
   * @param {object} req
   *        The HAR entry object representing the network request.
   */
  return function onRequestFinished(req) {
    const wrappedReq = wrapObject(req, {} /* wrappers */, {
      getContent: {
        minArgs: 0,
        maxArgs: 0,
      },
    });
    listener(wrappedReq);
  };
});

const onMessageWrappers = new DefaultWeakMap(listener => {
  if (typeof listener !== "function") {
    return listener;
  }

  /**
   * Wraps a message listener function so that it may send responses based on
   * its return value, rather than by returning a sentinel value and calling a
   * callback. If the listener function returns a Promise, the response is
   * sent when the promise either resolves or rejects.
   *
   * @param {*} message
   *        The message sent by the other end of the channel.
   * @param {object} sender
   *        Details about the sender of the message.
   * @param {function(*)} sendResponse
   *        A callback which, when called with an arbitrary argument, sends
   *        that value as a response.
   * @returns {boolean}
   *        True if the wrapped listener returned a Promise, which will later
   *        yield a response. False otherwise.
   */
  return function onMessage(message, sender, sendResponse) {
    let didCallSendResponse = false;

    let wrappedSendResponse;
    let sendResponsePromise = new Promise(resolve => {
      wrappedSendResponse = function(response) {
        didCallSendResponse = true;
        resolve(response);
      };
    });

    let result;
    try {
      result = listener(message, sender, wrappedSendResponse);
    } catch (err) {
      result = Promise.reject(err);
    }

    const isResultThenable = result !== true && isThenable(result);

    // If the listener didn't returned true or a Promise, or called
    // wrappedSendResponse synchronously, we can exit earlier
    // because there will be no response sent from this listener.
    if (result !== true && !isResultThenable && !didCallSendResponse) {
      return false;
    }

    // A small helper to send the message if the promise resolves
    // and an error if the promise rejects (a wrapped sendMessage has
    // to translate the message into a resolved promise or a rejected
    // promise).
    const sendPromisedResult = (promise) => {
      promise.then(msg => {
        // send the message value.
        sendResponse(msg);
      }, error => {
        // Send a JSON representation of the error if the rejected value
        // is an instance of error, or the object itself otherwise.
        let message;
        if (error && (error instanceof Error ||
            typeof error.message === "string")) {
          message = error.message;
        } else {
          message = "An unexpected error occurred";
        }

        sendResponse({
          __mozWebExtensionPolyfillReject__: true,
          message,
        });
      }).catch(err => {
        // Print an error on the console if unable to send the response.
        console.error("Failed to send onMessage rejected reply", err);
      });
    };

    // If the listener returned a Promise, send the resolved value as a
    // result, otherwise wait the promise related to the wrappedSendResponse
    // callback to resolve and send it as a response.
    if (isResultThenable) {
      sendPromisedResult(result);
    } else {
      sendPromisedResult(sendResponsePromise);
    }

    // Let Chrome know that the listener is replying.
    return true;
  };
});

const wrappedSendMessageCallback = ({reject, resolve}, reply) => {
  if (extensionAPIs.runtime.lastError) {
    // Detect when none of the listeners replied to the sendMessage call and resolve
    // the promise to undefined as in Firefox.
    // See https://github.com/mozilla/webextension-polyfill/issues/130
    if (extensionAPIs.runtime.lastError.message === CHROME_SEND_MESSAGE_CALLBACK_NO_RESPONSE_MESSAGE) {
      resolve();
    } else {
      reject(new Error(extensionAPIs.runtime.lastError.message));
    }
  } else if (reply && reply.__mozWebExtensionPolyfillReject__) {
    // Convert back the JSON representation of the error into
    // an Error instance.
    reject(new Error(reply.message));
  } else {
    resolve(reply);
  }
};

const wrappedSendMessage = (name, metadata, apiNamespaceObj, ...args) => {
  if (args.length < metadata.minArgs) {
    throw new Error(`Expected at least ${metadata.minArgs} ${pluralizeArguments(metadata.minArgs)} for ${name}(), got ${args.length}`);
  }

  if (args.length > metadata.maxArgs) {
    throw new Error(`Expected at most ${metadata.maxArgs} ${pluralizeArguments(metadata.maxArgs)} for ${name}(), got ${args.length}`);
  }

  return new Promise((resolve, reject) => {
    const wrappedCb = wrappedSendMessageCallback.bind(null, {resolve, reject});
    args.push(wrappedCb);
    apiNamespaceObj.sendMessage(...args);
  });
};

const settingMetadata = {
  clear: {minArgs: 1, maxArgs: 1},
  get: {minArgs: 1, maxArgs: 1},
  set: {minArgs: 1, maxArgs: 1},
};

// NOTE: apiMetadata is associated to the content of the api-metadata.json file
// at build time by replacing the following "include" with the content of the
// JSON file. 
const apiMetadata = {
  ...apiMetadataJson,
  privacy: {
    network: {"*": settingMetadata},
    services: {"*": settingMetadata},
    websites: {"*": settingMetadata},
  }
};

export const browser = wrapObject(extensionAPIs, {
  devtools: {
    network: {
      onRequestFinished: wrapEvent(onRequestFinishedWrappers),
    },
  },
  runtime: {
    onMessage: wrapEvent(onMessageWrappers),
    onMessageExternal: wrapEvent(onMessageWrappers),
    sendMessage: wrappedSendMessage.bind(null, "sendMessage", {minArgs: 1, maxArgs: 3}),
  },
  tabs: {
    sendMessage: wrappedSendMessage.bind(null, "sendMessage", {minArgs: 2, maxArgs: 3}),
  },
}, apiMetadata);
