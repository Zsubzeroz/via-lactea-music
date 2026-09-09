import React from 'react';
import { ActiveTab } from '../types';
import { 
  Play, 
  Sliders, 
  GitBranch, 
  Sparkles, 
  Music2, 
  Upload, 
  Radio, 
  Smartphone,
  HardDrive,
  CheckCircle2
} from 'lucide-react';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenUpload: () => void;
  isPlaying: boolean;
  activeTrackTitle?: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenUpload,
  isPlaying,
  activeTrackTitle,
}) => {
  return (
    <header className="border-b border-zinc-800 bg-[#0c0c0e] sticky top-0 z-40">
      {/* Top telemetry strip */}
      <div className="border-b border-zinc-800/60 bg-[#08080a] px-3 sm:px-4 py-1 text-[10px] sm:text-[11px] font-mono flex items-center justify-between gap-2 text-zinc-400">
        {/* Mobile condensed telemetry */}
        <div className="flex sm:hidden items-center gap-2 truncate">
          <span className="flex items-center gap-1 text-zinc-200">
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-[#00ff88] animate-pulse' : 'bg-[#ff0055]'}`} />
            {isPlaying ? 'DSP 48kHz' : 'DSP STANDBY'}
          </span>
          <span className="text-zinc-600">•</span>
          <span className="text-zinc-400 truncate">495 FAIXAS</span>
        </div>

        {/* Desktop detailed telemetry */}
        <div className="hidden sm:flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-1.5 text-zinc-300">
            <span className={`inline-block w-2 h-2 rounded-full ${isPlaying ? 'bg-[#00ff88] animate-pulse' : 'bg-[#ff0055]'}`} />
            ENGINE: {isPlaying ? 'DSP ATIVO (48kHz)' : 'STANDBY'}
          </span>
          <span className="text-zinc-600">|</span>
          <span className="flex items-center gap-1 text-zinc-300">
            <HardDrive className="w-3.5 h-3.5 text-zinc-400" />
            R2 CLOUDFLARE: <strong className="text-emerald-400 font-medium">10GB EGRESS ZERO</strong> (3.9GB USADO)
          </span>
          <span className="text-zinc-600">|</span>
          <span className="flex items-center gap-1 text-zinc-300">
            <Smartphone className="w-3.5 h-3.5 text-zinc-400" />
            REDMI 15C: <strong className="text-zinc-200">495 FAIXAS SINCRONIZADAS</strong>
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-zinc-500 hidden md:inline">BUILD: v0.1.0-alpha</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 font-mono">
            FLAC 24-BIT
          </span>
        </div>
      </div>

      {/* Main Brand & Action Row */}
      <div className="px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between gap-2 border-b border-zinc-800/40">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-md bg-[#ff0055]/15 border border-[#ff0055]/40 flex items-center justify-center text-[#ff0055] shrink-0">
            <Radio className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm sm:text-base font-bold tracking-tight text-white flex items-center gap-1 truncate">
                VIA LÁCTEA <span className="text-[#ff0055]">MUSIC</span>
              </h1>
              <span className="hidden sm:inline-block text-[9px] uppercase font-mono px-1 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                PROTÓTIPO
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-zinc-400 font-mono truncate hidden xs:block">
              Audiophile Lossless Player & GitHub Architecture
            </p>
          </div>
        </div>

        {/* Action Button: Import Audio */}
        <button
          id="btn-upload-audio"
          onClick={onOpenUpload}
          className="px-2.5 sm:px-3 py-1.5 rounded-md border border-zinc-700 bg-zinc-800/90 hover:bg-zinc-700 text-zinc-200 text-xs font-medium flex items-center gap-1.5 transition-colors shrink-0 shadow-sm active:scale-95"
          title="Importar arquivo MP3, WAV ou FLAC do seu computador"
        >
          <Upload className="w-3.5 h-3.5 text-[#ff0055]" />
          <span className="hidden xs:inline">Adicionar</span>
          <span>Áudio</span>
        </button>
      </div>

      {/* Navigation Tabs Bar (Horizontal scrolling on mobile) */}
      <div className="px-2 sm:px-4 py-1.5 bg-[#0a0a0c] overflow-x-auto scrollbar-none flex items-center gap-1 touch-pan-x">
        <button
          id="tab-player"
          onClick={() => setActiveTab('player')}
          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 active:scale-95 ${
            activeTab === 'player'
              ? 'bg-[#ff0055] text-white shadow-sm'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
          }`}
        >
          <Play className="w-3.5 h-3.5" />
          <span>Player & Visualizador</span>
        </button>

        <button
          id="tab-library"
          onClick={() => setActiveTab('library')}
          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 active:scale-95 ${
            activeTab === 'library'
              ? 'bg-[#ff0055] text-white shadow-sm'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
          }`}
        >
          <Music2 className="w-3.5 h-3.5" />
          <span>Biblioteca (495)</span>
        </button>

        <button
          id="tab-equalizer"
          onClick={() => setActiveTab('equalizer')}
          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 active:scale-95 ${
            activeTab === 'equalizer'
              ? 'bg-[#ff0055] text-white shadow-sm'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Equalizador 10-Bandas</span>
        </button>

        <button
          id="tab-github"
          onClick={() => setActiveTab('github')}
          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 active:scale-95 ${
            activeTab === 'github'
              ? 'bg-[#ff0055] text-white shadow-sm'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
          }`}
        >
          <GitBranch className="w-3.5 h-3.5 text-[#00ff88]" />
          <span>GitHub Hub</span>
        </button>

        <button
          id="tab-ai-harmony"
          onClick={() => setActiveTab('ai-harmony')}
          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 active:scale-95 ${
            activeTab === 'ai-harmony'
              ? 'bg-[#ff0055] text-white shadow-sm'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>IA Harmonia</span>
        </button>
      </div>
    </header>
  );
};
