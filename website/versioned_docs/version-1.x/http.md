---
title: http
sidebar_label: http
id: version-1.x-http
original_id: http
---

You need to pass an HTTP client into `isomorphic-git` functions that make HTTP requests.
Both a node client (`isomorphic-git/http/node`) and a browser client (`isomorphic-git/http/web`) are included in the npm package, but you have to pick which one to use.
Or you can provide your own!

(In the past, we tried to be clever and automatically select the client for you. But that can be really hard to determine in edge cases like Electron.)

## Node Client

The Node client uses the [`simple-get`](https://npm.im/simple-get) package under the hood.

```js
const git = require("isomorphic-git");
const http = require("isomorphic-git/http/node");
git.getRemoteInfo({ http, url: 'https://github.com/isomorphic-git/isomorphic-git' })
  .then(console.log)
```

If you need features that aren't supported currently, like detecting and handling `HTTP_PROXY` environment variables, you can
wrap this client or implement your own HTTP client. (See section below.)

## Browser Client:

The Browser client uses the [`Fetch API`](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) under the hood.

```js
import git from "isomorphic-git";
import http from "isomorphic-git/http/web";
git.getRemoteInfo({ http, url: 'https://github.com/isomorphic-git/isomorphic-git' })
  .then(console.log)
```

If you are using ES modules directly, you can import it like this:
```js
import http from 'https://unpkg.com/isomorphic-git/http/web/index.js'
```

If you need to use a script tag (such as in a [WebWorker](./guide-webworker)), then use the UMD build. But note that the global var is called `GitHttp` not `http` because I was worried that would be too generic:
```html
<script src="https://unpkg.com/isomorphic-git/http/web/index.umd.js">
<script>
git.getRemoteInfo({ http: GitHttp, url: 'https://github.com/isomorphic-git/isomorphic-git' })
  .then(console.log)
```

### Implementing your own `http` client

An `http` client is an object with a single `request` method that implements the following API:

#### GitHttpPlugin

```js
const http = {
  async request ({
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
}
```

##### Parameters

| param       | type [= default]                    | description                                                             |
| ----------- | ----------------------------------- | ----------------------------------------------------------------------- |
| **url**     | string                              | The URL to request                                                      |
| **method**  | string = 'GET'                      | The HTTP method to use                                                  |
| **headers** | object = {}                         | Headers to include in the HTTP request                                  |
| **body**    | AsyncIterableIterator\<Uint8Array\> | An async iterator of Uint8Arrays that make up the body of POST requests |
| onProgress  | function (optional)                 | Reserved for future use (emitting `GitProgressEvent`s)                  |
| signal      | AbortSignal (optional)              | Reserved for future use (canceling a request)                           |

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

To get started, you might want to look at [`src/http/node/index.js`](https://github.com/isomorphic-git/isomorphic-git/blob/master/src/http/node/index.js)
and [`src/http/web/index.js`](https://github.com/isomorphic-git/isomorphic-git/blob/master/src/http/web/index.js).
