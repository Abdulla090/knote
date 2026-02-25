# Knote - AI-Powered Notes App

Knote is a premium, beautifully animated, and highly intelligent note-taking application powered entirely by Google's state-of-the-art Gemini AI model. It allows you to create smart notes via native audio transcription, text generation, and dynamic analysis—translating to Kurdish Sorani effortlessly.

## ✨ Key Features
- **AI Audio Dictation:** Speak your thoughts, and Gemini natively reads the audio without a third-party STT transcriber, directly writing your notes for you.
- **AI Magic Tools:** Summarize, expand, translate, format, analyze, and generate flashcards and mind maps from your notes instantly.
- **Focus & Stats Dashboard:** Track your daily writing streak, view interactive statistics, and use a responsive Focus Timer for productivity.
- **Fully Local & Secure:** Emphasizes privacy with secure device-level SQLite storage via Zustand sync, and environment variable API obfuscation.
- **Premium Aesthetics:** Vibrant gradients, soft blurs, fluid layout transitions, and bouncy macro-animations powered by Expo Reanimated and Moti.

## 🚀 Getting Started

### Prerequisites

You need [Node.js](https://nodejs.org/) and [EAS CLI](https://expo.dev/eas) to build and run this Expo project.

```bash
npm install -g eas-cli
```

### Installation

1. Clean or Clone the directory.
2. Install dependencies via `npm` or `bun`:

```bash
npm install
```

3. **Environment Setup:** Create a `.env` file at the root of the project to securely house your Gemini API key.

```bash
touch .env
```
Inside `.env`, copy your API key:
```env
EXPO_PUBLIC_GEMINI_API_KEY="AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXX"
```

### Running the App

Run the application locally on your simulator/web browser:
```bash
npx expo start --clear
```

### Building the APK

You can directly build this app for Android using EAS:
```bash
eas build -p android --profile preview
```

## 🛠 Tech Stack
- **Framework:** React Native & Expo Router (SDK 50+)
- **State Management:** Zustand
- **Animations:** React Native Reanimated
- **AI Implementation:** Google Generative AI SDK `@google/genai`
- **Iconography:** Lucide React Native & Phosphor Icons
- **Storage:** React Native Async Storage

## 🔒 Security Requirements
For security, all API keys must be injected securely at build time or fetched securely through a secure proxy server. By dynamically applying `EXPO_PUBLIC_GEMINI_API_KEY`, the key is removed from standard source-control detection tools.

## Supported Languages
Knote fully supports:
- English
- Kurdish (Sorani) - natively injected using the `Rabar_039` font.
