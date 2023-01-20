import { ServerContext } from './server';
import { blue, green } from 'picocolors';
import { getShortName } from './utils';

export function bindingHmrEvents(serverContext: ServerContext) {
  const { watcher, ws, root, moduleGraph } = serverContext;

  watcher.on('change', async (file) => {
    console.log(`✨${blue('[hmr]')} ${green(file)} changed`);
    await moduleGraph.invalidateModule(file);
    ws.send({
      type: 'update',
      updates: [
        {
          type: 'js-update',
          timestamp: Date.now(),
          path: '/' + getShortName(file, root),
          acceptedPath: '/' + getShortName(file, root),
        },
      ],
    });
  });
}
