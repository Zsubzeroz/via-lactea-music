import React, { useState, useEffect } from 'react';
import { getApiBase } from '../config';
import { Download, X, Check, Loader2, AlertCircle, Music } from 'lucide-react';

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTrackDownloaded?: () => void;
}

interface DownloadedTrack {
  id: string;
  title: string;
  artist: string;
  category: string;
  sizeMB: number;
}

const CATEGORIES = [
  'Piano', 'Rap Nacional', 'Poesia Acústica', 'Música Eletrônica',
  'Treino', 'Trap Nacional', 'Rock', 'Samba Pagode', 'Presbiteriano',
  'Chamou atenção', 'Nacional', 'Hip Hop', 'Rap_Trap', 'Rei do pop',
];

export const DownloadModal: React.FC<DownloadModalProps> = ({
  isOpen,
  onClose,
  onTrackDownloaded,
}) => {
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('Chamou atenção');
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DownloadedTrack | null>(null);

  useEffect(() => {
    if (isOpen) {
      setUrl('');
      setCategory('Chamou atenção');
      setDownloading(false);
      setProgress('');
      setError(null);
      setResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDownload = async () => {
    if (!url.trim()) {
      setError('Cole uma URL válida');
      return;
    }

    setDownloading(true);
    setError(null);
    setResult(null);
    setProgress('Buscando informações do vídeo...');

    try {
      const response = await fetch(`${getApiBase()}/api/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), category }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Falha no download');
      }

      setResult({
        id: data.track.id,
        title: data.track.title,
        artist: data.track.artist,
        category: data.track.category,
        sizeMB: data.track.sizeMB,
      });

      onTrackDownloaded?.();
    } catch (err: any) {
      setError(err.message || 'Erro ao baixar música');
    } finally {
      setDownloading(false);
      setProgress('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-[#111113] border border-zinc-800 rounded-lg p-6 max-w-lg w-full flex flex-col gap-4 relative shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-[#00ff88]" />
            <h3 className="text-sm font-bold text-white tracking-tight">
              BAIXAR MÚSICA — VIA LÁCTEA
            </h3>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-zinc-400 font-mono">
          Cole uma URL do YouTube, SoundCloud ou outra plataforma. O áudio será baixado automaticamente.
        </p>

        {/* URL Input */}
        <div>
          <label className="text-xs font-mono text-zinc-400 block mb-1">URL da Música:</label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
            disabled={downloading}
            className="w-full bg-[#0a0a0c] border border-zinc-800 rounded p-2.5 text-xs font-mono text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 disabled:opacity-50"
          />
        </div>

        {/* Category selector */}
        <div>
          <label className="text-xs font-mono text-zinc-400 block mb-1">Categoria:</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={downloading}
            className="w-full bg-[#0a0a0c] border border-zinc-800 rounded p-2.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-zinc-500 disabled:opacity-50"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Downloading Status */}
        {downloading && (
          <div className="bg-[#0a0a0c] border border-zinc-800 rounded-lg p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-[#00ff88] animate-spin" />
              <span className="text-xs font-mono text-zinc-200">{progress}</span>
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-2">
              <div className="bg-[#00ff88] h-2 rounded-full animate-pulse" style={{ width: '60%' }} />
            </div>
          </div>
        )}

        {/* Success */}
        {result && !downloading && (
          <div className="bg-[#0a0a0c] border border-emerald-800/50 rounded-lg p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-mono text-emerald-300 font-semibold">Download concluído!</span>
            </div>
            <div className="flex items-center gap-3 p-2 rounded bg-zinc-900/60 border border-zinc-800">
              <Music className="w-8 h-8 text-zinc-600 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-mono text-zinc-200 truncate font-semibold">{result.title}</p>
                <p className="text-[10px] font-mono text-zinc-400 truncate">{result.artist}</p>
                <div className="flex gap-2 mt-1">
                  <span className="text-[10px] font-mono text-zinc-500">{result.category}</span>
                  <span className="text-[10px] font-mono text-zinc-500">•</span>
                  <span className="text-[10px] font-mono text-zinc-500">{result.sizeMB} MB</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-950/30 border border-red-800/50 rounded-lg p-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span className="text-xs font-mono text-red-300">{error}</span>
          </div>
        )}

        {/* Actions */}
        <div className="pt-2 border-t border-zinc-800 flex justify-end gap-2 text-xs font-mono">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
          >
            {result ? 'Fechar' : 'Cancelar'}
          </button>
          {!result && !downloading && (
            <button
              onClick={handleDownload}
              disabled={!url.trim()}
              className="px-3 py-1.5 rounded bg-[#00ff88] hover:bg-[#00ff88]/90 text-black font-semibold flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download className="w-3.5 h-3.5" />
              Baixar
            </button>
          )}
          {result && (
            <button
              onClick={() => {
                setUrl('');
                setResult(null);
                setError(null);
              }}
              className="px-3 py-1.5 rounded bg-[#00ff88] hover:bg-[#00ff88]/90 text-black font-semibold flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Baixar Outra
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
