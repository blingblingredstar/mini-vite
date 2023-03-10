import { init, parse } from 'es-module-lexer';
import { Plugin } from '../plugin';
import { ServerContext } from '../server';
import {
  cleanUrl,
  getShortName,
  isInternalRequest,
  isJsRequest,
  normalizePath,
} from '../utils';
import MagicString from 'magic-string';
import {
  BARE_IMPORT_RE,
  CLIENT_PUBLIC_PATH,
  PRE_BUNDLE_DIR,
} from '../constants';
import path from 'path';

export function importAnalysisPlugin(): Plugin {
  let serverContext: ServerContext;
  return {
    name: 'm-vite:import-analysis',
    configureServer(e) {
      serverContext = e;
    },
    async transform(code, id) {
      // only transform js file
      if (!isJsRequest(id) || isInternalRequest(id)) return null;
      await init;
      const [imports] = parse(code);
      const magicString = new MagicString(code);
      const { moduleGraph } = serverContext;
      const curMod = moduleGraph.getModuleById(id);
      const importedModules = new Set<string>();
      const resolve = async (id: string, importer?: string) => {
        const resolved = await serverContext.pluginContainer.resolveId(
          id,
          importer && normalizePath(importer),
        );
        if (!resolved) return;
        const cleanedId = cleanUrl(resolved.id);
        const mod = moduleGraph.getModuleById(cleanedId);
        let resolvedId = `/${getShortName(resolved.id, serverContext.root)}`;
        if (mod && mod.lastHmrTimestamp > 0) {
          resolvedId += `?t=${mod.lastHmrTimestamp}`;
        }
        return resolvedId;
      };
      for (const importInfo of imports) {
        /**
         * @example const str = `import react from react`
         * str.slice(s, e) => 'react'
         */
        const { s: modStart, e: modEnd, n: modName } = importInfo;
        if (!modName) continue;
        if (modName.endsWith('.svg')) {
          const resolvedUrl = path.join(path.dirname(id), modName);
          magicString.overwrite(modStart, modEnd, `${resolvedUrl}?import`);
          continue;
        }
        // overwrite path to node_modules/.m-vite/
        if (BARE_IMPORT_RE.test(modName)) {
          const bundlePath = normalizePath(
            path.join('/', PRE_BUNDLE_DIR, `${modName}.js`),
          );
          magicString.overwrite(modStart, modEnd, bundlePath);
          importedModules.add(bundlePath);
        } else if (modName.startsWith('.') || modName.startsWith('/')) {
          const resolved = await resolve(modName, id);
          if (resolved) {
            magicString.overwrite(modStart, modEnd, resolved);
            importedModules.add(resolved);
          }
        }
      }

      if (!id.includes('node_modules')) {
        curMod &&
          magicString.prepend(
            `import { createHotContext as __vite__createHotContext } from "${CLIENT_PUBLIC_PATH}";` +
              `\nimport.meta.hot = __vite__createHotContext(${JSON.stringify(
                cleanUrl(curMod.url),
              )});\n`,
          );
      }

      curMod && moduleGraph.updateModuleInfo(curMod, importedModules);
      return {
        code: magicString.toString(),
        map: magicString.generateMap(),
      };
    },
  };
}
