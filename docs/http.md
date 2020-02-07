---
title: http
sidebar_label: http
---

You need to pass an HTTP client into `isomorphic-git` for functions that make HTTP requests.
The `isomorphic-git` package already includes both a node client and a browser client, but you have to tell it which one to use.
Or you can provide your own!

Node usage:

```js
const git = require("isomorphic-git");
const http = require("isomorphic-git/node/http");
git.clone({ ..., http })
```

Browser usage:

```js
const git = require("isomorphic-git");
const http = require("isomorphic-git/browser/http");
git.clone({ ..., http })
```

### Implementing your own `http` plugin

An `http` client is just one function that implements the following API:

#### GitHttpPlugin

```js
async function http ({
  url,
  method,
  headers,
  body,
  onProgress
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

| param         | type [= default]                    | description                                                             |
| ------------- | ----------------------------------- | ------------------------------------------------------------------------|
| **url**       | string                              | The URL to request                                                      |
| **method**    | string = 'GET'                      | The HTTP method to use                                                  |
| **headers**   | object = {}                         | Headers to include in the HTTP request                                  |
| **body**      | AsyncIterableIterator\<Uint8Array\> | An async iterator of Uint8Arrays that make up the body of POST requests |
| onProgress    | function (optional)                 | Reserved for future use (emitting `GitProgressEvent`s)                  |
| signal        | AbortSignal (optional)              | Reserved for future use (canceling a request)                           |

##### Return values

| param             | type [= default]                    | description                                                            |
| ----------------- | ----------------------------------- | ---------------------------------------------------------------------- |
| **url**           | string                              | The final URL that was fetched after any redirects                     |
| **method**        | string                              | The HTTP method that was used                                          |
| **headers**       | object                              | HTTP response headers                                                  |
| **body**          | AsyncIterableIterator\<Uint8Array\> | An async iterator of Uint8Arrays that make up the body of the response |
| **statusCode**    | number                              | The HTTP status code                                                   |
| **statusMessage** | string                              | The HTTP status message                                                |

Both requests and responses are "streaming" in the sense that they are async iterables.
You don't _have_ to support streaming (and in some cases, like uploads in the browser, it may not be possible yet) but it is nice to have.
If you are not streaming responses, you can simply fake it by returning an array with a single `Uint8Array` inside it.
This works because the async iteration protocol (`for await ... of`) will fallback to the sync iteration protocol, which is supported by plain Arrays.
