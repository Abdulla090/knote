# 📋 Knote — Implementation Plan

> **Cross-Platform Voice AI Note-Taking App**
> Languages: English (default) & Kurdish Sorani (کوردی سۆرانی)
> Platform: iOS & Android (React Native / Expo)

---

## 🏗️ Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Phase 1 — Project Setup & Foundation](#phase-1--project-setup--foundation)
4. [Phase 2 — Authentication & User Profile](#phase-2--authentication--user-profile)
5. [Phase 3 — Core Note CRUD](#phase-3--core-note-crud)
6. [Phase 4 — Voice Recording & Transcription](#phase-4--voice-recording--transcription)
7. [Phase 5 — AI-Powered Features](#phase-5--ai-powered-features)
8. [Phase 6 — Smart Folder Organization](#phase-6--smart-folder-organization)
9. [Phase 7 — Search & Filtering](#phase-7--search--filtering)
10. [Phase 8 — Multilingual Support (i18n)](#phase-8--multilingual-support-i18n)
11. [Phase 9 — UI/UX Polish & Animations](#phase-9--uiux-polish--animations)
12. [Phase 10 — Settings, Sync & Offline](#phase-10--settings-sync--offline)
13. [Phase 11 — Testing & QA](#phase-11--testing--qa)
14. [Phase 12 — Build, Deploy & Launch](#phase-12--build-deploy--launch)
15. [Database Schema](#database-schema)
16. [Folder Structure](#folder-structure)
17. [Feature Matrix](#feature-matrix)

---

## 1. Project Overview

**Knote** is a premium, AI-powered voice note-taking app that lets users:

- 🎙️ **Record voice** and get instant transcriptions in **English** and **Kurdish Sorani**
- 📝 **Create, edit, and manage** text and voice notes
- 🤖 **AI Summarization** — auto-generate summaries from transcriptions
- 📂 **AI Folder Organization** — AI automatically categorizes and files notes into smart folders
- 🔍 **Powerful Search** — full-text search across all notes, transcriptions, and summaries
- 🌐 **Bilingual** — full RTL support for Kurdish Sorani, with English as the default
- ☁️ **Cloud Sync** — powered by Supabase for real-time sync across devices

---

## 2. Tech Stack

| Layer               | Technology                                         |
| ------------------- | -------------------------------------------------- |
| **Framework**       | React Native with Expo (SDK 52+)                   |
| **Language**        | TypeScript                                         |
| **Navigation**      | Expo Router (file-based routing)                   |
| **State Management**| Zustand                                            |
| **Backend / BaaS**  | Supabase (Auth, Database, Storage, Edge Functions) |
| **AI / LLM**        | Google Gemini API (2.5 Flash / Pro)                |
| **Speech-to-Text**  | Google Cloud Speech-to-Text API (supports Kurdish) |
| **Audio Recording** | expo-av                                            |
| **Styling**         | React Native StyleSheet + custom design system     |
| **Animations**      | React Native Reanimated 3                          |
| **Local Storage**   | expo-sqlite / AsyncStorage                         |
| **i18n**            | i18next + react-i18next                            |
| **Icons**           | @expo/vector-icons (Ionicons / MaterialIcons)      |
| **Fonts**           | Google Fonts (Inter for EN, Noto Sans Arabic/Kurdish for KU) |

---

## Phase 1 — Project Setup & Foundation

### Step 1.1: Initialize Expo Project
- [ ] Create new Expo project with TypeScript template
- [ ] Configure `app.json` / `app.config.ts` (app name, slug, icons, splash)
- [ ] Set up Expo Router for file-based navigation

### Step 1.2: Install Core Dependencies
```
Dependencies to install:
├── @supabase/supabase-js          # Backend
├── zustand                        # State management
├── i18next, react-i18next         # Internationalization
├── expo-av                        # Audio recording
├── expo-file-system               # File management
├── expo-sqlite                    # Local database
├── react-native-reanimated        # Animations
├── @expo/vector-icons             # Icons
├── expo-haptics                   # Haptic feedback
├── expo-secure-store              # Secure token storage
├── expo-localization              # Device locale detection
├── date-fns                       # Date formatting
└── react-native-safe-area-context # Safe area handling
```

### Step 1.3: Design System Setup
- [ ] Create `/constants/theme.ts` — colors, typography, spacing, radius
- [ ] Define **dark mode** and **light mode** palettes
- [ ] Create reusable component primitives:
  - `Text` (with font scaling & RTL support)
  - `Button` (primary, secondary, ghost, icon variants)
  - `Card` (elevated, flat)
  - `Input` (text, search)
  - `BottomSheet`
  - `Modal`
  - `IconButton`
  - `Badge`
  - `Chip`
  - `Avatar`
  - `Divider`
  - `LoadingSpinner`
  - `EmptyState`
  - `Toast / Snackbar`

### Step 1.4: Navigation Structure
```
App Navigation Tree:
├── (auth)/
│   ├── login.tsx
│   ├── register.tsx
│   └── forgot-password.tsx
├── (tabs)/
│   ├── index.tsx          → Home / All Notes
│   ├── folders.tsx        → Smart Folders
│   ├── search.tsx         → Search
│   └── settings.tsx       → Settings
├── note/
│   ├── [id].tsx           → Note Detail / Editor
│   └── new.tsx            → New Note (voice or text)
├── folder/
│   └── [id].tsx           → Folder Detail (notes list)
└── _layout.tsx            → Root Layout
```

---

## Phase 2 — Authentication & User Profile

### Step 2.1: Supabase Project Setup
- [ ] Create Supabase project
- [ ] Configure Auth providers (Email/Password, Google OAuth)
- [ ] Set up Row Level Security (RLS) policies
- [ ] Create `profiles` table

### Step 2.2: Auth Screens
- [ ] **Login Screen** — Email + Password, Google Sign-In button
- [ ] **Register Screen** — Name, Email, Password, Confirm Password
- [ ] **Forgot Password Screen** — Email input, reset link
- [ ] Auth state persistence with `expo-secure-store`

### Step 2.3: Auth State Management
- [ ] Create `useAuthStore` (Zustand)
  - `user`, `session`, `loading`
  - `signIn()`, `signUp()`, `signOut()`, `resetPassword()`
- [ ] Auto-redirect based on auth state in root layout
- [ ] Session refresh handling

### Step 2.4: User Profile
- [ ] Profile settings (name, avatar, preferred language)
- [ ] Store user preferences in Supabase `profiles` table

---

## Phase 3 — Core Note CRUD

### Step 3.1: Database Tables
- [ ] Create `notes` table (see [Database Schema](#database-schema))
- [ ] Create `folders` table
- [ ] Create `note_tags` table
- [ ] Set up RLS policies for all tables

### Step 3.2: Note Data Layer
- [ ] Create `useNotesStore` (Zustand) with:
  - `notes[]`, `loading`, `error`
  - `fetchNotes()` — paginated fetch from Supabase
  - `createNote(note)` — insert new note
  - `updateNote(id, updates)` — update note content
  - `deleteNote(id)` — soft delete (move to trash)
  - `restoreNote(id)` — restore from trash
  - `permanentlyDelete(id)` — hard delete
- [ ] Optimistic updates for instant UI feedback
- [ ] Local caching with SQLite for offline access

### Step 3.3: Note List Screen (Home)
- [ ] **Note Cards** — show title, preview, date, folder badge, type icon (voice/text)
- [ ] **Sort Options** — by date (newest/oldest), by title, by folder
- [ ] **View Toggle** — grid view / list view
- [ ] **Pull-to-refresh**
- [ ] **Swipe Actions** — swipe left to delete, swipe right to archive
- [ ] **Floating Action Button (FAB)** — "+" to create new note (expands to show Voice/Text options)

### Step 3.4: Note Editor Screen
- [ ] **Rich Text Editor** with:
  - Bold, italic, underline
  - Bullet list, numbered list
  - Headings (H1, H2, H3)
  - Code blocks
- [ ] **Title Input** — auto-focus on create
- [ ] **Auto-save** — debounced save every 3 seconds after changes
- [ ] **Word Count** & **character count** display
- [ ] **Timestamp** — created at, last modified
- [ ] **Tagging** — add/remove tags
- [ ] **Move to Folder** — assign/change folder
- [ ] **Share** — share note as text / PDF
- [ ] **Delete** — with confirmation dialog

### Step 3.5: Note Types
- [ ] **Text Note** — standard typed note
- [ ] **Voice Note** — voice recording + transcription attached
- [ ] **Mixed Note** — text + multiple voice recordings inline

---

## Phase 4 — Voice Recording & Transcription

### Step 4.1: Audio Recording Engine
- [ ] Create `useAudioRecorder` custom hook using `expo-av`:
  - `startRecording()` — begin capture (WAV/M4A format)
  - `pauseRecording()` — pause recording
  - `resumeRecording()` — resume recording
  - `stopRecording()` — stop and return audio URI
  - `cancelRecording()` — cancel without saving
  - `recordingDuration` — real-time duration display
  - `isRecording` — boolean state
  - `audioLevels` — real-time audio amplitude for waveform visualization

### Step 4.2: Recording UI
- [ ] **Recording Screen / Modal**:
  - Large **record button** (pulsing animation while recording)
  - **Waveform visualization** — real-time audio amplitude bars
  - **Timer** — elapsed recording time (MM:SS)
  - **Pause/Resume** button
  - **Cancel** button
  - **Stop & Save** button
  - **Language Selector** — toggle between English 🇬🇧 and Kurdish Sorani 🇮🇶
- [ ] **Haptic feedback** on record start/stop
- [ ] **Background recording** support (continue recording when app is backgrounded)

### Step 4.3: Audio Playback
- [ ] Create `useAudioPlayer` custom hook:
  - `play()`, `pause()`, `stop()`, `seekTo(position)`
  - `currentPosition` — real-time playback position
  - `duration` — total audio length
  - `playbackSpeed` — 0.5x, 1x, 1.5x, 2x
- [ ] **Playback UI** in note detail:
  - Mini audio player bar
  - Seek bar / progress indicator
  - Speed control
  - Waveform scrubber

### Step 4.4: Speech-to-Text Transcription
- [ ] **Transcription Service** using Google Cloud Speech-to-Text:
  - Support for **English** (`en-US`)
  - Support for **Kurdish Sorani** (`ckb`) — Central Kurdish
  - Auto-detect language option
  - Real-time streaming transcription (if feasible) OR post-recording batch transcription
- [ ] **Supabase Edge Function** — `transcribe-audio`:
  - Receives audio file (uploaded to Supabase Storage)
  - Sends to Google Speech-to-Text API
  - Returns transcription text with timestamps
  - Handles language selection parameter
- [ ] **Transcription Display**:
  - Full transcription text shown below audio player
  - Highlight current word during playback (karaoke-style sync)
  - Copy transcription to clipboard
  - Edit transcription manually (correct mistakes)
  - Timestamp markers for segments

### Step 4.5: Audio File Management
- [ ] Upload audio files to **Supabase Storage** (`audio-recordings` bucket)
- [ ] Generate signed URLs for playback
- [ ] Compress audio before upload (reduce file size)
- [ ] Local caching of audio files for offline playback

---

## Phase 5 — AI-Powered Features

### Step 5.1: AI Service Architecture
- [ ] Create `AIService` class / module:
  - Uses **Google Gemini API** (2.5 Flash for speed, Pro for quality)
  - Configurable model selection
  - Rate limiting / throttling
  - Error handling + retry logic
- [ ] Create **Supabase Edge Function** — `ai-process`:
  - Endpoint for AI operations (keeps API key server-side)
  - Accepts: `{ action, content, language, noteId }`
  - Actions: `summarize`, `categorize`, `tag`, `title`, `translate`

### Step 5.2: AI Auto-Summarization
- [ ] **Trigger**: After transcription is completed OR manually by user
- [ ] **Summarization Levels**:
  - 🟢 **Brief** — 1-3 sentence overview
  - 🟡 **Standard** — key points in bullet form (default)
  - 🔴 **Detailed** — comprehensive paragraph summary
- [ ] **Bilingual Summaries** — generate summary in the same language as the note, or both
- [ ] **Summary Display**:
  - Collapsible summary section at top of note
  - "Regenerate Summary" button
  - Edit summary manually
- [ ] **Prompt Engineering** for Kurdish Sorani:
  ```
  System Prompt:
  "You are a note summarization assistant. Summarize the following transcription
   in [language]. Preserve key details, action items, and important names/dates.
   For Kurdish Sorani, use standard Sorani script and vocabulary."
  ```

### Step 5.3: AI Auto-Titling
- [ ] When user creates a voice note, AI generates a title from the transcription
- [ ] User can accept, edit, or regenerate the title
- [ ] Title generation considers language of content

### Step 5.4: AI Auto-Tagging
- [ ] AI analyzes note content and suggests relevant tags
- [ ] Tags are language-aware (English tags for EN notes, Kurdish tags for KU notes)
- [ ] Pre-defined tag categories:
  - 📚 Study, 💼 Work, 💡 Ideas, 📋 To-Do, 🗓️ Meeting, 🎯 Goals
  - 📖 خوێندن, 💼 کار, 💡 بیرۆکە, 📋 لیستی کارەکان, 🗓️ کۆبوونەوە, 🎯 ئامانجەکان

### Step 5.5: AI Note Enhancement
- [ ] **Action Items Extraction** — AI identifies tasks/to-dos from notes
- [ ] **Key Points** — AI extracts the most important points
- [ ] **Translation** — translate note between English ↔ Kurdish Sorani
- [ ] **Tone Rewriting** — rewrite note in formal/casual/professional tone
- [ ] **Expansion** — AI expands brief notes into detailed content

### Step 5.6: AI Processing UI
- [ ] Show **loading shimmer** while AI processes
- [ ] **Progress indicator** with stage labels ("Transcribing…", "Summarizing…", "Organizing…")
- [ ] **Error state** with retry option
- [ ] **AI Credits / Usage Indicator** (if implementing usage limits)

---

## Phase 6 — Smart Folder Organization

### Step 6.1: Folder System
- [ ] Create `useFoldersStore` (Zustand):
  - `folders[]`, `fetchFolders()`, `createFolder()`, `updateFolder()`, `deleteFolder()`
- [ ] **Default Folders** (pre-created for every user):
  - 📥 All Notes
  - ⭐ Favorites
  - 🗑️ Trash
  - 📝 Uncategorized
- [ ] **Custom Folders**:
  - User can create, rename, delete custom folders
  - Folder icon picker (emoji or icon)
  - Folder color picker

### Step 6.2: AI Auto-Categorization
- [ ] **On Note Creation**, AI analyzes content and suggests a folder:
  - Matches against existing folder names/themes
  - If no match, suggests creating a new folder
- [ ] **Batch Organization** — "Organize All" button that re-categorizes all uncategorized notes
- [ ] **Learning over time** — AI considers user's past categorizations as patterns
- [ ] **Confidence Score** — show how confident AI is about the categorization
- [ ] **User Override** — user can move notes to different folders (AI learns from corrections)

### Step 6.3: AI Folder Suggestions
- [ ] When user has 10+ uncategorized notes, AI suggests folder structure:
  ```
  AI Suggestion:
  "Based on your notes, I suggest creating these folders:
   📚 University Lectures (8 notes)
   💼 Work Meetings (5 notes)
   💡 Personal Ideas (3 notes)
   Would you like me to organize them?"
  ```
- [ ] User can accept all, accept individually, or dismiss

### Step 6.4: Folder UI
- [ ] **Folders Tab** — grid/list of all folders with note count
- [ ] **Folder Detail Screen** — list of notes in that folder
- [ ] **Drag-and-Drop** — manually drag notes between folders (optional, advanced)
- [ ] **Folder Stats** — total notes, total voice minutes, last updated

---

## Phase 7 — Search & Filtering

### Step 7.1: Full-Text Search
- [ ] Search across:
  - Note titles
  - Note content (text)
  - Transcriptions
  - Summaries
  - Tags
- [ ] **Supabase Full-Text Search** using `tsvector` / `tsquery`
- [ ] Support for both **English** and **Kurdish** text search
- [ ] **Search-as-you-type** with debounced input (300ms)

### Step 7.2: Filters
- [ ] **By Type**: All, Text Notes, Voice Notes
- [ ] **By Folder**: filter by specific folder
- [ ] **By Date Range**: today, this week, this month, custom range
- [ ] **By Tags**: filter by one or multiple tags
- [ ] **By Language**: English, Kurdish, All
- [ ] **Sorting**: newest first, oldest first, alphabetical, most recently edited

### Step 7.3: Search UI
- [ ] **Search Screen** with:
  - Search input with clear button
  - Recent searches (saved locally)
  - Filter chips row (scrollable horizontal)
  - Results list with highlighted matching text
  - Empty state: "No results found" with illustration
- [ ] **Global Search** — accessible from any screen via search icon in header

---

## Phase 8 — Multilingual Support (i18n)

### Step 8.1: i18n Setup
- [ ] Configure `i18next` with `react-i18next`
- [ ] Create translation files:
  - `locales/en/translation.json` — English (default)
  - `locales/ku/translation.json` — Kurdish Sorani
- [ ] Auto-detect device language on first launch
- [ ] Language switcher in settings

### Step 8.2: Translation Coverage
- [ ] All UI strings (buttons, labels, headers, placeholders, errors)
- [ ] All empty states and onboarding text
- [ ] Date/time formatting (localized)
- [ ] Number formatting (Arabic numerals for Kurdish: ٠١٢٣٤٥٦٧٨٩)

### Step 8.3: RTL Support
- [ ] Enable RTL layout for Kurdish Sorani
- [ ] Use `I18nManager.forceRTL(true)` when Kurdish is selected
- [ ] Mirror all directional icons (arrows, chevrons)
- [ ] Test all screens in RTL mode
- [ ] Handle mixed LTR/RTL content in notes (English text within Kurdish note)

### Step 8.4: Kurdish Typography
- [ ] Use **Noto Sans Arabic** or **Rabar** font for Kurdish text
- [ ] Ensure proper line height and letter spacing for Kurdish script
- [ ] Test character rendering for all Kurdish Sorani special characters:
  - ڕ ڵ ێ ۆ ژ ڤ ۊ ە

---

## Phase 9 — UI/UX Polish & Animations

### Step 9.1: Onboarding Flow
- [ ] **3-4 Onboarding Screens** (swipeable):
  1. Welcome — "Your AI-Powered Voice Notebook" 🤖🎙️
  2. Voice to Text — "Speak, and Knote transcribes" 🗣️➡️📝
  3. AI Organization — "AI organizes your notes automatically" 🧠📂
  4. Bilingual — "Works in English & Kurdish Sorani" 🌐
- [ ] Language selection on first screen (sets app language)
- [ ] Skip option & progress dots

### Step 9.2: Micro-Animations
- [ ] **Page Transitions** — smooth slide/fade between screens
- [ ] **FAB Animation** — expand from "+" to reveal Voice/Text options
- [ ] **Recording Pulse** — pulsing glow effect on record button
- [ ] **Waveform Animation** — animated audio bars during recording
- [ ] **Card Entrance** — staggered fade-in for note cards on load
- [ ] **Swipe Actions** — smooth reveal of delete/archive actions
- [ ] **AI Processing** — shimmer/skeleton loading while AI works
- [ ] **Success Feedback** — checkmark animation on save
- [ ] **Delete Confirmation** — slide-down confirmation bar

### Step 9.3: Haptic Feedback
- [ ] Haptic on record button press
- [ ] Haptic on swipe action trigger
- [ ] Haptic on successful save
- [ ] Haptic on delete

### Step 9.4: Dark Mode / Light Mode
- [ ] System-based auto-detection
- [ ] Manual toggle in settings
- [ ] Smooth transition animation between themes
- [ ] All components respect theme context

### Step 9.5: Premium Design Details
- [ ] **Glassmorphism** — frosted glass effect on modals and bottom sheets
- [ ] **Gradient Accents** — subtle gradients on primary buttons and headers
- [ ] **Shadows & Elevation** — meaningful depth hierarchy
- [ ] **Custom App Icon** — modern, recognizable icon
- [ ] **Splash Screen** — branded, animated splash

---

## Phase 10 — Settings, Sync & Offline

### Step 10.1: Settings Screen
- [ ] **Account**: name, email, avatar, sign out, delete account
- [ ] **Language**: switch between English / Kurdish Sorani
- [ ] **Appearance**: dark mode / light mode / system
- [ ] **AI Settings**:
  - Default summary level (brief/standard/detailed)
  - Auto-summarize on/off
  - Auto-categorize on/off
  - AI model preference (Flash for speed / Pro for quality)
- [ ] **Recording Settings**:
  - Default recording language
  - Audio quality (high/medium/low)
  - Auto-transcribe on/off
- [ ] **Storage**: storage used, clear cache
- [ ] **About**: version, licenses, feedback link
- [ ] **Danger Zone**: export all data, delete account

### Step 10.2: Cloud Sync
- [ ] Real-time sync using Supabase Realtime subscriptions
- [ ] Conflict resolution strategy (last-write-wins with merge for text)
- [ ] Sync status indicator in header
- [ ] Manual "Sync Now" option

### Step 10.3: Offline Support
- [ ] **Local SQLite database** mirrors Supabase data
- [ ] **Offline-first architecture**:
  - Read: always from local DB (fast)
  - Write: save to local DB immediately, sync to Supabase when online
  - Queue pending changes when offline
- [ ] **Audio files**: cache recently played audio locally
- [ ] **Sync on reconnect**: automatically sync queued changes

---

## Phase 11 — Testing & QA

### Step 11.1: Unit Tests
- [ ] Test AI service functions (summarize, categorize, tag)
- [ ] Test audio recording hooks
- [ ] Test Zustand stores (notes, folders, auth)
- [ ] Test i18n translations loading
- [ ] Test utility functions (date formatting, text truncation)

### Step 11.2: Integration Tests
- [ ] Test full note creation flow (record → transcribe → summarize → categorize)
- [ ] Test auth flow (register → login → session persistence)
- [ ] Test search with various queries
- [ ] Test offline → online sync

### Step 11.3: Manual QA Checklist
- [ ] Test on iOS (iPhone 12+, iPad)
- [ ] Test on Android (Pixel, Samsung Galaxy)
- [ ] Test RTL layout (Kurdish Sorani)
- [ ] Test with large notes (10,000+ characters)
- [ ] Test with 100+ notes (performance)
- [ ] Test audio recording (quiet environment, noisy environment)
- [ ] Test Kurdish transcription accuracy
- [ ] Test offline mode (airplane mode)
- [ ] Test dark mode in all screens
- [ ] Test accessibility (screen reader, font scaling)

---

## Phase 12 — Build, Deploy & Launch

### Step 12.1: Pre-Launch
- [ ] App store assets (screenshots, description, keywords)
- [ ] Privacy policy & terms of service
- [ ] App icon in all required sizes
- [ ] Splash screen configuration

### Step 12.2: Build
- [ ] Configure EAS Build (`eas.json`)
- [ ] Create development build for testing
- [ ] Create preview build for beta testing
- [ ] Create production build:
  - APK / AAB for Android
  - IPA for iOS

### Step 12.3: Deploy
- [ ] Submit to Google Play Store
- [ ] Submit to Apple App Store
- [ ] Set up OTA updates via EAS Update

### Step 12.4: Post-Launch
- [ ] Monitor crash reports (Sentry / Expo crash reporting)
- [ ] Monitor API usage (Gemini, Speech-to-Text)
- [ ] Gather user feedback
- [ ] Plan v1.1 features

---

## Database Schema

```sql
-- ============================================
-- PROFILES
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  preferred_language TEXT DEFAULT 'en', -- 'en' or 'ku'
  preferred_theme TEXT DEFAULT 'system', -- 'light', 'dark', 'system'
  ai_auto_summarize BOOLEAN DEFAULT true,
  ai_auto_categorize BOOLEAN DEFAULT true,
  ai_summary_level TEXT DEFAULT 'standard', -- 'brief', 'standard', 'detailed'
  ai_model TEXT DEFAULT 'flash', -- 'flash' or 'pro'
  default_recording_language TEXT DEFAULT 'en',
  audio_quality TEXT DEFAULT 'high', -- 'high', 'medium', 'low'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- FOLDERS
-- ============================================
CREATE TABLE folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  name_ku TEXT, -- Kurdish translation of folder name
  icon TEXT DEFAULT '📁',
  color TEXT DEFAULT '#6366F1',
  is_default BOOLEAN DEFAULT false, -- true for system folders
  sort_order INTEGER DEFAULT 0,
  note_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- NOTES
-- ============================================
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
  
  -- Content
  title TEXT,
  content TEXT, -- main text content (rich text as markdown/html)
  note_type TEXT DEFAULT 'text', -- 'text', 'voice', 'mixed'
  language TEXT DEFAULT 'en', -- detected/selected note language
  
  -- Voice / Transcription
  audio_url TEXT, -- Supabase Storage URL
  audio_duration INTEGER, -- duration in seconds
  transcription TEXT, -- full transcription text
  transcription_segments JSONB, -- timestamped segments [{start, end, text}]
  transcription_language TEXT, -- language used for transcription
  transcription_status TEXT DEFAULT 'none', -- 'none', 'processing', 'completed', 'failed'
  
  -- AI Generated
  summary TEXT,
  summary_level TEXT, -- 'brief', 'standard', 'detailed'
  ai_title TEXT, -- AI-suggested title
  ai_tags TEXT[], -- AI-suggested tags
  ai_category TEXT, -- AI-suggested folder/category
  ai_confidence FLOAT, -- confidence score for categorization
  action_items JSONB, -- extracted action items [{text, completed}]
  key_points TEXT[], -- extracted key points
  
  -- Metadata
  is_favorite BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false, -- soft delete
  deleted_at TIMESTAMPTZ,
  word_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TAGS
-- ============================================
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  name_ku TEXT, -- Kurdish translation
  color TEXT DEFAULT '#8B5CF6',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- NOTE_TAGS (Junction Table)
-- ============================================
CREATE TABLE note_tags (
  note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (note_id, tag_id)
);

-- ============================================
-- AUDIO_RECORDINGS (for mixed notes with multiple recordings)
-- ============================================
CREATE TABLE audio_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID REFERENCES notes(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  audio_url TEXT NOT NULL,
  duration INTEGER, -- seconds
  transcription TEXT,
  transcription_segments JSONB,
  language TEXT DEFAULT 'en',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_notes_user_id ON notes(user_id);
CREATE INDEX idx_notes_folder_id ON notes(folder_id);
CREATE INDEX idx_notes_created_at ON notes(created_at DESC);
CREATE INDEX idx_notes_is_deleted ON notes(is_deleted);
CREATE INDEX idx_folders_user_id ON folders(user_id);
CREATE INDEX idx_tags_user_id ON tags(user_id);

-- Full-text search index
ALTER TABLE notes ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, '') || ' ' || coalesce(transcription, '') || ' ' || coalesce(summary, ''))
  ) STORED;

CREATE INDEX idx_notes_search ON notes USING GIN(search_vector);
```

---

## Folder Structure

```
Knote/
├── app/                          # Expo Router pages
│   ├── (auth)/
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── forgot-password.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx           # Tab bar layout
│   │   ├── index.tsx             # Home / All Notes
│   │   ├── folders.tsx           # Folders
│   │   ├── search.tsx            # Search
│   │   └── settings.tsx          # Settings
│   ├── note/
│   │   ├── [id].tsx              # Note Detail
│   │   └── new.tsx               # Create Note
│   ├── folder/
│   │   └── [id].tsx              # Folder Detail
│   ├── onboarding.tsx            # Onboarding screens
│   └── _layout.tsx               # Root layout
│
├── components/                   # Reusable UI components
│   ├── ui/                       # Design system primitives
│   │   ├── Text.tsx
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   ├── BottomSheet.tsx
│   │   ├── Badge.tsx
│   │   ├── Chip.tsx
│   │   ├── IconButton.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── EmptyState.tsx
│   │   ├── Toast.tsx
│   │   └── Divider.tsx
│   ├── notes/
│   │   ├── NoteCard.tsx          # Note list item card
│   │   ├── NoteEditor.tsx        # Rich text editor
│   │   ├── NoteHeader.tsx        # Note detail header
│   │   └── NoteSummary.tsx       # AI summary display
│   ├── audio/
│   │   ├── RecordButton.tsx      # Main record button
│   │   ├── RecordingModal.tsx    # Full recording interface
│   │   ├── AudioPlayer.tsx       # Playback player
│   │   ├── Waveform.tsx          # Audio waveform visualization
│   │   └── TranscriptionView.tsx # Transcription display
│   ├── folders/
│   │   ├── FolderCard.tsx        # Folder grid item
│   │   ├── FolderPicker.tsx      # Folder selection bottom sheet
│   │   └── AISuggestion.tsx      # AI folder suggestion card
│   ├── ai/
│   │   ├── AIProcessing.tsx      # AI loading state
│   │   ├── SummaryCard.tsx       # Summary display card
│   │   └── ActionItems.tsx       # Action items checklist
│   └── common/
│       ├── Header.tsx
│       ├── FAB.tsx               # Floating action button
│       ├── SearchBar.tsx
│       └── LanguageSwitcher.tsx
│
├── stores/                       # Zustand state management
│   ├── useAuthStore.ts
│   ├── useNotesStore.ts
│   ├── useFoldersStore.ts
│   ├── useTagsStore.ts
│   ├── useRecordingStore.ts
│   └── useSettingsStore.ts
│
├── services/                     # API & business logic
│   ├── supabase.ts               # Supabase client initialization
│   ├── ai.ts                     # AI service (Gemini API calls)
│   ├── transcription.ts          # Speech-to-Text service
│   ├── audio.ts                  # Audio recording & playback
│   ├── storage.ts                # File upload/download
│   └── sync.ts                   # Offline sync logic
│
├── hooks/                        # Custom React hooks
│   ├── useAudioRecorder.ts
│   ├── useAudioPlayer.ts
│   ├── useTheme.ts
│   ├── useSearch.ts
│   └── useOfflineSync.ts
│
├── constants/                    # App constants
│   ├── theme.ts                  # Colors, typography, spacing
│   ├── config.ts                 # API URLs, feature flags
│   └── defaults.ts               # Default folders, tags
│
├── locales/                      # i18n translations
│   ├── en/
│   │   └── translation.json
│   └── ku/
│       └── translation.json
│
├── utils/                        # Utility functions
│   ├── formatDate.ts
│   ├── formatDuration.ts
│   ├── textHelpers.ts
│   └── validators.ts
│
├── types/                        # TypeScript type definitions
│   ├── note.ts
│   ├── folder.ts
│   ├── tag.ts
│   ├── audio.ts
│   └── ai.ts
│
├── assets/                       # Static assets
│   ├── images/
│   ├── fonts/
│   └── animations/               # Lottie animations
│
├── app.json                      # Expo config
├── eas.json                      # EAS Build config
├── tsconfig.json                 # TypeScript config
├── package.json
└── README.md
```

---

## Feature Matrix

| Feature                        | Priority | Phase | Complexity |
| ------------------------------ | -------- | ----- | ---------- |
| Project Setup & Navigation     | 🔴 High  | 1     | ⭐⭐        |
| Design System Components       | 🔴 High  | 1     | ⭐⭐⭐      |
| Auth (Email + Google)          | 🔴 High  | 2     | ⭐⭐        |
| Note CRUD (Text)               | 🔴 High  | 3     | ⭐⭐⭐      |
| Rich Text Editor               | 🟡 Med   | 3     | ⭐⭐⭐⭐    |
| Voice Recording                | 🔴 High  | 4     | ⭐⭐⭐      |
| Speech-to-Text (EN)            | 🔴 High  | 4     | ⭐⭐⭐⭐    |
| Speech-to-Text (Kurdish)       | 🔴 High  | 4     | ⭐⭐⭐⭐⭐  |
| Audio Playback + Waveform      | 🟡 Med   | 4     | ⭐⭐⭐      |
| AI Summarization               | 🔴 High  | 5     | ⭐⭐⭐      |
| AI Auto-Titling                | 🟡 Med   | 5     | ⭐⭐        |
| AI Auto-Tagging                | 🟡 Med   | 5     | ⭐⭐⭐      |
| AI Auto-Categorization         | 🔴 High  | 6     | ⭐⭐⭐⭐    |
| Smart Folder System            | 🔴 High  | 6     | ⭐⭐⭐      |
| Full-Text Search               | 🟡 Med   | 7     | ⭐⭐⭐      |
| Filters & Sort                 | 🟡 Med   | 7     | ⭐⭐        |
| i18n (English + Kurdish)       | 🔴 High  | 8     | ⭐⭐⭐      |
| RTL Support                    | 🔴 High  | 8     | ⭐⭐⭐⭐    |
| Animations & Haptics           | 🟡 Med   | 9     | ⭐⭐⭐      |
| Dark Mode / Light Mode         | 🟡 Med   | 9     | ⭐⭐        |
| Onboarding Flow                | 🟢 Low   | 9     | ⭐⭐        |
| Offline Support                | 🟡 Med   | 10    | ⭐⭐⭐⭐⭐  |
| Cloud Sync                     | 🟡 Med   | 10    | ⭐⭐⭐⭐    |
| Settings Screen                | 🟡 Med   | 10    | ⭐⭐        |
| Testing                        | 🟡 Med   | 11    | ⭐⭐⭐      |
| Build & Deploy                 | 🔴 High  | 12    | ⭐⭐⭐      |

---

## 🚀 Estimated Timeline

| Phase       | Description                      | Duration    |
| ----------- | -------------------------------- | ----------- |
| Phase 1     | Setup & Foundation               | 2–3 days    |
| Phase 2     | Auth & Profile                   | 1–2 days    |
| Phase 3     | Note CRUD                        | 3–4 days    |
| Phase 4     | Voice Recording & Transcription  | 4–5 days    |
| Phase 5     | AI Features                      | 3–4 days    |
| Phase 6     | Smart Folders                    | 2–3 days    |
| Phase 7     | Search & Filtering               | 2–3 days    |
| Phase 8     | i18n & RTL                       | 2–3 days    |
| Phase 9     | UI Polish & Animations           | 3–4 days    |
| Phase 10    | Settings, Sync & Offline         | 3–4 days    |
| Phase 11    | Testing & QA                     | 2–3 days    |
| Phase 12    | Build & Deploy                   | 1–2 days    |
| **TOTAL**   |                                  | **~30–40 days** |

---

## 🔑 Key API Keys Required

1. **Supabase** — Project URL + Anon Key (for Auth, DB, Storage)
2. **Google Gemini API** — for AI summarization, categorization, tagging
3. **Google Cloud Speech-to-Text** — for voice transcription (EN + Kurdish)

---

## 📝 Notes & Considerations

1. **Kurdish Sorani STT**: Google Cloud Speech-to-Text has limited Kurdish support. Fallback options include:
   - **Whisper (OpenAI)** — good multilingual support, can run as Edge Function
   - **Azure Speech Services** — supports Kurdish (Central Kurdish `ku-Arab-IQ`)
   - Test accuracy before committing to a provider

2. **Offline AI**: AI features require internet. Show appropriate messaging when offline.

3. **Audio Storage Costs**: Consider compressing audio files (opus/webm) to reduce Supabase Storage usage.

4. **Rate Limiting**: Implement rate limiting on AI Edge Functions to prevent abuse.

5. **Privacy**: All audio is processed server-side via Edge Functions. Consider adding a privacy notice about audio processing.

---

*This plan is a living document. Check off items as they are completed and adjust timelines as needed.*
