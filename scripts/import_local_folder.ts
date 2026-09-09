#!/usr/bin/env tsx
/**
 * Batch import: local folder → Firebase Storage + Firestore
 *
 * Usage:
 *   npx tsx scripts/import_local_folder.ts "/home/estifer/Musica"
 *   npm run import -- "/home/estifer/Musica"
 *
 * Requires: firebase-admin (service account in automation/credentials/firebase-sa.json)
 */

import fs from 'fs';
import path from 'path';
import { parseFile } from 'music-metadata';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { getFirestore } from 'firebase-admin/firestore';
import { createHash } from 'crypto';

// ── Firebase Admin init ──────────────────────────────────────────────────────

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

function initAdmin() {
  if (getApps().length > 0) return getApps()[0];
  const sa = JSON.parse(fs.readFileSync(getServiceAccountPath(), 'utf-8'));
  return initializeApp({
    credential: cert(sa),
    storageBucket: 'via-lactea-music.firebasestorage.app',
  });
}

// ── Cover extraction + WebP conversion ───────────────────────────────────────

async function extractCoverToWebP(filePath: string, trackId: string): Promise<Buffer | null> {
  try {
    const metadata = await parseFile(filePath, { duration: false });
    const pic = metadata.common.picture?.[0];
    if (!pic?.data) return null;

    // Convert Uint8Array to Buffer
    return Buffer.from(pic.data);
  } catch {
    return null;
  }
}

// ── File scanning ────────────────────────────────────────────────────────────

const AUDIO_EXTS = new Set(['.mp3', '.flac', '.ogg', '.m4a']);

interface ScanResult {
  filePath: string;
  relativePath: string;
  category: string; // subfolder name
}

function scanFolder(rootDir: string): ScanResult[] {
  const results: ScanResult[] = [];

  function walk(dir: string, relBase: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath, relBase ? `${relBase}/${entry.name}` : entry.name);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (AUDIO_EXTS.has(ext)) {
          const category = relBase || 'Importados';
          results.push({ filePath: fullPath, relativePath: relBase, category });
        }
      }
    }
  }

  walk(rootDir, '');
  return results;
}

// ── Hash for dedup ───────────────────────────────────────────────────────────

function fileHash(buffer: Buffer): string {
  return createHash('md5').update(buffer).digest('hex');
}

// ── Main ─────────────────────────────────────────────────────────────────────

interface ImportMeta {
  id: string;
  title: string;
  artist: string;
  album: string;
  category: string;
  duration: number;
  format: 'OGG' | 'AAC' | 'MP3';
  sizeMB: number;
  coverUrl?: string;
  createdAt: string;
  audioHash: string;
}

async function main() {
  const targetDir = process.argv[2];
  if (!targetDir || !fs.existsSync(targetDir)) {
    console.error('Usage: npx tsx scripts/import_local_folder.ts <folder_path>');
    console.error('Example: npx tsx scripts/import_local_folder.ts "/home/estifer/Musica"');
    process.exit(1);
  }

  console.log(`\n🎵 Via Láctea Music — Batch Import`);
  console.log(`   Source: ${targetDir}\n`);

  const app = initAdmin();
  const bucket = getStorage(app).bucket();
  const db = getFirestore(app);

  // Get existing tracks for dedup
  const existingSnap = await db.collection('tracks').get();
  const existingTitles = new Set<string>();
  const existingHashes = new Set<string>();
  for (const doc of existingSnap.docs) {
    const data = doc.data();
    existingTitles.add(`${data.title}|${data.artist}|${data.album}`);
    if (data.audioHash) existingHashes.add(data.audioHash);
  }

  // Scan folder
  const files = scanFolder(targetDir);
  console.log(`📁 Found ${files.length} audio files\n`);

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < files.length; i++) {
    const { filePath, category } = files[i];
    const fileName = path.basename(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const fileStat = fs.statSync(filePath);

    process.stdout.write(`[${i + 1}/${files.length}] ${fileName} ... `);

    try {
      // Read metadata
      const metadata = await parseFile(filePath, { duration: true });
      const title = metadata.common.title || path.basename(fileName, ext);
      const artist = metadata.common.artist || 'Desconhecido';
      const album = metadata.common.album || 'Sem Álbum';
      const duration = metadata.format.duration || 0;
      const formatMap: Record<string, 'MP3' | 'OGG' | 'AAC'> = {
        '.mp3': 'MP3',
        '.flac': 'MP3', // Will be converted
        '.ogg': 'OGG',
        '.m4a': 'AAC',
      };
      const format = formatMap[ext] || 'MP3';

      // Check dedup by title+artist+album
      const dedupKey = `${title}|${artist}|${album}`;
      if (existingTitles.has(dedupKey)) {
        console.log('skip (duplicate)');
        skipped++;
        continue;
      }

      // Generate track ID
      const trackId = `track-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      // Upload audio
      const audioBuffer = fs.readFileSync(filePath);
      const audioHash = fileHash(audioBuffer);

      if (existingHashes.has(audioHash)) {
        console.log('skip (hash match)');
        skipped++;
        continue;
      }

      const audioStoragePath = `tracks/${category}/${trackId}/${fileName}`;
      await bucket.file(audioStoragePath).save(audioBuffer, {
        contentType: ext === '.mp3' ? 'audio/mpeg' : ext === '.flac' ? 'audio/flac' : ext === '.ogg' ? 'audio/ogg' : 'audio/mp4',
        metadata: { cacheControl: 'public, max-age=31536000' },
      });

      // Extract cover
      let coverUrl: string | undefined;
      const pic = metadata.common.picture?.[0];
      if (pic?.data) {
        const coverStoragePath = `covers/${trackId}.webp`;
        // Save raw image buffer (client-side will handle WebP conversion for display)
        // For now, save as the original format
        const ext = pic.format?.includes('jpeg') ? 'jpg' : pic.format?.includes('png') ? 'png' : 'jpg';
        const coverPath = `covers/${trackId}.${ext}`;
        await bucket.file(coverPath).save(pic.data, {
          contentType: pic.format || 'image/jpeg',
          metadata: { cacheControl: 'public, max-age=31536000' },
        });
        const [url] = await bucket.file(coverPath).getSignedUrl({
          action: 'read',
          expires: Date.now() + 365 * 24 * 60 * 60 * 1000,
        });
        coverUrl = url;
      }

      // Get audio download URL
      const [audioUrl] = await bucket.file(audioStoragePath).getSignedUrl({
        action: 'read',
        expires: Date.now() + 365 * 24 * 60 * 60 * 1000,
      });

      // Save to Firestore
      const docData: ImportMeta = {
        id: trackId,
        title,
        artist,
        album,
        category,
        duration,
        format,
        sizeMB: parseFloat((fileStat.size / (1024 * 1024)).toFixed(1)),
        coverUrl,
        createdAt: new Date().toISOString(),
        audioHash,
      };

      await db.collection('tracks').doc(trackId).set(docData);

      existingTitles.add(dedupKey);
      existingHashes.add(audioHash);
      imported++;
      console.log('ok');
    } catch (err: any) {
      errors++;
      console.log(`error: ${err.message}`);
    }
  }

  console.log(`\n✅ Import complete:`);
  console.log(`   Imported: ${imported}`);
  console.log(`   Skipped:  ${skipped}`);
  console.log(`   Errors:   ${errors}`);
  console.log(`   Total:    ${files.length}\n`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
