import os from 'os';
import path from 'path';
import {
  CLIENT_PUBLIC_PATH,
  HASH_RE,
  JS_TYPES_RE,
  QUERY_RE,
} from './constants';
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

export const isCSSRequest = (id: string): boolean =>
  cleanUrl(id).endsWith('.css');

export const cleanUrl = (url: string): string =>
  url.replace(HASH_RE, '').replace(QUERY_RE, '');

export const isImportRequest = (url: string) => url.endsWith('?import');

const INTERNAL_LIST = [CLIENT_PUBLIC_PATH, '/@react-refresh'];
export const isInternalRequest = (url: string) => INTERNAL_LIST.includes(url);

export const removeImportQuery = (url: string) => url.replace(/\?import$/, '');

export const getShortName = (file: string, root: string) =>
  file.startsWith(root + '/') ? path.posix.relative(root, file) : file;
