import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';

let firebaseAdmin: admin.app.App | null = null;

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
    '  - automation/credentials/firebase-sa.json (project root)\n' +
    '  - ~/.config/via-lactea/firebase-sa.json\n\n' +
    'Download from: https://console.firebase.google.com/project/via-lactea-music/settings/serviceaccounts/adminsdk'
  );
}

export function initFirebaseAdmin(): admin.app.App {
  if (firebaseAdmin) return firebaseAdmin;

  const serviceAccount = JSON.parse(
    fs.readFileSync(getServiceAccountPath(), 'utf-8')
  );

  firebaseAdmin = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'via-lactea-music.firebasestorage.app',
  });

  console.log('[Firebase Admin] Initialized for project:', serviceAccount.project_id);
  return firebaseAdmin;
}

export function getFirebaseAdmin(): admin.app.App {
  if (!firebaseAdmin) return initFirebaseAdmin();
  return firebaseAdmin;
}

export async function generateSignedUrl(
  storagePath: string,
  expiresInMs: number = 60 * 60 * 1000
): Promise<string> {
  const app = getFirebaseAdmin();
  const bucket = app.storage().bucket();
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
  const bucket = app.storage().bucket();
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
