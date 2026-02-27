<p align="center">
  <img src="assets/icon.png" width="100" height="100" alt="Knote icon" style="border-radius: 22px;" />
</p>

<h1 align="center">Knote</h1>

<p align="center">
  <strong>Your AI-Powered Note Companion</strong><br/>
  <em>Think it. Speak it. Knote captures it.</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Expo-54-000020?logo=expo&logoColor=white" />
  <img src="https://img.shields.io/badge/React%20Native-0.81-61DAFB?logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/Gemini%20AI-2.5-4285F4?logo=google&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/License-MIT-green" />
</p>

---

## ✨ Overview

**Knote** is a premium, AI-first note-taking app built with React Native & Expo. Powered entirely by **Google Gemini AI**, it transforms how you capture, organize, and interact with your ideas — through voice, text, images, and intelligent analysis.

Every feature is designed with **beautiful animations**, **edge-to-edge design**, and a **zero-cloud** privacy model — your data never leaves your device.

---

## 🎯 Key Features

### 🎙️ Voice Intelligence
- **AI Audio Transcription** — Speak naturally and Gemini transcribes directly from the audio waveform. No third-party STT service; no upload delays.
- **Speaker Diarization & Timestamps** — Multi-speaker detection with timestamped segments for meetings and interviews.
- **Voice Memo Enhancer** — Clean up raw transcripts: remove filler words, fix grammar, add punctuation, and restructure paragraphs automatically.

### 🧠 AI Magic Tools
| Tool | Description |
|---|---|
| **Smart Summarize** | Brief, standard, or detailed summaries with key-point extraction |
| **Auto-Tag & Categorize** | AI-generated tags and automatic folder sorting by content analysis |
| **Smart Compose** | Continue writing seamlessly — AI matches your tone, style, and context |
| **Improve Writing** | One-tap grammar, clarity, and structure polish |
| **Translate** | Instant English ↔ Kurdish Sorani translation |
| **Generate Title** | Automatic descriptive title from note content |
| **Extract Action Items** | Pull out tasks and to-dos into a checklist |
| **Related Notes** | AI finds connections between your notes |

### 📚 Study Mode
- **Flashcard Generator** — AI creates Q&A flashcards from any note for study and review.
- **Mind Map Generator** — Visualize note structure as an interactive hierarchical mind map.

### 🔍 Document Intelligence
- **Document Scanner** — Photograph receipts, business cards, handwritten notes, or documents. Gemini extracts and structures all text.
- **AI Q&A Chat** — Ask questions across all your notes. Knote AI cites sources and finds answers from your personal knowledge base.

### 📊 Focus & Productivity Hub
- **Writing Streak Tracker** — Track daily consistency with a 30-day activity heatmap.
- **Note Statistics Dashboard** — Voice vs. text breakdown, word counts, favorites, and more.
- **Focus Timer** — Built-in Pomodoro-style timer with customizable work/break durations.
- **Mood Insights** — AI analyzes the emotional tone of your journal entries over time.
- **Voice Briefing** — A daily AI-generated podcast-style summary of your recent notes, read aloud via text-to-speech.
- **Motivational Quotes** — Rotating daily quotes widget on the dashboard.

### 🎨 Premium Design
- **6 Theme Presets** — Ember, Aurora, Sunset, Ocean, Mint, Rosé — each with curated dark & light palettes.
- **Background Patterns** — Waves, dots, circuit, orbs — SVG-animated decorative patterns.
- **Fluid Animations** — Spring-based micro-animations on every interaction via `react-native-reanimated`.
- **Edge-to-Edge UI** — Transparent system bars, dynamic safe area handling, immersive full-screen experience.
- **Custom Kurdish Font** — Native Rabar_039 font for beautiful Kurdish Sorani typography.

### 📁 Organization
- **Smart Folders** — Default + custom folders with icons and colors.
- **Pin & Favorite** — Pin important notes to the top; star your favorites.
- **Color Labels** — Color-code notes for visual categorization.
- **Advanced Search** — Full-text search across all notes, titles, tags, and transcriptions.
- **Sort Options** — By date, title, or custom order.
- **Trash & Restore** — Soft-delete with recovery; permanent deletion when ready.
- **Duplicate & Share** — Clone notes or share content to any app.

