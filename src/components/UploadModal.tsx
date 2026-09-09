import React, { useState, useRef } from 'react';
import { Track } from '../types';
import { Upload, FileAudio, X, Check, HardDrive } from 'lucide-react';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTrack: (track: Track) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onAddTrack,
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [trackCategory, setTrackCategory] = useState('Chamou atenção');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    const audioUrl = URL.createObjectURL(file);
    const fileName = file.name.replace(/\.[^/.]+$/, '');
    const ext = file.name.split('.').pop()?.toUpperCase() || 'MP3';

    const newTrack: Track = {
      id: `user-trk-${Date.now()}`,
      title: fileName,
      artist: 'Áudio Local Importado',
      album: 'Sessão do Usuário',
      category: trackCategory,
      duration: 180, // will auto-update on audio metadata load
      audioUrl: audioUrl,
      isSynthesized: false,
      bpm: 120,
      key: 'Custom',
      format: (ext === 'FLAC' || ext === 'WAV' ? ext : 'MP3') as any,
      bitrate: ext === 'FLAC' ? '1411 kbps' : '320 kbps',
      sampleRate: '48.0 kHz',
      sizeMB: parseFloat((file.size / (1024 * 1024)).toFixed(1)),
      localPath: `Uploads/${file.name}`,
      syncStatus: 'cached',
      chords: ['C', 'G', 'Am', 'F'],
    };

    // Try reading audio duration
    const tempAudio = new Audio();
    tempAudio.src = audioUrl;
    tempAudio.onloadedmetadata = () => {
      newTrack.duration = Math.round(tempAudio.duration);
      onAddTrack(newTrack);
      onClose();
    };
    tempAudio.onerror = () => {
      onAddTrack(newTrack);
      onClose();
    };
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-[#111113] border border-zinc-800 rounded-lg p-6 max-w-lg w-full flex flex-col gap-4 relative shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-[#ff0055]" />
            <h3 className="text-sm font-bold text-white tracking-tight">
              IMPORTAR ÁUDIO LOCAL PARA O VIA LÁCTEA
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-zinc-400 font-mono">
          Adicione uma música do seu computador (.mp3, .wav, .flac) para testar o decodificador DSP, equalizador e espectro em tempo real.
        </p>

        {/* Category selector */}
        <div>
          <label className="text-xs font-mono text-zinc-400 block mb-1">Destinar à Pasta:</label>
          <select
            value={trackCategory}
            onChange={(e) => setTrackCategory(e.target.value)}
            className="w-full bg-[#0a0a0c] border border-zinc-800 rounded p-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-[#ff0055]"
          >
            <option value="Piano">Piano / Clássico</option>
            <option value="Rap Nacional">Rap Nacional</option>
            <option value="Poesia Acústica">Poesia Acústica</option>
            <option value="Música Eletrônica">Música Eletrônica</option>
            <option value="Treino">Treino / Phonk</option>
            <option value="Chamou atenção">Chamou atenção / Avulso</option>
          </select>
        </div>

        {/* Drag and Drop Zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleFiles(e.dataTransfer.files);
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors flex flex-col items-center justify-center gap-2 ${
            dragOver
              ? 'border-[#ff0055] bg-[#ff0055]/10'
              : 'border-zinc-800 bg-[#0a0a0c] hover:border-zinc-700'
          }`}
        >
          <FileAudio className={`w-10 h-10 ${dragOver ? 'text-[#ff0055]' : 'text-zinc-500'}`} />
          <p className="text-xs font-mono text-zinc-200">
            Arraste um arquivo de áudio ou <span className="text-[#ff0055] underline">clique para selecionar</span>
          </p>
          <p className="text-[10px] font-mono text-zinc-500">
            Formatos suportados: .MP3, .FLAC, .WAV, .OGG, .M4A
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>

        <div className="pt-2 border-t border-zinc-800 flex justify-end gap-2 text-xs font-mono">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
