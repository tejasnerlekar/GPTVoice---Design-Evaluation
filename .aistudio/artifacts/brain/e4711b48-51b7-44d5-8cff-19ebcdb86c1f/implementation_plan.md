# ChatGPT Advanced Voice Mode with Integrated Vedic Astrologer (GitHub Pages Ready)

A pixel-faithful replica of ChatGPT's mobile Advanced Voice Mode with pitch-black OLED styling, an organic fluid blue-and-pearl animated orb driven by real-time microphone audio levels, and an integrated Vedic Astrologer engine. Designed for effortless static deployment to **GitHub Pages** using a free Gemini API key and 100% client-side sub-15ms astronomical calculations.

## User Review & Critical Decisions

> [!IMPORTANT]
> **Confirmed Revision Requirements**:
> - **GitHub Pages & Static Hosting Architecture**: Build architecture configured for pure static SPA output (`vite build` with relative `base: './'`). Runs natively on GitHub Pages without requiring a Node.js backend server.
> - **Free Gemini API Tier**: Powered by `gemini-3.8-flash` / `gemini-2.5-flash` compatible with the free Gemini API tier. Includes an unobtrusive API key manager modal (stored securely in client `localStorage`) so anyone testing on GitHub Pages can plug in their free Gemini API key in 5 seconds.
> - **100% Client-Side Sub-15ms Vedic Astrology Engine**: Astronomical calculations (Julian Day, Lahiri Ayanamsha, Lagna/Ascendant, Moon Sign/Rashi, Nakshatra, Bhavas, and Vimshottari Mahadasha/Antardasha) run entirely client-side in pure TypeScript in under 5ms, guaranteeing instantaneous responses even offline.
> - **Voice-First Experience**: No visual Kundali geometric charts; all readings and insights are delivered naturally through spoken voice and the slide-over chat transcript.
> - **Auto-Selected Neural Voice**: Automatically selects the best neural device voice (Google US English, Samantha, Microsoft Natural) for natural spoken cadence.

---

## 1. Overview & Core Concept

- **What It Does**: Provides a zero-friction ChatGPT mobile Advanced Voice Mode experience. Features an organic royal blue and pearlescent orb that breathes, ripples, and pulses dynamically to real-time microphone input, tap-to-interrupt speech capabilities, seamless text transcript toggling, and an authentic Vedic Astrologer persona that calculates real birth charts and Vimshottari Dashas.
- **GitHub Pages Readiness**: Can be deployed to GitHub Pages with a single command (`npm run build`) or GitHub Action. All assets use relative paths (`./`), avoiding 404s on subpaths like `https://username.github.io/chatgpt-voice-astrologer/`.
- **Target Audience**: Users seeking an ultra-fast, fluid voice AI on mobile devices that provides deep, respectful Jyotish insights without requiring complex server infrastructure or paid cloud credits.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Voice Mode (Default Main View)**:
   - Fullscreen pitch-black (`#000000`) canvas fitted to mobile viewport (`100dvh`, safe-area-inset padding).
   - Centered fluid orb (~125px diameter) anchored with deep royal blue (`#1d4ed8` / `#2563eb`) at the bottom and pearlescent white highlights on top.
   - Dynamic 4-state shader:
     - `idle`: Gentle organic breathing wave.
     - `listening`: Canvas fluid shader reacts to live microphone audio levels via Web Audio API `AnalyserNode`.
     - `thinking`: Swirling orbital shimmer.
     - `speaking`: Rhythmic pulsing synchronized to sentence-by-sentence streaming speech synthesis.
   - Tap-to-interrupt: Tapping the orb or speaking immediately stops active audio playback.

2. **Top Bar & Settings Drawer**:
   - Left: Rounded pill hamburger menu button to toggle the Chat Transcript view.
   - Right: Voice & API settings pill button (allowing users on GitHub Pages to easily enter their free Gemini API key, test neural voices, or toggle auto-listen).

3. **Bottom Action Bar**:
   - Left: Rounded pill input with `+`, "Ask ChatGPT" text input, and submit button.
   - Right: Circular mic mute/unmute button and 'X' close button to exit voice mode.

