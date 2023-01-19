import type { LoadResult, PartialResolvedId, SourceDescription } from 'rollup';
import { ServerContext } from './server';

export type ServerHook = (
  server: ServerContext,
) => MaybePromise<VoidFunction | void>;

export interface Plugin {
  name: string;
  configureServer?: ServerHook;
  resolveId?: (
    id: string,
    importer?: string,
  ) => MaybePromise<MaybeNull<PartialResolvedId>>;
  load?: (id: string) => MaybePromise<MaybeNull<LoadResult>>;
  transform?: (
    code: string,
    id: string,
  ) => MaybePromise<MaybeNull<SourceDescription>>;
  transformIndexHtml?: (raw: string) => MaybePromise<string>;
}

export function resolvePlugins(): Plugin[] {
  return [];
}
