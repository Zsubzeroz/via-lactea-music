#!/usr/bin/env tsx
/**
 * Download a track from YouTube and ingest into Firebase.
 *
 * Usage:
 *   npx tsx scripts/download-and-ingest.ts <url> <category>
 *
 * Or via environment variables:
 *   TRACK_URL=https://... TRACK_CATEGORY=Piano npx tsx scripts/download-and-ingest.ts
 */

import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { initFirebaseAdmin } from '../src/services/firebaseAdmin';
import { getFirestore } from 'firebase-admin/firestore';

const execFileAsync = promisify(execFile);

const PROJECT_ROOT = path.resolve(process.cwd());
const AUDIO_DIR = path.join(PROJECT_ROOT, 'audio');
const COVERS_DIR = path.join(PROJECT_ROOT, 'covers');

function cleanYouTubeUrl(raw: string): string {
  try {
    const u = new URL(raw);
    if (u.hostname.includes('youtube.com') || u.hostname.includes('youtu.be')) {
      u.searchParams.delete('list');
      u.searchParams.delete('start_radio');
      u.searchParams.delete('si');
      u.searchParams.delete('pp');
      return u.toString();
    }
  } catch {}
  return raw;
}

const rawUrl = process.argv[2] || process.env.TRACK_URL || '';
const url = cleanYouTubeUrl(rawUrl);
const category = process.argv[3] || process.env.TRACK_CATEGORY || 'Geral';

if (!url) {
  console.error('Usage: npx tsx scripts/download-and-ingest.ts <url> [category]');
  process.exit(1);
}

function sanitizeFolderName(name: string): string {
  return name.replace(/\s+/g, '_');
}

async function main() {
  const catDir = sanitizeFolderName(category);
  const trackId = `track-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  console.log(`🎵 Downloading: ${url}`);
  console.log(`📂 Category: ${category} (${catDir})`);
  console.log(`🆔 Track ID: ${trackId}\n`);

  // Ensure directories exist
  const outDir = path.join(AUDIO_DIR, catDir);
  fs.mkdirSync(outDir, { recursive: true });
  fs.mkdirSync(COVERS_DIR, { recursive: true });

  // 1. Get video info
  console.log('📋 Fetching video info...');
  const infoResult = await execFileAsync('yt-dlp', [
    '--remote-components', 'ejs:github',
    '--js-runtimes', 'node',
    '--extractor-args', 'youtube:player_client=android,web',
    '--dump-json', '--no-playlist', url,
  ], { timeout: 60000 });

  const info = JSON.parse(infoResult.stdout);
  const title = info.title || 'Unknown';
  const artist = info.artist || info.uploader || 'Unknown';
  const album = info.album || category;
  const duration = info.duration || 0;
  const thumbnail = info.thumbnail || '';

  console.log(`   Title: ${title}`);
  console.log(`   Artist: ${artist}`);
  console.log(`   Duration: ${Math.floor(duration / 60)}m ${Math.floor(duration % 60)}s\n`);

  // 2. Download audio as MP3
  console.log('⬇️  Downloading audio...');
  const outputTemplate = path.join(outDir, `${trackId}/%(title)s.%(ext)s`);
  await execFileAsync('yt-dlp', [
    '--remote-components', 'ejs:github',
    '--js-runtimes', 'node',
    '--extractor-args', 'youtube:player_client=android,web',
    '-x', '--audio-format', 'mp3',
    '--audio-quality', '320K',
    '--no-playlist',
    '-o', outputTemplate,
    '--no-overwrites',
    url,
  ], { timeout: 120000 });

  // Find the downloaded file
  const trackDir = path.join(outDir, trackId);
  if (!fs.existsSync(trackDir)) {
    throw new Error('Download failed — file not found');
  }
  const files = fs.readdirSync(trackDir);
  if (files.length === 0) {
    throw new Error('Download failed — directory empty');
  }
  const audioFile = files[0];
  const audioPath = path.join(trackId, audioFile);
  const audioFullPath = path.join(trackDir, audioFile);
  const fileSizeMB = fs.statSync(audioFullPath).size / (1024 * 1024);

  console.log(`   File: ${audioFile} (${fileSizeMB.toFixed(1)} MB)\n`);

  // 3. Download thumbnail
  console.log('🖼️  Downloading cover...');
  const coverPath = path.join(COVERS_DIR, `${trackId}.jpg`);
  if (thumbnail) {
    try {
      await execFileAsync('curl', ['-sL', '-o', coverPath, thumbnail], { timeout: 10000 });
      console.log('   Cover saved.\n');
    } catch {
      console.log('   Cover download failed (non-fatal).\n');
    }
  } else {
    console.log('   No thumbnail available.\n');
  }

  // 4. Save to Firestore
  const adminApp = initFirebaseAdmin();

  // Build Firestore document
  const trackData = {
    id: trackId,
    title,
    artist,
    album,
    category,
    duration,
    format: 'MP3',
    bitrate: '320 kbps',
    sampleRate: '44.1 kHz',
    sizeMB: Math.round(fileSizeMB * 10) / 10,
    audioKey: `${catDir}/${audioPath}`,
    audioUrl: `/audio/${catDir}/${audioPath}`,
    coverUrl: `/covers/${trackId}.jpg`,
    createdAt: new Date().toISOString(),
    source: 'yt-dlp',
    sourceUrl: url,
  };

  const db = getFirestore(adminApp);
  await db.collection('tracks').doc(trackId).set(trackData);

  console.log(`\n✅ Done! Track "${title}" ingested as ${trackId}`);
  console.log(`   Audio: /audio/${catDir}/${audioPath}`);
  console.log(`   Cover: /covers/${trackId}.jpg`);
}

main().catch((err) => {
  console.error('❌ Error:', err.message || err);
  process.exit(1);
});
