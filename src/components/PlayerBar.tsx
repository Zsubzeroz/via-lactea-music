import React, { useState } from 'react';
import { Track } from '../types';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  RotateCcw, 
  RotateCw, 
  Volume2, 
  VolumeX, 
  Shuffle, 
  Repeat, 
  Sliders, 
  HardDrive,
  FileAudio,
  Download,
  Check
} from 'lucide-react';

interface PlayerBarProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isShuffle: boolean;
  isLoop: boolean;
  isOffline: boolean;
  onPlayPause: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onSeek: (seconds: number) => void;
  onVolumeChange: (val: number) => void;
  onToggleShuffle: () => void;
  onToggleLoop: () => void;
  onOpenEqualizer: () => void;
  onDownloadOffline: () => void;
}

export const PlayerBar: React.FC<PlayerBarProps> = ({
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  volume,
  isShuffle,
  isLoop,
  isOffline,
  onPlayPause,
  onPrevious,
  onNext,
  onSeek,
  onVolumeChange,
  onToggleShuffle,
  onToggleLoop,
  onOpenEqualizer,
  onDownloadOffline,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(volume);

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(ratio * duration);
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      onVolumeChange(prevVolume || 0.8);
    } else {
      setPrevVolume(volume);
      setIsMuted(true);
      onVolumeChange(0);
    }
  };

  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <div className="border-t border-zinc-800 bg-[#0c0c0e] px-3 sm:px-4 py-2 sm:py-3 sticky bottom-0 z-40 shadow-2xl backdrop-blur-md">
      {/* Waveform Scrubber Line */}
      <div 
        id="scrubber-bar"
        onClick={handleProgressBarClick}
        className="w-full h-3 -mt-2 sm:-mt-3 mb-1.5 cursor-pointer group flex items-center"
      >
        <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden relative group-hover:h-2 transition-all">
          <div 
            className="h-full bg-[#ff0055] transition-all duration-75 relative"
            style={{ width: `${progressPercent}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full opacity-0 group-hover:opacity-100 shadow" />
          </div>
        </div>
      </div>

      {/* MOBILE COMPACT PLAYER (< 640px) */}
      <div className="flex sm:hidden items-center justify-between gap-2">
        {/* Track Info (Click opens Equalizer or shows info) */}
        <div className="flex items-center gap-2 min-w-0 flex-1 pr-1">
          <div className="w-9 h-9 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 relative">
            <FileAudio className={`w-5 h-5 ${isPlaying ? 'text-[#ff0055]' : 'text-zinc-500'}`} />
            {isPlaying && (
              <span className="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-[#00ff88]" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-zinc-100 truncate">
              {currentTrack ? currentTrack.title : 'Nenhuma faixa'}
            </p>
            <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-mono truncate">
              <span className="truncate">{currentTrack?.artist || 'Selecione uma faixa'}</span>
              {currentTrack && (
                <>
                  <span className="text-zinc-600">•</span>
                  <span className="text-[#00ff88] shrink-0 font-bold">{currentTrack.format}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Action Controls */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onDownloadOffline}
            className={`w-9 h-9 rounded flex items-center justify-center transition-colors ${
              isOffline
                ? 'text-[#00ff88]'
                : 'text-zinc-400 hover:text-[#00ff88] active:bg-zinc-800'
            }`}
            title={isOffline ? 'Disponível offline' : 'Salvar offline'}
          >
            {isOffline ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
          </button>

          <button
            id="btn-mobile-eq"
            onClick={onOpenEqualizer}
            className="w-9 h-9 rounded flex items-center justify-center text-zinc-400 hover:text-white active:bg-zinc-800 transition-colors"
            title="Equalizador"
          >
            <Sliders className="w-4 h-4 text-[#ff0055]" />
          </button>

          <button
            id="btn-mobile-prev"
            onClick={onPrevious}
            className="w-9 h-9 rounded flex items-center justify-center text-zinc-300 active:bg-zinc-800 transition-colors"
            title="Anterior"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            id="btn-mobile-play"
            onClick={onPlayPause}
            className="w-10 h-10 rounded-full bg-[#ff0055] active:bg-[#ff0055]/80 text-white flex items-center justify-center transition-transform active:scale-95 shadow-md shrink-0"
            title={isPlaying ? 'Pausar' : 'Tocar'}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
          </button>

          <button
            id="btn-mobile-next"
            onClick={onNext}
            className="w-9 h-9 rounded flex items-center justify-center text-zinc-300 active:bg-zinc-800 transition-colors"
            title="Próxima"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* DESKTOP AUDIOPHILE PLAYER (>= 640px) */}
      <div className="hidden sm:flex items-center justify-between gap-4">
        {/* Track Metadata (Left) */}
        <div className="flex items-center gap-3 min-w-[220px] max-w-sm">
          <div className="w-11 h-11 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center relative overflow-hidden shrink-0">
            <FileAudio className={`w-6 h-6 ${isPlaying ? 'text-[#ff0055]' : 'text-zinc-500'}`} />
            {isPlaying && (
              <span className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-ping" />
            )}
          </div>

          <div className="truncate">
            <div className="flex items-center gap-2 truncate">
              <span className="text-sm font-semibold text-zinc-100 truncate">
                {currentTrack ? currentTrack.title : 'Nenhuma faixa selecionada'}
              </span>
              {currentTrack && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 shrink-0">
                  {currentTrack.format}
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400 truncate">
              {currentTrack ? `${currentTrack.artist} • ${currentTrack.album}` : 'Selecione uma faixa na biblioteca'}
            </p>
          </div>
        </div>

        {/* Playback Controls (Center) */}
        <div className="flex flex-col items-center gap-1.5 flex-1 max-w-md">
          <div className="flex items-center gap-3">
            <button
              id="btn-shuffle"
              onClick={onToggleShuffle}
              className={`p-1.5 rounded hover:bg-zinc-800 transition-colors ${
                isShuffle ? 'text-[#ff0055]' : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title="Modo Aleatório"
            >
              <Shuffle className="w-4 h-4" />
            </button>

            <button
              id="btn-prev"
              onClick={onPrevious}
              className="p-1.5 rounded text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
              title="Faixa Anterior"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              id="btn-rewind-10"
              onClick={() => onSeek(Math.max(0, currentTime - 10))}
              className="p-1.5 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors text-xs"
              title="Retroceder 10s"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <button
              id="btn-play-pause"
              onClick={onPlayPause}
              className="w-10 h-10 rounded-md bg-[#ff0055] hover:bg-[#ff0055]/90 text-white flex items-center justify-center transition-transform active:scale-95 shadow-md"
              title={isPlaying ? 'Pausar (Espaço)' : 'Tocar (Espaço)'}
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
            </button>

            <button
              id="btn-forward-10"
              onClick={() => onSeek(Math.min(duration, currentTime + 10))}
              className="p-1.5 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors text-xs"
              title="Avançar 10s"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>

            <button
              id="btn-next"
              onClick={onNext}
              className="p-1.5 rounded text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
              title="Próxima Faixa"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            <button
              id="btn-loop"
              onClick={onToggleLoop}
              className={`p-1.5 rounded hover:bg-zinc-800 transition-colors ${
                isLoop ? 'text-[#ff0055]' : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title="Repetir Faixa Atual"
            >
              <Repeat className="w-4 h-4" />
            </button>
          </div>

          {/* Time indicator */}
          <div className="text-[11px] font-mono text-zinc-400 flex items-center gap-2">
            <span className="text-zinc-200">{formatTime(currentTime)}</span>
            <span>/</span>
            <span>{formatTime(duration)}</span>
            {currentTrack && (
              <span className="text-zinc-600 hidden sm:inline">
                [{currentTrack.bitrate} • {currentTrack.bpm} BPM]
              </span>
            )}
          </div>
        </div>

        {/* Volume & Studio Tools (Right) */}
        <div className="flex items-center gap-3 min-w-[200px] justify-end">
          <button
            onClick={onDownloadOffline}
            className={`p-1.5 rounded transition-colors ${
              isOffline
                ? 'text-[#00ff88]'
                : 'text-zinc-500 hover:text-[#00ff88] hover:bg-zinc-800'
            }`}
            title={isOffline ? 'Disponível offline' : 'Salvar offline'}
          >
            {isOffline ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
          </button>

          <button
            id="btn-quick-eq"
            onClick={onOpenEqualizer}
            className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono flex items-center gap-1.5 border border-zinc-700"
            title="Abrir Equalizador Paramétrico"
          >
            <Sliders className="w-3.5 h-3.5 text-[#ff0055]" />
            <span>EQ 10-Band</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="text-zinc-400 hover:text-zinc-200 p-1"
              title={isMuted ? 'Desmutar' : 'Mutar'}
            >
              {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                if (isMuted) setIsMuted(false);
                onVolumeChange(parseFloat(e.target.value));
              }}
              className="w-20 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#ff0055]"
            />
            <span className="text-[10px] font-mono text-zinc-500 w-8 text-right">
              {Math.round((isMuted ? 0 : volume) * 100)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
