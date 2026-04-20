# 🏛️ Muse Music Player Architecture

This document outlines the system design, data flow, and architectural decisions made for the Muse Music Player.

## 1. System Overview
Muse is a high-performance, mobile-first Progressive Web App (PWA) built with React and Vite. It leverages unofficial music APIs and fallback systems to provide a premium, free music streaming experience.

## 2. Core Architecture
The app follows a **Context-Based Architecture** where a central state manager handles global audio playback, queue management, and persistence.

### Layered Structure
- **UI Layer (React):** Functional components using modern hooks and CSS modules for styling.
- **State Layer (Context API):** 
    - `PlayerContext`: Audio engine, queue logic, volume, crossfade, and EQ.
    - `AuthContext`: (Future) User profiles and preferences.
- **Service Layer (API):**
    - `api.js`: Unified data fetcher with caching and fallback logic.
- **Storage Layer (Browser):**
    - `localStorage`: Fast persistence for liked songs and settings.
    - `IndexedDB`: (In-Progress) Large blob storage for offline tracks.

## 3. Advanced Features Architecture

### 🔄 The "YouTube Fallback" (Hybrid Engine)
To ensure no search query ever returns zero results, the system implements a hybrid search:
1. Primary search hits **JioSaavn**.
2. If results are insufficient (<3), the engine parallel-fetches from **Piped API (YouTube)**.
3. YouTube tracks are transformed into the internal `Track` format on the fly.

### 🎚️ Pro Audio Engine (Web Audio API)
The audio chain is processed through a specialized processing node:
`MediaElementSource` -> `BiquadFilterNode` (5x for EQ) -> `GainNode` (for Crossfade) -> `Destination`.

### 🧬 Semantic Discovery
Uses `playHistory` tracking to compute "Top Artists" and "Top Genres". This data is used to generate **Personal Mixes** dynamically every session.

## 4. Deployment & Hosting
- **Hosting:** Vercel (Auto-deployment via GitHub).
- **PWA:** Service workers enable background caching and "Install App" prompts.

---
*Created with the GSD Framework - Plan. Build. Test. Repeat.*
