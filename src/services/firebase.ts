import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytesResumable, getDownloadURL, listAll } from 'firebase/storage';
import { getFirestore, collection, doc, setDoc, getDocs, query, orderBy, onSnapshot } from 'firebase/firestore';

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
export const storage = getStorage(app);
export const db = getFirestore(app);

export interface TrackMetadata {
  id: string;
  title: string;
  artist: string;
  album: string;
  category: string;
  duration: number;
  format: 'OGG' | 'AAC' | 'MP3';
  oggPath?: string;
  aacPath?: string;
  mp3Path?: string;
  sizeMB: number;
  createdAt: string;
}

export async function uploadTrack(
  file: File,
  metadata: Omit<TrackMetadata, 'id' | 'createdAt'>,
  onProgress?: (percent: number) => void
): Promise<string> {
  const trackId = `track-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const storagePath = `tracks/${metadata.category}/${trackId}/${file.name}`;
  const storageRef = ref(storage, storagePath);

  const uploadTask = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on('state_changed',
      (snapshot) => {
        const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        onProgress?.(percent);
      },
      (error) => reject(error),
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

        const docData: TrackMetadata = {
          ...metadata,
          id: trackId,
          [`${metadata.format.toLowerCase()}Path`]: storagePath,
          createdAt: new Date().toISOString(),
        };

        await setDoc(doc(db, 'tracks', trackId), docData);
        resolve(trackId);
      }
    );
  });
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

export async function getTrackDownloadUrl(storagePath: string): Promise<string> {
  const storageRef = ref(storage, storagePath);
  return getDownloadURL(storageRef);
}
