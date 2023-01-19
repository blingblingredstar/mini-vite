import { readFile } from 'fs-extra';
import { Plugin } from '../plugin';
import { isJsRequest } from '../utils';
import { transform } from 'esbuild';
import path from 'path';

export function esbuildTransformPlugin(): Plugin {
  return {
    name: 'm-vite:esbuild-transform',
    async load(id) {
      if (isJsRequest(id)) {
        try {
          return await readFile(id, 'utf-8');
        } catch (e) {
          return null;
        }
      }
    },
    async transform(code, id) {
      if (isJsRequest(id)) {
        const extname = path.extname(id).slice(1) as
          | 'js'
          | 'ts'
          | 'jsx'
          | 'tsx';
        const { code: transformedCode, map } = await transform(code, {
          target: 'esnext',
          format: 'esm',
          sourcemap: true,
          loader: extname,
        });
        return {
          code: transformedCode,
          map,
        };
      }
      return null;
    },
  };
}
