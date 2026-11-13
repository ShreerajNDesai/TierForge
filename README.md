# 🎮 TierForge

<p align="center">
  <strong>A sleek, cinematic desktop game launcher, library organizer, tier list creator, and backlog tracker.</strong>
  <br />
  Powered by Electron, React, TypeScript, Tailwind CSS, and Google Gemini AI.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Electron-39-47848F?logo=electron&logoColor=white" alt="Electron" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/TailwindCSS-3-38B2AC?logo=tailwind-css&logoColor=white" alt="Tailwind" />
  <img src="https://img.shields.io/badge/SQLite-Better--SQLite3-003B57?logo=sqlite&logoColor=white" alt="SQLite" />
  <img src="https://img.shields.io/badge/AI-Google%20Gemini-8E75C2?logo=google&logoColor=white" alt="Gemini AI" />
  <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License" />
</p>

---

## 🌟 Features

### 🕹️ Library & Launcher
- **Local Scanner**: Auto-detects installed Steam titles across multiple library drives and custom directories (`C:\Games`, `D:\Games`, Epic, GOG, etc.).
- **Steam Integration**: Import your full Steam library with playtime, covers, and live achievement progression via the Steam Web API.
- **Cinematic Game View**: Immersive modal featuring backdrop trailers, high-res screenshots, HowLongToBeat stats, PC system requirements, and age ratings.
- **Session & Playtime Tracking**: Automatically logs session durations, launches titles, and updates playtime in a local SQLite database.

### 🏆 Tier List Creator
- **Interactive Drag-and-Drop**: Easily rank your games into customizable tiers (S, A, B, C, D, F) with smooth physics.
- **Export & Share**: Generate high-resolution exportable tier list images ready for social media.

### 🔮 AI Oracle (Gemini 2.5)
- **Backlog Cure**: Beat analysis paralysis — let AI pick the exact game you should play tonight based on your mood and past favorites.
- **Smart Play Order**: Generates the canon chronological story order for sprawling franchises (e.g., *Resident Evil*, *Kingdom Hearts*, *Metal Gear*).
- **Game Compatibility Score**: Evaluates whether a new game aligns with your historical preferences before you buy.
- **AI Recommendations & Deep Cuts**: Discover hidden gems and indie masterpieces tailored to your specific taste.
- **Gamer Profile**: A playful AI roast and summary of your gaming habits and backlog stats.

### ☁️ Cloud Saves & Backup
- **Save File Auto-Detection**: Integrates with [Ludusavi](https://github.com/mtkennerly/ludusavi) manifest to identify local save paths for thousands of games.
- **Google Drive Backup**: Zip and sync game saves directly to Google Drive (`TierForge Cloud Saves`), allowing painless restore across machines.
- **Local JSON / DB Backups**: One-click full data exports and imports.

### 💬 Discord Rich Presence
- Live Discord activity status showing when you are organizing your library or playing games with elapsed time.

### 🧩 Plugin System
- Extend TierForge with custom plugins (custom CSS themes, hooks on game launch/close, sidebar extensions).

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (version **20.x** or **22.x** recommended)
- `npm` (comes with Node.js)
- Windows, macOS, or Linux

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ShreerajNDesai/TierForge.git
   cd TierForge
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment (Optional):**
   Copy the example environment configuration:
   ```bash
   cp .env.example .env
   ```
   *(See [Configuration](#-configuration) below for details.)*

4. **Launch development mode:**
   ```bash
   npm run dev
   ```

---

## 🔑 Configuration

All core third-party APIs can be easily configured inside the app via **Settings**:

| Service | Setting | Description |
| :--- | :--- | :--- |
| **Google Gemini** | `geminiKey` | Powers the AI Oracle, recommendations, canon play order, and backlog curing. |
| **IGDB (Twitch)** | `igdb_client_id` & `igdb_client_secret` | Fetches rich metadata, covers, screenshots, ratings, and trailers. |
| **Steam Web API** | `steamKey` & `steamId` | Syncs owned Steam games, playtime, and user achievements. |
| **Google Drive** | `GDRIVE_CLIENT_ID` & `GDRIVE_CLIENT_SECRET` | *(Optional)* Cloud save backups. Can be supplied via `.env` or in-app. |

---

## 🛠️ Available Scripts

- **`npm run dev`**: Starts Vite dev server with Electron hot reload.
- **`npm run build`**: Runs type checking and builds the production bundle.
- **`npm run test`**: Runs unit tests with Vitest.
- **`npm run lint`**: Checks code quality with ESLint and Prettier.
- **`npm run typecheck`**: Runs TypeScript compilation check without emitting files.
- **`npm run build:win`**: Packages a Windows installer/executable via electron-builder.
- **`npm run build:mac`**: Packages for macOS.
- **`npm run build:linux`**: Packages for Linux (AppImage / deb / snap).

---

## 🏗️ Architecture

```
tierforge/
├── src/
│   ├── main/                 # Electron Main Process
│   │   ├── api.ts            # External API integrations (IGDB, Steam, Gemini, CheapShark)
│   │   ├── database.ts       # Better-SQLite3 schema, prepared queries, and migrations
│   │   ├── discord.ts        # Discord RPC client
│   │   ├── driveConfig.ts    # Google Drive OAuth configuration
│   │   ├── ludusavi.ts       # Save file detection and cloud backup zipping
│   │   ├── scanner.ts        # Local executable and Steam library scanner
│   │   ├── index.ts          # Main window lifecycle and IPC handlers
│   │   └── plugins/          # Extensible plugin manager
│   ├── preload/              # Secure contextBridge preload scripts
│   └── renderer/             # React 19 Frontend
│       ├── src/
│       │   ├── components/   # Modals, HUD, Navigation, Cinematic cards
│       │   ├── context/      # Global state provider
│       │   ├── pages/        # Library, TierList, Discover, AI Oracle, Stats, Settings
│       │   └── hooks/        # Custom React hooks (gamepad, scrolling)
├── electron-builder.yml      # Desktop packaging configuration
├── electron.vite.config.ts   # Vite bundler configuration
└── package.json
```

---

## 🔒 Security & Privacy

- **Local-First**: All your games, tags, notes, and playtime are stored locally in your operating system's `AppData` directory via an encrypted/isolated SQLite database (`tierforge.db`).
- **Context Isolation**: Strict Electron `contextBridge` isolation is enforced — renderer components cannot access Node.js primitives or native system files directly.
- **Safe Protocols**: External URLs and executable launches are validated before execution.

---

## 🤝 Contributing

Contributions, feature requests, and bug reports are welcome!
1. Fork the project.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
