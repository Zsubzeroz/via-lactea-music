import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { ActiveTab, Track } from './types';
import { INITIAL_TRACKS } from './data/mockTracks';
import { audioEngine } from './services/audioEngine';
import { listTracks, subscribeToTracks, TrackMetadata, getTrackDownloadUrl } from './services/firebase';
import { Header } from './components/Header';
import { PlayerBar } from './components/PlayerBar';
import { VisualizerCanvas } from './components/VisualizerCanvas';
import { EqualizerModal } from './components/EqualizerModal';
import { LibraryView } from './components/LibraryView';
import { UploadModal } from './components/UploadModal';
import { Disc, Radio, ListMusic } from 'lucide-react';

const AlbumsView = React.lazy(() =>
  import('./components/AlbumsView').then((m) => ({ default: m.AlbumsView }))
);

function trackFromMeta(m: TrackMetadata): Track {
  return {
    id: m.id,
    title: m.title,
    artist: m.artist,
    album: m.album,
    category: m.category,
    duration: m.duration,
    audioUrl: m.audioKey ? `/api/audio/${m.audioKey}` : undefined,
    audioKey: m.audioKey,
    coverUrl: m.coverUrl,
    isSynthesized: false,
    bpm: 120,
    key: 'Custom',
    format: m.format,
    bitrate: '320 kbps',
    sampleRate: '44.1 kHz',
    sizeMB: m.sizeMB,
    localPath: `audio/${m.category}/${m.title}`,
    syncStatus: 'synced',
  };
}

