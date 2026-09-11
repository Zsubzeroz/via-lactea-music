import React, { useState } from 'react';
import { Playlist } from '../types';
import { FolderOpen, Plus, Pencil, Trash2, Music, X, Check, FolderPlus } from 'lucide-react';

interface PlaylistsViewProps {
  playlists: Playlist[];
  tracks: import('../types').Track[];
  onCreate: (name: string) => Promise<void>;
  onRename: (id: string, name: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const PlaylistsView: React.FC<PlaylistsViewProps> = ({
  playlists,
  tracks,
  onCreate,
  onRename,
  onDelete,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!newName.trim() || loading) return;
    setLoading(true);
    try {
      await onCreate(newName.trim());
      setNewName('');
      setIsCreating(false);
    } catch {}
    setLoading(false);
  };

  const handleRename = async (id: string) => {
    if (!editName.trim() || loading) return;
    setLoading(true);
    try {
      await onRename(id, editName.trim());
      setEditingId(null);
      setEditName('');
    } catch {}
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (loading) return;
    setLoading(true);
    try {
      await onDelete(id);
      setDeleteConfirmId(null);
    } catch {}
    setLoading(false);
  };

  const getTrackCount = (playlist: Playlist) => {
    return tracks.filter((t) => t.category === playlist.name && !t.deletedAt).length;
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="bg-[#1111113] border border-zinc-800 rounded-lg p-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-3">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-[#ff0055]" />
            <h2 className="text-sm font-bold text-white tracking-tight">PLAYLISTS / PASTAS</h2>
          </div>
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#ff0055] hover:bg-[#ff0055]/80 text-white text-xs font-mono font-semibold transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Nova Playlist
          </button>
        </div>
        <p className="text-xs text-zinc-500">
          Cada playlist corresponde a uma pasta no sistema de áudio. Ao baixar ou fazer upload, selecione a playlist de destino.
        </p>
      </div>

      {/* Create Form */}
      {isCreating && (
        <div className="bg-[#111113] border border-zinc-700 rounded-lg p-4 flex items-center gap-3">
          <FolderPlus className="w-5 h-5 text-[#00ff88] shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Nome da nova playlist..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate();
              if (e.key === 'Escape') { setIsCreating(false); setNewName(''); }
            }}
            className="flex-1 bg-[#0a0a0c] border border-zinc-700 rounded px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-[#00ff88] placeholder-zinc-600"
          />
          <button
            onClick={handleCreate}
            disabled={!newName.trim() || loading}
            className="px-3 py-2 rounded bg-[#00ff88]/20 hover:bg-[#00ff88]/30 text-[#00ff88] text-xs font-mono font-semibold transition-colors disabled:opacity-40"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setIsCreating(false); setNewName(''); }}
            className="px-3 py-2 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-xs font-mono transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Playlist Grid */}
      {playlists.length === 0 && !isCreating ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <FolderOpen className="w-10 h-10 text-zinc-600" />
          <p className="text-sm font-mono text-zinc-400">Nenhuma playlist criada</p>
          <p className="text-xs text-zinc-500">Clique em "Nova Playlist" para começar</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {playlists.map((playlist) => {
            const count = getTrackCount(playlist);
            const isEditing = editingId === playlist.id;
            const isConfirmingDelete = deleteConfirmId === playlist.id;

            return (
              <div
                key={playlist.id}
                className="bg-[#111113] border border-zinc-800 rounded-lg p-3 flex flex-col gap-2 hover:border-zinc-700 transition-colors group"
              >
                {/* Folder icon + name */}
                <div className="flex items-center gap-2 min-h-[40px]">
                  <FolderOpen className="w-6 h-6 text-[#ff0055] shrink-0" />
                  {isEditing ? (
                    <input
                      type="text"
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRename(playlist.id);
                        if (e.key === 'Escape') { setEditingId(null); setEditName(''); }
                      }}
                      className="flex-1 min-w-0 bg-[#0a0a0c] border border-zinc-600 rounded px-2 py-1 text-xs font-mono text-zinc-200 focus:outline-none focus:border-[#00ff88]"
                    />
                  ) : (
                    <span className="text-xs font-semibold text-zinc-200 truncate">{playlist.name}</span>
                  )}
                </div>

                {/* Track count */}
                <div className="flex items-center gap-1 text-[10px] font-mono text-zinc-500">
                  <Music className="w-3 h-3" />
                  {count} {count === 1 ? 'faixa' : 'faixas'}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 mt-auto pt-2 border-t border-zinc-800/60">
                  {isEditing ? (
                    <>
                      <button
                        onClick={() => handleRename(playlist.id)}
                        className="flex-1 px-2 py-1 rounded bg-[#00ff88]/20 text-[#00ff88] text-[10px] font-mono font-semibold"
                      >
                        Salvar
                      </button>
                      <button
                        onClick={() => { setEditingId(null); setEditName(''); }}
                        className="flex-1 px-2 py-1 rounded bg-zinc-800 text-zinc-400 text-[10px] font-mono"
                      >
                        Cancelar
                      </button>
                    </>
                  ) : isConfirmingDelete ? (
                    <>
                      <button
                        onClick={() => handleDelete(playlist.id)}
                        className="flex-1 px-2 py-1 rounded bg-red-900/50 hover:bg-red-800/50 text-red-300 text-[10px] font-mono font-semibold"
                      >
                        Confirmar
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="flex-1 px-2 py-1 rounded bg-zinc-800 text-zinc-400 text-[10px] font-mono"
                      >
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => { setEditingId(playlist.id); setEditName(playlist.name); }}
                        className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 text-[10px] font-mono flex items-center gap-1 transition-colors"
                      >
                        <Pencil className="w-3 h-3" /> Renomear
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(playlist.id)}
                        className="px-2 py-1 rounded bg-zinc-800 hover:bg-red-900/50 text-zinc-400 hover:text-red-300 text-[10px] font-mono flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" /> Excluir
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
