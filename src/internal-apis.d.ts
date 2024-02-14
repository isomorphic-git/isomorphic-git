declare module 'isomorphic-git/internal-apis'


// ref: https://stackoverflow.com/a/77801519/387194
interface CompressionStream extends GenericTransformStream {  }
type CompressionFormat = "deflate" | "deflate-raw" | "gzip";
declare var CompressionStream: {
  prototype: CompressionStream;
  new(format: CompressionFormat): CompressionStream
}
