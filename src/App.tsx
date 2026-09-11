import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { ActiveTab, Track } from './types';
import { audioEngine } from './services/audioEngine';
import { listTracks, subscribeToTracks, TrackMetadata, getTrackDownloadUrl } from './services/firebase';
import { getApiBase } from './config';
import { getOfflineTracks } from './services/offlineStore';
import { Header } from './components/Header';
import { PlayerBar } from './components/PlayerBar';
import { VisualizerCanvas } from './components/VisualizerCanvas';
import { EqualizerModal } from './components/EqualizerModal';
import { LibraryView } from './components/LibraryView';
import { UploadModal } from './components/UploadModal';
import { DownloadModal } from './components/DownloadModal';
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
    audioUrl: m.audioKey ? `${getApiBase()}/api/audio/${m.audioKey}` : undefined,
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
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0.85);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [isLoop, setIsLoop] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<ActiveTab>('player');
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [isDownloadOpen, setIsDownloadOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;
  const currentTrackRef = useRef(currentTrack);
  currentTrackRef.current = currentTrack;
  const isLoopRef = useRef(isLoop);
  isLoopRef.current = isLoop;
  const isShuffleRef = useRef(isShuffle);
  isShuffleRef.current = isShuffle;

  useEffect(() => {
    let active = true;

    const loadLocalTracks = async () => {
      const localTracks = await getOfflineTracks();
      if (!active) return;

      if (localTracks.length > 0) {
        setTracks((prev) => {
          const merged = [...localTracks, ...prev.filter((track) => !localTracks.some((localTrack) => localTrack.id === track.id))];
          return merged;
        });
        setCurrentTrack((prev) => prev ?? localTracks[0]);
        setDuration((prev) => prev || localTracks[0].duration);
      }
    };

    loadLocalTracks();

    const unsub = subscribeToTracks((fbTracks) => {
      if (!active || fbTracks.length === 0) return;
      const converted = fbTracks.map(trackFromMeta);
      setTracks((prev) => {
        const offlineOnly = prev.filter((track) => track.syncStatus === 'offline' || !!track.audioUrl?.startsWith('blob:'));
        const merged = [...offlineOnly, ...converted];
        const unique = new Map<string, Track>();
        merged.forEach((track) => unique.set(track.id, track));
        return Array.from(unique.values());
      });
      if (!isPlaying) {
        setCurrentTrack((prev) => prev ?? converted[0]);
        setDuration((prev) => prev || converted[0].duration);
      }
    });

    return () => {
      active = false;
      unsub();
    };
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
        handleNextTrackRef.current();
      }
    );
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        handlePlayPause();
      } else if (e.code === 'ArrowRight') {
        audioEngine.seek(Math.min(durationRef.current, currentTimeRef.current + 5));
      } else if (e.code === 'ArrowLeft') {
        audioEngine.seek(Math.max(0, currentTimeRef.current - 5));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handlePlayPause = () => {
    if (isPlayingRef.current) {
      audioEngine.pause();
    } else {
      if (currentTime > 0) {
        audioEngine.resume();
      } else if (currentTrackRef.current) {
        audioEngine.playTrack(currentTrackRef.current);
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
    if (!currentTrackRef.current) return;
    if (isLoopRef.current) {
      audioEngine.playTrack(currentTrackRef.current, 0);
      return;
    }
    const currentIndex = tracks.findIndex((t) => t.id === currentTrackRef.current!.id);
    let nextIndex = 0;
    if (isShuffleRef.current) {
      nextIndex = Math.floor(Math.random() * tracks.length);
    } else {
      nextIndex = (currentIndex + 1) % tracks.length;
    }
    handleSelectTrack(tracks[nextIndex]);
  }, [tracks]);

  const handleNextTrackRef = useRef(handleNextTrack);
  handleNextTrackRef.current = handleNextTrack;

  const handleSelectTrackRef = useRef(handleSelectTrack);
  handleSelectTrackRef.current = handleSelectTrack;

  const currentTimeRef = useRef(currentTime);
  currentTimeRef.current = currentTime;
  const durationRef = useRef(duration);
  durationRef.current = duration;

  const handlePreviousTrack = () => {
    if (!currentTrack) return;
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
        onOpenDownload={() => setIsDownloadOpen(true)}
        isPlaying={isPlaying}
        activeTrackTitle={currentTrack?.title}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4 md:p-6 pb-24 sm:pb-20 flex flex-col gap-4 sm:gap-6">
        {activeTab === 'player' && currentTrack && (
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
                    const isSelected = currentTrack ? t.id === currentTrack.id : false;
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

      <DownloadModal
        isOpen={isDownloadOpen}
        onClose={() => setIsDownloadOpen(false)}
        onTrackDownloaded={() => showToast('Música baixada! Atualizando biblioteca...')}
      />
    </div>
  );
}
