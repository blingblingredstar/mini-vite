type VoidFunction = () => void;
type MaybePromise<T> = T | Promise<T>;
type MaybeNull<T> = T | null;

type WebSocketData =
  | { type: 'connected' }
  | {
      type: 'update';
      updates: HmrUpdateData[];
    };

type HmrUpdateData = {
  type: 'js-update';
  timestamp: number;
  path: string;
  acceptedPath: string;
};
