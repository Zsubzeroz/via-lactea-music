import React, { useState } from 'react';
import { EQ_FREQUENCIES, EQ_PRESETS, audioEngine } from '../services/audioEngine';
import { EQPreset } from '../types';
import { Sliders, RotateCcw, Check, Sparkles } from 'lucide-react';

interface EqualizerViewProps {
  onClose?: () => void;
}

export const EqualizerModal: React.FC<EqualizerViewProps> = ({ onClose }) => {
  const [currentGains, setCurrentGains] = useState<number[]>([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const [activePresetName, setActivePresetName] = useState<string>('Flat (Direto de Estúdio)');

  const handleGainChange = (index: number, newGain: number) => {
    const updated = [...currentGains];
    updated[index] = newGain;
    setCurrentGains(updated);
    audioEngine.setEQBandGain(index, newGain);
    setActivePresetName('Customizado');
  };

  const applyPreset = (preset: EQPreset) => {
    setCurrentGains([...preset.gains]);
    setActivePresetName(preset.name);
    audioEngine.applyEQPreset(preset);
  };

  const resetFlat = () => {
    const flat = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    setCurrentGains(flat);
    setActivePresetName('Flat (Direto de Estúdio)');
    flat.forEach((g, i) => audioEngine.setEQBandGain(i, g));
  };

  // Generate SVG path for the EQ curve
  const getCurvePath = () => {
    const width = 600;
    const height = 140;
    const zeroY = height / 2;
    const points = currentGains.map((gain, i) => {
      const x = 30 + (i / (currentGains.length - 1)) * (width - 60);
      // gain is -12 to +12, map to y: +12 -> 15, -12 -> height - 15
      const y = zeroY - (gain / 12) * (zeroY - 15);
      return { x, y };
    });

    if (points.length === 0) return '';
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cx = (prev.x + curr.x) / 2;
      d += ` C ${cx} ${prev.y}, ${cx} ${curr.y}, ${curr.x} ${curr.y}`;
    }
    return d;
  };

  return (
    <div className="bg-[#111113] border border-zinc-800 rounded-lg p-5 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[#ff0055]/15 border border-[#ff0055]/30 flex items-center justify-center text-[#ff0055]">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              EQUALIZADOR PARAMÉTRICO DE ESTÚDIO [10-BANDAS]
            </h2>
            <p className="text-xs text-zinc-400 font-mono">
              Filtros Biquad IIR em cascata direta no pipeline de áudio Web Audio
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={resetFlat}
            className="px-2.5 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono flex items-center gap-1.5 transition-colors border border-zinc-700"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Resetar Flat (0 dB)
          </button>
        </div>
      </div>

      {/* Real-time Frequency Response Curve Graph */}
      <div className="w-full bg-[#0a0a0c] border border-zinc-800 rounded p-3 flex flex-col gap-1 relative overflow-hidden">
        <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500">
          <span>CURVA DE RESPOSTA DSP</span>
          <span className="text-[#00ff88]">GANHO MÁXIMO: +12dB / -12dB</span>
        </div>

        <svg viewBox="0 0 600 140" className="w-full h-32 overflow-visible">
          {/* Grid lines */}
          <line x1="30" y1="20" x2="570" y2="20" stroke="#27272a" strokeDasharray="3 3" />
          <line x1="30" y1="70" x2="570" y2="70" stroke="#3f3f46" strokeWidth="1" />
          <line x1="30" y1="120" x2="570" y2="120" stroke="#27272a" strokeDasharray="3 3" />

          {/* dB labels */}
          <text x="5" y="24" fill="#71717a" fontSize="10" fontFamily="JetBrains Mono">+12</text>
          <text x="12" y="74" fill="#71717a" fontSize="10" fontFamily="JetBrains Mono">0</text>
          <text x="5" y="124" fill="#71717a" fontSize="10" fontFamily="JetBrains Mono">-12</text>

          {/* Response curve fill & stroke */}
          <path
            d={`${getCurvePath()} L 570 70 L 30 70 Z`}
            fill="#ff0055"
            fillOpacity="0.08"
          />
          <path
            d={getCurvePath()}
            fill="none"
            stroke="#ff0055"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Nodes on curve */}
          {currentGains.map((gain, i) => {
            const x = 30 + (i / (currentGains.length - 1)) * (600 - 60);
            const y = 70 - (gain / 12) * (70 - 15);
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r="3.5"
                fill="#ffffff"
                stroke="#ff0055"
                strokeWidth="2"
              />
            );
          })}
        </svg>
      </div>

      {/* Preset Selectors */}
      <div>
        <div className="text-xs font-mono font-semibold text-zinc-300 mb-2 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          PRESETS ACÚSTICOS CALIBRADOS:
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {EQ_PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => applyPreset(preset)}
              className={`p-2 rounded border text-left flex flex-col justify-between transition-all ${
                activePresetName === preset.name
                  ? 'border-[#ff0055] bg-[#ff0055]/10 text-white'
                  : 'border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium truncate">{preset.name.split('(')[0]}</span>
                {activePresetName === preset.name && <Check className="w-3 h-3 text-[#ff0055] shrink-0" />}
              </div>
              <span className="text-[10px] text-zinc-500 line-clamp-1 mt-1">{preset.description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 10 Vertical Sliders */}
      <div className="bg-[#0a0a0c] border border-zinc-800 rounded p-4">
        <div className="grid grid-cols-10 gap-2 items-end justify-items-center h-52 pb-2">
          {EQ_FREQUENCIES.map((freq, index) => {
            const gain = currentGains[index];
            const label = freq >= 1000 ? `${freq / 1000}k` : `${freq}`;

            return (
              <div key={freq} className="flex flex-col items-center h-full justify-between w-full">
                {/* dB Readout */}
                <span className={`text-[10px] font-mono ${gain > 0 ? 'text-[#ff0055]' : gain < 0 ? 'text-sky-400' : 'text-zinc-500'}`}>
                  {gain > 0 ? `+${gain.toFixed(1)}` : gain.toFixed(1)}
                </span>

                {/* Slider */}
                <div className="relative h-36 flex items-center justify-center">
                  {/* Center zero line marker */}
                  <div className="absolute w-4 h-0.5 bg-zinc-700 pointer-events-none" />
                  
                  <input
                    type="range"
                    min="-12"
                    max="12"
                    step="0.5"
                    value={gain}
                    onChange={(e) => handleGainChange(index, parseFloat(e.target.value))}
                    className="h-32 -rotate-90 appearance-none bg-zinc-800 rounded cursor-pointer accent-[#ff0055] w-32"
                  />
                </div>

                {/* Frequency Band Label */}
                <span className="text-[11px] font-mono font-medium text-zinc-300 mt-1">
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
