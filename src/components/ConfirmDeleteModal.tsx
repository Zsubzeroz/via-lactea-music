import React from 'react';
import { Track } from '../types';
import { AlertTriangle, X, Trash2 } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  track: Track | null;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  track,
  onConfirm,
  onClose,
}) => {
  if (!isOpen || !track) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4">
      <div className="bg-[#111113] border border-red-800/50 rounded-lg p-6 max-w-md w-full flex flex-col gap-4 relative shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <h3 className="text-sm font-bold text-red-300 tracking-tight">
              EXCLUSÃO DEFINITIVA
            </h3>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Warning */}
        <div className="bg-red-950/30 border border-red-800/50 rounded-lg p-3 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <span className="text-xs font-mono text-red-300">
            Esta ação é <strong>irreversível</strong>. O arquivo de áudio, a capa e todos os dados serão removidos permanentemente do servidor e do armazenamento local.
          </span>
        </div>

        {/* Track info */}
        <div className="flex items-center gap-3 p-3 rounded bg-zinc-900/60 border border-zinc-800">
          {track.coverUrl ? (
            <img
              src={track.coverUrl}
              alt=""
              className="w-12 h-12 rounded object-cover bg-zinc-800 shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded bg-zinc-800 flex items-center justify-center shrink-0">
              <Trash2 className="w-5 h-5 text-zinc-600" />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-xs font-mono text-zinc-200 truncate font-semibold">{track.title}</p>
            <p className="text-[10px] font-mono text-zinc-400 truncate">{track.artist}</p>
            <p className="text-[10px] font-mono text-zinc-500 truncate">{track.category}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-2 border-t border-zinc-800 flex justify-end gap-2 text-xs font-mono">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-3 py-1.5 rounded bg-red-600 hover:bg-red-500 text-white font-semibold flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Excluir Definitivamente
          </button>
        </div>
      </div>
    </div>
  );
};
