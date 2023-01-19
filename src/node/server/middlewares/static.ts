import { NextHandleFunction } from 'connect';
import sirv from 'sirv';
import { isImportRequest } from '../../utils';

export function staticMiddleware(root: string): NextHandleFunction {
  // load static asset by sirv middleware
  const serveFromRoot = sirv(root, { dev: true });
  return async (req, res, next) => {
    if (!req.url) return;
    if (isImportRequest(req.url)) return;
    serveFromRoot(req, res, next);
  };
}
