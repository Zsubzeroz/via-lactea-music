import { Track } from '../types';

const DB_NAME = 'via-lactea-music';
const STORE_NAME = 'tracks';
const DB_VERSION = 1;

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('IndexedDB not available in this browser.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error || new Error('Failed to open IndexedDB'));
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

async function readTrackAudio(audio: ArrayBuffer | null, type: string | undefined): Promise<string | undefined> {
  if (!audio || !type) return undefined;
  const blob = new Blob([audio], { type });
  return URL.createObjectURL(blob);
}

export async function saveOfflineTrack(track: Track, audioBlob?: Blob): Promise<void> {
  if (!('indexedDB' in window)) return;

  const payload = {
    ...track,
    audioUrl: undefined,
    audioData: audioBlob ? await audioBlob.arrayBuffer() : null,
    audioType: audioBlob?.type || null,
  };

  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(payload);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error || new Error('Failed to save track locally'));
  });
}

export async function getOfflineTracks(): Promise<Track[]> {
  if (!('indexedDB' in window)) return [];

  const db = await openDatabase();
  const rows = await new Promise<any[]>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error || new Error('Failed to list offline tracks'));
  });

  const tracks = await Promise.all(
    rows.map(async (row) => {
      const nextTrack: Track = {
        ...row,
        audioUrl: undefined,
      };

      const audioUrl = await readTrackAudio(row.audioData || null, row.audioType || undefined);
      if (audioUrl) {
        nextTrack.audioUrl = audioUrl;
      }

      return nextTrack;
    })
  );

  return tracks.filter((track) => !!track.id).sort((a, b) => b.duration - a.duration);
}
