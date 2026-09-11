import React from 'react';
import { ActiveTab } from '../types';
import { Play, Sliders, Music2, Upload, Download, Radio, Disc3, Trash2 } from 'lucide-react';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenUpload: () => void;
  onOpenDownload: () => void;
  isPlaying: boolean;
  activeTrackTitle?: string;
  showTrash: boolean;
  onToggleTrash: () => void;
  trashCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenUpload,
  onOpenDownload,
  isPlaying,
  activeTrackTitle,
  showTrash,
  onToggleTrash,
  trashCount,
}) => {
  return (
    <header className="border-b border-zinc-800 bg-[#0c0c0e] sticky top-0 z-40">
      {/* Main Brand & Action Row */}
      <div className="px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-md bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 shrink-0">
            <Radio className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-bold tracking-tight text-white flex items-center gap-1 truncate">
              VIA LÁCTEA <span className="text-zinc-400">MUSIC</span>
            </h1>
            <p className="text-[10px] sm:text-xs text-zinc-400 font-mono truncate">
              {isPlaying ? `Tocando: ${activeTrackTitle}` : 'Player de Música'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenDownload}
            className="px-2.5 sm:px-3 py-1.5 rounded-md border border-zinc-700 bg-zinc-800/90 hover:bg-zinc-700 text-zinc-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-[#00ff88]" />
            <span className="hidden sm:inline">Baixar</span>
          </button>
          <button
            onClick={onOpenUpload}
            className="px-2.5 sm:px-3 py-1.5 rounded-md border border-zinc-700 bg-zinc-800/90 hover:bg-zinc-700 text-zinc-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden sm:inline">Upload</span>
          </button>
          <button
            onClick={onToggleTrash}
            className={`px-2.5 sm:px-3 py-1.5 rounded-md border text-xs font-medium flex items-center gap-1.5 transition-colors relative ${
              showTrash
                ? 'border-zinc-500 bg-zinc-700 text-white'
                : 'border-zinc-700 bg-zinc-800/90 hover:bg-zinc-700 text-zinc-200'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden sm:inline">Lixeira</span>
            {trashCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#ff0055] text-white text-[9px] font-bold flex items-center justify-center">
                {trashCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="px-2 sm:px-4 py-1.5 bg-[#0a0a0c] flex items-center gap-1">
        <button
          onClick={() => setActiveTab('player')}
          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
            activeTab === 'player'
              ? 'bg-zinc-700 text-white'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
          }`}
        >
          <Play className="w-3.5 h-3.5" />
          <span>Player</span>
        </button>

        <button
          onClick={() => setActiveTab('library')}
          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
            activeTab === 'library'
              ? 'bg-zinc-700 text-white'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
          }`}
        >
          <Music2 className="w-3.5 h-3.5" />
          <span>Biblioteca</span>
        </button>

        <button
          onClick={() => setActiveTab('albums')}
          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
            activeTab === 'albums'
              ? 'bg-zinc-700 text-white'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
          }`}
        >
          <Disc3 className="w-3.5 h-3.5" />
          <span>Álbuns</span>
        </button>

        <button
          onClick={() => setActiveTab('equalizer')}
          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
            activeTab === 'equalizer'
              ? 'bg-zinc-700 text-white'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Equalizador</span>
        </button>
      </div>
    </header>
  );
};
