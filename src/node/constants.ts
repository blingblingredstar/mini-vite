import path from 'path';

export const EXTERNAL_TYPES = [
  'css',
  'less',
  'sass',
  'scss',
  'styl',
  'stylus',
  'pcss',
  'postcss',
  'vue',
  'svelte',
  'marko',
  'astro',
  'png',
  'jpe?g',
  'gif',
  'svg',
  'ico',
  'webp',
  'avif',
] as const;

export const BARE_IMPORT_RE = /^[\w@][^:]/;

/** Default rebuild bundle file path: node_modules/.m-vite */
export const PRE_BUNDLE_DIR = path.join('node_modules', '.m-vite');