export default function App() {
  const [tracks, setTracks] = useState<Track[]>(INITIAL_TRACKS);
  const [currentTrack, setCurrentTrack] = useState<Track>(INITIAL_TRACKS[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(INITIAL_TRACKS[0].duration);
  const [volume, setVolume] = useState<number>(0.85);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [isLoop, setIsLoop] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<ActiveTab>('player');
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load tracks from Firebase Firestore
  useEffect(() => {
    const unsub = subscribeToTracks((fbTracks) => {
      if (fbTracks.length > 0) {
        const converted = fbTracks.map(trackFromMeta);
        setTracks(converted);
        if (converted.length > 0 && !isPlaying) {
          setCurrentTrack(converted[0]);
          setDuration(converted[0].duration);
        }
      }
    });
    return () => unsub();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    audioEngine.setCallbacks(
      (time, dur) => {
        setCurrentTime(time);
        if (dur && !isNaN(dur) && dur > 0) {
          setDuration(dur);
        }
      },
      (playing) => {
        setIsPlaying(playing);
      },
      () => {
        handleNextTrack();
      }
    );
  }, [tracks, currentTrack, isLoop, isShuffle]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        handlePlayPause();
      } else if (e.code === 'ArrowRight') {
        audioEngine.seek(Math.min(duration, currentTime + 5));
      } else if (e.code === 'ArrowLeft') {
        audioEngine.seek(Math.max(0, currentTime - 5));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, currentTime, duration]);

  const handlePlayPause = () => {
    if (isPlaying) {
      audioEngine.pause();
    } else {
      if (currentTime > 0) {
        audioEngine.resume();
      } else {
        audioEngine.playTrack(currentTrack);
      }
    }
  };

  const handleSelectTrack = (track: Track) => {
    setCurrentTrack(track);
    setDuration(track.duration);
    setCurrentTime(0);
    audioEngine.playTrack(track, 0);
    showToast(`Tocando: ${track.title}`);
  };

  const handleNextTrack = useCallback(() => {
    if (isLoop) {
      audioEngine.playTrack(currentTrack, 0);
      return;
    }
    const currentIndex = tracks.findIndex((t) => t.id === currentTrack.id);
    let nextIndex = 0;
    if (isShuffle) {
      nextIndex = Math.floor(Math.random() * tracks.length);
    } else {
      nextIndex = (currentIndex + 1) % tracks.length;
    }
    handleSelectTrack(tracks[nextIndex]);
  }, [tracks, currentTrack, isLoop, isShuffle]);

  const handlePreviousTrack = () => {
    if (currentTime > 3) {
      audioEngine.seek(0);
      return;
    }
    const currentIndex = tracks.findIndex((t) => t.id === currentTrack.id);
    const prevIndex = (currentIndex - 1 + tracks.length) % tracks.length;
    handleSelectTrack(tracks[prevIndex]);
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    audioEngine.setVolume(newVol);
  };

  const handleAddLocalTrack = (newTrack: Track) => {
    setTracks((prev) => [newTrack, ...prev]);
    handleSelectTrack(newTrack);
    showToast(`Áudio adicionado: ${newTrack.title}`);
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans selection:bg-[#ff0055] selection:text-white">
      {toastMessage && (
        <div className="fixed top-14 right-4 z-50 bg-[#111113] border border-[#ff0055] text-zinc-100 text-xs font-mono px-3.5 py-2 rounded-md shadow-xl flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#00ff88]" />
          {toastMessage}
        </div>
      )}

      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenUpload={() => setIsUploadOpen(true)}
        isPlaying={isPlaying}
        activeTrackTitle={currentTrack.title}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4 md:p-6 pb-24 sm:pb-20 flex flex-col gap-4 sm:gap-6">
        {activeTab === 'player' && (
          <div className="flex flex-col gap-4 sm:gap-6">
            <VisualizerCanvas
              isPlaying={isPlaying}
              bpm={currentTrack.bpm}
              format={currentTrack.format}
              sampleRate={currentTrack.sampleRate}
              bitrate={currentTrack.bitrate}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Now Playing */}
              <div className="lg:col-span-2 bg-[#111113] border border-zinc-800 rounded-lg p-4 sm:p-5 flex flex-col gap-4">
                <div className="flex items-center gap-2 pb-3 border-b border-zinc-800">
                  <Radio className="w-4 h-4 text-[#ff0055]" />
                  <span className="text-xs font-mono font-semibold text-zinc-300">REPRODUTOR</span>
                </div>

                <div className="flex items-center gap-4 sm:gap-5">
                  <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-lg bg-[#0a0a0c] border border-zinc-800 flex items-center justify-center shrink-0">
                    <Disc className={`w-12 h-12 sm:w-14 sm:h-14 text-zinc-600 transition-transform duration-1000 ${isPlaying ? 'rotate-[360deg] text-[#ff0055]' : ''}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-mono text-[#ff0055] font-semibold">
                      {currentTrack.category.toUpperCase()}
                    </span>
                    <h2 className="text-lg sm:text-2xl font-bold text-white tracking-tight truncate">
                      {currentTrack.title}
                    </h2>
                    <p className="text-sm text-zinc-300 truncate">{currentTrack.artist}</p>
                    <p className="text-xs text-zinc-500 font-mono truncate">{currentTrack.album}</p>

                    <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] font-mono">
                      <span className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300">{currentTrack.sampleRate}</span>
                      <span className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300">{currentTrack.bitrate}</span>
                      <span className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[#00ff88]">{currentTrack.bpm} BPM</span>
                      <span className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300">{currentTrack.format}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Queue */}
              <div className="bg-[#111113] border border-zinc-800 rounded-lg p-4 flex flex-col">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-3 text-xs font-mono text-zinc-300">
                  <span className="font-semibold flex items-center gap-1.5">
                    <ListMusic className="w-4 h-4 text-[#00ff88]" />
                    FILA ({tracks.length})
                  </span>
                  <button onClick={() => setActiveTab('library')} className="text-zinc-500 hover:text-zinc-300">
                    Ver Todas
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto max-h-80 space-y-1 relative">
                  {tracks.slice(0, 8).map((t, idx) => {
                    const isSelected = t.id === currentTrack.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => handleSelectTrack(t)}
                        className={`w-full p-2 rounded text-left transition-colors flex items-center justify-between gap-2 text-xs ${
                          isSelected
                            ? 'bg-[#ff0055]/15 border border-[#ff0055]/40 text-white'
                            : 'hover:bg-zinc-800/60 text-zinc-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono text-[10px] text-zinc-500 w-3 text-right">{idx + 1}</span>
                          <div className="truncate">
                            <p className="font-medium truncate">{t.title}</p>
                            <p className="text-[10px] text-zinc-500 truncate">{t.artist}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-zinc-500 shrink-0">{t.format}</span>
                      </button>
                    );
                  })}
                  {tracks.length > 8 && (
                    <div className="sticky bottom-0 left-0 right-0 h-10 pointer-events-none" style={{ background: 'linear-gradient(to bottom, transparent, #111113)' }} />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'library' && (
          <LibraryView
            tracks={tracks}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            onSelectTrack={handleSelectTrack}
            onPlayPause={handlePlayPause}
          />
        )}

        {activeTab === 'albums' && (
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-3">
                  <Disc className="w-8 h-8 text-zinc-600 animate-spin" />
                  <span className="text-xs font-mono text-zinc-500">Carregando álbuns...</span>
                </div>
              </div>
            }
          >
            <AlbumsView
              tracks={tracks}
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              onSelectTrack={handleSelectTrack}
              onPlayPause={handlePlayPause}
            />
          </Suspense>
        )}

        {activeTab === 'equalizer' && (
          <EqualizerModal />
        )}
      </main>

      <PlayerBar
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        isShuffle={isShuffle}
        isLoop={isLoop}
        onPlayPause={handlePlayPause}
        onPrevious={handlePreviousTrack}
        onNext={handleNextTrack}
        onSeek={(sec) => audioEngine.seek(sec)}
        onVolumeChange={handleVolumeChange}
        onToggleShuffle={() => setIsShuffle(!isShuffle)}
        onToggleLoop={() => setIsLoop(!isLoop)}
        onOpenEqualizer={() => setActiveTab('equalizer')}
      />

      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onAddTrack={handleAddLocalTrack}
      />
    </div>
  );
}
