import resolve from 'resolve';
import type { Plugin } from '../plugin';
import type { ServerContext } from '../server/index';
import path from 'path';
import { pathExists } from 'fs-extra';
import { normalizePath } from '../utils';
import { DEFAULT_EXTENSIONS } from '../constants';

export function resolvePlugin(): Plugin {
  let serverContext: ServerContext;
  return {
    name: 'm-vite:resolve',
    configureServer(s) {
      serverContext = s;
    },
    async resolveId(id, importer) {
      // handle absolute path
      if (path.isAbsolute(id)) {
        if (await pathExists(id)) return { id };
        // add root prefix, like '/src/index.ts'
        id = path.join(serverContext.root, id);
        if (await pathExists(id)) return { id };
      }
      // handle relative path
      else if (id.startsWith('.')) {
        if (!importer) {
          throw new Error('`importer` should not be undefined');
        }
        const hasExtension = path.extname(id).length > 1;
        let resolvedId: string;
        // include file extension
        // @example './app.tsx'
        if (hasExtension) {
          resolvedId = normalizePath(
            resolve.sync(id, { basedir: path.dirname(importer) }),
          );
          if (await pathExists(resolvedId)) {
            return {
              id: resolvedId,
            };
          }
        }
        // not include file ext
        // @example './App'
        else {
          // transform './App' to './App.tsx'
          for (const ext of DEFAULT_EXTENSIONS) {
            try {
              const withExtension = `${id}${ext}`;
              resolvedId = normalizePath(
                resolve.sync(withExtension, {
                  basedir: path.dirname(importer),
                }),
              );
              if (await pathExists(resolvedId)) {
                return { id: resolvedId };
              }
            } catch (e) {
              continue;
            }
          }
        }
      }
      return null;
    },
  };
}
