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

<p align="center">
  <img src="screenshots/01-library-overview-grid.png" alt="TierForge Library Overview" width="95%" />
</p>

---

## 📸 Visual Showcase & Feature Tour

### 🕹️ 1. Library & Game Management
Organize your entire gaming universe. Scan local drives, sync Steam, launch titles, and track playtime.

| 🎮 Library Overview & Quick Play | 📥 Multi-Source Import Hub |
| :---: | :---: |
| ![Library](screenshots/01-library-overview.png) | ![Import Hub](screenshots/01-library-import-hub.png) |
| *Library view with 'Currently Playing', 'Completed', and Backlog suggestions* | *AI Vision screenshot import, bulk text import, & Steam account sync* |

| 📤 Export Hub (Tier Lists & Mosaics) |
| :---: |
| ![Export Hub](screenshots/01-library-export-hub.png) |
| *One-click exports for high-resolution tier lists and library mosaics* |

---

### 🏆 2. Interactive Tier List Maker
Rank your games with interactive physics, customizable tiers, and ready-to-share exports.

| 🗂️ Drag-and-Drop Tier List Canvas | 🖼️ Exported High-Res Graphic |
| :---: | :---: |
| ![Interactive Tier List](screenshots/02-tier-list-interactive.png) | ![Exported Tier List](screenshots/02-tier-list-exported.png) |
| *Smooth drag & drop organization across S, A, B, C, D, F, and Dropped tiers* | *Crystal clear exported PNG ready for Twitter, Discord, and Reddit* |

---

### 🎬 3. Cinematic Game View
Immersive full-screen backdrop modals with live trailers, screenshots, specs, and cloud saves.

| 📖 Overview, Lore & Tech Specs | 📸 Gallery, Franchises & Save Linking |
| :---: | :---: |
| ![Cinematic Modal Overview](screenshots/03-cinematic-modal-overview.png) | ![Cinematic Modal Gallery](screenshots/03-cinematic-modal-gallery.png) |
| *Trailers, age ratings, HowLongToBeat stats, engine details, & storyline* | *Screenshot lightbox, canon play order generator, and linked cloud save status* |

---

### 🔮 4. AI Oracle (Powered by Gemini 2.5)
Combat backlog paralysis with intelligent, personalized gaming insights.

| ✨ Tailored Recommendations & Vibe Search | 🩺 The Backlog Therapist |
| :---: | :---: |
| ![AI Recommendations](screenshots/04-ai-oracle-recommendations.png) | ![Backlog Therapist](screenshots/04-ai-oracle-backlog-therapist.png) |
| *Deep cuts, hidden indie gems, and mood-based conversational search* | *One-click cure for decision paralysis: tells you exactly what to play tonight* |

---

### 🧭 5. Discover Hub & Global Leaderboards
Live IGDB feeds, curated genre collections, and critic leaderboards.

| 🔥 Trending & Popular Games | 💎 Curated Indie Masterpieces |
| :---: | :---: |
| ![Trending Games](screenshots/05-discover-trending.png) | ![Indie Showcase](screenshots/05-discover-indie.png) |
| *Real-time trending titles with instant one-click library additions* | *Discover acclaimed indie classics and rising hits* |

| 🏆 Global Hall of Fame |
| :---: |
| ![Global Rankings](screenshots/05-rankings-hall-of-fame.png) |
| *Critic podium and leaderboards across Steam, Metacritic, and IGDB* |

---

### 📊 6. Player Statistics & Live HUD
Deep analytics of your gaming habits, release timelines, and real-time hardware telemetry.

| 🪪 My Gamer Card & AI Profile | 📈 Release Eras Timeline & Trophy Cabinet |
| :---: | :---: |
| ![Gamer Card](screenshots/06-statistics-gamer-card.png) | ![Release Timeline](screenshots/06-statistics-release-timeline.png) |
| *Completion rates, library health bars, genre radar, and studio loyalty* | *Decade timeline of your collection, eras analysis, and completed trophies* |

| 💻 Live System Monitor & Session HUD |
| :---: |
| ![System Monitor](screenshots/06-system-monitor-hud.png) |
| *Real-time CPU, RAM, disk space, session uptime, and library completion tracking* |

---

### ⚙️ 7. Cloud Saves, Integrations & Extensibility
Complete control over backup folders, Google Drive sync, and plugin architectures.

| ☁️ Google Drive Cloud Save Sync | 🔌 Web Integrations & Plugin Engine |
| :---: | :---: |
| ![Cloud Backup](screenshots/07-settings-cloud-backup.png) | ![Plugins & Integrations](screenshots/07-settings-plugins-integrations.png) |
| *Automated save backups, Google Drive connection, and API key management* | *Custom URL templates (PCGamingWiki, repacks) and modular plugin manager* |

| ⚙️ General Preferences & Audio Controls |
| :---: |
| ![General Settings](screenshots/07-settings-general.png) |
| *Cinematic backdrop video modes, default audio, and Discord Rich Presence* |

---

### 🕹️ 8. Windows Tray Quick-Launcher
Access your gaming dashboard instantly from the Windows system tray without opening the full UI.

<p align="center">
  <img src="screenshots/08-desktop-tray-menu.png" alt="Desktop Tray Quick Launcher" width="340px" />
  <br />
  <em>Quick launch recent games, roll a random backlog title ("Surprise Me!"), toggle Discord RPC, scan your PC, and force cloud backups with zero friction.</em>
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
