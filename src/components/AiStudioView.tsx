import React, { useState, useEffect } from 'react';
import { Track } from '../types';
import { 
  Sparkles, 
  Music, 
  Send, 
  FileText, 
  Copy, 
  Check, 
  Bot, 
  Activity, 
  BookOpen, 
  Clock, 
  Layers, 
  Volume2
} from 'lucide-react';

interface AiStudioViewProps {
  currentTrack: Track | null;
  onSelectChordTime?: (seconds: number) => void;
}

export const AiStudioView: React.FC<AiStudioViewProps> = ({ currentTrack, onSelectChordTime }) => {
  const [activeSubTab, setActiveSubTab] = useState<'analysis' | 'lyrics'>('analysis');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  // Lyrics generator state
  const [lyricsGenre, setLyricsGenre] = useState('Rap Nacional');
  const [lyricsTheme, setLyricsTheme] = useState('Noites de código, foco em engenharia e superação pessoal');
  const [isGeneratingLyrics, setIsGeneratingLyrics] = useState(false);
  const [generatedLyrics, setGeneratedLyrics] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Auto-analyze when currentTrack changes
  useEffect(() => {
    if (currentTrack) {
      triggerAnalysis(currentTrack);
    }
  }, [currentTrack?.id]);

  const triggerAnalysis = async (track: Track) => {
    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/gemini/analyze-track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: track.title,
          artist: track.artist,
          genre: track.category,
        }),
      });
      const data = await res.json();
      setAnalysisResult(data.analysis);
    } catch (err) {
      console.warn('Analysis error:', err);
      // Fallback
      setAnalysisResult({
        scale: track.key || 'Lá Menor (Am)',
        bpm: track.bpm || 80,
        progression: track.chords || ['Am', 'F', 'C', 'G'],
        timeSignature: '4/4',
        structure: 'Intro [4c] → Tema Principal [8c] → Variação [8c] → Refrão [8c] → Outro [4c]',
        acousticProfile: {
          subBassEnergy: '55%',
          presenceMid: '70%',
          pianoDynamics: 'mf expressivo',
          masteringTarget: '-14 LUFS',
        },
        poeticNotes: `Estrutura harmônica de ${track.title} com ênfase na precisão tímbrica e equilíbrio acústico.`,
        cifras: (track.chords || ['Am', 'F', 'C', 'G']).map((c, idx) => ({
          chord: c,
          timing: `0:${(idx * 15).toString().padStart(2, '0')}`,
          lyric: `Compasso ${idx + 1} - Transição harmônica`,
        })),
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateLyrics = async () => {
    setIsGeneratingLyrics(true);
    try {
      const res = await fetch('/api/gemini/generate-lyrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          genre: lyricsGenre,
          theme: lyricsTheme,
          artistStyle: lyricsGenre.includes('Rap') ? 'Racionais / Sabotage / Emicida' : 'Poesia Acústica',
        }),
      });
      const data = await res.json();
      setGeneratedLyrics(data.lyrics || '');
    } catch (err) {
      console.error(err);
      setGeneratedLyrics(
        `[Intro - Piano suave]\nMadrugadas silenciosas, linhas de código na tela,\nCada nota no teclado é a luz na minha janela.\n\n[Verso 1]\nO relógio corre contra a gravidade,\nVia Láctea no peito trazendo clareza pra cidade.\nOuvindo Chopin no fone, batida no coração,\nConstruindo o futuro com as próprias mãos.\n\n[Refrão]\n48 quilohertz, som puro e sem ruído,\nO que foi sonhado agora é construído.\nDo terminal ao celular, o ritmo não para,\nA precisão é a marca que o destino separa.`
      );
    } finally {
      setIsGeneratingLyrics(false);
    }
  };

  const copyLyrics = () => {
    navigator.clipboard.writeText(generatedLyrics);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Subtab navigation */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-2 text-xs font-mono">
        <button
          onClick={() => setActiveSubTab('analysis')}
          className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
            activeSubTab === 'analysis' ? 'bg-[#ff0055] text-white font-semibold' : 'text-zinc-400 hover:text-white bg-zinc-900'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          Análise Harmônica & Cifras
        </button>

        <button
          onClick={() => setActiveSubTab('lyrics')}
          className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
            activeSubTab === 'lyrics' ? 'bg-[#ff0055] text-white font-semibold' : 'text-zinc-400 hover:text-white bg-zinc-900'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          Gerador de Letras & Poesia com IA
        </button>
      </div>

      {activeSubTab === 'analysis' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Main Info Card */}
          <div className="md:col-span-2 bg-[#111113] border border-zinc-800 rounded-lg p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div>
                <span className="text-[11px] font-mono text-zinc-500">OBRA SELECIONADA:</span>
                <h3 className="text-base font-bold text-white tracking-tight">
                  {currentTrack ? currentTrack.title : 'Nenhuma faixa selecionada'}
                </h3>
                <p className="text-xs text-zinc-400 font-mono">
                  {currentTrack ? `${currentTrack.artist} • ${currentTrack.category}` : 'Selecione uma faixa para analisar'}
                </p>
              </div>

              {currentTrack && (
                <button
                  onClick={() => triggerAnalysis(currentTrack)}
                  disabled={isAnalyzing}
                  className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono flex items-center gap-1.5 border border-zinc-700 transition-colors disabled:opacity-50"
                >
                  <Sparkles className={`w-3.5 h-3.5 text-amber-400 ${isAnalyzing ? 'animate-spin' : ''}`} />
                  {isAnalyzing ? 'Analisando...' : 'Reanalisar com IA'}
                </button>
              )}
            </div>

            {analysisResult ? (
              <div className="space-y-4 text-xs font-mono">
                {/* Harmonic Tags Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="p-2.5 rounded bg-[#0a0a0c] border border-zinc-800">
                    <span className="text-zinc-500 text-[10px]">TOM & ESCALA</span>
                    <p className="text-zinc-100 font-bold mt-0.5">{analysisResult.scale}</p>
                  </div>
                  <div className="p-2.5 rounded bg-[#0a0a0c] border border-zinc-800">
                    <span className="text-zinc-500 text-[10px]">ANDAMENTO (BPM)</span>
                    <p className="text-[#00ff88] font-bold mt-0.5">{analysisResult.bpm} BPM</p>
                  </div>
                  <div className="p-2.5 rounded bg-[#0a0a0c] border border-zinc-800">
                    <span className="text-zinc-500 text-[10px]">COMPASSO</span>
                    <p className="text-zinc-100 font-bold mt-0.5">{analysisResult.timeSignature || '4/4'}</p>
                  </div>
                  <div className="p-2.5 rounded bg-[#0a0a0c] border border-zinc-800">
                    <span className="text-zinc-500 text-[10px]">MASTERING ALVO</span>
                    <p className="text-zinc-100 font-bold mt-0.5">{analysisResult.acousticProfile?.masteringTarget || '-14 LUFS'}</p>
                  </div>
                </div>

                {/* Chords Progression Bar */}
                <div className="p-3 rounded bg-[#0a0a0c] border border-zinc-800">
                  <span className="text-zinc-500 text-[10px] block mb-1.5">PROGRESSÃO DE ACORDES PRINCIPAL:</span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {analysisResult.progression?.map((chord: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded bg-[#ff0055]/15 border border-[#ff0055]/40 text-[#ff0055] font-bold text-sm">
                          {chord}
                        </span>
                        {idx < analysisResult.progression.length - 1 && (
                          <span className="text-zinc-600">→</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Structure Breakdown */}
                <div className="p-3 rounded bg-[#0a0a0c] border border-zinc-800">
                  <span className="text-zinc-500 text-[10px] block mb-1">ESTRUTURA FORMAL DA COMPOSIÇÃO:</span>
                  <p className="text-zinc-200 leading-relaxed">{analysisResult.structure}</p>
                </div>

                {/* Poetic & Acoustic Analysis */}
                <div className="p-3 rounded bg-[#0a0a0c] border border-zinc-800">
                  <span className="text-zinc-500 text-[10px] block mb-1">NOTAS POÉTICAS & DIRETRIZES DO ENGENHEIRO:</span>
                  <p className="text-zinc-300 leading-relaxed">{analysisResult.poeticNotes}</p>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-zinc-500 font-mono text-xs">
                Carregando análise acústica do Gemini...
              </div>
            )}
          </div>

          {/* Side: Interactive Chords / Cifras Timeline */}
          <div className="bg-[#111113] border border-zinc-800 rounded-lg p-5 flex flex-col gap-3">
            <div className="flex items-center gap-2 pb-2 border-b border-zinc-800 font-mono text-xs text-zinc-200">
              <Music className="w-4 h-4 text-[#ff0055]" />
              <span className="font-bold">LINHA TEMPORAL DE CIFRAS</span>
            </div>

            <div className="space-y-2 overflow-y-auto max-h-96 pr-1">
              {analysisResult?.cifras?.map((item: any, i: number) => (
                <div
                  key={i}
                  className="p-2.5 rounded bg-[#0a0a0c] border border-zinc-800 hover:border-zinc-700 transition-colors flex items-center justify-between gap-3 text-xs font-mono"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="px-2 py-0.5 rounded bg-[#ff0055] text-white font-bold text-xs">
                      {item.chord}
                    </span>
                    <span className="text-zinc-400 text-[11px] truncate max-w-[130px]">{item.lyric}</span>
                  </div>
                  <span className="text-zinc-500 text-[10px] shrink-0">{item.timing}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Subtab: AI Lyrics Generator */}
      {activeSubTab === 'lyrics' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Controls */}
          <div className="bg-[#111113] border border-zinc-800 rounded-lg p-5 flex flex-col gap-4">
            <div className="pb-3 border-b border-zinc-800">
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                PARÂMETROS DA LETRA AUTORAL
              </h3>
              <p className="text-xs text-zinc-400 font-mono">
                Modelos de geração de versos poéticos do Gemini 3
              </p>
            </div>

            <div>
              <label className="text-xs font-mono text-zinc-400 block mb-1">Gênero Musical:</label>
              <select
                value={lyricsGenre}
                onChange={(e) => setLyricsGenre(e.target.value)}
                className="w-full bg-[#0a0a0c] border border-zinc-800 rounded p-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-[#ff0055]"
              >
                <option value="Rap Nacional">Rap Nacional (Racionais / Sabotage)</option>
                <option value="Poesia Acústica">Poesia Acústica & Cypher Melódica</option>
                <option value="Piano & Voz Acústico">Piano Solo & Voz Poética Clássica</option>
                <option value="Trap Nacional">Trap Nacional (808 Lírico)</option>
                <option value="Treino Phonk">Phonk / Alta Energia para Treino</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-mono text-zinc-400 block mb-1">Tema / Mensagem Central:</label>
              <textarea
                value={lyricsTheme}
                onChange={(e) => setLyricsTheme(e.target.value)}
                rows={4}
                className="w-full bg-[#0a0a0c] border border-zinc-800 rounded p-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-[#ff0055] resize-none"
                placeholder="Ex: Noites de programação no Linux, disciplina, superação, harmonia ao piano..."
              />
            </div>

            <button
              onClick={handleGenerateLyrics}
              disabled={isGeneratingLyrics}
              className="w-full py-2.5 rounded bg-[#ff0055] hover:bg-[#ff0055]/90 text-white font-mono text-xs font-semibold flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-50"
            >
              <Sparkles className={`w-4 h-4 ${isGeneratingLyrics ? 'animate-spin' : ''}`} />
              {isGeneratingLyrics ? 'Gerando com Gemini 3.8...' : 'Gerar Letra Autoral'}
            </button>
          </div>

          {/* Generated Lyrics Output */}
          <div className="md:col-span-2 bg-[#111113] border border-zinc-800 rounded-lg p-5 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-3">
              <div className="flex items-center gap-2 font-mono text-xs text-zinc-300">
                <FileText className="w-4 h-4 text-sky-400" />
                <span className="font-bold text-white">LETRA GERADA</span>
                <span className="text-zinc-500">[{lyricsGenre}]</span>
              </div>

              {generatedLyrics && (
                <button
                  onClick={copyLyrics}
                  className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono flex items-center gap-1.5 transition-colors border border-zinc-700"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-[#00ff88]" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copiado!' : 'Copiar Letra'}
                </button>
              )}
            </div>

            <div className="flex-1 bg-[#0a0a0c] border border-zinc-800 rounded p-4 font-mono text-xs text-zinc-200 whitespace-pre-wrap leading-relaxed overflow-y-auto max-h-[480px]">
              {generatedLyrics ? (
                generatedLyrics
              ) : (
                <span className="text-zinc-600 italic">
                  Clique em "Gerar Letra Autoral" para compor versos exclusivos com a IA baseados no tema e gênero selecionados.
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
