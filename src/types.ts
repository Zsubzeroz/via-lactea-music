export type AudioFormat = 'FLAC' | 'MP3' | 'WAV' | 'SYNTH';

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  category: string;
  duration: number; // in seconds
  audioUrl?: string; // Blob or synthesized generator id
  isSynthesized?: boolean;
  synthPreset?: 'piano' | 'synthwave' | 'hiphop' | 'ambient' | 'phonk';
  bpm: number;
  key: string;
  format: AudioFormat;
  bitrate: string; // e.g. '1411 kbps' or '320 kbps'
  sampleRate: string; // '48.0 kHz' | '44.1 kHz'
  sizeMB: number;
  localPath: string; // e.g. 'Documents/Musica/Piano/Clássico SnapTube/Chopin_Nocturne.mp3'
  syncStatus: 'synced' | 'cached' | 'uploading' | 'offline';
  lyrics?: string;
  chords?: string[];
}

export interface Playlist {
  id: string;
  name: string;
  folderName: string;
  description: string;
  trackCount: number;
  colorAccent: string;
  iconName: string;
}

export interface EQBand {
  freq: number;
  label: string;
  gain: number; // -12 to +12 dB
}

export interface EQPreset {
  name: string;
  description: string;
  gains: number[]; // 10 bands
}

export interface GitCommit {
  hash: string;
  shortHash: string;
  message: string;
  author: string;
  date: string;
  tag?: string;
}

export interface GitFile {
  path: string;
  type: 'file' | 'dir';
  size?: string;
  language?: string;
  content?: string;
}

export type ActiveTab = 'player' | 'library' | 'equalizer' | 'github' | 'ai-harmony';
