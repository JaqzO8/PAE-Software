import type { SimulacroSubmission } from "./learningService";

export interface OfflineAttempt {
  id: string;
  submission: SimulacroSubmission;
  createdAt: string;
  attempts: number;
}

const STORAGE_KEY = "pae.offlineAttempts";
const DB_NAME = "pae-learning-offline";
const DB_VERSION = 1;
const STORE_NAME = "offlineAttempts";

const canUseIndexedDb = () => typeof indexedDB !== "undefined";

const openDb = () => new Promise<IDBDatabase>((resolve, reject) => {
  if (!canUseIndexedDb()) {
    reject(new Error("IndexedDB no disponible"));
    return;
  }

  const request = indexedDB.open(DB_NAME, DB_VERSION);

  request.onupgradeneeded = () => {
    const db = request.result;
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
      store.createIndex("simulacroId", "submission.simulacroId", { unique: true });
      store.createIndex("createdAt", "createdAt", { unique: false });
    }
  };

  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error || new Error("No se pudo abrir IndexedDB"));
});

const withStore = async <T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T> | void
) => {
  const db = await openDb();

  return new Promise<T>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, mode);
    const store = transaction.objectStore(STORE_NAME);
    const request = operation(store);
    let result: T;

    if (request) {
      request.onsuccess = () => {
        result = request.result;
      };
      request.onerror = () => reject(request.error || new Error("Operacion offline fallida"));
    }

    transaction.oncomplete = () => {
      db.close();
      resolve(result);
    };
    transaction.onerror = () => {
      db.close();
      reject(transaction.error || new Error("Transaccion offline fallida"));
    };
  });
};

const readQueue = (): OfflineAttempt[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    return [];
  }
};

const writeQueue = (queue: OfflineAttempt[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
};

const queueOfflineAttemptFallback = (submission: SimulacroSubmission) => {
  const queue = readQueue();
  const existing = queue.find((item) => item.submission.simulacroId === submission.simulacroId);
  if (existing) return existing;

  const attempt: OfflineAttempt = {
    id: `${submission.simulacroId}-${Date.now()}`,
    submission,
    createdAt: new Date().toISOString(),
    attempts: 0,
  };
  writeQueue([...queue, attempt]);
  return attempt;
};

export const queueOfflineAttempt = async (submission: SimulacroSubmission) => {
  const attempt: OfflineAttempt = {
    id: `${submission.simulacroId}-${Date.now()}`,
    submission,
    createdAt: new Date().toISOString(),
    attempts: 0,
  };

  try {
    const existing = await withStore<OfflineAttempt | undefined>("readonly", (store) => (
      store.index("simulacroId").get(submission.simulacroId) as IDBRequest<OfflineAttempt | undefined>
    ));
    if (existing) return existing;

    await withStore("readwrite", (store) => store.add(attempt));
    return attempt;
  } catch (error) {
    return queueOfflineAttemptFallback(submission);
  }
};

export const getOfflineAttempts = async () => {
  try {
    return await withStore<OfflineAttempt[]>("readonly", (store) => (
      store.index("createdAt").getAll() as IDBRequest<OfflineAttempt[]>
    ));
  } catch (error) {
    return readQueue();
  }
};

export const removeOfflineAttempt = async (id: string) => {
  try {
    await withStore("readwrite", (store) => store.delete(id));
  } catch (error) {
    writeQueue(readQueue().filter((item) => item.id !== id));
  }
};

export const markOfflineAttemptTried = async (id: string) => {
  try {
    const attempt = await withStore<OfflineAttempt | undefined>("readonly", (store) => (
      store.get(id) as IDBRequest<OfflineAttempt | undefined>
    ));
    if (!attempt) return;
    await withStore("readwrite", (store) => store.put({ ...attempt, attempts: attempt.attempts + 1 }));
  } catch (error) {
    writeQueue(readQueue().map((item) => (
      item.id === id ? { ...item, attempts: item.attempts + 1 } : item
    )));
  }
};