### 🌍 Bilingual Support
- **English & Kurdish Sorani** — Full UI localization via i18next.
- **AI speaks both** — Transcription, summarization, flashcards, and all AI tools work in both languages natively.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | React Native 0.81 + Expo SDK 54 |
| **Navigation** | Expo Router v6 (file-based routing) |
| **AI Engine** | Google Gemini 2.5 Flash via `@google/genai` |
| **State** | Zustand 5 with AsyncStorage persistence |
| **Animations** | React Native Reanimated 4 |
| **Styling** | StyleSheet + Expo Linear Gradient |
| **Icons** | Lucide React Native |
| **Audio** | Expo AV (recording & playback) |
| **Speech** | Expo Speech (text-to-speech for briefings) |
| **Localization** | i18next + react-i18next |
| **Lists** | @shopify/flash-list for high-performance rendering |

---

## 📂 Project Structure

```
Knote/
├── app/                          # Expo Router screens
│   ├── (tabs)/                   # Tab navigation
│   │   ├── index.tsx             # Notes list (home)
│   │   ├── folders.tsx           # Folder management
│   │   ├── search.tsx            # Global search
│   │   ├── settings.tsx          # App settings
│   │   └── _layout.tsx           # Custom animated tab bar
│   ├── note/
│   │   ├── new.tsx               # Create new note (voice/text)
│   │   └── [id].tsx              # Note detail + AI tools
│   ├── folder/[id].tsx           # Folder contents
│   ├── study/[id].tsx            # Flashcard study mode
│   ├── mindmap/[id].tsx          # Mind map visualization
│   ├── ai-chat.tsx               # AI Q&A chat
│   ├── scan.tsx                  # Document scanner
│   ├── briefing.tsx              # Voice briefing
│   ├── insights.tsx              # Mood analysis
│   ├── dashboard.tsx             # Focus & Stats hub
│   ├── onboarding.tsx            # First-launch walkthrough
│   └── _layout.tsx               # Root layout + theme
├── src/
│   ├── components/               # Reusable UI components
│   ├── constants/
│   │   ├── config.ts             # App config, Gemini setup, AI prompts
│   │   └── theme.ts              # Design tokens, colors, spacing
│   ├── contexts/
│   │   └── ThemeContext.tsx       # Theme provider (dark/light + presets)
│   ├── hooks/
│   │   ├── useAudioRecorder.ts   # Audio recording hook
│   │   └── useAudioPlayer.ts     # Audio playback hook
│   ├── locales/                  # i18n translations (en, ku)
│   ├── services/
│   │   └── ai.ts                 # All Gemini AI service functions
│   ├── stores/
│   │   ├── useNotesStore.ts      # Notes state management
│   │   ├── useFoldersStore.ts    # Folders state management
│   │   └── useSettingsStore.ts   # Settings + streak tracking
│   ├── types/                    # TypeScript interfaces
│   └── utils/                    # Helper utilities
├── assets/                       # Icons, splash, fonts
├── app.json                      # Expo config
├── app.config.js                 # Dynamic config (env vars)
└── eas.json                      # EAS Build profiles
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [EAS CLI](https://docs.expo.dev/eas/) for building

```bash
npm install -g eas-cli
```

### Installation

```bash
# Clone the repository
git clone https://github.com/Abdulla090/knote.git
cd knote

# Install dependencies
npm install
```

### Environment Setup

Create a `.env` file in the project root:

```env
EXPO_PUBLIC_GEMINI_API_KEY="your-gemini-api-key-here"
```

> Get a free API key from [Google AI Studio](https://aistudio.google.com/apikey)

### Run Locally

```bash
# Start the development server
npx expo start --clear

# Run on Android
npx expo start --android

# Run on iOS
npx expo start --ios
```

### Build APK

```bash
# Preview build (APK for testing)
eas build -p android --profile preview

# Production build (AAB for Play Store)
eas build -p android --profile production
```

> **Note:** Set your API key as an EAS environment variable with **sensitive** visibility for production builds:
> ```bash
> eas env:create --name EXPO_PUBLIC_GEMINI_API_KEY --value "your-key" --visibility sensitive --environment production --environment preview --environment development
> ```

---

## 🔒 Privacy & Security

- **100% Local Storage** — All notes are stored on-device using AsyncStorage. No cloud sync, no server, no tracking.
- **No Data Collection** — Zero analytics, zero telemetry.
- **Secure API Key Handling** — API keys are injected at build time via `expo-constants` and never committed to source control.
- **`.env` is gitignored** — Your secrets stay local.

---

## 🌐 Supported Languages

| Language | UI | AI Features |
|---|---|---|
| **English** | ✅ | ✅ |
| **Kurdish Sorani** (Central Kurdish) | ✅ | ✅ |

Kurdish Sorani is rendered with the native **Rabar_039** font for authentic typography.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  <strong>Built with ❤️ and Gemini AI</strong><br/>
  <sub>Designed & developed by <a href="https://github.com/Abdulla090">Abdulla</a></sub>
</p>
