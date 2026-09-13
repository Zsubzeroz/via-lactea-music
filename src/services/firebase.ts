import { initializeApp } from 'firebase/app';
import {
  getFirestore, collection, doc, addDoc, updateDoc, deleteDoc,
  getDocs, query, orderBy, onSnapshot, where,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: (import.meta as any).env?.VITE_FIREBASE_API_KEY,
  authDomain: (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID,
  storageBucket: (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: (import.meta as any).env?.VITE_FIREBASE_APP_ID,
  measurementId: (import.meta as any).env?.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// ── URL helpers ──────────────────────────────────────────────────────────────

export function getAudioUrl(audioKey: string): string {
  return `/audio/${audioKey}`;
}

export function getCoverUrl(_category: string, trackId: string): string {
  return `/covers/${trackId}.jpg`;
}

// ── Track metadata ───────────────────────────────────────────────────────────

export interface TrackMetadata {
  id: string;
  title: string;
  artist: string;
  album: string;
  category: string;
  duration: number;
  format: 'OGG' | 'AAC' | 'MP3';
  sizeMB: number;
  audioKey?: string;
  audioUrl?: string;
  coverKey?: string;
  coverUrl?: string;
  createdAt: string;
  deletedAt?: string | null;
}

export function subscribeToTracks(callback: (tracks: TrackMetadata[]) => void) {
  const q = query(collection(db, 'tracks'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const tracks = snapshot.docs.map(d => d.data() as TrackMetadata);
    callback(tracks);
  });
}

export async function setTrackDeletedStatus(trackId: string, deletedAt: string | null) {
  const ref = doc(db, 'tracks', trackId);
  await updateDoc(ref, { deletedAt });
}

export async function permanentDeleteTrack(trackId: string) {
  const ref = doc(db, 'tracks', trackId);
  await deleteDoc(ref);
}

// ── Playlists ────────────────────────────────────────────────────────────────

export interface PlaylistDoc {
  id: string;
  name: string;
  folderName: string;
  trackCount: number;
  createdAt: string;
}

function sanitizeFolderName(name: string): string {
  return name.replace(/[^a-zA-Z0-9À-ú_-]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
}

export function subscribeToPlaylists(callback: (playlists: PlaylistDoc[]) => void) {
  const q = query(collection(db, 'playlists'), orderBy('name', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const playlists = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as PlaylistDoc));
    callback(playlists);
  });
}

export async function createPlaylist(name: string): Promise<PlaylistDoc> {
  const folderName = sanitizeFolderName(name.trim());
  const docRef = await addDoc(collection(db, 'playlists'), {
    name: name.trim(),
    folderName,
    trackCount: 0,
    createdAt: new Date().toISOString(),
  });
  return { id: docRef.id, name: name.trim(), folderName, trackCount: 0, createdAt: new Date().toISOString() };
}

export async function renamePlaylist(id: string, name: string): Promise<void> {
  const ref = doc(db, 'playlists', id);
  await updateDoc(ref, {
    name: name.trim(),
    folderName: sanitizeFolderName(name.trim()),
  });
}

export async function deletePlaylist(id: string): Promise<void> {
  const ref = doc(db, 'playlists', id);
  await deleteDoc(ref);
}
