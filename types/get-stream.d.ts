declare module 'get-stream' {
  import { Readable } from 'stream';
  function buffer(stream: Readable): Promise<Buffer>;
  export { buffer };
}
