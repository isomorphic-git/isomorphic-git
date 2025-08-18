export type GitProgressEvent = {
    phase: string;
    loaded: number;
    total: number;
};
export type ProgressCallback = (progress: GitProgressEvent) => void | Promise<void>;
export type GitHttpRequest = {
    /**
     * - The URL to request
     */
    url: string;
    /**
     * - The HTTP method to use
     */
    method?: string | undefined;
    /**
     * - Headers to include in the HTTP request
     */
    headers?: {
        [x: string]: string;
    } | undefined;
    /**
     * - An HTTP or HTTPS agent that manages connections for the HTTP client (Node.js only)
     */
    agent?: any;
    /**
     * - An async iterator of Uint8Arrays that make up the body of POST requests
     */
    body?: AsyncIterableIterator<Uint8Array>;
    /**
     * - Reserved for future use (emitting `GitProgressEvent`s)
     */
    onProgress?: ProgressCallback | undefined;
    /**
     * - Reserved for future use (canceling a request)
     */
    signal?: object;
};
export type GitHttpResponse = {
    /**
     * - The final URL that was fetched after any redirects
     */
    url: string;
    /**
     * - The HTTP method that was used
     */
    method?: string | undefined;
    /**
     * - HTTP response headers
     */
    headers?: {
        [x: string]: string;
    } | undefined;
    /**
     * - An async iterator of Uint8Arrays that make up the body of the response
     */
    body?: AsyncIterableIterator<Uint8Array>;
    /**
     * - The HTTP status code
     */
    statusCode: number;
    /**
     * - The HTTP status message
     */
    statusMessage: string;
};
export type HttpFetch = (request: GitHttpRequest) => Promise<GitHttpResponse>;
export type HttpClient = {
    request: HttpFetch;
};
declare namespace index {
    export { request };
}
/**
 * HttpClient
 *
 * @param {GitHttpRequest} request
 * @returns {Promise<GitHttpResponse>}
 */
export function request({ onProgress, url, method, headers, body, }: GitHttpRequest): Promise<GitHttpResponse>;
export { index as default };
