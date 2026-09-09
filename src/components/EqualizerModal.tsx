import React, { useState, useRef, useCallback } from 'react';
import { EQ_FREQUENCIES, EQ_PRESETS, audioEngine } from '../services/audioEngine';
import { EQPreset } from '../types';
import { Sliders, RotateCcw, Check, Sparkles } from 'lucide-react';

interface EqualizerViewProps {
  onClose?: () => void;
}

const SVG_W = 600;
const SVG_H = 140;
const PAD_X = 30;
const PAD_Y = 15;
const ZERO_Y = SVG_H / 2;

function gainToY(gain: number): number {
  return ZERO_Y - (gain / 12) * (ZERO_Y - PAD_Y);
}

function yToGain(y: number): number {
  const raw = ((ZERO_Y - y) / (ZERO_Y - PAD_Y)) * 12;
  return Math.round(Math.max(-12, Math.min(12, raw)) * 2) / 2;
}

function indexToX(i: number): number {
  return PAD_X + (i / 9) * (SVG_W - PAD_X * 2);
}

function buildCurvePath(gains: number[]): string {
  if (gains.length === 0) return '';
  const points = gains.map((g, i) => ({ x: indexToX(i), y: gainToY(g) }));
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cx = (prev.x + curr.x) / 2;
    d += ` C ${cx} ${prev.y}, ${cx} ${curr.y}, ${curr.x} ${curr.y}`;
  }
  return d;
}

