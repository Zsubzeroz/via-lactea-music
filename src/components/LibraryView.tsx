import React, { useState, useRef, useEffect } from 'react';
import { Track } from '../types';
import { PLAYLIST_CATEGORIES } from '../data/mockTracks';
import { 
  Play, 
  Pause, 
  Search, 
  Filter, 
  FileAudio, 
  HardDrive, 
  Sparkles, 
  Clock, 
  Music, 
  CheckCircle2, 
  Disc,
  ArrowUpDown,
  SearchX,
  Download,
  DownloadCloud,
  Check,
  Trash2
} from 'lucide-react';

interface LibraryViewProps {
  tracks: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  onSelectTrack: (track: Track) => void;
  onPlayPause: () => void;
  onAnalyzeTrack: (track: Track) => void;
  onDownloadOffline: (track: Track) => void;
  onDeleteTrack: (track: Track) => void;
  offlineTrackIds: Set<string>;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  tracks,
  currentTrack,
  isPlaying,
  onSelectTrack,
  onPlayPause,
  onAnalyzeTrack,
  onDownloadOffline,
  onDeleteTrack,
  offlineTrackIds,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'title' | 'artist' | 'duration' | 'bpm'>('title');
  const listRef = useRef<HTMLDivElement>(null);

  // Scroll to top when category or search changes
  useEffect(() => {
    listRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [selectedCategory, searchQuery, sortBy]);

  const filteredTracks = tracks.filter((track) => {
    const matchesCategory = selectedCategory === 'all' || track.category.toLowerCase().includes(selectedCategory.toLowerCase());
    const query = searchQuery.toLowerCase();
    const matchesQuery = 
      track.title.toLowerCase().includes(query) ||
      track.artist.toLowerCase().includes(query) ||
      track.album.toLowerCase().includes(query) ||
      track.category.toLowerCase().includes(query) ||
      track.localPath.toLowerCase().includes(query);
    return matchesCategory && matchesQuery;
  }).sort((a, b) => {
    if (sortBy === 'title') return a.title.localeCompare(b.title);
    if (sortBy === 'artist') return a.artist.localeCompare(b.artist);
    if (sortBy === 'duration') return b.duration - a.duration;
    if (sortBy === 'bpm') return b.bpm - a.bpm;
    return 0;
  });

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Category Folders Carousel / Chips */}
      <div className="bg-[#111113] border border-zinc-800 rounded-lg p-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-3 text-xs font-mono text-zinc-400">
          <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-zinc-400" />
            PASTAS SINCRONIZADAS DO REDMI 15C [495 FAIXAS]
          </span>
          <span>Armazenamento: ~3.9 GB em Documents/Musica/</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`p-2.5 rounded border text-left flex flex-col justify-between transition-all ${
              selectedCategory === 'all'
                ? 'border-zinc-500 bg-zinc-700/50 text-white'
                : 'border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-mono">TODAS AS FAIXAS</span>
              <span className="text-[10px] font-mono text-zinc-500">{tracks.length}</span>
            </div>
            <span className="text-[10px] text-zinc-500 mt-1">Coleção Completa</span>
          </button>

          {PLAYLIST_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory.toLowerCase() === cat.id.toLowerCase() || 
                               (cat.id === 'piano' && selectedCategory.toLowerCase() === 'piano') ||
                               (cat.id === 'rap-nacional' && selectedCategory.toLowerCase() === 'rap nacional');

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.name.split(' ')[0])}
                className={`p-2.5 rounded border text-left flex flex-col justify-between transition-all ${
                  isSelected
                    ? 'border-zinc-500 bg-zinc-700/50 text-white'
                    : 'border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold truncate">{cat.name}</span>
                  <span className="text-[10px] font-mono text-zinc-500">{cat.trackCount}</span>
                </div>
                <span className="text-[10px] text-zinc-500 truncate mt-1">{cat.folderName}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#111113] border border-zinc-800 rounded-lg p-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por título, artista, álbum ou gênero..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0a0a0c] border border-zinc-800 rounded px-3 py-2 sm:py-1.5 pl-9 text-xs font-mono text-zinc-200 focus:outline-none focus:border-zinc-500 placeholder-zinc-600"
          />
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500 hidden xs:inline-flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5" />
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-[#0a0a0c] border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-300 text-xs focus:outline-none focus:border-zinc-500"
            >
              <option value="title">Título</option>
              <option value="artist">Artista</option>
              <option value="duration">Duração</option>
              <option value="bpm">BPM</option>
            </select>
          </div>

          <span className="text-zinc-500 text-xs">
            <strong className="text-zinc-200">{filteredTracks.length}</strong> de {tracks.length}
          </span>
        </div>
      </div>

      {/* Track List */}
      <div ref={listRef} className="bg-[#111113] border border-zinc-800 rounded-lg overflow-hidden">
        {/* Desktop Header */}
        <div className="hidden sm:grid grid-cols-12 px-4 py-2.5 bg-[#0a0a0c] border-b border-zinc-800 text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
          <div className="col-span-5 sm:col-span-4">Obra / Artista</div>
          <div className="hidden sm:block sm:col-span-3">Álbum & Categoria</div>
          <div className="col-span-4 sm:col-span-3">Formato & Taxa</div>
          <div className="col-span-3 sm:col-span-2 text-right">Ações & Duração</div>
        </div>

        {/* Mobile Sub-header */}
        <div className="sm:hidden px-3 py-2 bg-[#0a0a0c] border-b border-zinc-800 text-[10px] font-mono text-zinc-500 flex justify-between items-center">
          <span>FAIXAS ({filteredTracks.length})</span>
          <span>DURAÇÃO & IA</span>
        </div>

        <div className="divide-y divide-zinc-800/60">
          {filteredTracks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <SearchX className="w-10 h-10 text-zinc-600" />
              <p className="text-sm font-mono text-zinc-400">Nenhuma faixa encontrada</p>
              <p className="text-xs text-zinc-500">Tente ajustar a busca ou trocar de categoria</p>
            </div>
          ) : (
          filteredTracks.map((track) => {
            const isCurrent = currentTrack?.id === track.id;

            return (
              <div
                key={track.id}
                className={`px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-zinc-800/40 transition-colors ${
                  isCurrent ? 'bg-[#ff0055]/10 border-l-2 border-[#ff0055]' : ''
                }`}
              >
                {/* MOBILE TRACK ROW (< 640px) */}
                <div className="flex sm:hidden items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <button
                      onClick={() => {
                        if (isCurrent) {
                          onPlayPause();
                        } else {
                          onSelectTrack(track);
                        }
                      }}
                      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 active:scale-95 transition-transform ${
                        isCurrent
                          ? 'bg-[#ff0055] text-white shadow'
                          : 'bg-zinc-800 text-zinc-400 active:bg-zinc-700'
                      }`}
                    >
                      {isCurrent && isPlaying ? (
                        <Pause className="w-4 h-4 fill-current" />
                      ) : (
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      )}
                    </button>

                    {track.coverUrl ? (
                      <img src={track.coverUrl} alt="" className="w-9 h-9 rounded object-cover bg-zinc-800 shrink-0" />
                    ) : (
                      <div className="w-9 h-9 rounded bg-zinc-800 flex items-center justify-center shrink-0">
                        <Music className="w-4 h-4 text-zinc-600" />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-semibold truncate ${isCurrent ? 'text-white' : 'text-zinc-200'}`}>
                        {track.title}
                      </p>
                      <p className="text-[11px] text-zinc-400 truncate">
                        {track.artist} • <span className="text-zinc-500">{track.album}</span>
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5 font-mono text-[9px]">
                        <span className={`px-1 py-0.2 rounded font-bold ${
                          track.format === 'FLAC' 
                            ? 'bg-emerald-950 text-[#00ff88] border border-emerald-800' 
                            : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                        }`}>
                          {track.format}
                        </span>
                        <span className="text-zinc-400">{track.sampleRate}</span>
                        <span className="text-zinc-600">•</span>
                        <span className="text-zinc-400">{track.bpm} BPM</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 text-right">
                    <button
                      onClick={() => onDeleteTrack(track)}
                      className="w-8 h-8 rounded flex items-center justify-center text-zinc-400 hover:text-red-400 active:bg-zinc-800 transition-colors"
                      title="Mover para lixeira"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDownloadOffline(track)}
                      className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${
                        offlineTrackIds.has(track.id)
                          ? 'text-[#00ff88]'
                          : 'text-zinc-400 hover:text-[#00ff88] active:bg-zinc-800'
                      }`}
                      title={offlineTrackIds.has(track.id) ? 'Disponível offline' : 'Salvar offline'}
                    >
                      {offlineTrackIds.has(track.id) ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <Download className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => onAnalyzeTrack(track)}
                      className="w-8 h-8 rounded flex items-center justify-center text-zinc-400 hover:text-amber-400 active:bg-zinc-800"
                      title="Harmonia & Cifras com IA"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    </button>
                    <span className="text-[11px] font-mono text-zinc-400">
                      {formatDuration(track.duration)}
                    </span>
                  </div>
                </div>

                {/* DESKTOP TRACK ROW (>= 640px) */}
                <div className="hidden sm:grid grid-cols-12 items-center">
                  {/* Title & Artist */}
                  <div className="col-span-5 sm:col-span-4 flex items-center gap-3 pr-2">
                    <button
                      onClick={() => {
                        if (isCurrent) {
                          onPlayPause();
                        } else {
                          onSelectTrack(track);
                        }
                      }}
                      className={`w-8 h-8 rounded flex items-center justify-center shrink-0 transition-transform active:scale-95 ${
                        isCurrent
                          ? 'bg-[#ff0055] text-white shadow'
                          : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
                      }`}
                    >
                      {isCurrent && isPlaying ? (
                        <Pause className="w-4 h-4 fill-current" />
                      ) : (
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      )}
                    </button>

                    {track.coverUrl ? (
                      <img src={track.coverUrl} alt="" className="w-9 h-9 rounded object-cover bg-zinc-800 shrink-0" />
                    ) : (
                      <div className="w-9 h-9 rounded bg-zinc-800 flex items-center justify-center shrink-0">
                        <Music className="w-4 h-4 text-zinc-600" />
                      </div>
                    )}

                    <div className="truncate">
                      <p className={`text-xs font-semibold truncate ${isCurrent ? 'text-white' : 'text-zinc-200'}`}>
                        {track.title}
                      </p>
                      <p className="text-[11px] text-zinc-400 truncate font-mono">
                        {track.artist}
                      </p>
                    </div>
                  </div>

                  {/* Album & Category */}
                  <div className="col-span-3 pr-2 truncate">
                    <p className="text-xs text-zinc-300 truncate">{track.album}</p>
                    <span className="inline-block text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700 mt-0.5">
                      {track.category}
                    </span>
                  </div>

                  {/* Format, Bitrate, BPM */}
                  <div className="col-span-3 pr-2 font-mono text-[11px]">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                        track.format === 'FLAC' 
                          ? 'bg-emerald-950 text-[#00ff88] border border-emerald-800' 
                          : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                      }`}>
                        {track.format}
                      </span>
                      <span className="text-zinc-400">{track.sampleRate}</span>
                      <span className="text-zinc-500 hidden md:inline">{track.bitrate}</span>
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-0.5 truncate">
                      BPM: <span className="text-zinc-300">{track.bpm}</span> | Tom: <span className="text-zinc-300">{track.key}</span>
                    </p>
                  </div>

                  {/* Duration & AI Action */}
                  <div className="col-span-2 flex items-center justify-end gap-2 font-mono text-xs">
                    <button
                      onClick={() => onDeleteTrack(track)}
                      className="p-1 rounded text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-colors"
                      title="Mover para lixeira"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onDownloadOffline(track)}
                      className={`p-1 rounded transition-colors ${
                        offlineTrackIds.has(track.id)
                          ? 'text-[#00ff88]'
                          : 'text-zinc-500 hover:text-[#00ff88] hover:bg-zinc-800'
                      }`}
                      title={offlineTrackIds.has(track.id) ? 'Disponível offline' : 'Salvar offline'}
                    >
                      {offlineTrackIds.has(track.id) ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <Download className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <button
                      onClick={() => onAnalyzeTrack(track)}
                      className="p-1 rounded text-zinc-500 hover:text-amber-400 hover:bg-zinc-800 transition-colors"
                      title="Analisar Harmonia & Cifras com IA"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                    </button>

                    <span className="text-zinc-400 w-10 text-right">
                      {formatDuration(track.duration)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
          )}
        </div>
      </div>
    </div>
  );
};
