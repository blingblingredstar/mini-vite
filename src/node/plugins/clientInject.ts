import { readFile, realpath } from 'fs-extra';
import { CLIENT_PUBLIC_PATH, HMR_PORT } from '../constants';
import { Plugin } from '../plugin';
import { ServerContext } from '../server';
import path from 'path';

export function clientInjectPlugin(): Plugin {
  let serverContext: ServerContext;
  return {
    name: 'm-vite:client-inject',
    configureServer(s) {
      serverContext = s;
    },
    resolveId(id) {
      return id === CLIENT_PUBLIC_PATH ? { id } : null;
    },
    async load(id) {
      if (id === CLIENT_PUBLIC_PATH) {
        const realPath = path.join(
          serverContext.root,
          'node_modules',
          'mini-vite',
          'dist',
          'client.mjs',
        );
        const code = await readFile(realPath, 'utf-8');

        return {
          code: code.replace('__HMR_PORT__', JSON.stringify(HMR_PORT)),
        };
      }
    },
    transformIndexHtml(raw) {
      // inject script below head element
      return raw.replace(
        /(<head[^>]*>)/i,
        `$1<script type="module" src="${CLIENT_PUBLIC_PATH}"></script>`,
      );
    },
  };
}
