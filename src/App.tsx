import React, { useState, useEffect, useCallback } from 'react';
import { ActiveTab, Track } from './types';
import { INITIAL_TRACKS } from './data/mockTracks';
import { audioEngine } from './services/audioEngine';
import { Header } from './components/Header';
import { PlayerBar } from './components/PlayerBar';
import { VisualizerCanvas } from './components/VisualizerCanvas';
import { EqualizerModal } from './components/EqualizerModal';
import { LibraryView } from './components/LibraryView';
import { GitHubView } from './components/GitHubView';
import { AiStudioView } from './components/AiStudioView';
import { UploadModal } from './components/UploadModal';
import { 
  Play, 
  Pause, 
  Disc, 
  Sliders, 
  Sparkles, 
  GitBranch, 
  HardDrive, 
  Radio, 
  Music, 
  CheckCircle2, 
  ListMusic,
  Share2,
  FileText
} from 'lucide-react';

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

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Setup audio engine callbacks
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

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in textarea or input
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
    showToast(`Reproduzindo: ${track.title}`);
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
    const nextTrack = tracks[nextIndex];
    handleSelectTrack(nextTrack);
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
    showToast(`Áudio adicionado com sucesso: ${newTrack.title}`);
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans selection:bg-[#ff0055] selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-14 right-4 z-50 bg-[#111113] border border-[#ff0055] text-zinc-100 text-xs font-mono px-3.5 py-2 rounded-md shadow-xl flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#00ff88]" />
          {toastMessage}
        </div>
      )}

      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenUpload={() => setIsUploadOpen(true)}
        isPlaying={isPlaying}
        activeTrackTitle={currentTrack.title}
      />

      {/* Main Content Area with mobile safe padding */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4 md:p-6 pb-24 sm:pb-20 flex flex-col gap-4 sm:gap-6">
        {activeTab === 'player' && (
          <div className="flex flex-col gap-4 sm:gap-6">
            {/* Upper: Live Spectrum FFT & Oscilloscope */}
            <VisualizerCanvas
              isPlaying={isPlaying}
              bpm={currentTrack.bpm}
              format={currentTrack.format}
              sampleRate={currentTrack.sampleRate}
              bitrate={currentTrack.bitrate}
            />

            {/* Lower: Showcase Active Track & Queue Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Active Track Highlight Details */}
              <div className="lg:col-span-2 bg-[#111113] border border-zinc-800 rounded-lg p-3.5 sm:p-5 flex flex-col justify-between gap-4 sm:gap-5">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-zinc-800 mb-4">
                    <div className="flex items-center gap-2">
                      <Radio className="w-4 h-4 text-[#ff0055]" />
                      <span className="text-xs font-mono font-semibold text-zinc-300">
                        REPRODUTOR AUDIOPHILE & METADADOS
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-[#00ff88] border border-emerald-800">
                        R2 ZERO-EGRESS
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                        {currentTrack.syncStatus.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col xs:flex-row gap-4 sm:gap-5 items-center xs:items-start text-center xs:text-left">
                    {/* Vinyl / Cover disc simulation */}
                    <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-lg bg-[#0a0a0c] border border-zinc-800 flex items-center justify-center relative overflow-hidden shrink-0 group shadow-md">
                      <Disc className={`w-14 h-14 sm:w-16 sm:h-16 text-zinc-600 transition-transform duration-1000 ${isPlaying ? 'rotate-[360deg] text-[#ff0055]' : ''}`} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                      <span className="absolute bottom-1.5 left-1.5 text-[9px] sm:text-[10px] font-mono text-zinc-400">
                        {currentTrack.format}
                      </span>
                    </div>

                    {/* Metadata details */}
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-mono text-[#ff0055] font-semibold">
                        {currentTrack.category.toUpperCase()}
                      </span>
                      <h2 className="text-lg sm:text-2xl font-bold text-white tracking-tight truncate mt-0.5">
                        {currentTrack.title}
                      </h2>
                      <p className="text-sm text-zinc-300 font-medium truncate mt-0.5">
                        {currentTrack.artist}
                      </p>
                      <p className="text-xs text-zinc-500 font-mono truncate mt-0.5">
                        Álbum: {currentTrack.album}
                      </p>

                      {/* Technical Spec pills */}
                      <div className="mt-3 flex flex-wrap justify-center xs:justify-start gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] font-mono">
                        <span className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300">
                          {currentTrack.sampleRate}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300">
                          {currentTrack.bitrate}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[#00ff88]">
                          {currentTrack.bpm} BPM
                        </span>
                        <span className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300">
                          Tom: {currentTrack.key}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Local Path & Lyrics Preview */}
                <div className="pt-3 sm:pt-4 border-t border-zinc-800 space-y-2.5 sm:space-y-3">
                  <div className="p-2 sm:p-2.5 rounded bg-[#0a0a0c] border border-zinc-800 text-[10px] sm:text-[11px] font-mono flex items-center justify-between gap-2 text-zinc-400">
                    <span className="truncate">
                      <strong className="text-zinc-500">Local: </strong>
                      {currentTrack.localPath}
                    </span>
                    <span className="text-zinc-500 shrink-0">{currentTrack.sizeMB} MB</span>
                  </div>

                  {currentTrack.lyrics && (
                    <div className="p-2.5 sm:p-3 rounded bg-[#0a0a0c] border border-zinc-800 text-xs font-mono text-zinc-300">
                      <span className="text-[10px] text-zinc-500 block mb-1">LINHA POÉTICA / CONTEXTO:</span>
                      <p className="italic text-zinc-300">{currentTrack.lyrics}</p>
                    </div>
                  )}

                  <div className="flex flex-col xs:flex-row items-stretch xs:items-center justify-between gap-2 text-xs font-mono pt-1">
                    <button
                      onClick={() => setActiveTab('ai-harmony')}
                      className="text-[#ff0055] hover:underline flex items-center gap-1 justify-center xs:justify-start"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Análise harmônica completa
                    </button>
                    <button
                      onClick={() => setActiveTab('equalizer')}
                      className="text-zinc-400 hover:text-white flex items-center gap-1 justify-center xs:justify-start"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      Ajustar EQ 10-Bandas
                    </button>
                  </div>
                </div>
              </div>

              {/* Up Next / Mini Queue Sidebar */}
              <div className="bg-[#111113] border border-zinc-800 rounded-lg p-5 flex flex-col">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-3 text-xs font-mono text-zinc-300">
                  <span className="font-semibold flex items-center gap-1.5">
                    <ListMusic className="w-4 h-4 text-[#00ff88]" />
                    FILA DE REPRODUÇÃO ({tracks.length})
                  </span>
                  <button
                    onClick={() => setActiveTab('library')}
                    className="text-zinc-500 hover:text-zinc-300"
                  >
                    Ver Todas
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto max-h-80 space-y-1 pr-1">
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
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="font-mono text-[10px] text-zinc-500 w-4 text-right">
                            {idx + 1}
                          </span>
                          <div className="truncate">
                            <p className="font-medium truncate">{t.title}</p>
                            <p className="text-[10px] text-zinc-500 truncate font-mono">{t.artist}</p>
                          </div>
                        </div>

                        <span className="text-[10px] font-mono text-zinc-500 shrink-0">
                          {t.format}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Library */}
        {activeTab === 'library' && (
          <LibraryView
            tracks={tracks}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            onSelectTrack={handleSelectTrack}
            onPlayPause={handlePlayPause}
            onAnalyzeTrack={(t) => {
              setCurrentTrack(t);
              setActiveTab('ai-harmony');
            }}
          />
        )}

        {/* Tab: Equalizer */}
        {activeTab === 'equalizer' && (
          <EqualizerModal />
        )}

        {/* Tab: GitHub */}
        {activeTab === 'github' && (
          <GitHubView onNotify={showToast} />
        )}

        {/* Tab: AI Harmony & Lyrics */}
        {activeTab === 'ai-harmony' && (
          <AiStudioView currentTrack={currentTrack} />
        )}
      </main>

      {/* Global Interactive Bottom Audio Player */}
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

      {/* Audio Upload Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onAddTrack={handleAddLocalTrack}
      />
    </div>
  );
}
