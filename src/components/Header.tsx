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
      <div className="border-b border-zinc-800/60 bg-[#08080a] px-4 py-1.5 text-[11px] font-mono flex flex-wrap items-center justify-between gap-3 text-zinc-400">
        <div className="flex items-center gap-4 flex-wrap">
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

        <div className="flex items-center gap-3">
          <span className="text-zinc-500 hidden sm:inline">BUILD: v0.1.0-alpha [linux-x64/android]</span>
          <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 font-mono">
            FLAC 24-BIT
          </span>
        </div>
      </div>

      {/* Main navigation & brand bar */}
      <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-[#ff0055]/15 border border-[#ff0055]/40 flex items-center justify-center text-[#ff0055]">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                VIA LÁCTEA <span className="text-[#ff0055]">MUSIC</span>
              </h1>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                PROTÓTIPO & GITHUB
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-mono">
              Audiophile Lossless Player & Ecosystem Architecture
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-[#141416] p-1 rounded-md border border-zinc-800 overflow-x-auto">
          <button
            id="tab-player"
            onClick={() => setActiveTab('player')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'player'
                ? 'bg-[#ff0055] text-white shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            Player & Visualizador
          </button>

          <button
            id="tab-library"
            onClick={() => setActiveTab('library')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'library'
                ? 'bg-[#ff0055] text-white shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            <Music2 className="w-3.5 h-3.5" />
            Biblioteca (495 Faixas)
          </button>

          <button
            id="tab-equalizer"
            onClick={() => setActiveTab('equalizer')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'equalizer'
                ? 'bg-[#ff0055] text-white shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Equalizador 10-Bandas
          </button>

          <button
            id="tab-github"
            onClick={() => setActiveTab('github')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'github'
                ? 'bg-[#ff0055] text-white shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5 text-[#00ff88]" />
            Repositório GitHub
          </button>

          <button
            id="tab-ai-harmony"
            onClick={() => setActiveTab('ai-harmony')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'ai-harmony'
                ? 'bg-[#ff0055] text-white shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            IA Harmonia & Cifras
          </button>
        </nav>

        {/* Action Button: Import Audio */}
        <div className="flex items-center gap-2">
          <button
            id="btn-upload-audio"
            onClick={onOpenUpload}
            className="px-3 py-1.5 rounded-md border border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
            title="Importar arquivo MP3, WAV ou FLAC do seu computador"
          >
            <Upload className="w-3.5 h-3.5 text-zinc-300" />
            <span>Adicionar Áudio Local</span>
          </button>
        </div>
      </div>
    </header>
  );
};