4. **Conversational Behavior & Vedic Persona**:
   - Responds to casual greetings ("Hi", "Hello") with standard concise ChatGPT brevity without unprompted astrology mentions.
   - Seamlessly activates Vedic Astrologer persona upon request ("Act as a Vedic astrologer", "Check my horoscope", or when birth details are shared).
   - Gracefully collects birth details (DOB, Time of Birth with AM/PM, and Place of Birth).
   - Synthesizes comprehensive astrological answers:
     1. Birth Chart Summary (Lagna, Moon Sign, Nakshatra)
     2. Kundali House Analysis (7th for relationships, 10th for career)
     3. Vimshottari Dasha & Planetary Transits
     4. Ethical Astrology Disclaimer (planetary tendencies vs. karma and free will)
     5. Contextual follow-up suggestions

---

## 3. Key Technical Decisions & Trade-Offs

- **Client-Side Vedic Astronomical Computation Engine**:
  - *Chosen Approach*: Implement Lahiri Ayanamsha calculation, Julian Day converter, geographic local sidereal time (LST), planetary positions, and Vimshottari Dasha tree directly in `src/services/vedicEngine.ts`.
  - *Why*: Enables instant sub-5ms calculation directly in the browser. Zero server dependency, making it 100% portable to GitHub Pages.
- **Dual API Bridge (Server Proxy + Client Direct for GitHub Pages)**:
  - *Chosen Approach*: The client can connect to the local server route `/api/chatgpt/voice` in development, but if hosted statically on GitHub Pages, it calls the Gemini API directly from the client using the user's free API key stored in `localStorage`.
  - *Why*: Allows immediate zero-setup testing in AI Studio while ensuring 1-click static deployment to GitHub Pages without any backend server.
- **Relative Path Routing for GitHub Pages**:
  - *Chosen Approach*: Set `base: './'` in `vite.config.ts`.
  - *Why*: Ensures that bundled scripts, styles, and web workers load reliably when deployed under any repository name on `github.io`.

---

## 4. Technical Architecture & Data Strategy

### System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Static Browser Bundle (100dvh)                  │
│                        Hosted on GitHub Pages                          │
│                                                                        │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │ Top Bar: Transcript Drawer ─── [Settings: Free Gemini Key]     │   │
│   └────────────────────────────────────────────────────────────────┘   │
│                                                                        │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │                    Fullscreen Orb Canvas                       │   │
│   │   [ Royal Blue & Pearlescent Organic Shader (~125px) ]         │   │
│   │   [ States: idle | listening | thinking | speaking ]           │   │
│   │   [ Tap to Interrupt Handler ]                                 │   │
│   └────────────────────────────────────────────────────────────────┘   │
│                                                                        │
│   ┌───────────────────────────────┐  ┌─────────────────────────────┐   │
│   │  Web Audio API AnalyserNode   │  │   Web Speech API (STT/TTS)  │   │
│   │  Microphone Level Stream      │  │   Silence VAD + Neural Voice│   │
│   └──────────────┬────────────────┘  └──────────────┬──────────────┘   │
│                  │                                  │                  │
│   ┌──────────────┴──────────────────────────────────┴──────────────┐   │
│   │ Bottom Action Bar: [+ Ask ChatGPT] Input ── [Mic] ── [Exit 'X'] │   │
│   └────────────────────────────────────────────────────────────────┘   │
│                                                                        │
│   ┌───────────────────────────────┐  ┌─────────────────────────────┐   │
│   │ Pure TypeScript Vedic Engine  │  │   Client Gemini API Service │   │
│   │ (Sub-5ms Lahiri/Rashi/Dasha)  │  │   (Free Gemini API Key)     │   │
│   └───────────────────────────────┘  └─────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
```

### Deployment Configuration for GitHub Pages

- `vite.config.ts`: Configured with `base: './'` for relative asset paths.
- Ready-to-use GitHub Actions workflow (`.github/workflows/deploy.yml`) generated for automatic build & deployment on push to `main`.
