import type { Loader, Plugin } from 'esbuild';
import { init, parse } from 'es-module-lexer';
import createDebug from 'debug';
import { BARE_IMPORT_RE } from '../constants';
import resolve from 'resolve';
import { normalizePath } from '../utils';
import fs from 'fs';
import nodePath from 'path';

const debug = createDebug('dev');

export function preBundlePlugin(deps: Set<string>): Plugin {
  return {
    name: 'esbuild:pre-bundle',
    setup(build) {
      build.onResolve({ filter: BARE_IMPORT_RE }, ({ path, importer }) => {
        const isEntry = !importer;
        if (deps.has(path)) {
          return isEntry
            ? { path, namespace: 'dep' }
            : {
                path: resolve.sync(path, { basedir: process.cwd() }),
              };
        }
      });

      build.onLoad(
        {
          filter: /.*/,
          namespace: 'dep',
        },
        async (loadInfo) => {
          await init;
          const { path } = loadInfo;
          const root = process.cwd();
          const entryPath = normalizePath(
            resolve.sync(path, { basedir: root }),
          );
          const code = await fs.readFileSync(entryPath, 'utf-8');
          const [imports, exports] = await parse(code);
          const proxyModule: string[] = [];
          // handle cjs
          if (!imports.length && !exports.length) {
            // build proxy module
            const res = require(entryPath);
            const specifiers = Object.keys(res);
            proxyModule.push(
              `export { ${specifiers.join(',')} } from "${entryPath}"`,
              `export default require("${entryPath}")`,
            );
          } else {
            if (exports.map((specifiers) => specifiers.n).includes('default')) {
              proxyModule.push(`import d from "${entryPath}";export default d`);
            }
            proxyModule.push(`export * from "${entryPath}"`);
          }
          debug('代理模块内容: %o', proxyModule.join('\n'));
          const loader = nodePath.extname(entryPath).slice(1) as Loader;
          return {
            loader: loader,
            contents: proxyModule.join('\n'),
            resolveDir: root,
          };
        },
      );
    },
  };
}