export const EqualizerModal: React.FC<EqualizerViewProps> = ({ onClose }) => {
  const [currentGains, setCurrentGains] = useState<number[]>([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const [activePresetName, setActivePresetName] = useState<string>('Flat (Direto de Estúdio)');
  const svgRef = useRef<SVGSVGElement>(null);
  const draggingRef = useRef<number | null>(null);

  const applyGains = (gains: number[]) => {
    setCurrentGains(gains);
    gains.forEach((g, i) => audioEngine.setEQBandGain(i, g));
  };

  const handleGainChange = (index: number, newGain: number) => {
    const updated = [...currentGains];
    updated[index] = newGain;
    applyGains(updated);
    setActivePresetName('Customizado');
  };

  const applyPreset = (preset: EQPreset) => {
    setCurrentGains([...preset.gains]);
    setActivePresetName(preset.name);
    audioEngine.applyEQPreset(preset);
  };

  const resetFlat = () => {
    const flat = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    applyGains(flat);
    setActivePresetName('Flat (Direto de Estúdio)');
  };

  // Drag handlers for SVG curve nodes
  const getSVGPoint = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    const scaleX = SVG_W / rect.width;
    const scaleY = SVG_H / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }, []);

  const findClosestBand = useCallback((px: number): number | null => {
    let closest = 0;
    let minDist = Infinity;
    for (let i = 0; i < 10; i++) {
      const bx = indexToX(i);
      const by = gainToY(currentGains[i]);
      const dist = Math.hypot(px - bx, 0); // horizontal proximity only
      if (dist < minDist) {
        minDist = dist;
        closest = i;
      }
    }
    return minDist < 60 ? closest : null;
  }, [currentGains]);

  const onPointerDown = (e: React.PointerEvent) => {
    const pt = getSVGPoint(e.clientX, e.clientY);
    if (!pt) return;
    const band = findClosestBand(pt.x);
    if (band === null) return;

    draggingRef.current = band;
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (draggingRef.current === null) return;
    const pt = getSVGPoint(e.clientX, e.clientY);
    if (!pt) return;
    const newGain = yToGain(pt.y);
    const updated = [...currentGains];
    updated[draggingRef.current] = newGain;
    applyGains(updated);
    setActivePresetName('Customizado');
  };

  const onPointerUp = () => {
    draggingRef.current = null;
  };

  const curvePath = buildCurvePath(currentGains);

  return (
    <div className="bg-[#111113] border border-zinc-800 rounded-lg p-5 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              EQUALIZADOR PARAMÉTRICO DE ESTÚDIO [10-BANDAS]
            </h2>
            <p className="text-xs text-zinc-400 font-mono">
              Arraste os pontos da curva ou use os sliders abaixo
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

      {/* Interactive Frequency Response Curve */}
      <div className="w-full bg-[#0a0a0c] border border-zinc-800 rounded p-3 flex flex-col gap-1 relative overflow-hidden">
        <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500">
          <span>CURVA DE RESPOSTA DSP — arraste os pontos</span>
          <span className="text-[#00ff88]">GANHO: +12dB / -12dB</span>
        </div>

        <svg
          ref={svgRef}
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          className="w-full h-32 overflow-visible cursor-crosshair touch-none"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {/* Grid */}
          <line x1={PAD_X} y1={PAD_Y} x2={SVG_W - PAD_X} y2={PAD_Y} stroke="#27272a" strokeDasharray="3 3" />
          <line x1={PAD_X} y1={ZERO_Y} x2={SVG_W - PAD_X} y2={ZERO_Y} stroke="#3f3f46" strokeWidth="1" />
          <line x1={PAD_X} y1={SVG_H - PAD_Y} x2={SVG_W - PAD_X} y2={SVG_H - PAD_Y} stroke="#27272a" strokeDasharray="3 3" />

          {/* dB labels */}
          <text x="5" y={PAD_Y + 4} fill="#71717a" fontSize="10" fontFamily="JetBrains Mono">+12</text>
          <text x="12" y={ZERO_Y + 4} fill="#71717a" fontSize="10" fontFamily="JetBrains Mono">0</text>
          <text x="5" y={SVG_H - PAD_Y + 4} fill="#71717a" fontSize="10" fontFamily="JetBrains Mono">-12</text>

          {/* Frequency labels */}
          {EQ_FREQUENCIES.map((freq, i) => {
            const x = indexToX(i);
            const label = freq >= 1000 ? `${freq / 1000}k` : `${freq}`;
            return (
              <text key={i} x={x} y={SVG_H - 2} fill="#52525b" fontSize="8" fontFamily="JetBrains Mono" textAnchor="middle">
                {label}
              </text>
            );
          })}

          {/* Curve fill */}
          <path
            d={`${curvePath} L ${indexToX(9)} ${ZERO_Y} L ${indexToX(0)} ${ZERO_Y} Z`}
            fill="#ff0055"
            fillOpacity="0.08"
          />

          {/* Curve stroke */}
          <path
            d={curvePath}
            fill="none"
            stroke="#ff0055"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Draggable nodes */}
          {currentGains.map((gain, i) => {
            const x = indexToX(i);
            const y = gainToY(gain);
            const isDragging = draggingRef.current === i;
            return (
              <g key={i}>
                {/* Larger hit area */}
                <circle cx={x} cy={y} r="14" fill="transparent" />
                {/* Visual dot */}
                <circle
                  cx={x}
                  cy={y}
                  r={isDragging ? "6" : "4"}
                  fill="#ffffff"
                  stroke="#ff0055"
                  strokeWidth="2"
                  className="transition-all"
                />
                {/* dB label on hover/drag */}
                {(isDragging || Math.abs(gain) > 0.5) && (
                  <text
                    x={x}
                    y={y - 10}
                    fill="#ffffff"
                    fontSize="9"
                    fontFamily="JetBrains Mono"
                    textAnchor="middle"
                    fontWeight="bold"
                  >
                    {gain > 0 ? `+${gain.toFixed(1)}` : gain.toFixed(1)}
                  </text>
                )}
              </g>
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
              className={`p-2 rounded border text-left flex flex-col justify-between transition-all min-h-[64px] ${
                activePresetName === preset.name
                  ? 'border-zinc-500 bg-zinc-700/50 text-white'
                  : 'border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium truncate">{preset.name.split('(')[0]}</span>
                {activePresetName === preset.name && <Check className="w-3 h-3 text-zinc-300 shrink-0" />}
              </div>
              <span className="text-[10px] text-zinc-500 line-clamp-2 mt-1 leading-tight" title={preset.description}>
                {preset.description}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 10 Vertical Sliders */}
      <div className="bg-[#0a0a0c] border border-zinc-800 rounded p-3 sm:p-4">
        <div className="flex sm:hidden items-center justify-between text-[11px] font-mono text-zinc-400 mb-3 pb-1 border-b border-zinc-800/60">
          <span className="flex items-center gap-1 text-zinc-300">
            <Sliders className="w-3 h-3 text-zinc-400" /> 10 Bandas Paramétricas
          </span>
          <span className="text-zinc-500 text-[10px]">Deslize horizontalmente ➔</span>
        </div>

        <div className="overflow-x-auto scrollbar-thin pb-2 touch-pan-x -mx-1 px-1">
          <div className="min-w-[560px] sm:min-w-0 grid grid-cols-10 gap-2 items-end justify-items-center h-52 pb-2">
            {EQ_FREQUENCIES.map((freq, index) => {
              const gain = currentGains[index];
              const label = freq >= 1000 ? `${freq / 1000}k` : `${freq}`;

              return (
                <div key={freq} className="flex flex-col items-center h-full justify-between w-full min-w-[48px]">
                  <span className={`text-[10px] font-mono font-bold ${gain > 0 ? 'text-[#ff0055]' : gain < 0 ? 'text-sky-400' : 'text-zinc-500'}`}>
                    {gain > 0 ? `+${gain.toFixed(1)}` : gain.toFixed(1)}
                  </span>

                  <div className="relative h-36 flex items-center justify-center">
                    <div className="absolute w-5 h-0.5 bg-zinc-700 pointer-events-none" />
                    <input
                      type="range"
                      min="-12"
                      max="12"
                      step="0.5"
                      value={gain}
                      onChange={(e) => handleGainChange(index, parseFloat(e.target.value))}
                      className="h-32 -rotate-90 appearance-none bg-zinc-800 rounded cursor-pointer accent-zinc-400 w-32 touch-none"
                    />
                  </div>

                  <span className="text-[11px] font-mono font-medium text-zinc-300 mt-1">
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
