#!/usr/bin/env tsx
/**
 * Migrate local audio + covers to Firebase Storage
 *
 * Usage:
 *   npx tsx scripts/upload-to-firebase-storage.ts
 */

import fs from 'fs';
import path from 'path';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { getFirestore } from 'firebase-admin/firestore';

const PROJECT_ROOT = path.resolve(process.cwd());
const AUDIO_DIR = path.join(PROJECT_ROOT, 'audio');
const COVERS_DIR = path.join(PROJECT_ROOT, 'covers');
const BUCKET_NAME = 'via-lactea-music.firebasestorage.app';
const BATCH_SIZE = 4;

function getServiceAccountPath(): string {
  const possiblePaths = [
    path.resolve(PROJECT_ROOT, 'automation/credentials/firebase-sa.json'),
    path.resolve(process.env.HOME || '', '.config/via-lactea/firebase-sa.json'),
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error('Service account key not found.');
}

function initAdmin() {
  if (getApps().length > 0) return getApps()[0];
  const sa = JSON.parse(fs.readFileSync(getServiceAccountPath(), 'utf-8'));
  return initializeApp({
    credential: cert(sa),
    storageBucket: BUCKET_NAME,
  });
}

function getPublicUrl(storagePath: string): string {
  const encoded = encodeURIComponent(storagePath);
  return `https://firebasestorage.googleapis.com/v0/b/${BUCKET_NAME}/o/${encoded}?alt=media`;
}

function findFiles(dir: string, exts: string[]): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  const walk = (d: string) => {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (exts.some((ext) => entry.name.toLowerCase().endsWith(ext))) {
        results.push(full);
      }
    }
  };
  walk(dir);
  return results;
}

function contentTypeFor(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.mp3') return 'audio/mpeg';
  if (ext === '.ogg') return 'audio/ogg';
  if (ext === '.m4a') return 'audio/mp4';
  if (ext === '.flac') return 'audio/flac';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.png') return 'image/png';
  return 'application/octet-stream';
}

async function uploadBatch(
  files: { localPath: string; storagePath: string }[],
  bucket: ReturnType<typeof getStorage> extends (app: any) => { bucket: () => any } ? any : any,
  label: string
): Promise<{ uploaded: number; errors: number }> {
  let uploaded = 0;
  let errors = 0;

  for (const file of files) {
    try {
      const buffer = fs.readFileSync(file.localPath);
      const contentType = contentTypeFor(file.localPath);
      const ref = bucket.file(file.storagePath);

      await ref.save(buffer, {
        contentType,
        metadata: {
          cacheControl: 'public, max-age=31536000',
        },
      });

      uploaded++;
    } catch (err: any) {
      console.error(`  ✗ ${label}: ${file.storagePath} — ${err.message}`);
      errors++;
    }
  }

  return { uploaded, errors };
}

async function main() {
  console.log('🚀 Firebase Storage Migration');
  console.log('═══════════════════════════════════════\n');

  const app = initAdmin();
  const bucket = getStorage(app).bucket();
  const db = getFirestore(app);

  // ── Collect audio files ──────────────────────────────────────────────────
  console.log('📁 Scanning audio files...');
  const audioFiles = findFiles(AUDIO_DIR, ['.mp3', '.ogg', '.m4a', '.flac']);
  console.log(`   Found ${audioFiles.length} audio files\n`);

  // ── Collect cover files ──────────────────────────────────────────────────
  console.log('🖼️  Scanning cover files...');
  const coverFiles = findFiles(COVERS_DIR, ['.jpg', '.jpeg', '.png']);
  console.log(`   Found ${coverFiles.length} cover files\n`);

  const totalFiles = audioFiles.length + coverFiles.length;
  let processed = 0;

  // ── Upload audio files in batches ────────────────────────────────────────
  console.log('⬆️  Uploading audio files...');
  for (let i = 0; i < audioFiles.length; i += BATCH_SIZE) {
    const batch = audioFiles.slice(i, i + BATCH_SIZE);
    const batchItems = batch.map((localPath) => {
      const relative = path.relative(AUDIO_DIR, localPath);
      return { localPath, storagePath: `audio/${relative}` };
    });

    const result = await uploadBatch(batchItems, bucket, 'audio');
    processed += batch.length;
    const pct = ((processed / totalFiles) * 100).toFixed(0);
    process.stdout.write(`\r   [${processed}/${totalFiles}] ${pct}% — ${result.uploaded} ok, ${result.errors} err`);
  }
  console.log('\n');

  // ── Upload cover files in batches ────────────────────────────────────────
  console.log('⬆️  Uploading cover files...');
  for (let i = 0; i < coverFiles.length; i += BATCH_SIZE) {
    const batch = coverFiles.slice(i, i + BATCH_SIZE);
    const batchItems = batch.map((localPath) => {
      const relative = path.relative(COVERS_DIR, localPath);
      return { localPath, storagePath: `covers/${relative}` };
    });

    const result = await uploadBatch(batchItems, bucket, 'cover');
    processed += batch.length;
    const pct = ((processed / totalFiles) * 100).toFixed(0);
    process.stdout.write(`\r   [${processed}/${totalFiles}] ${pct}% — ${result.uploaded} ok, ${result.errors} err`);
  }
  console.log('\n');

  // ── Update Firestore documents ───────────────────────────────────────────
  console.log('📝 Updating Firestore documents...');
  const tracksSnap = await db.collection('tracks').get();
  let updated = 0;
  let skipped = 0;

  for (const doc of tracksSnap.docs) {
    const data = doc.data();
    const updates: Record<string, string> = {};

    // Set audioUrl if not already set
    if (data.audioKey && !data.audioUrl) {
      updates.audioUrl = getPublicUrl(`audio/${data.audioKey}`);
    }

    // Set coverUrl from coverKey if not already a full URL
    if (data.coverKey && (!data.coverUrl || data.coverUrl.startsWith('/'))) {
      updates.coverUrl = getPublicUrl(`covers/${data.coverKey}`);
    }

    // Set coverUrl from audioKey-derived cover path
    if (!updates.coverUrl && data.audioKey && !data.coverKey) {
      const coverPath = data.audioKey.replace(/\/[^/]+$/, '');
      const coverFile = path.join(COVERS_DIR, `${doc.id}.jpg`);
      if (fs.existsSync(coverFile)) {
        updates.coverUrl = getPublicUrl(`covers/${doc.id}.jpg`);
      }
    }

    if (Object.keys(updates).length > 0) {
      await doc.ref.update(updates);
      updated++;
    } else {
      skipped++;
    }
  }

  console.log(`   Updated: ${updated}, Already set: ${skipped}\n`);

  console.log('✅ Migration complete!');
  console.log(`   Audio: ${audioFiles.length} files uploaded`);
  console.log(`   Covers: ${coverFiles.length} files uploaded`);
  console.log(`   Firestore: ${updated} docs updated`);
}

main().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
