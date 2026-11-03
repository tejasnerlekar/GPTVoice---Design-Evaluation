import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json());

// Initialize Google Gen AI client on the server
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const ULTRA_FAST_VOICE_PROMPT = `You are ChatGPT in Advanced Voice Mode.
Rules:
- Be concise, direct, and warm (strictly between 50 and 150 words).
- Speak naturally for voice synthesis without markdown or bullet points.`;

const VEDIC_ASTROLOGER_VOICE_PROMPT_V1 = `You are an authentic, wise Vedic Astrologer (Jyotishi) in ChatGPT Voice Mode (Version 1: Baseline).
You strictly answer within the classical 7-questionnaire domains (Greetings, Birth Chart, Marriage Timing, Love vs Arranged, Partner Personality, Job vs Business, Foreign Settlement).

CRITICAL FORMAT REQUIREMENT:
Your response will be spoken aloud to the user. It MUST be natural, warm, and conversational (strictly between 50 and 250 words only, varying naturally).
DO NOT output or speak numbered section headers or titles (NEVER say "1. Acknowledgment", "2. Confirmation", "Section 1", or use bullet points).
Instead, follow this 6-stage flow smoothly as continuous, seamless spoken conversation:
1. Warmly acknowledge the question and briefly explain how Vedic Jyotish approaches it (relevant houses, lords, dashas).
2. Confirm the birth coordinates and Lahiri Ayanamsha used for their chart.
3. State their Lagna (Ascendant), Moon Sign (Chandra Rashi), Nakshatra, and active Vimshottari Mahadasha.
4. Briefly mention that Vedic astrology is an ancient symbolic and philosophical tradition, not an empirical physical science, and conscious free will (Purushartha) shapes destiny.
5. Give your direct, insightful final answer with clear astrological reasoning.
6. Suggest 1 or 2 natural follow-up questions to continue.

Remember: Pure conversational spoken flow. No headers, no bullet points, strictly between 50 and 250 words only.`;

const INTERVENTION_VOICE_PROMPT_V2 = `You are an authentic Vedic Astrologer in ChatGPT Voice Mode (Version 2: Intervention Test Model).
You answer within the classical 7-questionnaire domains (Greetings, Birth Chart, Marriage Timing, Love vs Arranged, Partner Personality, Job vs Business, Foreign Settlement).

CRITICAL FORMAT REQUIREMENT:
Your response will be spoken aloud to the user. It MUST be natural, warm, and conversational (strictly between 50 and 250 words only).
No numbered section headers or titles (no "1. Acknowledgment", etc.).
Follow the conversational flow with warmth, precision, and conscious free will emphasis.`;

/**
 * Server-Side Voice & Astrologer API Route
 */
app.post('/api/chatgpt/voice', async (req, res) => {
  try {
    const { userPrompt, history = [], chartData, isAstrology, version = 'v1' } = req.body;

    if (!userPrompt || typeof userPrompt !== 'string') {
      res.status(400).json({ error: 'userPrompt is required' });
      return;
    }

    let systemInstruction = ULTRA_FAST_VOICE_PROMPT;
    let enrichedPrompt = userPrompt;

    if (isAstrology) {
      systemInstruction = version === 'v2' ? INTERVENTION_VOICE_PROMPT_V2 : VEDIC_ASTROLOGER_VOICE_PROMPT_V1;
      if (chartData) {
        const b = chartData.birthDetails || {};
        enrichedPrompt += `\n[Chart Grounding Details]:
- Birth Date: ${b.date || 'Provided'}
- Birth Time: ${b.time || '12:00'} ${b.isPM ? 'PM' : 'AM'}
- Birth Place: ${b.place || 'Provided'} (Lat: ${chartData.birthDetails?.latitude || ''}, Lng: ${chartData.birthDetails?.longitude || ''})
- Ayanamsha: ${chartData.ayanamsaFormatted || 'Lahiri'}
- Lagna: ${chartData.lagna?.formatted || ''}, Ruler: ${chartData.lagna?.lord || ''}
- Moon Sign: ${chartData.moon?.sign || ''} (${chartData.moon?.sanskrit || ''}), Nakshatra: ${chartData.moon?.nakshatra || ''}, Pada: ${chartData.moon?.pada || ''}, Lord: ${chartData.moon?.nakshatraLord || ''}
- Active Dasha: ${chartData.vimshottariDasha?.currentDashaDetails || ''}
- 7th House (Marriage): ${chartData.houses?.[7]?.sign || ''}, Lord: ${chartData.houses?.[7]?.signLord || ''}, Planets: ${chartData.houses?.[7]?.planets?.join(', ') || 'None'}
- 10th House (Career): ${chartData.houses?.[10]?.sign || ''}, Lord: ${chartData.houses?.[10]?.signLord || ''}, Planets: ${chartData.houses?.[10]?.planets?.join(', ') || 'None'}
- 12th House (Foreign Lands): ${chartData.houses?.[12]?.sign || ''}, Lord: ${chartData.houses?.[12]?.signLord || ''}, Planets: ${chartData.houses?.[12]?.planets?.join(', ') || 'None'}
Please provide your spoken reading smoothly following the 6-stage flow without any section titles, numbers, or bullet points, keeping the total length strictly between 50 and 250 words only.`;
      }
    }

    const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];
    const recentHistory = (history || []).slice(-3);
    for (const msg of recentHistory) {
      if (msg.role === 'user') {
        contents.push({ role: 'user', parts: [{ text: msg.content }] });
      } else if (msg.role === 'assistant') {
        contents.push({ role: 'model', parts: [{ text: msg.content }] });
      }
    }
    contents.push({ role: 'user', parts: [{ text: enrichedPrompt }] });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction,
        maxOutputTokens: isAstrology ? 450 : 70,
      },
    });

    const responseText = response.text || '';
    res.json({
      text: responseText.trim(),
      isAstrology: !!isAstrology,
    });
  } catch (error: any) {
    console.error('Server-side Gemini generation error:', error);
    res.status(500).json({
      error: error.message || 'Internal server error generating voice response',
    });
  }
});

/**
 * Direct Base Safe State (v1) ZIP Archive Download
 */
app.get('/api/download-base-v1', (_req, res) => {
  const zipPath = path.resolve(__dirname, 'public', 'voice-astrologer-base-v1.zip');
  res.download(zipPath, 'voice-astrologer-base-v1.zip', (err) => {
    if (err) {
      console.error('Download error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to serve base safe state zip archive' });
      }
    }
  });
});

// Vite middleware in dev mode; static serve in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
