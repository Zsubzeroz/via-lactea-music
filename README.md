# Via Láctea Music

Player de música pessoal com equalizador paramétrico, visualizer em tempo real, download offline e integração com IA para análise harmonica.

## Tech Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 19 + TypeScript + Vite |
| Estilo | Tailwind CSS v4 |
| Áudio | Web Audio API (10-band EQ + FFT Visualizer) |
| Backend | Express + Node.js |
| Banco | Firebase Firestore (real-time) |
| Storage | Cloudflare R2 + IndexedDB (offline) |
| IA | Google Gemini 2.0 Flash |
| Download | yt-dlp (server-side) |
| Tunnel | Cloudflare Quick Tunnel |
| Deploy | Firebase Hosting |

## Funcionalidades

- **Reprodutor** com controles completos (play/pause, next/prev, seek, volume, shuffle, loop)
- **Equalizador paramétrico** de 10 bandas com presets (Flat, Piano Clássico, Rap 808, Eletrônica, Poesia, Treino)
- **Visualizer** em tempo real com FFT e formas de onda
- **Biblioteca** com busca, filtros por categoria e ordenação (título, artista, duração, BPM)
- **Álbuns** agrupados por categoria
- **Download de músicas** via yt-dlp (YouTube, SoundCloud)
- **Upload local** com conversão OGG/AAC via FFmpeg.wasm
- **Download offline** — salva tracks do servidor no IndexedDB para funcionar sem internet
- **Análise harmonica com IA** — acordes, cifras e estrutura via Gemini
- **Sincronização real-time** via Firestore
- **Atalhos de teclado** — Espaço (play/pause), setas (seek)
- **PWA** — instalável no mobile e desktop
- **100% gratuito** — sem cartão, sem tier pago

## Estrutura do Projeto

```
via-lactea-music/
├── src/
│   ├── components/
│   │   ├── AlbumsView.tsx      # Visualização de álbuns
│   │   ├── DownloadModal.tsx   # Modal de download (yt-dlp)
│   │   ├── EqualizerModal.tsx  # Equalizador 10-band
│   │   ├── Header.tsx          # Navegação e ações
│   │   ├── LibraryView.tsx     # Biblioteca com busca/filtros
│   │   ├── PlayerBar.tsx       # Barra de reprodução
│   │   ├── UploadModal.tsx     # Modal de upload local
│   │   └── VisualizerCanvas.tsx # Canvas do visualizer
│   ├── services/
│   │   ├── audioEngine.ts      # Engine de áudio (Web Audio API)
│   │   ├── audioConverter.ts   # Conversão OGG/AAC via FFmpeg
│   │   ├── firebase.ts         # Firestore real-time listener
│   │   ├── firebaseAdmin.ts    # Firebase Admin SDK
│   │   ├── offlineStore.ts     # IndexedDB (offline + download)
│   │   └── r2.ts               # Cloudflare R2 presigned URLs
│   ├── data/
│   │   └── mockTracks.ts       # Categorias e metadados
│   ├── types.ts                # Interfaces TypeScript
│   ├── config.ts               # URL base da API
│   ├── App.tsx                 # Componente principal
│   └── main.tsx                # Entry point
├── audio/                      # Arquivos de áudio locais
├── covers/                     # Capas de álbuns
├── scripts/
│   └── import_local_folder.ts  # Importação em massa
├── server.ts                   # Express server
├── .env                        # Variáveis de ambiente
└── firebase.json               # Configuração Firebase
```

## Como Rodar

### Pré-requisitos

- Node.js 18+
- yt-dlp (para downloads)
- cloudflared (para tunnel)

### Instalação

```bash
npm install
```

### Variáveis de Ambiente

Copie `.env.example` para `.env` e configure:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_API_BASE_URL=https://SEU-TUNNEL.trycloudflare.com
GEMINI_API_KEY=...
```

### Desenvolvimento

```bash
npm run dev
```

O servidor inicia em `http://localhost:3001`.

### Tunnel (para acesso externo)

```bash
cloudflared tunnel --url http://localhost:3001
```

Copie a URL gerada e atualize `VITE_API_BASE_URL` no `.env`.

### Build e Deploy

```bash
npm run build
firebase deploy --only hosting
```

## Arquitetura

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Firebase Host   │────▶│  Cloudflare      │────▶│  Express Server  │
│  (static SPA)   │     │  Tunnel          │     │  (port 3001)    │
└─────────────────┘     └──────────────────┘     └────────┬────────┘
                                                          │
                                           ┌──────────────┼──────────────┐
                                           ▼              ▼              ▼
                                      ┌─────────┐  ┌──────────┐  ┌───────────┐
                                      │ Firestore│  │  audio/  │  │  yt-dlp   │
                                      │ (metadata│  │  (files) │  │ (download)│
                                      └─────────┘  └──────────┘  └───────────┘
```

- **Firebase Hosting** serve o SPA estático
- **Express Server** roda localmente, serve áudio e APIs
- **Cloudflare Tunnel** expõe o servidor para o mundo
- **Firestore** sincroniza metadados em real-time
- **IndexedDB** armazena áudio para offline

## Comandos

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run start` | Servidor de produção |
| `npm run lint` | Type check (tsc --noEmit) |
| `npm run import` | Importar pasta local de músicas |

## Licença

Uso pessoal. MIT
