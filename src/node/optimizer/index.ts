import { build } from 'esbuild';
import path from 'path';
import { scanPlugin } from './scanPlugin';
import { green } from 'picocolors';
import { PRE_BUNDLE_DIR } from '../constants';
import { preBundlePlugin } from './preBundlePlugin';

export async function optimize(root: string) {
  // 1. Find entry.
  // To simply the logic, hardcode the entry file path.
  const entry = path.resolve(root, 'src/main.tsx');
  // 2. Scan from entry
  const deps = new Set<string>();
  await build({
    entryPoints: [entry],
    bundle: true,
    write: false, // Just find the deps, no need to write to file.
    plugins: [scanPlugin(deps)],
  });
  console.log(
    `${green('需要预构建的依赖')}:\n${[...deps]
      .map(green)
      .map((item) => `  ${item}`)
      .join('\n')}`,
  );
  // 3. Build pre deps
  await build({
    entryPoints: [...deps],
    write: true,
    bundle: true,
    format: 'esm',
    splitting: true,
    outdir: path.resolve(root, PRE_BUNDLE_DIR),
    plugins:[preBundlePlugin(deps)]
  })
}
