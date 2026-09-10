import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDocs, query, orderBy, onSnapshot } from 'firebase/firestore';
import { getApiBase } from '../config';

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
  coverKey?: string;
  coverUrl?: string;
  createdAt: string;
}

export async function listTracks(): Promise<TrackMetadata[]> {
  const q = query(collection(db, 'tracks'), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => d.data() as TrackMetadata);
}

export function subscribeToTracks(callback: (tracks: TrackMetadata[]) => void) {
  const q = query(collection(db, 'tracks'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const tracks = snapshot.docs.map(d => d.data() as TrackMetadata);
    callback(tracks);
  });
}

export async function getTrackDownloadUrl(audioKey: string): Promise<string> {
  return `${getApiBase()}/api/audio/${audioKey}`;
}
