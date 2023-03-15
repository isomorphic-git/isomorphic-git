---
title: 'http' plugin
sidebar_label: http
id: version-0.70.7-plugin_http
original_id: plugin_http
---

There is a default `http` plugin built into isomorphic-git, so you don't need to initialize an `http` plugin.
However, the builtin `http` plugin isn't perfect, so if you find it wanting you can substitute your own.

If you want to bring your own `http` plugin, here is how you can initialize one:

```js
// Using require() in Node.js
const git = require("isomorphic-git");
const { http } = require("./your-http-plugin");
git.plugins.set("http", http);

// using ES6 modules
import { plugins } from "isomorphic-git";
import { http } from "./your-http-plugin";
plugins.set("http", http);
```

> Note: only one `http` plugin can be registered at a time.

### Implementing your own `http` plugin

Note that unlike many other plugins, the `http` plugin is not an object with properties but a single function.
An `http` plugin must implement the following API:

#### GitHttpPlugin

```js
async function http ({
  core,
  emitter,
  emitterPrefix,
  url,
  method,
  headers,
  body
}) {
  ...
  // Do stuff
  ...
  return {
    url,
    method,
    headers,
    body,
    statusCode,
    statusMessage
  }
}
```

##### Parameters

| param         | type [= default]                    | description                                                                                                                   |
| ------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| core          | string                              | If your `http` plugin needs access to other plugins, it can do so via `git.cores.get(core)`                                   |
| emitter       | [Emitter](./plugin_emitter.md)      | If your `http` plugin emits events, it can do so via `emitter.emit()`                                                         |
| emitterPrefix | string                              | The `emitterPrefix` passed by the user when calling a function. If your plugin emits events, prefix the event name with this. |
| **url**       | string                              | The URL to request                                                                                                            |
| **method**    | string = 'GET'                      | The HTTP method to use                                                                                                        |
| **headers**   | object = {}                         | Headers to include in the HTTP request                                                                                        |
| **body**      | AsyncIterableIterator\<Uint8Array\> | An async iterator of Uint8Arrays that make up the body of POST requests                                                       |

##### Return values

| param       | type [= default]                    | description                                                            |
| ----------- | ----------------------------------- | ---------------------------------------------------------------------- |
| **url**     | string                              | The final URL that was fetched after any redirects                     |
| **method**  | string                              | The HTTP method that was used                                          |
| **headers** | object                              | HTTP response headers                                                  |
| **body**    | AsyncIterableIterator\<Uint8Array\> | An async iterator of Uint8Arrays that make up the body of the response |

Both requests and responses are "streaming" in the sense that they are async iterables.
You don't _have_ to support streaming (and in some cases, like uploads in the browser, it may not be possible) but it is nice to have.
If you are not streaming responses, you can simply fake it by returning an Array with a single Uint8Array inside it.
This works because the async iteration protocol (`for await ... of`) will fallback to the sync iteration protocol, which is supported by plain Arrays.
