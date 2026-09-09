import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import path from 'path';
import fs from 'fs';

let firebaseApp: App | null = null;

function getServiceAccountPath(): string {
  const possiblePaths = [
    path.resolve(process.cwd(), 'automation/credentials/firebase-sa.json'),
    path.resolve(process.env.HOME || '', '.config/via-lactea/firebase-sa.json'),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) return p;
  }

  throw new Error(
    'Service account key not found. Place firebase-sa.json in:\n' +
    '  - automation/credentials/firebase-sa.json\n' +
    '  - ~/.config/via-lactea/firebase-sa.json'
  );
}

export function initFirebaseAdmin(): App {
  if (firebaseApp) return firebaseApp;

  const existing = getApps();
  if (existing.length > 0) {
    firebaseApp = existing[0];
    return firebaseApp;
  }

  const serviceAccount = JSON.parse(
    fs.readFileSync(getServiceAccountPath(), 'utf-8')
  );

  firebaseApp = initializeApp({
    credential: cert(serviceAccount),
    storageBucket: 'via-lactea-music.firebasestorage.app',
  });

  console.log('[Firebase Admin] Initialized for project:', serviceAccount.project_id);
  return firebaseApp;
}

export function getFirebaseAdmin(): App {
  if (!firebaseApp) return initFirebaseAdmin();
  return firebaseApp;
}

export async function generateSignedUrl(
  storagePath: string,
  expiresInMs: number = 60 * 60 * 1000
): Promise<string> {
  const app = getFirebaseAdmin();
  const bucket = getStorage(app).bucket();
  const file = bucket.file(storagePath);

  const [signedUrl] = await file.getSignedUrl({
    action: 'read',
    expires: Date.now() + expiresInMs,
  });

  return signedUrl;
}

export async function uploadToStorage(
  fileBuffer: Buffer,
  storagePath: string,
  contentType: string
): Promise<string> {
  const app = getFirebaseAdmin();
  const bucket = getStorage(app).bucket();
  const file = bucket.file(storagePath);

  await file.save(fileBuffer, {
    contentType,
    metadata: {
      cacheControl: 'public, max-age=31536000',
    },
  });

  const [url] = await file.getSignedUrl({
    action: 'read',
    expires: Date.now() + 365 * 24 * 60 * 60 * 1000,
  });

  return url;
}
