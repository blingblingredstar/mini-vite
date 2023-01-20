import { Server } from 'connect';
import { WebSocketServer } from 'ws';
import { HMR_PORT } from './constants';
import { red } from 'picocolors';

type WebSocketSendPayload = Record<string, any>;
export type WebSocketServerInstance = {
  send: (payload: WebSocketSendPayload) => void;
  close: VoidFunction;
};

export function createWebSocketServer(server: Server): WebSocketServerInstance {
  const wss = new WebSocketServer({ port: HMR_PORT });
  wss.on('connection', (socket) => {
    socket.send(JSON.stringify({ type: 'connected' }));
  });

  wss.on('error', (e: Error & { code: string }) => {
    if (e.code !== 'EADDRINUSE') {
      console.error(red(`WebSocket server error:\n${e.stack || e.message}`));
    }
  });

  return {
    send(payload) {
      const stringified = JSON.stringify(payload);
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(stringified);
        }
      });
    },
    close() {
      wss.close();
    },
  };
}
