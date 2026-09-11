import React, { useState, useRef } from 'react';
import { Track, Playlist } from '../types';
import { Upload, FileAudio, X, Check, Loader2, AlertCircle } from 'lucide-react';
import { convertAudio, getOptimalFormat, ConversionResult } from '../services/audioConverter';
import { saveOfflineTrack } from '../services/offlineStore';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTrack: (track: Track) => void;
  onNotify?: (msg: string) => void;
  playlists?: Playlist[];
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onAddTrack,
  onNotify,
  playlists = [],
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [trackCategory, setTrackCategory] = useState('Chamou atenção');
  const [converting, setConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [conversionResult, setConversionResult] = useState<ConversionResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const resetState = () => {
    setConverting(false);
    setProgress(0);
    setError(null);
    setConversionResult(null);
    setSelectedFile(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleConvert = async (file: File) => {
    setSelectedFile(file);
    setConverting(true);
    setError(null);
    setProgress(0);

    try {
      const result = await convertAudio(file, setProgress);
      setConversionResult(result);
      setConverting(false);
      onNotify?.(`Convertido: Ogg ${(result.oggSize / 1024 / 1024).toFixed(1)}MB + AAC ${(result.aacSize / 1024 / 1024).toFixed(1)}MB`);
    } catch (err: any) {
      setError(err.message || 'Erro na conversão');
      setConverting(false);
    }
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    if (file.size > 100 * 1024 * 1024) {
      setError('Arquivo muito grande (máx. 100MB)');
      return;
    }

    handleConvert(file);
  };

  const handleConfirmUpload = async () => {
    if (!conversionResult || !selectedFile) return;

    const fileName = selectedFile.name.replace(/\.[^/.]+$/, '');
    const optimalFormat = getOptimalFormat();
    const chosenBlob = optimalFormat === 'ogg' ? conversionResult.oggBlob : conversionResult.aacBlob;
    const audioUrl = optimalFormat === 'ogg' ? conversionResult.oggUrl : conversionResult.aacUrl;

    const newTrack: Track = {
      id: `user-trk-${Date.now()}`,
      title: fileName,
      artist: 'Áudio Local Importado',
      album: 'Sessão do Usuário',
      category: trackCategory,
      duration: conversionResult.originalDuration,
      audioUrl,
      isSynthesized: false,
      bpm: 120,
      key: 'Custom',
      format: optimalFormat === 'ogg' ? 'OGG' : 'AAC',
      bitrate: '192 kbps',
      sampleRate: '44.1 kHz',
      sizeMB: parseFloat(((optimalFormat === 'ogg' ? conversionResult.oggSize : conversionResult.aacSize) / (1024 * 1024)).toFixed(1)),
      localPath: `Uploads/${selectedFile.name}`,
      syncStatus: 'offline',
      chords: ['C', 'G', 'Am', 'F'],
    };

    await saveOfflineTrack(newTrack, chosenBlob);
    onAddTrack(newTrack);
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-[#111113] border border-zinc-800 rounded-lg p-6 max-w-lg w-full flex flex-col gap-4 relative shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-zinc-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">
              IMPORTAR ÁUDIO — VIA LÁCTEA
            </h3>
          </div>
          <button onClick={handleClose} className="text-zinc-400 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-zinc-400 font-mono">
          Upload MP3 → Conversão automática para Ogg Vorbis (web/android) + AAC (iOS/Safari).
        </p>

        {/* Category selector */}
        <div>
          <label className="text-xs font-mono text-zinc-400 block mb-1">Destinar à Pasta:</label>
          <select
            value={trackCategory}
            onChange={(e) => setTrackCategory(e.target.value)}
            className="w-full bg-[#0a0a0c] border border-zinc-800 rounded p-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-zinc-500"
          >
            {playlists.map((p) => (
              <option key={p.id} value={p.name}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Conversion Status */}
        {converting && (
          <div className="bg-[#0a0a0c] border border-zinc-800 rounded-lg p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-zinc-400 animate-spin" />
              <span className="text-xs font-mono text-zinc-200">
                Convertendo {selectedFile?.name}...
              </span>
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-2">
              <div
                className="bg-[#ff0055] h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="text-[10px] font-mono text-zinc-500 flex justify-between">
              <span>MP3 → Ogg Vorbis + AAC</span>
              <span>{progress}%</span>
            </div>
          </div>
        )}

        {/* Conversion Result */}
        {conversionResult && !converting && (
          <div className="bg-[#0a0a0c] border border-emerald-800/50 rounded-lg p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-mono text-emerald-300 font-semibold">Conversão concluída</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
              <div className="flex justify-between p-2 rounded bg-zinc-900/60 border border-zinc-800">
                <span className="text-zinc-400">Ogg Vorbis:</span>
                <span className="text-zinc-200">{(conversionResult.oggSize / 1024 / 1024).toFixed(1)} MB</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-zinc-900/60 border border-zinc-800">
                <span className="text-zinc-400">AAC (M4A):</span>
                <span className="text-zinc-200">{(conversionResult.aacSize / 1024 / 1024).toFixed(1)} MB</span>
              </div>
            </div>
            <p className="text-[10px] font-mono text-zinc-500">
              Formato ótimo selecionado automaticamente para o seu browser.
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-950/30 border border-red-800/50 rounded-lg p-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span className="text-xs font-mono text-red-300">{error}</span>
          </div>
        )}

        {/* Drag and Drop Zone */}
        {!converting && !conversionResult && (
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
                ? 'border-zinc-500 bg-zinc-800/50'
                : 'border-zinc-800 bg-[#0a0a0c] hover:border-zinc-700'
            }`}
          >
            <FileAudio className={`w-10 h-10 ${dragOver ? 'text-zinc-300' : 'text-zinc-500'}`} />
            <p className="text-xs font-mono text-zinc-200">
              Arraste um MP3 ou <span className="text-zinc-300 underline">clique para selecionar</span>
            </p>
            <p className="text-[10px] font-mono text-zinc-500">
              Conversão automática: MP3 → Ogg Vorbis + AAC
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/mpeg,audio/mp3"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>
        )}

        {/* Actions */}
        <div className="pt-2 border-t border-zinc-800 flex justify-end gap-2 text-xs font-mono">
          <button
            onClick={handleClose}
            className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
          >
            Cancelar
          </button>
          {conversionResult && !converting && (
            <button
              onClick={handleConfirmUpload}
              className="px-3 py-1.5 rounded bg-[#ff0055] hover:bg-[#ff0055]/90 text-white font-semibold flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              Adicionar à Biblioteca
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
