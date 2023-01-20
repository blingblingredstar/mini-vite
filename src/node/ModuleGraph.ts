import type { TransformResult, PartialResolvedId } from 'rollup';
import { cleanUrl } from './utils';

export class ModuleNode {
  /** asset url */
  url: string;
  /** asset absolute path */
  id: MaybeNull<string> = null;
  importers = new Set<ModuleNode>();
  importedModules = new Set<ModuleNode>();
  transformResults: MaybeNull<TransformResult> = null;
  lastHmrTimestamp = 0;
  constructor(url: string) {
    this.url = url;
  }
}

export class ModuleGraph {
  /** asset url to ModuleNode map */
  urlToModuleMap = new Map<string, ModuleNode>();
  /** asset absolute path to ModuleNode map */
  idToModuleMap = new Map<string, ModuleNode>();

  constructor(
    private resolveId: (url: string) => Promise<MaybeNull<PartialResolvedId>>,
  ) {}

  async #resolve(url: string): Promise<{ url: string; resolvedId: string }> {
    const resolved = await this.resolveId(url);
    const resolvedId = resolved?.id || url;
    return {
      url,
      resolvedId,
    };
  }

  getModuleById(id: string): ModuleNode | undefined {
    return this.idToModuleMap.get(id);
  }

  async getModuleByUrl(rawUrl: string): Promise<ModuleNode | undefined> {
    const { url } = await this.#resolve(rawUrl);
    return this.urlToModuleMap.get(url);
  }

  async ensureEntryFromUrl(rawUrl: string): Promise<ModuleNode> {
    const { url, resolvedId } = await this.#resolve(rawUrl);
    // Check cache first
    if (this.urlToModuleMap.has(url)) {
      return this.urlToModuleMap.get(url)!;
    }
    // If cache not exist, update urlToModuleMap and idToModuleMap
    const mod = new ModuleNode(url);
    mod.id = resolvedId;
    this.urlToModuleMap.set(url, mod);
    this.idToModuleMap.set(resolvedId, mod);
    return mod;
  }

  async updateModuleInfo(
    mod: ModuleNode,
    importedModules: Set<string | ModuleNode>,
  ) {
    const prevImports = mod.importedModules;
    for (const currentImports of importedModules) {
      const dep =
        typeof currentImports === 'string'
          ? await this.ensureEntryFromUrl(cleanUrl(currentImports))
          : currentImports;
      if (dep) {
        mod.importedModules.add(dep);
        dep.importers.add(mod);
      }
    }
    // Clear deps that no longer referenced
    for (const prevImport of prevImports) {
      if (!importedModules.has(prevImport.url)) {
        prevImport.importers.delete(mod);
      }
    }
  }

  invalidateModule(file: string) {
    const mod = this.idToModuleMap.get(file);
    if (!mod) return;
    mod.lastHmrTimestamp = Date.now();
    mod.transformResults = null;
    mod.importers.forEach(({ id }) => {
      id && this.invalidateModule(id);
    });
  }
}
