import type {
  LoadResult,
  PartialResolvedId,
  SourceDescription,
  PluginContext as RollupPluginContext,
  ResolvedId,
} from 'rollup';
import type { Plugin } from './plugin';

export interface PluginContainer {
  resolveId(
    id: string,
    importer?: string,
  ): Promise<MaybeNull<PartialResolvedId>>;
  load(id: string): Promise<MaybeNull<LoadResult>>;
  transform(code: string, id: string): Promise<MaybeNull<SourceDescription>>;
}

/**
 * Simulate Rollup's plug-in mechanism
 */
export const createPluginContainer = (plugins: Plugin[]): PluginContainer => {
  // Plugin context object
  const pluginContainer: PluginContainer = {
    async resolveId(id, importer) {
      const ctx = new Context();
      for (const plugin of plugins) {
        if (plugin.resolveId) {
          const newId = await plugin.resolveId.call(ctx, id, importer);
          if (newId) {
            id = typeof newId === 'string' ? newId : newId.id;
            return { id };
          }
        }
      }
      return null;
    },
    async load(id) {
      const ctx = new Context();
      for (const plugin of plugins) {
        if (plugin.load) {
          const result = await plugin.load.call(ctx, id);
          if (result) {
            return result;
          }
        }
      }
      return null;
    },
    async transform(code, id) {
      const ctx = new Context();
      for (const plugin of plugins) {
        if (plugin.transform) {
          const result = await plugin.transform.call(ctx, code, id);
          if (!result) continue;
          if (typeof result === 'string') {
            code = result;
          } else if (result.code) {
            code = result.code;
          }
        }
      }

      return { code };
    },
  };

  //@ts-ignore only implements resolve method
  class Context implements RollupPluginContext {
    async resolve(id: string, importer?: string) {
      let out = await pluginContainer.resolveId(id, importer);
      if (typeof out === 'string') out = { id: out };
      return out as ResolvedId | null;
    }
  }

  return pluginContainer;
};
