---
title: GitRemoteHTTP
sidebar_label: GitRemoteHTTP
id: version-1.x-gitRemoteHTTP
original_id: gitRemoteHTTP
---

The `GitRemoteHTTP` class provides methods for interacting with remote Git repositories over HTTP.

## Methods

### `GitRemoteHTTP.discover`

Discovers references from a remote Git repository.

#### Parameters

| param               | type                     | description                                      |
| ------------------- | ------------------------ | ------------------------------------------------ |
| **http**            | HttpClient               | The HTTP client to use for requests.             |
| **onProgress**      | ProgressCallback         | Callback for progress updates.                   |
| **onAuth**          | AuthCallback             | Callback for providing authentication.           |
| **onAuthFailure**   | AuthFailureCallback      | Callback for handling authentication failures.   |
| **onAuthSuccess**   | AuthSuccessCallback      | Callback for handling successful authentication. |
| **corsProxy**       | string                   | Optional CORS proxy URL.                         |
| **service**         | string                   | The Git service (e.g., "git-upload-pack").       |
| **url**             | string                   | The URL of the remote repository.                |
| **headers**         | Object\<string, string\> | HTTP headers to include in the request.          |
| **protocolVersion** | 1 &#124; 2               | The Git protocol version to use.                 |

#### Returns

`Promise<Object>`  
The parsed response from the remote repository.

---

### `GitRemoteHTTP.connect`

Connects to a remote Git repository and sends a request.

#### Parameters

| param          | type                     | description                                |
| -------------- | ------------------------ | ------------------------------------------ |
| **http**       | HttpClient               | The HTTP client to use for requests.       |
| **onProgress** | ProgressCallback         | Callback for progress updates.             |
| **corsProxy**  | string                   | Optional CORS proxy URL.                   |
| **service**    | string                   | The Git service (e.g., "git-upload-pack"). |
| **url**        | string                   | The URL of the remote repository.          |
| **auth**       | any                      | Authentication credentials.                |
| **body**       | any                      | The request body to send.                  |
| **headers**    | Object\<string, string\> | HTTP headers to include in the request.    |

#### Returns

`Promise<GitHttpResponse>`  
The HTTP response from the remote repository.

---

## Notes

- The `GitRemoteHTTP` class supports Git protocol versions 1 and 2.
- It handles authentication and retries for HTTP requests.
- The class uses the `corsProxify` utility to support CORS proxies.

<script>
(function rewriteEditLink() {
  const el = document.querySelector('a.edit-page-link.button');
  if (el) {
    el.href = 'https://github.com/isomorphic-git/isomorphic-git/edit/main/src/managers/GitRemoteHTTP.js';
  }
})();
</script>
