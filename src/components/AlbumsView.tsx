import React, { useMemo, useState } from 'react';
import { Track } from '../types';
import { Disc3, Play, Pause, Music, Download, Check } from 'lucide-react';

interface AlbumsViewProps {
  tracks: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  onSelectTrack: (track: Track) => void;
  onPlayFromQueue: (tracks: Track[], track: Track) => void;
  onPlayPause: () => void;
  onDownloadOffline: (track: Track) => void;
  offlineTrackIds: Set<string>;
}

interface AlbumGroup {
  album: string;
  category: string;
  tracks: Track[];
  coverUrl?: string;
}

function generatePlaceholderGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h1 = Math.abs(hash % 360);
  const h2 = (h1 + 40) % 360;
  return `linear-gradient(135deg, hsl(${h1}, 40%, 15%) 0%, hsl(${h2}, 35%, 10%) 100%)`;
}

function getInitial(name: string): string {
  return name.charAt(0).toUpperCase();
}

export const AlbumsView: React.FC<AlbumsViewProps> = ({
  tracks,
  currentTrack,
  isPlaying,
  onSelectTrack,
  onPlayFromQueue,
  onPlayPause,
  onDownloadOffline,
  offlineTrackIds,
}) => {
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);

  // Group tracks by album within each category
  const albumsByCategory = useMemo(() => {
    const grouped = new Map<string, AlbumGroup[]>();

    for (const track of tracks) {
      const cat = track.category || 'Sem Categoria';
      if (!grouped.has(cat)) {
        grouped.set(cat, []);
      }
      const catAlbums = grouped.get(cat)!;
      const existing = catAlbums.find((a) => a.album === track.album);
      if (existing) {
        existing.tracks.push(track);
      } else {
        catAlbums.push({
          album: track.album,
          category: cat,
          tracks: [track],
          coverUrl: track.coverUrl,
        });
      }
    }

    // Sort albums within each category by name
    for (const catAlbums of grouped.values()) {
      catAlbums.sort((a, b) => a.album.localeCompare(b.album));
    }

    return grouped;
  }, [tracks]);

  // Find all tracks in the selected album for queue
  const selectedAlbumTracks = useMemo(() => {
    if (!selectedAlbum) return [];
    for (const catAlbums of albumsByCategory.values()) {
      const found = catAlbums.find((a) => a.album === selectedAlbum);
      if (found) return found.tracks;
    }
    return [];
  }, [selectedAlbum, albumsByCategory]);

  const handleAlbumClick = (album: AlbumGroup) => {
    setSelectedAlbum(album.album);
    // Play first track of the album with album queue
    if (album.tracks.length > 0) {
      onPlayFromQueue(album.tracks, album.tracks[0]);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Category sections */}
      {Array.from(albumsByCategory.entries()).map(([category, albums]) => (
        <div key={category}>
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-zinc-800">
            <Music className="w-4 h-4 text-zinc-400" />
            <h2 className="text-sm font-mono font-semibold text-zinc-200 uppercase tracking-wider">
              {category}
            </h2>
            <span className="text-[10px] font-mono text-zinc-500">
              {albums.length} {albums.length === 1 ? 'álbum' : 'álbuns'}
            </span>
          </div>

          {/* Album grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {albums.map((album) => {
              const isCurrentAlbum = album.tracks.some((t) => t.id === currentTrack?.id);
              const hasMultiple = album.tracks.length > 1;

              return (
                <button
                  key={album.album}
                  onClick={() => handleAlbumClick(album)}
                  className={`group relative flex flex-col gap-2 p-3 rounded-lg border transition-all ${
                    selectedAlbum === album.album
                      ? 'border-zinc-500 bg-zinc-800/50'
                      : 'border-zinc-800 bg-[#111113] hover:border-zinc-700 hover:bg-zinc-800/30'
                  }`}
                >
                  {/* Album cover with stacked effect */}
                  <div className="relative aspect-square w-full">
                    {/* Stacked cards behind (for albums with multiple tracks) */}
                    {hasMultiple && (
                      <>
                        <div
                          className="absolute inset-0 rounded-md border border-zinc-700/50"
                          style={{
                            transform: 'rotate(-4deg) translate(4px, 4px)',
                            opacity: 0.3,
                            background: album.coverUrl
                              ? undefined
                              : generatePlaceholderGradient(album.album + '_2'),
                          }}
                        >
                          {album.tracks[1]?.coverUrl && (
                            <img
                              src={album.tracks[1].coverUrl}
                              alt=""
                              className="w-full h-full object-cover rounded-md"
                              loading="lazy"
                            />
                          )}
                        </div>
                        <div
                          className="absolute inset-0 rounded-md border border-zinc-700/30"
                          style={{
                            transform: 'rotate(3deg) translate(-3px, 3px)',
                            opacity: 0.2,
                            background: album.tracks[2]?.coverUrl
                              ? undefined
                              : generatePlaceholderGradient(album.album + '_3'),
                          }}
                        >
                          {album.tracks[2]?.coverUrl && (
                            <img
                              src={album.tracks[2].coverUrl}
                              alt=""
                              className="w-full h-full object-cover rounded-md"
                              loading="lazy"
                            />
                          )}
                        </div>
                      </>
                    )}

                    {/* Main cover */}
                    <div
                      className={`relative w-full h-full rounded-md overflow-hidden border transition-all ${
                        isCurrentAlbum && isPlaying
                          ? 'border-[#ff0055] shadow-[0_0_12px_rgba(255,0,85,0.3)]'
                          : 'border-zinc-700'
                      }`}
                    >
                      {album.coverUrl ? (
                        <img
                          src={album.coverUrl}
                          alt={album.album}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center"
                          style={{ background: generatePlaceholderGradient(album.album) }}
                        >
                          <span className="text-3xl sm:text-4xl font-bold text-zinc-500/60">
                            {getInitial(album.album)}
                          </span>
                        </div>
                      )}

                      {/* Play overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                        <div className={`w-10 h-10 rounded-full bg-[#ff0055] flex items-center justify-center shadow-lg transition-opacity ${
                          isCurrentAlbum && isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        }`}>
                          {isCurrentAlbum && isPlaying ? (
                            <Pause className="w-4 h-4 text-white fill-current" />
                          ) : (
                            <Play className="w-4 h-4 text-white fill-current ml-0.5" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Album info */}
                  <div className="min-w-0 text-left">
                    <p className={`text-xs font-semibold truncate ${
                      isCurrentAlbum ? 'text-white' : 'text-zinc-200'
                    }`}>
                      {album.album}
                    </p>
                    <p className="text-[10px] text-zinc-500 truncate">
                      {album.tracks[0]?.artist || 'Artista'}
                    </p>
                    <p className="text-[10px] font-mono text-zinc-600 mt-0.5">
                      {album.tracks.length} {album.tracks.length === 1 ? 'faixa' : 'faixas'}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Selected album queue sidebar */}
      {selectedAlbum && selectedAlbumTracks.length > 0 && (
        <div className="bg-[#111113] border border-zinc-800 rounded-lg p-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-3">
            <div className="flex items-center gap-2">
              <Disc3 className="w-4 h-4 text-[#ff0055]" />
              <span className="text-xs font-mono font-semibold text-zinc-300">
                FILA — {selectedAlbum}
              </span>
            </div>
            <button
              onClick={() => setSelectedAlbum(null)}
              className="text-[10px] font-mono text-zinc-500 hover:text-zinc-300"
            >
              Fechar
            </button>
          </div>

          <div className="space-y-1 max-h-60 overflow-y-auto">
            {selectedAlbumTracks.map((track, idx) => {
              const isActive = track.id === currentTrack?.id;
              return (
                <button
                  key={track.id}
                  onClick={() => onPlayFromQueue(selectedAlbumTracks, track)}
                  className={`w-full p-2 rounded text-left transition-colors flex items-center gap-3 text-xs ${
                    isActive
                      ? 'bg-[#ff0055]/15 border border-[#ff0055]/40 text-white'
                      : 'hover:bg-zinc-800/60 text-zinc-300'
                  }`}
                >
                  <span className="font-mono text-[10px] text-zinc-500 w-4 text-right">
                    {isActive && isPlaying ? (
                      <Disc3 className="w-3 h-3 text-[#ff0055] animate-spin" />
                    ) : (
                      idx + 1
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{track.title}</p>
                    <p className="text-[10px] text-zinc-500 truncate">{track.artist}</p>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500 shrink-0">
                    {Math.floor(track.duration / 60)}:{String(Math.floor(track.duration % 60)).padStart(2, '0')}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDownloadOffline(track); }}
                    className={`w-7 h-7 rounded flex items-center justify-center shrink-0 transition-colors ${
                      offlineTrackIds.has(track.id)
                        ? 'text-[#00ff88]'
                        : 'text-zinc-500 hover:text-[#00ff88] active:bg-zinc-800'
                    }`}
                    title={offlineTrackIds.has(track.id) ? 'Disponível offline' : 'Salvar offline'}
                  >
                    {offlineTrackIds.has(track.id) ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                  </button>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
