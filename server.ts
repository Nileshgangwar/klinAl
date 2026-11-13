import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '1mb' }));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

interface ChatMessageInput {
  role: 'user' | 'assistant';
  content: string;
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', url: `http://localhost:${PORT}` });
});

async function generateWithRetry(
  conversationTurns: { role: 'user' | 'model'; parts: { text: string }[] }[],
  systemInstruction: string
) {
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: conversationTurns,
        config: {
          systemInstruction,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const isTransient = msg.includes('503') || msg.includes('UNAVAILABLE') || msg.includes('429');
      if (!isTransient || attempt === maxAttempts) {
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, attempt * 600));
    }
  }
  throw new Error('Failed to generate response.');
}

app.post('/api/chat', async (req, res) => {
  try {
    const { message, history = [], telemetryContext } = req.body as {
      message?: string;
      history?: ChatMessageInput[];
      telemetryContext?: unknown;
    };

    if (!message || typeof message !== 'string' || !message.trim()) {
      res.status(400).json({ error: 'Message is required.' });
      return;
    }

    if (!process.env.GEMINI_API_KEY) {
      res.status(500).json({
        error: 'Gemini API key is not configured. Add GEMINI_API_KEY in Settings > Secrets.',
      });
      return;
    }

    const systemInstruction = [
      'You are Kiln AI Copilot, an industrial ceramics thermal engineering and plant operations assistant.',
      'You assist plant operators, process engineers, and supply chain directors.',
      'Always quote all costs, tariffs, and savings in Indian Rupees (INR / ₹) using Indian numbering conventions (e.g., ₹11,625 or ₹1,54,560).',
      'Be concise, quantitative, and grounded strictly in the live plant telemetry provided below. Use short paragraphs or crisp bullet points with exact kiln IDs, zone numbers, temperatures (°C), yields (%), and INR figures.',
      'Live Plant Telemetry Snapshot:',
      JSON.stringify(telemetryContext ?? {}, null, 2),
    ].join('\n');

    const conversationTurns = [
      ...history.slice(-8).map((turn) => ({
        role: turn.role === 'assistant' ? ('model' as const) : ('user' as const),
        parts: [{ text: turn.content }],
      })),
      {
        role: 'user' as const,
        parts: [{ text: message.trim() }],
      },
    ];

    const response = await generateWithRetry(conversationTurns, systemInstruction);

    const reply = response.text?.trim();
    if (!reply) {
      res.status(502).json({ error: 'No response text generated from model.' });
      return;
    }

    res.json({ reply });
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : 'Failed to reach Kiln AI assistant service.';
    console.error('[/api/chat] Error:', err);

    if (errorMessage.includes('API_KEY_INVALID') || errorMessage.includes('PERMISSION_DENIED')) {
      res.status(403).json({
        error: 'Invalid or missing Gemini API key. Check Settings > Secrets.',
      });
      return;
    }
    if (errorMessage.includes('RESOURCE_EXHAUSTED') || errorMessage.includes('429')) {
      res.status(429).json({
        error: 'Assistant quota temporarily reached. Please retry in a moment.',
      });
      return;
    }
    if (errorMessage.includes('503') || errorMessage.includes('UNAVAILABLE')) {
      res.status(503).json({
        error: 'Kiln AI model is experiencing temporary high demand. Please retry in a few seconds.',
      });
      return;
    }

    res.status(500).json({ error: 'Unable to reach Kiln AI assistant. Please retry.' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Kiln AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
