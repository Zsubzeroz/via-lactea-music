import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { ActiveTab, Track, Playlist } from './types';
import { audioEngine } from './services/audioEngine';
import { subscribeToTracks, TrackMetadata } from './services/firebase';
import { getApiBase } from './config';
import { getOfflineTracks, fetchAndSaveOfflineTrack, isTrackOffline, softDeleteOfflineTrack, removeOfflineTrack } from './services/offlineStore';
import { Header } from './components/Header';
import { PlayerBar } from './components/PlayerBar';
import { VisualizerCanvas } from './components/VisualizerCanvas';
import { EqualizerModal } from './components/EqualizerModal';
import { LibraryView } from './components/LibraryView';
import { UploadModal } from './components/UploadModal';
import { DownloadModal } from './components/DownloadModal';
import { ConfirmDeleteModal } from './components/ConfirmDeleteModal';
import { PlaylistsView } from './components/PlaylistsView';
import { Disc, Radio, ListMusic, Trash2 } from 'lucide-react';

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
    coverUrl: m.coverUrl
      ? `${getApiBase()}${m.coverUrl}`
      : m.coverKey
        ? `${getApiBase()}/api/covers/${m.coverKey}`
        : undefined,
    isSynthesized: false,
    bpm: 120,
    key: 'Custom',
    format: m.format,
    bitrate: '320 kbps',
    sampleRate: '44.1 kHz',
    sizeMB: m.sizeMB,
    localPath: `audio/${m.category}/${m.title}`,
    syncStatus: 'synced',
    deletedAt: m.deletedAt || null,
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
  const [offlineTrackIds, setOfflineTrackIds] = useState<Set<string>>(new Set());
  const [showTrash, setShowTrash] = useState<boolean>(false);
  const [deleteTarget, setDeleteTarget] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [queueIndex, setQueueIndex] = useState<number>(-1);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);

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

  // Restore EQ settings from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem('via-lactea-eq');
      if (raw) {
        const { gains } = JSON.parse(raw);
        if (Array.isArray(gains) && gains.length === 10) {
          gains.forEach((g: number, i: number) => audioEngine.setEQBandGain(i, g));
        }
      }
    } catch {}
  }, []);

  // Fetch playlists from server
  useEffect(() => {
    fetch(`${getApiBase()}/api/playlists`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setPlaylists(data); })
      .catch(() => {});
  }, []);

  const handleCreatePlaylist = async (name: string) => {
    const res = await fetch(`${getApiBase()}/api/playlists`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error);
    }
    const data = await res.json();
    setPlaylists((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
    showToast(`Playlist "${name}" criada!`);
  };

  const handleRenamePlaylist = async (id: string, name: string) => {
    const res = await fetch(`${getApiBase()}/api/playlists/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error);
    }
    const data = await res.json();
    setPlaylists((prev) => prev.map((p) => (p.id === id ? { ...p, name: data.name, folderName: data.folderName } : p)));
    showToast(`Playlist renomeada!`);
  };

  const handleDeletePlaylist = async (id: string) => {
    const res = await fetch(`${getApiBase()}/api/playlists/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error);
    }
    setPlaylists((prev) => prev.filter((p) => p.id !== id));
    showToast(`Playlist excluída!`);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    const checkOffline = async () => {
      const ids = await Promise.all(
        tracks.map(async (t) => {
          const offline = await isTrackOffline(t.id);
          return offline ? t.id : null;
        })
      );
      setOfflineTrackIds(new Set(ids.filter(Boolean) as string[]));
    };
    if (tracks.length > 0) checkOffline();
  }, [tracks]);

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

  const playFromQueue = (queueTracks: Track[], track: Track) => {
    const idx = queueTracks.findIndex((t) => t.id === track.id);
    setQueue(queueTracks);
    setQueueIndex(idx >= 0 ? idx : 0);
    handleSelectTrack(track);
  };

  const queueRef = useRef(queue);
  queueRef.current = queue;
  const queueIndexRef = useRef(queueIndex);
  queueIndexRef.current = queueIndex;

  const handleNextTrack = useCallback(() => {
    if (!currentTrackRef.current) return;
    if (isLoopRef.current) {
      audioEngine.playTrack(currentTrackRef.current, 0);
      return;
    }

    const q = queueRef.current;
    const qi = queueIndexRef.current;

    if (q.length > 0) {
      let nextIdx: number;
      if (isShuffleRef.current) {
        nextIdx = Math.floor(Math.random() * q.length);
      } else {
        nextIdx = (qi + 1) % q.length;
      }
      setQueueIndex(nextIdx);
      handleSelectTrack(q[nextIdx]);
    } else {
      const currentIndex = tracks.findIndex((t) => t.id === currentTrackRef.current!.id);
      let nextIndex = 0;
      if (isShuffleRef.current) {
        nextIndex = Math.floor(Math.random() * tracks.length);
      } else {
        nextIndex = (currentIndex + 1) % tracks.length;
      }
      handleSelectTrack(tracks[nextIndex]);
    }
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

    const q = queueRef.current;
    const qi = queueIndexRef.current;

    if (q.length > 0) {
      const prevIdx = (qi - 1 + q.length) % q.length;
      setQueueIndex(prevIdx);
      handleSelectTrack(q[prevIdx]);
    } else {
      const currentIndex = tracks.findIndex((t) => t.id === currentTrack.id);
      const prevIndex = (currentIndex - 1 + tracks.length) % tracks.length;
      handleSelectTrack(tracks[prevIndex]);
    }
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

  const downloadingRef = useRef(new Set<string>());

  const handleDownloadOffline = async (track: Track) => {
    if (downloadingRef.current.has(track.id)) return;
    if (offlineTrackIds.has(track.id)) {
      showToast(`"${track.title}" já está disponível offline`);
      return;
    }
    downloadingRef.current.add(track.id);
    showToast(`Baixando "${track.title}" para offline...`);
    try {
      const blobUrl = await fetchAndSaveOfflineTrack(track);
      if (blobUrl) {
        setOfflineTrackIds((prev) => new Set(prev).add(track.id));
        setTracks((prev) =>
          prev.map((t) => (t.id === track.id ? { ...t, audioUrl: blobUrl, syncStatus: 'offline' as const } : t))
        );
        showToast(`"${track.title}" salvo offline!`);
      }
    } catch (err) {
      console.error('Download offline failed:', err);
      showToast(`Erro ao baixar "${track.title}"`);
    } finally {
      downloadingRef.current.delete(track.id);
    }
  };

  const handleSoftDelete = async (track: Track) => {
    const deletedAt = new Date().toISOString();
    setTracks((prev) =>
      prev.map((t) => (t.id === track.id ? { ...t, deletedAt } : t))
    );
    if (track.audioKey) {
      try {
        await fetch(`${getApiBase()}/api/tracks/${track.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deletedAt }),
        });
      } catch { /* Firestore soft delete failed, local state updated */ }
    }
    if (offlineTrackIds.has(track.id)) {
      await softDeleteOfflineTrack(track.id).catch(() => {});
    }
    if (currentTrackRef.current?.id === track.id) {
      handleNextTrackRef.current();
    }
    showToast(`"${track.title}" movida para a lixeira`);
  };

  const handleRestore = async (track: Track) => {
    setTracks((prev) =>
      prev.map((t) => (t.id === track.id ? { ...t, deletedAt: null } : t))
    );
    if (track.audioKey) {
      try {
        await fetch(`${getApiBase()}/api/tracks/${track.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deletedAt: null }),
        });
      } catch { /* Firestore restore failed */ }
    }
    showToast(`"${track.title}" restaurada!`);
  };

  const handlePermanentDelete = async (track: Track) => {
    try {
      await fetch(`${getApiBase()}/api/tracks/${track.id}`, { method: 'DELETE' });
    } catch { /* server delete failed */ }
    if (offlineTrackIds.has(track.id)) {
      await removeOfflineTrack(track.id).catch(() => {});
      setOfflineTrackIds((prev) => {
        const next = new Set(prev);
        next.delete(track.id);
        return next;
      });
    }
    setTracks((prev) => prev.filter((t) => t.id !== track.id));
    if (currentTrackRef.current?.id === track.id) {
      handleNextTrackRef.current();
    }
    setDeleteTarget(null);
    showToast(`"${track.title}" excluída permanentemente`);
  };

  const trashCount = tracks.filter((t) => t.deletedAt).length;
  const activeTracks = tracks.filter((t) => !t.deletedAt);
  const trashTracks = tracks.filter((t) => t.deletedAt);

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
        showTrash={showTrash}
        onToggleTrash={() => setShowTrash(!showTrash)}
        trashCount={trashCount}
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
                  <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-lg bg-[#0a0a0c] border border-zinc-800 flex items-center justify-center shrink-0 overflow-hidden relative">
                    {currentTrack.coverUrl ? (
                      <img src={currentTrack.coverUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Disc className={`w-12 h-12 sm:w-14 sm:h-14 text-zinc-600 transition-transform duration-1000 ${isPlaying ? 'rotate-[360deg] text-[#ff0055]' : ''}`} />
                    )}
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
                  {activeTracks.slice(0, 8).map((t, idx) => {
                    const isSelected = currentTrack ? t.id === currentTrack.id : false;
                    return (
                      <button
                        key={t.id}
                        onClick={() => playFromQueue(activeTracks.slice(0, 8), t)}
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
                  {activeTracks.length > 8 && (
                    <div className="sticky bottom-0 left-0 right-0 h-10 pointer-events-none" style={{ background: 'linear-gradient(to bottom, transparent, #111113)' }} />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'library' && (
            <LibraryView
              tracks={activeTracks}
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              onSelectTrack={handleSelectTrack}
              onPlayFromQueue={playFromQueue}
              onPlayPause={handlePlayPause}
              onAnalyzeTrack={() => {}}
              onDownloadOffline={handleDownloadOffline}
              onDeleteTrack={handleSoftDelete}
              offlineTrackIds={offlineTrackIds}
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
              tracks={activeTracks}
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              onSelectTrack={handleSelectTrack}
              onPlayFromQueue={playFromQueue}
              onPlayPause={handlePlayPause}
            />
          </Suspense>
        )}

        {activeTab === 'equalizer' && (
          <EqualizerModal />
        )}

        {activeTab === 'playlists' && (
          <PlaylistsView
            playlists={playlists}
            tracks={tracks}
            onCreate={handleCreatePlaylist}
            onRename={handleRenamePlaylist}
            onDelete={handleDeletePlaylist}
          />
        )}

        {showTrash && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-3 border-b border-zinc-800">
              <Trash2 className="w-4 h-4 text-zinc-400" />
              <span className="text-xs font-mono font-semibold text-zinc-300">LIXEIRA ({trashCount})</span>
            </div>
            {trashTracks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Trash2 className="w-10 h-10 text-zinc-600" />
                <p className="text-sm font-mono text-zinc-400">Nenhuma faixa na lixeira</p>
              </div>
            ) : (
              <div className="bg-[#111113] border border-zinc-800 rounded-lg overflow-hidden divide-y divide-zinc-800/60">
                {trashTracks.map((t) => (
                  <div key={t.id} className="px-4 py-3 hover:bg-zinc-800/40 transition-colors flex items-center gap-3">
                    {t.coverUrl ? (
                      <img src={t.coverUrl} alt="" className="w-10 h-10 rounded object-cover bg-zinc-800 shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded bg-zinc-800 flex items-center justify-center shrink-0">
                        <Disc className="w-5 h-5 text-zinc-600" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-zinc-200 truncate">{t.title}</p>
                      <p className="text-[10px] text-zinc-400 truncate">{t.artist}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleRestore(t)}
                        className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-mono"
                      >
                        Restaurar
                      </button>
                      <button
                        onClick={() => setDeleteTarget(t)}
                        className="px-2.5 py-1 rounded bg-red-900/50 hover:bg-red-800/50 text-red-300 text-[10px] font-mono"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
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
        isOffline={currentTrack ? offlineTrackIds.has(currentTrack.id) : false}
        onPlayPause={handlePlayPause}
        onPrevious={handlePreviousTrack}
        onNext={handleNextTrack}
        onSeek={(sec) => audioEngine.seek(sec)}
        onVolumeChange={handleVolumeChange}
        onToggleShuffle={() => setIsShuffle(!isShuffle)}
        onToggleLoop={() => setIsLoop(!isLoop)}
        onOpenEqualizer={() => setActiveTab('equalizer')}
        onDownloadOffline={() => currentTrack && handleDownloadOffline(currentTrack)}
        onSoftDelete={() => currentTrack && handleSoftDelete(currentTrack)}
      />

      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onAddTrack={handleAddLocalTrack}
        playlists={playlists}
      />

      <DownloadModal
        isOpen={isDownloadOpen}
        onClose={() => setIsDownloadOpen(false)}
        onTrackDownloaded={() => showToast('Música baixada! Atualizando biblioteca...')}
        playlists={playlists}
      />

      <ConfirmDeleteModal
        isOpen={deleteTarget !== null}
        track={deleteTarget}
        onConfirm={() => deleteTarget && handlePermanentDelete(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
