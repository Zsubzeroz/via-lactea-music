import { Track } from '../types';
import { getApiBase } from '../config';

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

export async function isTrackOffline(trackId: string): Promise<boolean> {
  if (!('indexedDB' in window)) return false;
  const db = await openDatabase();
  return new Promise<boolean>((resolve) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(trackId);
    request.onsuccess = () => {
      const row = request.result;
      resolve(!!row && !!row.audioData);
    };
    request.onerror = () => resolve(false);
  });
}

export async function fetchAndSaveOfflineTrack(track: Track): Promise<string | null> {
  if (!track.audioKey || !track.audioUrl) return null;

  const url = `${getApiBase()}/api/audio/${track.audioKey}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const blob = await response.blob();
  await saveOfflineTrack(track, blob);
  return URL.createObjectURL(blob);
}

export async function softDeleteOfflineTrack(trackId: string): Promise<void> {
  if (!('indexedDB' in window)) return;
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const getReq = store.get(trackId);
    getReq.onsuccess = () => {
      const row = getReq.result;
      if (row) {
        row.deletedAt = new Date().toISOString();
        const putReq = store.put(row);
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error || new Error('Failed to soft delete'));
      } else {
        resolve();
      }
    };
    getReq.onerror = () => reject(getReq.error || new Error('Failed to read track for soft delete'));
  });
}

export async function removeOfflineTrack(trackId: string): Promise<void> {
  if (!('indexedDB' in window)) return;
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(trackId);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error || new Error('Failed to remove track'));
  });
}
