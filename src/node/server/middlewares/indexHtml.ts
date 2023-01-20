import path from 'path';
import { ServerContext } from '..';
import { NextHandleFunction } from 'connect';
import { pathExists, readFile } from 'fs-extra';

export function indexHtmlMiddleware(
  serverContext: ServerContext,
): NextHandleFunction {
  return async (req, res, next) => {
    if (req.url === '/') {
      const { root } = serverContext;
      // Use the root dir index.html by default
      const indexHtmlPath = path.join(root, 'index.html');
      if (await pathExists(indexHtmlPath)) {
        const rawHtml = await readFile(indexHtmlPath, 'utf-8');
        let html = rawHtml;
        await serverContext.plugins.forEach(async (plugin) => {
          if (plugin.transformIndexHtml) {
            html = await plugin.transformIndexHtml(html);
          }
        });
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/html');
        return res.end(html);
      }
    }
    return next();
  };
}
