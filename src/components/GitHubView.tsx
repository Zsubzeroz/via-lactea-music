import React, { useState } from 'react';
import { 
  GitBranch, 
  GitCommit, 
  GitFork, 
  Star, 
  Copy, 
  Check, 
  FileCode, 
  FileText, 
  Terminal, 
  Download, 
  HardDrive, 
  Smartphone, 
  Layers, 
  ExternalLink,
  Code2
} from 'lucide-react';
import { REPO_FILES, COMMITS } from '../data/repoFiles';

interface GitHubViewProps {
  onNotify?: (msg: string) => void;
}

export const GitHubView: React.FC<GitHubViewProps> = ({ onNotify }) => {
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [selectedFilePath, setSelectedFilePath] = useState<string>('README.md');
  const [activeTab, setActiveTab] = useState<'code' | 'readme' | 'architecture' | 'commits'>('readme');

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    if (onNotify) {
      onNotify(id === 'clone' ? 'Comando git clone copiado!' : 'Copiado para a área de transferência!');
    }
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const handleExportBlueprint = () => {
    const blueprintData = {
      repository: 'Zsubzeroz/via-lactea-music',
      version: '0.1.0-alpha',
      exportedAt: new Date().toISOString(),
      architecture: {
        frontend: 'Flutter 3.44.7 / React 19 Web Desktop',
        storage: 'Cloudflare R2 (10GB Free Tier, zero egress)',
        database: 'Firebase Firestore Real-time',
        devices: ['Linux Desktop (Host Master)', 'Redmi 15C (Mobile Cache)']
      },
      files: REPO_FILES,
      commitLog: COMMITS
    };

    const blob = new Blob([JSON.stringify(blueprintData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'via-lactea-music-repo-blueprint.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    if (onNotify) onNotify('Blueprint JSON exportado com sucesso!');
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Top GitHub Repo Header Card */}
      <div className="bg-[#111113] border border-zinc-800 rounded-lg p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-zinc-400 font-mono text-xs">Repositório Oficial:</span>
              <a 
                href="https://github.com/Zsubzeroz" 
                target="_blank" 
                rel="noreferrer"
                className="text-white hover:text-[#ff0055] font-bold text-lg tracking-tight flex items-center gap-1.5 transition-colors"
              >
                Zsubzeroz / <span className="text-[#ff0055]">via-lactea-music</span>
                <ExternalLink className="w-4 h-4 text-zinc-500" />
              </a>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-950/80 text-[#00ff88] border border-emerald-800">
                Público
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-zinc-800 text-zinc-300 border border-zinc-700">
                v0.1.0-alpha
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
              Arquitetura de player de música audiophile com sincronização híbrida Cloudflare R2 + Firebase Firestore para Linux Desktop e Redmi 15C.
            </p>
          </div>

          {/* Repo Stats & Clone Button */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center bg-[#18181b] rounded border border-zinc-800 divide-x divide-zinc-800 text-xs font-mono">
              <span className="px-2.5 py-1 text-zinc-300 flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-amber-400" /> 12
              </span>
              <span className="px-2.5 py-1 text-zinc-300 flex items-center gap-1.5">
                <GitFork className="w-3.5 h-3.5 text-zinc-400" /> 2
              </span>
              <span className="px-2.5 py-1 text-zinc-300 flex items-center gap-1.5">
                <GitCommit className="w-3.5 h-3.5 text-[#ff0055]" /> 5 commits
              </span>
            </div>

            <button
              onClick={handleExportBlueprint}
              className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono flex items-center gap-1.5 border border-zinc-700 transition-colors"
              title="Baixar Blueprint completo do repositório em JSON"
            >
              <Download className="w-3.5 h-3.5 text-zinc-300" />
              Exportar Blueprint
            </button>
          </div>
        </div>

        {/* Quick Clone Bar */}
        <div className="mt-4 pt-4 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-3 bg-[#0a0a0c] p-3 rounded border border-zinc-800/80">
          <div className="flex items-center gap-2 font-mono text-xs text-zinc-300 truncate">
            <Terminal className="w-4 h-4 text-[#00ff88] shrink-0" />
            <span className="text-zinc-500">$</span>
            <span className="text-zinc-200 select-all truncate">
              git clone https://github.com/Zsubzeroz/via-lactea-music.git
            </span>
          </div>

          <button
            onClick={() => copyToClipboard('git clone https://github.com/Zsubzeroz/via-lactea-music.git', 'clone')}
            className="px-3 py-1 rounded bg-[#ff0055] hover:bg-[#ff0055]/90 text-white text-xs font-mono flex items-center gap-1.5 shrink-0 transition-colors"
          >
            {copiedCmd === 'clone' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedCmd === 'clone' ? 'Copiado!' : 'Copiar Git Clone'}
          </button>
        </div>
      </div>

      {/* Navigation Subtabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-2 text-xs font-mono">
        <button
          onClick={() => setActiveTab('readme')}
          className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
            activeTab === 'readme' ? 'bg-zinc-800 text-white font-semibold' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          README.md (Documentação)
        </button>

        <button
          onClick={() => setActiveTab('code')}
          className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
            activeTab === 'code' ? 'bg-zinc-800 text-white font-semibold' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Code2 className="w-3.5 h-3.5 text-[#00ff88]" />
          Explorador de Arquivos do Repositório
        </button>

        <button
          onClick={() => setActiveTab('architecture')}
          className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
            activeTab === 'architecture' ? 'bg-zinc-800 text-white font-semibold' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-[#ff0055]" />
          Arquitetura Cloudflare R2 + Firestore
        </button>

        <button
          onClick={() => setActiveTab('commits')}
          className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
            activeTab === 'commits' ? 'bg-zinc-800 text-white font-semibold' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <GitCommit className="w-3.5 h-3.5 text-amber-400" />
          Histórico de Commits ({COMMITS.length})
        </button>
      </div>

      {/* Tab: Code Explorer */}
      {activeTab === 'code' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* File Tree List */}
          <div className="bg-[#111113] border border-zinc-800 rounded-lg p-3">
            <div className="text-xs font-mono font-semibold text-zinc-300 pb-2 border-b border-zinc-800 mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <GitBranch className="w-3.5 h-3.5 text-zinc-400" /> branch: main
              </span>
              <span className="text-[10px] text-zinc-500">{Object.keys(REPO_FILES).length} arquivos</span>
            </div>

            <div className="flex flex-col gap-1">
              {Object.keys(REPO_FILES).map((filePath) => {
                const isSelected = selectedFilePath === filePath;
                return (
                  <button
                    key={filePath}
                    onClick={() => setSelectedFilePath(filePath)}
                    className={`px-2.5 py-1.5 rounded text-left font-mono text-xs flex items-center gap-2 transition-colors ${
                      isSelected
                        ? 'bg-[#ff0055]/15 text-white border border-[#ff0055]/40'
                        : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                    }`}
                  >
                    {filePath.endsWith('.md') ? (
                      <FileText className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    ) : filePath.endsWith('.dart') ? (
                      <FileCode className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    ) : (
                      <Terminal className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    )}
                    <span className="truncate">{filePath}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* File Code Viewer */}
          <div className="md:col-span-2 bg-[#0a0a0c] border border-zinc-800 rounded-lg p-4 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-3 text-xs font-mono text-zinc-400">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-[#ff0055]" />
                <span className="text-white font-semibold">{selectedFilePath}</span>
                <span className="text-zinc-600">|</span>
                <span className="text-zinc-500 uppercase">{REPO_FILES[selectedFilePath]?.lang}</span>
              </div>

              <button
                onClick={() => copyToClipboard(REPO_FILES[selectedFilePath]?.content || '', 'file')}
                className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs flex items-center gap-1 transition-colors"
              >
                {copiedCmd === 'file' ? <Check className="w-3 h-3 text-[#00ff88]" /> : <Copy className="w-3 h-3" />}
                {copiedCmd === 'file' ? 'Copiado' : 'Copiar Código'}
              </button>
            </div>

            <pre className="text-xs font-mono text-zinc-300 overflow-x-auto p-3 bg-[#0d0d10] rounded border border-zinc-800/80 leading-relaxed max-h-[480px]">
              <code>{REPO_FILES[selectedFilePath]?.content}</code>
            </pre>
          </div>
        </div>
      )}

      {/* Tab: README.md */}
      {activeTab === 'readme' && (
        <div className="bg-[#111113] border border-zinc-800 rounded-lg p-6">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-6">
            <div className="flex items-center gap-2 font-mono text-xs text-zinc-300">
              <FileText className="w-4 h-4 text-sky-400" />
              <span className="font-bold text-white">README.md</span>
            </div>
            <button
              onClick={() => copyToClipboard(REPO_FILES['README.md'].content, 'readme-raw')}
              className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono flex items-center gap-1.5 border border-zinc-700"
            >
              {copiedCmd === 'readme-raw' ? <Check className="w-3.5 h-3.5 text-[#00ff88]" /> : <Copy className="w-3.5 h-3.5" />}
              Copiar Markdown
            </button>
          </div>

          <div className="prose prose-invert max-w-none text-zinc-300 text-sm leading-relaxed space-y-4">
            <div className="p-4 rounded-md bg-[#0a0a0c] border border-zinc-800">
              <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                🎵 VIA LÁCTEA MUSIC — ESPECIFICAÇÃO OFICIAL DO REPOSITÓRIO
              </h2>
              <p className="text-xs text-zinc-400 font-mono">
                Player de Música Audiophile de Alta Precisão com Sincronização Híbrida em Nuvem (Zero Egress)
              </p>
            </div>

            <h3 className="text-base font-semibold text-white pt-2 border-b border-zinc-800 pb-1">
              1. Pilares da Engenharia de Sincronização
            </h3>
            <ul className="list-disc pl-5 space-y-2 text-zinc-300">
              <li>
                <strong className="text-[#00ff88]">Cloudflare R2 (10GB Gratuito, Egress Zero):</strong> Elimina qualquer custo de tráfego de dados durante o streaming ou download de arquivos brutos FLAC de alta densidade.
              </li>
              <li>
                <strong className="text-sky-400">Firebase Firestore Real-time:</strong> Sincroniza metadados, playlists por gênero (Piano clássico, Rap Nacional, Eletrônica, Treino, etc.) e timestamps de escuta instantaneamente entre o Linux Desktop e o Redmi 15C.
              </li>
              <li>
                <strong className="text-amber-400">Cache Híbrido LRU (Mobile):</strong> O Redmi 15C mantém 4GB das faixas mais ouvidas em cache offline, eliminando a dependência contínua de internet na rua.
              </li>
            </ul>

            <h3 className="text-base font-semibold text-white pt-3 border-b border-zinc-800 pb-1">
              2. Comandos de Inicialização Rápida
            </h3>
            <div className="bg-[#0a0a0c] p-4 rounded border border-zinc-800 font-mono text-xs text-zinc-300 space-y-2">
              <p className="text-zinc-500"># Clonar repositório e inicializar:</p>
              <p className="text-[#ff0055]">git clone https://github.com/Zsubzeroz/via-lactea-music.git</p>
              <p className="text-[#ff0055]">cd via-lactea-music</p>
              <p className="text-zinc-500"># Rodar no Linux Desktop:</p>
              <p className="text-[#00ff88]">flutter run -d linux</p>
              <p className="text-zinc-500"># Sincronizar faixas via cabo USB / ADB com o Redmi 15C:</p>
              <p className="text-sky-400">bash scripts/sync-redmi-adb.sh</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Architecture Specs */}
      {activeTab === 'architecture' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Cloudflare R2 Storage */}
          <div className="bg-[#111113] border border-zinc-800 rounded-lg p-5 flex flex-col gap-3">
            <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-800">
              <HardDrive className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="text-sm font-bold text-white">CLOUDFLARE R2 BUCKET</h3>
                <p className="text-[11px] font-mono text-zinc-400">Armazenamento Objeto S3-Compatível sem Taxa de Egress</p>
              </div>
            </div>

            <div className="space-y-2 text-xs font-mono text-zinc-300">
              <div className="flex justify-between p-2 rounded bg-zinc-900/60 border border-zinc-800">
                <span className="text-zinc-400">Cota Gratuita Mensal:</span>
                <span className="text-emerald-400 font-bold">10 GB / Zero Egress</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-zinc-900/60 border border-zinc-800">
                <span className="text-zinc-400">Armazenamento Ocupado:</span>
                <span className="text-zinc-200">3.94 GB (39.4%)</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-zinc-900/60 border border-zinc-800">
                <span className="text-zinc-400">Total de Faixas R2:</span>
                <span className="text-zinc-200">495 Obras Lossless</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-zinc-900/60 border border-zinc-800">
                <span className="text-zinc-400">Protocolo de Entrega:</span>
                <span className="text-sky-400">URLs Pré-assinadas (TTL 2h)</span>
              </div>
            </div>
          </div>

          {/* Card 2: Firebase Firestore & Realtime */}
          <div className="bg-[#111113] border border-zinc-800 rounded-lg p-5 flex flex-col gap-3">
            <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-800">
              <Layers className="w-5 h-5 text-[#ff0055]" />
              <div>
                <h3 className="text-sm font-bold text-white">FIREBASE FIRESTORE SYNC</h3>
                <p className="text-[11px] font-mono text-zinc-400">Sincronização em Tempo Real de Metadados e Estado</p>
              </div>
            </div>

            <div className="space-y-2 text-xs font-mono text-zinc-300">
              <div className="flex justify-between p-2 rounded bg-zinc-900/60 border border-zinc-800">
                <span className="text-zinc-400">Coleções Principais:</span>
                <span className="text-zinc-200">tracks, playlists, sync_nodes</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-zinc-900/60 border border-zinc-800">
                <span className="text-zinc-400">Segurança & Regras:</span>
                <span className="text-emerald-400 font-bold">rules_version = '2'</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-zinc-900/60 border border-zinc-800">
                <span className="text-zinc-400">Latência de Sync:</span>
                <span className="text-zinc-200">&lt; 120ms (WebSockets)</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-zinc-900/60 border border-zinc-800">
                <span className="text-zinc-400">Suporte Offline:</span>
                <span className="text-amber-400 font-bold">Persistence Enabled</span>
              </div>
            </div>
          </div>

          {/* Card 3: Linux Desktop Host */}
          <div className="bg-[#111113] border border-zinc-800 rounded-lg p-5 flex flex-col gap-3">
            <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-800">
              <Terminal className="w-5 h-5 text-[#00ff88]" />
              <div>
                <h3 className="text-sm font-bold text-white">LINUX DESKTOP (HOST MASTER)</h3>
                <p className="text-[11px] font-mono text-zinc-400">Ambiente de Produção e Estúdio Audiophile</p>
              </div>
            </div>

            <div className="space-y-2 text-xs font-mono text-zinc-300">
              <div className="flex justify-between p-2 rounded bg-zinc-900/60 border border-zinc-800">
                <span className="text-zinc-400">Diretório Local:</span>
                <span className="text-zinc-200">~/Documents/Musica/</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-zinc-900/60 border border-zinc-800">
                <span className="text-zinc-400">Decodificador:</span>
                <span className="text-zinc-200">ALSA / PulseAudio / PipeWire</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-zinc-900/60 border border-zinc-800">
                <span className="text-zinc-400">Taxa Nativa:</span>
                <span className="text-emerald-400 font-bold">48.0 kHz / 24-Bit Lossless</span>
              </div>
            </div>
          </div>

          {/* Card 4: Redmi 15C Mobile */}
          <div className="bg-[#111113] border border-zinc-800 rounded-lg p-5 flex flex-col gap-3">
            <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-800">
              <Smartphone className="w-5 h-5 text-sky-400" />
              <div>
                <h3 className="text-sm font-bold text-white">REDMI 15C (MOBILE CLIENT)</h3>
                <p className="text-[11px] font-mono text-zinc-400">Cache Híbrido e Mobilidade Total</p>
              </div>
            </div>

            <div className="space-y-2 text-xs font-mono text-zinc-300">
              <div className="flex justify-between p-2 rounded bg-zinc-900/60 border border-zinc-800">
                <span className="text-zinc-400">Limite de Cache:</span>
                <span className="text-zinc-200">4 GB (Política LRU Automática)</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-zinc-900/60 border border-zinc-800">
                <span className="text-zinc-400">Modo de Sync:</span>
                <span className="text-zinc-200">Wi-Fi Background + ADB USB</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-zinc-900/60 border border-zinc-800">
                <span className="text-zinc-400">Economia de Bateria:</span>
                <span className="text-emerald-400 font-bold">Hardware Accelerated DSP</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Commits History */}
      {activeTab === 'commits' && (
        <div className="bg-[#111113] border border-zinc-800 rounded-lg p-5">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4 font-mono text-xs text-zinc-400">
            <span>Histórico de Versões e Commits no Git</span>
            <span className="text-[#00ff88]">branch: main</span>
          </div>

          <div className="space-y-3">
            {COMMITS.map((c) => (
              <div key={c.hash} className="p-3 rounded bg-[#0a0a0c] border border-zinc-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[#ff0055]">
                    <GitCommit className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-zinc-100">{c.msg}</span>
                      {c.tag && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-950 text-amber-400 border border-amber-800">
                          {c.tag}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] font-mono text-zinc-500">
                      Commit por <strong className="text-zinc-300">Luan Estifer</strong> • {c.date}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">
                    {c.hash}
                  </span>
                  <button
                    onClick={() => copyToClipboard(c.hash, c.hash)}
                    className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
                    title="Copiar Hash"
                  >
                    {copiedCmd === c.hash ? <Check className="w-3.5 h-3.5 text-[#00ff88]" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
