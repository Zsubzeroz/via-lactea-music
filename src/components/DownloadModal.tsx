import React, { useState, useEffect, useRef } from 'react';
import { getApiBase } from '../config';
import { Playlist } from '../types';
import { Download, X, Check, Loader2, AlertCircle, Music, Search, Link as LinkIcon } from 'lucide-react';

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTrackDownloaded?: () => void;
  playlists?: Playlist[];
}

interface SearchResult {
  id: string;
  title: string;
  artist: string;
  duration: number;
  thumbnail: string;
  url: string;
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
  playlists = [],
}) => {
  const [tab, setTab] = useState<'search' | 'url'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('Chamou atenção');
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DownloadedTrack | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTab('search');
      setSearchQuery('');
      setSearchResults([]);
      setSearching(false);
      setSearchError(null);
      setUrl('');
      setCategory('Chamou atenção');
      setDownloading(false);
      setProgress('');
      setError(null);
      setResult(null);
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSearch = async () => {
    if (!searchQuery.trim() || searching) return;
    setSearching(true);
    setSearchError(null);
    setSearchResults([]);
    try {
      const res = await fetch(`${getApiBase()}/api/search?q=${encodeURIComponent(searchQuery.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Busca falhou');
      setSearchResults(data.results || []);
      if ((data.results || []).length === 0) {
        setSearchError('Nenhum resultado encontrado');
      }
    } catch (err: any) {
      setSearchError(err.message || 'Erro ao buscar música');
    } finally {
      setSearching(false);
    }
  };

  const handleDownloadFromUrl = async (downloadUrl: string) => {
    setDownloading(true);
    setError(null);
    setResult(null);
    setProgress('Baixando música...');
    try {
      const response = await fetch(`${getApiBase()}/api/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: downloadUrl, category }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Falha no download');
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

  const handleDownloadFromSearch = (searchResult: SearchResult) => {
    handleDownloadFromUrl(searchResult.url);
  };

  const handleDownloadFromUrlInput = () => {
    if (!url.trim()) {
      setError('Cole uma URL válida');
      return;
    }
    handleDownloadFromUrl(url.trim());
  };

  const formatDuration = (secs: number) => {
    if (!secs) return '--:--';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-[#111113] border border-zinc-800 rounded-lg p-6 max-w-lg w-full flex flex-col gap-4 relative shadow-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
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

        {/* Tab Toggle */}
        <div className="flex gap-1 bg-[#0a0a0c] p-1 rounded-lg border border-zinc-800">
          <button
            onClick={() => setTab('search')}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono transition-colors ${
              tab === 'search'
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            Buscar
          </button>
          <button
            onClick={() => setTab('url')}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono transition-colors ${
              tab === 'url'
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            Colar URL
          </button>
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
            {playlists.map((p) => (
              <option key={p.id} value={p.name}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Search Tab */}
        {tab === 'search' && (
          <>
            <div className="flex gap-2">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Buscar música no YouTube..."
                disabled={searching || downloading}
                className="flex-1 bg-[#0a0a0c] border border-zinc-800 rounded p-2.5 text-xs font-mono text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 disabled:opacity-50"
              />
              <button
                onClick={handleSearch}
                disabled={searching || !searchQuery.trim() || downloading}
                className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              >
                {searching ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Search className="w-3.5 h-3.5" />
                )}
                Buscar
              </button>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="flex flex-col gap-1 overflow-y-auto max-h-60 divide-y divide-zinc-800/60">
                {searchResults.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => handleDownloadFromSearch(r)}
                    disabled={downloading}
                    className="flex items-center gap-3 p-2 rounded hover:bg-zinc-800/60 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <img
                      src={r.thumbnail}
                      alt=""
                      className="w-12 h-9 rounded object-cover bg-zinc-800 shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-zinc-200 truncate">{r.title}</p>
                      <p className="text-[10px] text-zinc-400 truncate">{r.artist}</p>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500 shrink-0">
                      {formatDuration(r.duration)}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {searchError && !searching && (
              <div className="bg-red-950/30 border border-red-800/50 rounded-lg p-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span className="text-xs font-mono text-red-300">{searchError}</span>
              </div>
            )}
          </>
        )}

        {/* URL Tab */}
        {tab === 'url' && (
          <>
            <p className="text-xs text-zinc-400 font-mono">
              Cole uma URL do YouTube, SoundCloud ou outra plataforma. O áudio será baixado automaticamente.
            </p>
            <div>
              <label className="text-xs font-mono text-zinc-400 block mb-1">URL da Música:</label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleDownloadFromUrlInput()}
                placeholder="https://youtube.com/watch?v=..."
                disabled={downloading}
                className="w-full bg-[#0a0a0c] border border-zinc-800 rounded p-2.5 text-xs font-mono text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 disabled:opacity-50"
              />
            </div>
          </>
        )}

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
          {!result && !downloading && tab === 'url' && (
            <button
              onClick={handleDownloadFromUrlInput}
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
                setSearchResults([]);
                setSearchQuery('');
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
