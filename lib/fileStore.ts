/**
 * Kleine IndexedDB-wrapper voor binaire bestanden (foto's/video's).
 * localStorage is beperkt tot ~5 MB en alleen tekst, daarom bewaren we de
 * metadata in localStorage en de bestanden zelf hier.
 */
const DB_NAME = "pastpin";
const STORE = "files";
import { uid } from "./id";

const PREFIX = "idb:";

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => {
      dbPromise = null;
      reject(req.error);
    };
  });
  return dbPromise;
}

function tx<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(STORE, mode);
        const req = run(t.objectStore(STORE));
        t.oncomplete = () => resolve(req.result);
        t.onerror = () => reject(t.error);
        t.onabort = () => reject(t.error);
      }),
  );
}

export function isIdbSrc(src: string): boolean {
  return src.startsWith(PREFIX);
}

export async function putFile(blob: Blob): Promise<string> {
  const key = uid();
  await tx("readwrite", (s) => s.put(blob, key));
  return PREFIX + key;
}

export function getFile(src: string): Promise<Blob | undefined> {
  return tx("readonly", (s) => s.get(src.slice(PREFIX.length)) as IDBRequest<Blob | undefined>);
}

export async function deleteFile(src: string): Promise<void> {
  if (!isIdbSrc(src)) return;
  await tx("readwrite", (s) => s.delete(src.slice(PREFIX.length)));
}
