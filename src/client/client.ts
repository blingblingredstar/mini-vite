console.log('[mini vite] connecting...');

const socket = new WebSocket(`ws://localhost:__HMR_PORT__`, 'mini-vite-hmr');

socket.addEventListener('message', async ({ data }) => {
  handleMessage(JSON.parse(data)).catch(console.error);
});

const handleMessage = async (payload: WebSocketData) => {
  switch (payload.type) {
    case 'connected':
      console.log('[mini vite] connected.');
      // heartbeat test
      setInterval(() => socket.send('ping'), 1000);
      break;
    case 'update':
      payload.updates.forEach((update) => {
        if (update.type === 'js-update') {
          fetchUpdate(update);
        }
      });
      break;
    default:
      console.error('unknown websocket message');
  }
};

interface HotModule {
  id: string;
  callbacks: HotCallback[];
}

interface HotCallback {
  deps: string[];
  fn: (modules: object[]) => void;
}

const hotModulesMap = new Map<string, HotModule>();
const pruneModuleMap = new Map<string, ((data: any) => void) | Promise<void>>();

export const createHotContext = (ownerPath: string) => {
  const mod = hotModulesMap.get(ownerPath);
  if (mod) {
    mod.callbacks = [];
  }

  const acceptDeps = (deps: string[], callback: any) => {
    const mod: HotModule = hotModulesMap.get(ownerPath) || {
      id: ownerPath,
      callbacks: [],
    };
    mod.callbacks.push({
      deps,
      fn: callback,
    });
    hotModulesMap.set(ownerPath, mod);
  };

  return {
    accept(deps: any, callback?: any) {
      if (typeof deps === 'function' || !deps) {
        acceptDeps([ownerPath], ([mod]: any) => deps && deps(mod));
      }
    },

    prune(cb: (data: any) => void) {
      pruneModuleMap.set(ownerPath, cb);
    },
  };
};

async function fetchUpdate({ path, timestamp }: HmrUpdateData) {
  const mod = hotModulesMap.get(path);
  if (!mod) return;

  const moduleMap = new Map();
  const modulesToUpdate = new Set<string>();
  modulesToUpdate.add(path);

  await Promise.all(
    [...modulesToUpdate].map(async (dep) => {
      const [path, query] = dep.split('?');
      try {
        const newMod = await import(
          path + `?t=${timestamp}${query ? `&${query}` : ''}`
        );
        moduleMap.set(dep, newMod);
      } catch (e) {
        console.error(e);
      }
    }),
  );

  return () => {
    for (const { deps, fn } of mod.callbacks) {
      fn(deps.map((dep) => moduleMap.get(dep)));
    }
    console.log(`[mini vite] hot updated: ${path}`);
  };
}

const styleSheetsMap = new Map<string, HTMLStyleElement>();

export function updateStyle(id: string, content: string) {
  let style = styleSheetsMap.get(id);
  if (!style) {
    style = document.createElement('style');
    style.setAttribute('type', 'text/css');
    style.innerHTML = content;
    document.head.appendChild(style);
  } else {
    style.innerHTML = content;
  }
  styleSheetsMap.set(id, style);
}

export function removeStyle(id: string) {
  const style = styleSheetsMap.get(id);
  if (style) {
    document.head.removeChild(style);
  }
  styleSheetsMap.delete(id);
}
