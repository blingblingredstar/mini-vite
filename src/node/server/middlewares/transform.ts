import createDebug from 'debug';
import { ServerContext } from '..';
import { cleanUrl, isJsRequest } from '../../utils';
import { NextHandleFunction } from 'connect';

const debug = createDebug('dev');

/**
 * Sequential call serverContext.pluginContainer's resolveId, load, transform
 */
export async function transformRequest(
  url: string,
  serverContext: ServerContext,
) {
  const { pluginContainer } = serverContext;
  url = cleanUrl(url);
  const resolvedResult = await pluginContainer.resolveId(url);
  let transformResult;
  if (resolvedResult?.id) {
    let code = await pluginContainer.load(resolvedResult.id);
    if (typeof code !== 'string' && code) {
      code = code.code;
    }
    if (code) {
      transformResult = await pluginContainer.transform(
        code,
        resolvedResult.id,
      );
    }
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
    if (isJsRequest(url)) {
      const result = await transformRequest(url, serverContext);
      if (!result) return next();
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/javascript');
      return res.end(result.code);
    }
  };
}
