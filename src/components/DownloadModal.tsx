import React, { useState, useEffect, useRef } from 'react';
import { Download, X, Check, Loader2, AlertCircle, Music, Key, ExternalLink } from 'lucide-react';

const TOKEN_KEY = 'via-lactea-github-token';
const REPO_API = 'https://api.github.com/repos/Zsubzeroz/via-lactea-music';
const REPO_DISPATCH_URL = `${REPO_API}/actions/workflows/download-track.yml/dispatches`;
const YOUTUBE_REGEX = /^https?:\/\/(www\.|m\.|music\.)?(youtube\.com\/(watch\?v=|shorts\/)|youtu\.be\/)/;
const POLL_INTERVAL = 10000;
const MAX_POLL_ATTEMPTS = 30;

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTrackDownloaded?: () => void;
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
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || '');
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [tokenDraft, setTokenDraft] = useState('');

  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('Chamou atenção');
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const urlInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isOpen) {
      setUrl('');
      setCategory('Chamou atenção');
      setDownloading(false);
      setProgress('');
      setError(null);
      setSuccess(false);
      setShowTokenInput(false);
      setTokenDraft('');
      setTimeout(() => urlInputRef.current?.focus(), 100);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [isOpen]);

  if (!isOpen) return null;

  const hasToken = !!token;

  const handleSaveToken = () => {
    const trimmed = tokenDraft.trim();
    if (!trimmed) return;
    localStorage.setItem(TOKEN_KEY, trimmed);
    setToken(trimmed);
    setShowTokenInput(false);
    setTokenDraft('');
  };

  const handleChangeToken = () => {
    setTokenDraft(token);
    setShowTokenInput(true);
  };

  const handleClearToken = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken('');
    setShowTokenInput(true);
  };

  const startPolling = (dispatchedAt: number) => {
    let attempts = 0;
    pollRef.current = setInterval(async () => {
      attempts++;
      try {
        const res = await fetch(
          `${REPO_API}/actions/workflows/download-track.yml/runs?per_page=1&created=>=${new Date(dispatchedAt - 5000).toISOString()}`,
          { headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3+json' } }
        );
        if (!res.ok) return;
        const data = await res.json();
        const run = data.workflow_runs?.[0];
        if (!run) return;

        if (run.status === 'completed') {
          if (pollRef.current) clearInterval(pollRef.current);
          if (run.conclusion === 'success') {
            setSuccess(true);
            setDownloading(false);
            setProgress('');
            onTrackDownloaded?.();
          } else {
            setError(`Workflow falhou (${run.conclusion}). Verifique os logs no GitHub Actions.`);
            setDownloading(false);
            setProgress('');
          }
        } else {
          setProgress(`Processando e publicando na nuvem... (${run.status})`);
        }
      } catch {}

      if (attempts >= MAX_POLL_ATTEMPTS) {
        if (pollRef.current) clearInterval(pollRef.current);
        setProgress('Download disparado. Verifique o GitHub Actions para acompanhar.');
        setDownloading(false);
        onTrackDownloaded?.();
      }
    }, POLL_INTERVAL);
  };

  const handleDownload = async () => {
    if (!url.trim()) {
      setError('Cole uma URL válida');
      return;
    }
    if (!YOUTUBE_REGEX.test(url.trim())) {
      setError('Apenas URLs do YouTube são aceitas (youtube.com, youtu.be, m.youtube.com, music.youtube.com)');
      return;
    }
    if (!hasToken) {
      setError('Configure o GitHub Token primeiro');
      setShowTokenInput(true);
      return;
    }

    setDownloading(true);
    setError(null);
    setSuccess(false);
    setProgress('Disparando download via GitHub Actions...');

    try {
      const res = await fetch(REPO_DISPATCH_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
        body: JSON.stringify({
          ref: 'main',
          inputs: { url: url.trim(), category },
        }),
      });

      if (res.status === 204) {
        setProgress('Processando e publicando na nuvem...');
        startPolling(Date.now());
      } else if (res.status === 401 || res.status === 403) {
        setError('Token inválido ou sem permissão. Gere um novo token com acesso ao repositório.');
        setShowTokenInput(true);
        setDownloading(false);
        setProgress('');
      } else if (res.status === 404) {
        setError('Workflow não encontrado. Verifique se o repositório está correto.');
        setDownloading(false);
        setProgress('');
      } else {
        const body = await res.text();
        setError(`Erro ${res.status}: ${body.slice(0, 120)}`);
        setDownloading(false);
        setProgress('');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao conectar com GitHub');
      setDownloading(false);
      setProgress('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-[#111113] border border-zinc-800 rounded-lg p-6 max-w-lg w-full flex flex-col gap-4 relative shadow-2xl max-h-[90vh] overflow-y-auto">
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

        {/* Token setup */}
        {!hasToken && !showTokenInput && (
          <div className="bg-amber-950/30 border border-amber-800/50 rounded-lg p-3 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-xs font-mono text-amber-200 font-semibold">GitHub Token necessário</span>
            </div>
            <p className="text-[10px] text-amber-300/70 font-mono">
              Para baixar músicas pelo celular, configure um Personal Access Token do GitHub.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowTokenInput(true)}
                className="px-3 py-1.5 rounded bg-amber-800/60 hover:bg-amber-800 text-amber-100 text-[10px] font-mono"
              >
                Configurar Token
              </button>
              <a
                href="https://github.com/settings/tokens?type=beta"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-mono flex items-center gap-1"
              >
                Gerar Token <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </div>
        )}

        {showTokenInput && (
          <div className="bg-[#0a0a0c] border border-zinc-800 rounded-lg p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="text-xs font-mono text-zinc-300">GitHub Token</span>
              </div>
              <a
                href="https://github.com/settings/tokens?type=beta"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] font-mono text-zinc-500 hover:text-zinc-300 flex items-center gap-1"
              >
                Gerar <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
            <input
              type="password"
              value={tokenDraft}
              onChange={(e) => setTokenDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveToken()}
              placeholder="ghp_... ou github_pat_..."
              className="w-full bg-[#111113] border border-zinc-700 rounded p-2 text-xs font-mono text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
            />
            <p className="text-[10px] text-zinc-500 font-mono">
              Permissão: Actions → Read and Write no repo via-lactea-music
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleSaveToken}
                disabled={!tokenDraft.trim()}
                className="px-3 py-1.5 rounded bg-[#00ff88] hover:bg-[#00ff88]/90 text-black text-[10px] font-mono font-semibold disabled:opacity-40"
              >
                Salvar
              </button>
              <button
                onClick={() => { setShowTokenInput(false); setTokenDraft(''); }}
                className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-mono"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Token badge (when saved) */}
        {hasToken && !showTokenInput && (
          <div className="flex items-center justify-between bg-[#0a0a0c] border border-zinc-800 rounded-lg px-3 py-2">
            <div className="flex items-center gap-2">
              <Key className="w-3 h-3 text-emerald-400" />
              <span className="text-[10px] font-mono text-zinc-400">
                Token: {token.slice(0, 6)}...{token.slice(-4)}
              </span>
            </div>
            <div className="flex gap-1">
              <button
                onClick={handleChangeToken}
                className="text-[10px] font-mono text-zinc-500 hover:text-zinc-300 px-1.5 py-0.5 rounded hover:bg-zinc-800"
              >
                Alterar
              </button>
              <button
                onClick={handleClearToken}
                className="text-[10px] font-mono text-zinc-500 hover:text-red-400 px-1.5 py-0.5 rounded hover:bg-zinc-800"
              >
                Remover
              </button>
            </div>
          </div>
        )}

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

        {/* URL input */}
        <div>
          <label className="text-xs font-mono text-zinc-400 block mb-1">URL da Música:</label>
          <input
            ref={urlInputRef}
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleDownload()}
            placeholder="https://youtube.com/watch?v=..."
            disabled={downloading}
            className="w-full bg-[#0a0a0c] border border-zinc-800 rounded p-2.5 text-xs font-mono text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 disabled:opacity-50"
          />
        </div>

        {/* Processing status */}
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
        {success && (
          <div className="bg-[#0a0a0c] border border-emerald-800/50 rounded-lg p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-mono text-emerald-300 font-semibold">Download Concluído com Sucesso!</span>
            </div>
            <div className="flex items-center gap-3 p-2 rounded bg-zinc-900/60 border border-zinc-800">
              <Music className="w-8 h-8 text-zinc-600 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-mono text-zinc-200 truncate">Música publicada no Via Láctea</p>
                <p className="text-[10px] font-mono text-zinc-400 truncate">Categoria: {category}</p>
                <p className="text-[10px] font-mono text-[#00ff88] truncate mt-0.5">Atualize a página para ver a nova faixa</p>
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
            {success ? 'Fechar' : 'Cancelar'}
          </button>
          {!success && !downloading && (
            <button
              onClick={handleDownload}
              disabled={!url.trim() || !hasToken}
              className="px-3 py-1.5 rounded bg-[#00ff88] hover:bg-[#00ff88]/90 text-black font-semibold flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download className="w-3.5 h-3.5" />
              Baixar
            </button>
          )}
          {success && (
            <button
              onClick={() => {
                setUrl('');
                setSuccess(false);
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
