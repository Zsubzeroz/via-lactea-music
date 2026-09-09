import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null = null;
let ffmpegLoaded = false;

async function loadFFmpeg(): Promise<FFmpeg> {
  if (ffmpeg && ffmpegLoaded) return ffmpeg;

  ffmpeg = new FFmpeg();

  ffmpeg.on('log', ({ message }) => {
    console.log('[FFmpeg]', message);
  });

  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';

  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  });

  ffmpegLoaded = true;
  return ffmpeg;
}

export interface ConversionResult {
  oggBlob: Blob;
  aacBlob: Blob;
  oggUrl: string;
  aacUrl: string;
  originalDuration: number;
  oggSize: number;
  aacSize: number;
}

export async function convertAudio(
  file: File,
  onProgress?: (percent: number) => void
): Promise<ConversionResult> {
  const ff = await loadFFmpeg();

  const inputName = `input_${Date.now()}.mp3`;
  const oggOutput = `output_${Date.now()}.ogg`;
  const aacOutput = `output_${Date.now()}.m4a`;

  await ff.writeFile(inputName, await fetchFile(file));

  // Get duration
  await ff.exec(['-i', inputName, '-f', 'null', '-']);
  const logEntries = ff.on('log', () => {});

  // Convert to Ogg Vorbis (best for web + Android)
  onProgress?.(10);
  await ff.exec([
    '-i', inputName,
    '-c:a', 'libvorbis',
    '-q:a', '6',
    '-b:a', '192k',
    '-ar', '44100',
    '-ac', '2',
    '-y',
    oggOutput,
  ]);
  onProgress?.(50);

  // Convert to AAC (best for iOS/Safari)
  await ff.exec([
    '-i', inputName,
    '-c:a', 'aac',
    '-b:a', '192k',
    '-ar', '44100',
    '-ac', '2',
    '-y',
    aacOutput,
  ]);
  onProgress?.(90);

  const oggData = await ff.readFile(oggOutput);
  const aacData = await ff.readFile(aacOutput);

  const oggBlob = new Blob([oggData], { type: 'audio/ogg' });
  const aacBlob = new Blob([aacData], { type: 'audio/aac' });

  // Get duration from original
  const tempAudio = new Audio();
  tempAudio.src = URL.createObjectURL(file);
  const originalDuration = await new Promise<number>((resolve) => {
    tempAudio.onloadedmetadata = () => resolve(Math.round(tempAudio.duration));
    tempAudio.onerror = () => resolve(180);
  });

  // Cleanup
  await ff.deleteFile(inputName);
  await ff.deleteFile(oggOutput);
  await ff.deleteFile(aacOutput);

  onProgress?.(100);

  return {
    oggBlob,
    aacBlob,
    oggUrl: URL.createObjectURL(oggBlob),
    aacUrl: URL.createObjectURL(aacBlob),
    originalDuration,
    oggSize: oggBlob.size,
    aacSize: aacBlob.size,
  };
}

export function getOptimalFormat(): 'ogg' | 'aac' {
  const audio = document.createElement('audio');
  const canPlayOgg = audio.canPlayType('audio/ogg; codecs="vorbis"');
  const canPlayAac = audio.canPlayType('audio/mp4; codecs="mp4a.40.2"');

  if (canPlayOgg === 'probably' || canPlayOgg === 'maybe') return 'ogg';
  if (canPlayAac === 'probably' || canPlayAac === 'maybe') return 'aac';
  return 'ogg'; // fallback
}
