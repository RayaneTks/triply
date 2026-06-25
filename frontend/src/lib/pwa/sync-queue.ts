'use client';

/*
 * File de synchronisation des mutations effectuées hors-ligne.
 *
 * Stockage : IndexedDB (survit au rechargement et à la fermeture de l'app, contrairement
 * à la mémoire). Aucune dépendance externe.
 *
 * Intégration (côté appelant — hors périmètre de cet agent) :
 *   import { enqueueMutation } from '@/src/lib/pwa/sync-queue';
 *   // dans un handler d'edit, si le fetch échoue pour cause réseau :
 *   await enqueueMutation({ url, method, headers, body });
 *
 * Le rejeu est déclenché automatiquement par PwaProvider au retour online
 * (event `online` + message `TRIPLY_REPLAY_SYNC` envoyé par le Service Worker).
 */

const DB_NAME = 'triply-pwa';
const DB_VERSION = 1;
const STORE = 'sync-queue';

export interface QueuedMutation {
  id?: number;
  url: string;
  method: string;
  headers?: Record<string, string>;
  body?: string | null;
  createdAt: number;
}

function isAvailable(): boolean {
  return typeof indexedDB !== 'undefined';
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(
  db: IDBDatabase,
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, mode);
    const store = transaction.objectStore(STORE);
    const request = run(store);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function enqueueMutation(
  entry: Omit<QueuedMutation, 'id' | 'createdAt'> & { createdAt?: number },
): Promise<void> {
  if (!isAvailable()) return;
  const db = await openDb();
  try {
    await tx(db, 'readwrite', (store) =>
      store.add({ ...entry, createdAt: entry.createdAt ?? Date.now() }),
    );
    // Demande une background sync si supportée (rejeu garanti par l'OS).
    await requestBackgroundSync();
  } finally {
    db.close();
  }
}

export async function getQueued(): Promise<QueuedMutation[]> {
  if (!isAvailable()) return [];
  const db = await openDb();
  try {
    return await tx<QueuedMutation[]>(db, 'readonly', (store) => store.getAll());
  } finally {
    db.close();
  }
}

async function removeQueued(id: number): Promise<void> {
  const db = await openDb();
  try {
    await tx(db, 'readwrite', (store) => store.delete(id));
  } finally {
    db.close();
  }
}

export async function queueSize(): Promise<number> {
  if (!isAvailable()) return 0;
  const db = await openDb();
  try {
    return await tx<number>(db, 'readonly', (store) => store.count());
  } finally {
    db.close();
  }
}

let replaying = false;

/**
 * Rejoue toutes les mutations en attente dans l'ordre. Une mutation rejouée avec succès
 * (ou rejetée définitivement, ex. 4xx hors 429) est retirée de la file.
 * Retourne le nombre de mutations rejouées avec succès.
 */
export async function replayQueue(): Promise<number> {
  if (!isAvailable() || replaying) return 0;
  if (typeof navigator !== 'undefined' && !navigator.onLine) return 0;
  replaying = true;
  let replayed = 0;
  try {
    const items = await getQueued();
    for (const item of items.sort((a, b) => a.createdAt - b.createdAt)) {
      try {
        const res = await fetch(item.url, {
          method: item.method,
          headers: item.headers,
          body: item.body ?? undefined,
        });
        // Succès ou erreur client définitive (sauf 429) : on retire de la file.
        if (res.ok || (res.status >= 400 && res.status < 500 && res.status !== 429)) {
          if (item.id != null) await removeQueued(item.id);
          if (res.ok) replayed += 1;
        }
        // 5xx / 429 / réseau : on garde l'item pour un prochain essai.
      } catch {
        // Réseau retombé : on arrête, on retentera au prochain trigger.
        break;
      }
    }
  } finally {
    replaying = false;
  }
  return replayed;
}

async function requestBackgroundSync(): Promise<void> {
  try {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
    const reg = await navigator.serviceWorker.ready;
    // SyncManager n'est pas typé dans le DOM standard.
    const sync = (reg as unknown as { sync?: { register: (t: string) => Promise<void> } }).sync;
    if (sync) await sync.register('triply-sync');
  } catch {
    /* Background Sync non supporté (Safari/Firefox) : le rejeu `online` prend le relais. */
  }
}
