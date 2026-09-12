import { EQBand, EQPreset, Track } from '../types';
import { getApiBase } from '../config';

export const EQ_FREQUENCIES = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

export const EQ_PRESETS: EQPreset[] = [
  {
    name: 'Flat (Direto de Estúdio)',
    description: 'Resposta de frequência linear sem coloração para monitoramento neutro.',
    gains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
  {
    name: 'Piano Clássico Acústico',
    description: 'Reforço de ressonância de madeira (250Hz) e brilho cristalino nos harmônicos superiores.',
    gains: [1, 2, 3, 2, 0, 1, 2, 3, 4, 3],
  },
  {
    name: 'Rap Nacional & Trap 808',
    description: 'Sub-graves acentuados (32-64Hz), corte sutil em médios e presença clara nos vocais.',
    gains: [6, 7, 3, -1, -2, 1, 2, 3, 2, 1],
  },
  {
    name: 'Música Eletrônica & Club',
    description: 'Curva em V cirúrgica com kick e sub reforçados e agudos estalados.',
    gains: [5, 6, 2, -2, -1, 1, 2, 4, 5, 5],
  },
  {
    name: 'Poesia Acústica & Voz',
    description: 'Corte de frequências sub-graves desnecessárias e ganho nos formantes vocais (1k-4kHz).',
    gains: [-3, -1, 1, 2, 3, 4, 4, 3, 1, 0],
  },
  {
    name: 'Treino & Phonk Impact',
    description: 'Ênfase máxima em graves de impacto e médios-altos cortantes para foco de alta energia.',
    gains: [7, 8, 4, 0, -1, 1, 3, 4, 3, 2],
  },
];

class AudioEngineService {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private masterGain: GainNode | null = null;
  private eqFilters: BiquadFilterNode[] = [];
  
  // Media element audio (for uploaded MP3s/WAVs/FLACs)
  private audioElement: HTMLAudioElement | null = null;
  private mediaSourceNode: MediaElementAudioSourceNode | null = null;

  // Synthesizer runtime for built-in tracks
  private synthIntervalId: number | null = null;
  private synthStep = 0;
  private isSynthPlaying = false;
  private currentTrack: Track | null = null;
  private startTime = 0;
  private pauseOffset = 0;
  private isPlayingState = false;
  private playGeneration = 0;

  // Callbacks
  private onTimeUpdateCallback?: (time: number, duration: number) => void;
  private onStateChangeCallback?: (isPlaying: boolean) => void;
  private onTrackEndedCallback?: () => void;
  private onErrorCallback?: (error: string) => void;

  constructor() {
    // Initialized lazily on first user interaction
  }

  public initContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtxClass();

      // Master Gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);

      // Analyser Node for FFT Visualizer
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.82;

      // Create 10-band EQ
      this.eqFilters = EQ_FREQUENCIES.map((freq, index) => {
        const filter = this.ctx!.createBiquadFilter();
        if (index === 0) {
          filter.type = 'lowshelf';
        } else if (index === EQ_FREQUENCIES.length - 1) {
          filter.type = 'highshelf';
        } else {
          filter.type = 'peaking';
          filter.Q.value = 1.4;
        }
        filter.frequency.value = freq;
        filter.gain.value = 0;
        return filter;
      });

      // Chain filters in series: Filter0 -> Filter1 -> ... -> Filter9
      for (let i = 0; i < this.eqFilters.length - 1; i++) {
        this.eqFilters[i].connect(this.eqFilters[i + 1]);
      }

      // Connect last filter -> Analyser -> Master Gain -> Destination
      const lastFilter = this.eqFilters[this.eqFilters.length - 1];
      lastFilter.connect(this.analyser);
      this.analyser.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      // Setup audio element for uploaded files
      this.audioElement = new Audio();
      this.audioElement.crossOrigin = 'anonymous';
      this.mediaSourceNode = this.ctx.createMediaElementSource(this.audioElement);
      this.mediaSourceNode.connect(this.eqFilters[0]);

      this.audioElement.addEventListener('timeupdate', () => {
        if (this.audioElement && this.onTimeUpdateCallback && !this.isSynthPlaying) {
          this.onTimeUpdateCallback(this.audioElement.currentTime, this.audioElement.duration || 1);
        }
      });

      this.audioElement.addEventListener('ended', () => {
        this.isPlayingState = false;
        if (this.onStateChangeCallback) this.onStateChangeCallback(false);
        if (this.onTrackEndedCallback) this.onTrackEndedCallback();
      });
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    return this.ctx;
  }

  public setCallbacks(
    onTimeUpdate: (time: number, duration: number) => void,
    onStateChange: (isPlaying: boolean) => void,
    onTrackEnded: () => void,
    onError?: (error: string) => void
  ) {
    this.onTimeUpdateCallback = onTimeUpdate;
    this.onStateChangeCallback = onStateChange;
    this.onTrackEndedCallback = onTrackEnded;
    this.onErrorCallback = onError;
  }

  public async playTrack(track: Track, startFromSeconds = 0) {
    this.initContext();
    this.currentTrack = track;
    this.stopCurrent();

    if (!navigator.userActivation?.hasBeenActive) {
      console.warn('Playback blocked: no user activation');
      return;
    }

    // Build audio URL from audioKey if not already set
    if (track.audioKey && !track.audioUrl) {
      track.audioUrl = `${getApiBase()}/api/audio/${track.audioKey}`;
    }

    if (track.audioUrl && !track.isSynthesized) {
      this.isSynthPlaying = false;
      if (this.audioElement) {
        this.audioElement.src = track.audioUrl;
        this.audioElement.currentTime = startFromSeconds;
        const generation = ++this.playGeneration;
        this.audioElement.play().catch((err) => {
          if (this.playGeneration !== generation) return;
          console.error('Audio play error:', err);
          this.isPlayingState = false;
          if (this.onStateChangeCallback) this.onStateChangeCallback(false);
          if (this.onErrorCallback) {
            if (!navigator.onLine) {
              this.onErrorCallback('Sem conexão. Baixe a música para ouvir offline.');
            } else {
              this.onErrorCallback('Erro ao reproduzir. Tente baixar a música para ouvir offline.');
            }
          }
        });
      }
    } else {
      this.startProceduralSynth(track, startFromSeconds);
    }

    this.isPlayingState = true;
    if (this.onStateChangeCallback) this.onStateChangeCallback(true);
  }

  public pause() {
    if (this.isSynthPlaying) {
      this.stopSynthInterval();
      if (this.ctx) {
        this.pauseOffset += (this.ctx.currentTime - this.startTime);
      }
    } else if (this.audioElement) {
      this.audioElement.pause();
    }
    this.isPlayingState = false;
    if (this.onStateChangeCallback) this.onStateChangeCallback(false);
  }

  public resume() {
    this.initContext();
    if (this.currentTrack) {
      if (!navigator.userActivation?.hasBeenActive) {
        console.warn('Resume blocked: no user activation');
        return;
      }
      if (this.isSynthPlaying || this.currentTrack.isSynthesized) {
        this.startProceduralSynth(this.currentTrack, this.pauseOffset);
      } else if (this.audioElement) {
        this.audioElement.play();
      }
      this.isPlayingState = true;
      if (this.onStateChangeCallback) this.onStateChangeCallback(true);
    }
  }

  public seek(seconds: number) {
    if (this.isSynthPlaying && this.currentTrack) {
      this.pauseOffset = seconds;
      if (this.isPlayingState) {
        this.startProceduralSynth(this.currentTrack, seconds);
      } else if (this.onTimeUpdateCallback) {
        this.onTimeUpdateCallback(seconds, this.currentTrack.duration);
      }
    } else if (this.audioElement && this.currentTrack) {
      this.audioElement.currentTime = seconds;
    }
  }

  public stopCurrent() {
    this.stopSynthInterval();
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
    }
    this.isSynthPlaying = false;
    this.pauseOffset = 0;
  }

  public setVolume(val: number) {
    if (this.masterGain && this.ctx) {
      const clamped = Math.max(0, Math.min(1, val));
      this.masterGain.gain.setValueAtTime(clamped, this.ctx.currentTime);
    }
  }

  public setEQBandGain(index: number, gainDb: number) {
    if (this.eqFilters[index] && this.ctx) {
      this.eqFilters[index].gain.setTargetAtTime(gainDb, this.ctx.currentTime, 0.05);
    }
  }

  public applyEQPreset(preset: EQPreset) {
    preset.gains.forEach((gain, i) => {
      this.setEQBandGain(i, gain);
    });
  }

  public getAnalyserData(): { freq: Uint8Array; time: Uint8Array } {
    if (!this.analyser) {
      return { freq: new Uint8Array(64), time: new Uint8Array(64) };
    }
    const freqData = new Uint8Array(this.analyser.frequencyBinCount);
    const timeData = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(freqData);
    this.analyser.getByteTimeDomainData(timeData);
    return { freq: freqData, time: timeData };
  }

  // --- PROCEDURAL AUDIO SYNTHESIZER FOR BUILT-IN TRACKS ---
  private startProceduralSynth(track: Track, startOffset = 0) {
    this.stopSynthInterval();
    this.isSynthPlaying = true;
    this.startTime = this.ctx ? this.ctx.currentTime : 0;
    this.pauseOffset = startOffset;
    this.synthStep = Math.floor(startOffset * 4);

    const bpm = track.bpm || 80;
    const intervalMs = (60 / bpm / 2) * 1000; // eighth-note pulse

    // Schedule tick
    this.synthIntervalId = window.setInterval(() => {
      if (!this.ctx || !this.isSynthPlaying) return;

      const elapsed = this.pauseOffset + (this.ctx.currentTime - this.startTime);
      if (elapsed >= track.duration) {
        this.stopCurrent();
        this.isPlayingState = false;
        if (this.onStateChangeCallback) this.onStateChangeCallback(false);
        if (this.onTrackEndedCallback) this.onTrackEndedCallback();
        return;
      }

      if (this.onTimeUpdateCallback) {
        this.onTimeUpdateCallback(elapsed, track.duration);
      }

      this.triggerSynthPattern(track.synthPreset || 'piano', this.synthStep);
      this.synthStep++;
    }, intervalMs);
  }

  private stopSynthInterval() {
    if (this.synthIntervalId !== null) {
      clearInterval(this.synthIntervalId);
      this.synthIntervalId = null;
    }
  }

  private triggerSynthPattern(preset: string, step: number) {
    if (!this.ctx || !this.eqFilters[0]) return;
    const now = this.ctx.currentTime;
    const inputNode = this.eqFilters[0];

    // Note frequencies
    const C3 = 130.81, D3 = 146.83, Eb3 = 155.56, E3 = 164.81, F3 = 174.61, G3 = 196.00, Ab3 = 207.65, A3 = 220.00, Bb3 = 233.08, B3 = 246.94;
    const C4 = 261.63, D4 = 293.66, Eb4 = 311.13, E4 = 329.63, F4 = 349.23, G4 = 392.00, Ab4 = 415.30, A4 = 440.00, Bb4 = 466.16, B4 = 493.88;
    const C5 = 523.25, D5 = 587.33, Eb5 = 622.25, E5 = 659.25, G5 = 783.99;

    if (preset === 'piano') {
      // Classical Piano Arpeggio (Chopin / Beethoven / Satie inspiration)
      const pianoChords = [
        [C3, G3, C4, Eb4, G4],
        [Ab3, Eb4, Ab4, C5],
        [Bb3, F4, Bb4, D5],
        [G3, D4, G4, B4],
      ];
      const chordIndex = Math.floor((step % 32) / 8);
      const chord = pianoChords[chordIndex];
      const note = chord[step % chord.length];

      // Melodic note on top every 2 steps
      if (step % 2 === 0) {
        this.playPianoTone(note, 0.45, 1.2, inputNode);
      }
      // Bass root on downbeat
      if (step % 8 === 0) {
        this.playPianoTone(chord[0] / 2, 0.6, 2.0, inputNode);
      }
    } else if (preset === 'ambient') {
      // Hans Zimmer Interstellar Style Pad & Arpeggio (A minor)
      const zimmerNotes = [A3, C4, E4, A4, G4, E4, C4, B3];
      const note = zimmerNotes[step % zimmerNotes.length];
      this.playPluckTone(note, 0.35, 0.8, 'triangle', inputNode);

      if (step % 16 === 0) {
        // Deep sub pedal note
        this.playSubBass(55, 0.5, 3.5, inputNode);
      }
    } else if (preset === 'synthwave') {
      // 80s Cyberpunk / Electronic pulse
      const bassline = [110, 110, 130.81, 110, 164.81, 146.83, 110, 98];
      const bassNote = bassline[step % 8];
      this.playSawSynth(bassNote, 0.3, 0.25, inputNode);

      if (step % 4 === 2) {
        // Hi-hat / snare noise
        this.playNoiseSnare(inputNode);
      }
    } else if (preset === 'hiphop') {
      // Rap Nacional / 90s Boom Bap & 808
      if (step % 8 === 0) {
        this.playSubBass(45, 0.7, 0.8, inputNode); // Heavy 808 Kick
      }
      if (step % 8 === 4) {
        this.playNoiseSnare(inputNode); // Snare
      }
      if (step % 2 === 0) {
        // Rhodes piano chord
        const rhodes = [C4, Eb4, G4];
        rhodes.forEach((n) => this.playPianoTone(n, 0.2, 0.4, inputNode));
      }
    } else if (preset === 'phonk') {
      // Cowbell melody & aggressive 808
      const cowbellNotes = [587.33, 659.25, 783.99, 880.00, 783.99, 659.25];
      const cb = cowbellNotes[step % cowbellNotes.length];
      this.playCowbell(cb, 0.4, inputNode);

      if (step % 4 === 0) {
        this.playSubBass(50, 0.8, 0.5, inputNode);
      }
    }
  }

  // --- AUDIO SYNTH TONE GENERATORS ---
  private playPianoTone(freq: number, gainVal: number, duration: number, dest: AudioNode) {
    if (!this.ctx) return;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'triangle';
    osc2.type = 'sine';
    osc1.frequency.value = freq;
    osc2.frequency.value = freq * 2; // harmonic

    const now = this.ctx.currentTime;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(gainVal, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(dest);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + duration + 0.05);
    osc2.stop(now + duration + 0.05);
  }

  private playPluckTone(freq: number, gainVal: number, duration: number, type: OscillatorType, dest: AudioNode) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = type;
    osc.frequency.value = freq;

    filter.type = 'lowpass';
    filter.frequency.value = 1800;

    const now = this.ctx.currentTime;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(gainVal, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    osc.start(now);
    osc.stop(now + duration + 0.05);
  }

  private playSubBass(freq: number, gainVal: number, duration: number, dest: AudioNode) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.value = freq;

    const now = this.ctx.currentTime;
    gain.gain.setValueAtTime(gainVal, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(dest);

    osc.start(now);
    osc.stop(now + duration + 0.05);
  }

  private playSawSynth(freq: number, gainVal: number, duration: number, dest: AudioNode) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.value = freq;

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2400, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + duration);

    const now = this.ctx.currentTime;
    gain.gain.setValueAtTime(gainVal, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    osc.start(now);
    osc.stop(now + duration + 0.05);
  }

  private playNoiseSnare(dest: AudioNode) {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 0.1;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1000;

    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    noise.start(now);
  }

  private playCowbell(freq: number, gainVal: number, dest: AudioNode) {
    if (!this.ctx) return;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc1.type = 'square';
    osc2.type = 'square';
    osc1.frequency.value = freq;
    osc2.frequency.value = freq * 1.48; // Phonk cowbell metallic ratio

    filter.type = 'bandpass';
    filter.frequency.value = freq;
    filter.Q.value = 3.0;

    const now = this.ctx.currentTime;
    gain.gain.setValueAtTime(gainVal, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.3);
    osc2.stop(now + 0.3);
  }
}

export const audioEngine = new AudioEngineService();
