declare module 'y-websocket/bin/utils.cjs' {
  import { WebSocket } from 'ws';
  import * as Y from 'yjs';

  export function setupWSConnection(
    ws: WebSocket,
    req?: any,
    docName?: string,
    gc?: boolean
  ): void;
}