import os from 'os';
import path from 'path';
import { HASH_RE, JS_TYPES_RE, QUERY_RE } from './constants';
import nodePath from 'path';

export const slash = (p: string): string => p.replace(/\\/g, '/');

export const isWindows = os.platform() === 'win32';

export const normalizePath = (id: string): string =>
  path.posix.normalize(isWindows ? slash(id) : id);

export const isJsRequest = (url: string): boolean => {
  const path = cleanUrl(url);
  // path like 'a.js'
  if (JS_TYPES_RE.test(path)) {
    return true;
  }
  // path like './a'
  if (!nodePath.extname(path) && !path.endsWith('/')) {
    return true;
  }
  return false;
};

export const cleanUrl = (url: string): string =>
  url.replace(HASH_RE, '').replace(QUERY_RE, '');
