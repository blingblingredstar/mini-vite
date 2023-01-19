import type { Plugin } from 'esbuild';
import { EXTERNAL_TYPES, BARE_IMPORT_RE } from '../constants';

/**
 * Esbuild plugin to scan modules, and add bare imports to deps
 */
export function scanPlugin(deps: Set<string>): Plugin {
  return {
    name: 'esbuild:scan-deps',
    setup(build) {
      // ignore external type files
      build.onResolve(
        { filter: new RegExp(`\\.(${EXTERNAL_TYPES.join('|')})$`) },
        ({ path }) => {
          return {
            path,
            external: true,
          };
        },
      );
      // record deps
      build.onResolve({ filter: BARE_IMPORT_RE }, ({ path }) => {
        deps.add(path);
        return {
          path,
          external: true,
        };
      });
    },
  };
}
