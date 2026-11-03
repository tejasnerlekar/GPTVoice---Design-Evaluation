# ChatGPT Advanced Voice Mode with Integrated Vedic Astrologer

A real-time web replica of ChatGPT's mobile Advanced Voice Mode with an integrated Vedic Astrologer (Jyotish) engine, designed for mobile screen fit and ultra-fast voice interaction.

## Features
- **ChatGPT Voice Mode Aesthetic**: OLED pitch-black theme (`#000000`), minimal circular controls, and safe-area padding for mobile.
- **Center Fluid Animated Orb**:
  - Compact size (~125px diameter).
  - Deep royal blue (`#1d4ed8`) anchored at the bottom with pearlescent white highlights on top.
  - Organic fluid animations reacting dynamically to microphone audio levels, speaking cadence, and thinking ripples.
  - Tap-to-interrupt speech at any time.
- **Sub-15ms Vedic Astrologer Engine**:
  - Calculates Lahiri Ayanamsha, Lagna (Ascendant), Moon Sign (Chandra Rashi), Nakshatra & Pada, 12 Bhavas, and Vimshottari Mahadasha/Antardasha 100% client-side in pure TypeScript.
  - Conversational persona transitions into a respectful Vedic Jyotishi when prompted ("Act as a Vedic astrologer", "Check my horoscope", or when birth details are shared).
  - Structured spoken output: Birth Chart Summary, Kundali House Analysis, Vimshottari Dasha, Ethical Disclaimer, and contextual follow-up questions.
- **Free Gemini API Key Integration**:
  - Works with free Gemini API keys (`gemini-2.5-flash` / `gemini-3.8-flash`) stored safely in browser `localStorage`.
  - Offline fallback engine if no key is configured.
- **Ready for GitHub Pages**:
  - 100% static client-side build with relative paths (`base: './'`).
  - Pre-configured `.github/workflows/deploy.yml` for automated GitHub Pages hosting.

## Deploying to GitHub Pages
1. Push this repository to your GitHub account:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPO>.git
   git push -u origin main
   ```
2. In your GitHub repository:
   - Go to **Settings > Pages**.
   - Under **Build and deployment > Source**, select **GitHub Actions**.
3. That's it! GitHub will build and host your app at `https://<YOUR_USERNAME>.github.io/<YOUR_REPO>/`.
