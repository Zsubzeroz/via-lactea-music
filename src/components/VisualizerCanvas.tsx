import React, { useEffect, useRef, useState } from 'react';
import { audioEngine } from '../services/audioEngine';
import { Activity, Gauge, Disc } from 'lucide-react';

interface VisualizerCanvasProps {
  isPlaying: boolean;
  bpm: number;
  format: string;
  sampleRate: string;
  bitrate: string;
}

export const VisualizerCanvas: React.FC<VisualizerCanvasProps> = ({
  isPlaying,
  bpm,
  format,
  sampleRate,
  bitrate,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const peaksRef = useRef<number[]>(new Array(64).fill(0));
  
  const [visualMode, setVisualMode] = useState<'bars' | 'oscilloscope' | 'hybrid'>('hybrid');
  const [vuLevels, setVuLevels] = useState<{ left: number; right: number }>({ left: 0, right: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleResize = () => {
      if (containerRef.current && canvas) {
        canvas.width = containerRef.current.clientWidth;
        canvas.height = containerRef.current.clientHeight;
      }
    };
    handleResize();

    const resizeObserver = new ResizeObserver(handleResize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    const render = () => {
      const { freq, time } = audioEngine.getAnalyserData();
      const width = canvas.width;
      const height = canvas.height;

      // Clear with dark precision canvas background
      ctx.fillStyle = '#0a0a0c';
      ctx.fillRect(0, 0, width, height);

      // Draw technical grid lines
      ctx.strokeStyle = '#18181b';
      ctx.lineWidth = 1;
      const gridRows = 6;
      for (let r = 1; r < gridRows; r++) {
        const y = (height / gridRows) * r;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Calculate RMS for VU meters
      let sumSquares = 0;
      for (let i = 0; i < time.length; i++) {
        const val = (time[i] - 128) / 128;
        sumSquares += val * val;
      }
      const rms = Math.sqrt(sumSquares / time.length);
      const leftLevel = isPlaying ? Math.min(100, Math.round(rms * 160)) : 0;
      const rightLevel = isPlaying ? Math.min(100, Math.round(rms * 145 + Math.random() * 5)) : 0;
      setVuLevels({ left: leftLevel, right: rightLevel });

      // Draw FFT Bars
      if (visualMode === 'bars' || visualMode === 'hybrid') {
        const numBars = 48;
        const barSpacing = 3;
        const totalSpacing = (numBars - 1) * barSpacing;
        const barWidth = Math.max(3, (width - totalSpacing - 24) / numBars);

        for (let i = 0; i < numBars; i++) {
          const dataIndex = Math.floor((i / numBars) * (freq.length * 0.7));
          const value = isPlaying ? freq[dataIndex] : 2;
          const barHeight = Math.max(3, (value / 255) * (height - 30));
          const x = 12 + i * (barWidth + barSpacing);
          const y = height - barHeight - 18;

          // Decay peak line
          if (barHeight > peaksRef.current[i]) {
            peaksRef.current[i] = barHeight;
          } else {
            peaksRef.current[i] = Math.max(2, peaksRef.current[i] - 1.2);
          }

          // Bar gradient / style
          const isHighEnergy = value > 190;
          ctx.fillStyle = isHighEnergy ? '#ff0055' : '#27272a';
          if (isPlaying && value > 60) {
            ctx.fillStyle = i % 4 === 0 ? '#ff0055' : '#3f3f46';
          }
          ctx.fillRect(x, y, barWidth, barHeight);

          // Peak indicator dot
          const peakY = height - peaksRef.current[i] - 18;
          ctx.fillStyle = '#00ff88';
          ctx.fillRect(x, Math.max(6, peakY - 2), barWidth, 2);
        }
      }

      // Draw Oscilloscope Waveform Line
      if (visualMode === 'oscilloscope' || visualMode === 'hybrid') {
        ctx.lineWidth = visualMode === 'hybrid' ? 1.5 : 2;
        ctx.strokeStyle = '#ff0055';
        ctx.beginPath();

        const sliceWidth = width / time.length;
        let x = 0;

        for (let i = 0; i < time.length; i++) {
          const v = time[i] / 128.0;
          const y = (v * (height / 2)) - (visualMode === 'hybrid' ? 10 : 0);

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }

        ctx.lineTo(width, height / 2);
        ctx.stroke();
      }

      // Frequency baseline axis markers
      ctx.fillStyle = '#71717a';
      ctx.font = '10px JetBrains Mono, monospace';
      const markers = ['32Hz', '64Hz', '125Hz', '250Hz', '500Hz', '1kHz', '2kHz', '4kHz', '8kHz', '16kHz'];
      markers.forEach((m, idx) => {
        const mx = 12 + (idx / (markers.length - 1)) * (width - 40);
        ctx.fillText(m, mx, height - 4);
      });

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      resizeObserver.disconnect();
    };
  }, [isPlaying, visualMode]);

  return (
    <div className="border border-zinc-800 bg-[#111113] rounded-md p-3 relative flex flex-col">
      {/* Top Header of Visualizer */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-2 border-b border-zinc-800/80">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#ff0055]" />
          <span className="text-xs font-mono font-semibold tracking-wider text-zinc-200">
            ESPECTRO DE FREQUÊNCIA FFT EM TEMPO REAL
          </span>
          <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${isPlaying ? 'bg-emerald-950 text-[#00ff88] border border-emerald-800' : 'bg-zinc-800 text-zinc-400'}`}>
            {isPlaying ? 'ACTIVE 48kHz' : 'MUTED'}
          </span>
        </div>

        {/* Display mode buttons */}
        <div className="flex items-center gap-1 text-[11px] font-mono">
          <button
            onClick={() => setVisualMode('hybrid')}
            className={`px-2 py-0.5 rounded transition-colors ${
              visualMode === 'hybrid' ? 'bg-[#ff0055] text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            Híbrido
          </button>
          <button
            onClick={() => setVisualMode('bars')}
            className={`px-2 py-0.5 rounded transition-colors ${
              visualMode === 'bars' ? 'bg-[#ff0055] text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            Barras FFT
          </button>
          <button
            onClick={() => setVisualMode('oscilloscope')}
            className={`px-2 py-0.5 rounded transition-colors ${
              visualMode === 'oscilloscope' ? 'bg-[#ff0055] text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            Osciloscópio
          </button>
        </div>
      </div>

      {/* Main Canvas Container */}
      <div ref={containerRef} className="w-full h-44 relative overflow-hidden rounded bg-[#0a0a0c] border border-zinc-800">
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>

      {/* Telemetry & VU Meters Footer */}
      <div className="mt-2.5 pt-2 border-t border-zinc-800/80 grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] font-mono">
        {/* Hardware & Format stats */}
        <div className="flex items-center gap-3 text-zinc-400">
          <div>
            <span className="text-zinc-500">FORMATO: </span>
            <span className="text-zinc-200 font-bold">{format}</span>
          </div>
          <div>
            <span className="text-zinc-500">TAXA: </span>
            <span className="text-zinc-200">{sampleRate}</span>
          </div>
          <div>
            <span className="text-zinc-500">BITRATE: </span>
            <span className="text-zinc-200">{bitrate}</span>
          </div>
          <div>
            <span className="text-zinc-500">BPM: </span>
            <span className="text-[#00ff88] font-bold">{bpm}</span>
          </div>
        </div>

        {/* Dual Channel VU Meter (L / R) */}
        <div className="flex flex-col gap-1 justify-center md:col-span-2">
          <div className="flex items-center gap-2">
            <span className="text-zinc-400 w-4 text-[10px]">CH-L</span>
            <div className="flex-1 h-2 bg-zinc-800 rounded-sm overflow-hidden flex">
              <div
                className={`h-full transition-all duration-75 ${
                  vuLevels.left > 85 ? 'bg-[#ff0055]' : vuLevels.left > 60 ? 'bg-amber-400' : 'bg-[#00ff88]'
                }`}
                style={{ width: `${vuLevels.left}%` }}
              />
            </div>
            <span className="text-zinc-500 text-[10px] w-12 text-right">
              {vuLevels.left > 0 ? `-${Math.round((100 - vuLevels.left) * 0.48)} dB` : '-inf dB'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-zinc-400 w-4 text-[10px]">CH-R</span>
            <div className="flex-1 h-2 bg-zinc-800 rounded-sm overflow-hidden flex">
              <div
                className={`h-full transition-all duration-75 ${
                  vuLevels.right > 85 ? 'bg-[#ff0055]' : vuLevels.right > 60 ? 'bg-amber-400' : 'bg-[#00ff88]'
                }`}
                style={{ width: `${vuLevels.right}%` }}
              />
            </div>
            <span className="text-zinc-500 text-[10px] w-12 text-right">
              {vuLevels.right > 0 ? `-${Math.round((100 - vuLevels.right) * 0.48)} dB` : '-inf dB'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
