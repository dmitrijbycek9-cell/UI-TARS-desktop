# AI Studio Android App — Build Instructions

## Prerequisites

- Android Studio Ladybug (2024.2+) or later
- Android SDK 35 (API 35)
- Java 17+
- Gemini API key (free at [aistudio.google.com](https://aistudio.google.com/app/apikey))
- Firebase project (free tier is sufficient)

## Setup

### 1. Firebase Setup
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Add Android app → Package: `com.uitars.aistudio`
4. Download `google-services.json`
5. Copy it to `app/google-services.json`
6. Enable **Authentication** → Email/Password + Google Sign-In
7. Enable **Firestore Database** (Start in test mode)
8. Copy your **Web Client ID** from Firebase Console

### 2. Update Config
- Open `app/src/main/java/com/uitars/aistudio/presentation/auth/LoginScreen.kt`
- Replace `YOUR_FIREBASE_WEB_CLIENT_ID` with your actual Web Client ID

### 3. Build

```bash
cd apps/android-ai-studio

# Debug APK
./gradlew assembleDebug

# Release APK (requires signing key)
./gradlew assembleRelease
```

APK output: `app/build/outputs/apk/debug/app-debug.apk`

## Features

| Feature | Status |
|---------|--------|
| Google Sign-In | ✅ |
| Email/Password Auth | ✅ |
| Firebase Sync | ✅ |
| Chat Mode (multi-turn) | ✅ |
| Freeform Mode | ✅ |
| Streaming responses | ✅ |
| Model selection | ✅ (5 Gemini models) |
| System instructions | ✅ |
| Temperature / TopP / TopK / MaxTokens | ✅ |
| Image attachments | ✅ |
| Token counting | ✅ |
| API key management | ✅ |
| Response regeneration | ✅ |
| Local Room database | ✅ |
| Cloud Firestore sync | ✅ |
| Dark/Light theme | ✅ |
| Conversation history | ✅ |

## Models Supported

- Gemini 2.0 Flash (recommended)
- Gemini 2.0 Flash-Lite
- Gemini 1.5 Pro (2M context)
- Gemini 1.5 Flash
- Gemini 1.5 Flash-8B

## Architecture

```
presentation/   → Jetpack Compose UI + ViewModels
data/
  api/          → Retrofit (Gemini REST API)
  db/           → Room (local persistence)
  repository/   → Data layer (API + DB + Firebase)
  model/        → Data classes
di/             → Hilt dependency injection
```
