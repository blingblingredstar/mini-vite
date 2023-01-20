import createDebug from 'debug';
import { ServerContext } from '..';
import {
  cleanUrl,
  isCSSRequest,
  isImportRequest,
  isJsRequest,
} from '../../utils';
import { NextHandleFunction } from 'connect';

const debug = createDebug('dev');

/**
 * Sequential call serverContext.pluginContainer's resolveId, load, transform
 */
export async function transformRequest(
  url: string,
  serverContext: ServerContext,
) {
  const { pluginContainer, moduleGraph } = serverContext;
  url = cleanUrl(url);
  let mod = await moduleGraph.getModuleByUrl(url);
  if (mod?.transformResults) {
    return mod.transformResults;
  }
  const resolvedResult = await pluginContainer.resolveId(url);
  let transformResult;
  if (resolvedResult?.id) {
    let code = await pluginContainer.load(resolvedResult.id);
    if (typeof code !== 'string' && code) {
      code = code.code;
    }
    mod = await moduleGraph.ensureEntryFromUrl(url);
    if (code) {
      transformResult = await pluginContainer.transform(
        code,
        resolvedResult.id,
      );
    }
  }
  if (mod) {
    mod.transformResults = transformResult;
  }
  return transformResult;
}

export function transformMiddleware(
  serverContext: ServerContext,
): NextHandleFunction {
  return async (req, res, next) => {
    if (req.method !== 'GET' || !req.url) return next();
    const { url } = req;
    debug('transformMiddleware: %s', url);
    if (
      [isJsRequest, isCSSRequest, isImportRequest].some((test) => test(url))
    ) {
      const result = await transformRequest(url, serverContext);
      if (!result) return next();
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/javascript');
      return res.end(typeof result === 'string' ? result : result.code);
    }
    next();
  };
}
