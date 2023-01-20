console.log('[mini vite] connecting...');

const socket = new WebSocket(`ws://localhost:__HMR_PORT__`, 'mini-vite-hmr');

socket.addEventListener('message', async ({ data }) => {
  handleMessage(JSON.parse(data)).catch(console.error);
});

const handleMessage = async (payload: WebSocketData) => {
  switch (payload.type) {
    case 'connected':
      console.log('[mini vite] connected.');
      // heartbeat test
      setInterval(() => socket.send('ping'), 1000);
      break;
    case 'update':
      payload.updates.forEach((update) => {
        if (update.type === 'js-update') {
          // TODO
        }
      });
      break;
    default:
      console.error('unknown websocket message');
  }
};
