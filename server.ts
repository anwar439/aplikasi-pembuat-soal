import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Middleware for parsing JSON requests
app.use(express.json());

// Initialize Gemini API Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Endpoint for AI Quiz generation
app.post('/api/generate-quiz', async (req, res) => {
  try {
    const { topic, gradeLevel, questionCount, questionType } = req.body;

    if (!topic) {
      return res.status(400).json({ error: 'Topik harus diisi' });
    }

    const count = Math.min(Math.max(Number(questionCount) || 3, 1), 10);
    const gradeText = gradeLevel ? `tingkat ${gradeLevel}` : 'umum';

    const systemInstruction = `Anda adalah asisten pembuat soal evaluasi pembelajaran dan kuis sekolah (guru ahli). 
Buatlah soal-soal berkualitas tinggi dalam bahasa Indonesia yang sesuai dengan kurikulum sekolah. 
Setiap soal harus objektif, jelas, dan mendidik.
Selalu sertakan poin (skor) yang realistis (misalnya 10 atau 20 per soal) dan tandai jawaban yang benar.`;

    const prompt = `Buatlah kuis sebanyak ${count} soal dengan topik "${topic}" untuk siswa ${gradeText}.
Tipe soal yang diminta adalah: ${questionType}.
Ketentuan tipe soal:
- MULTIPLE_CHOICE: soal pilihan ganda, sediakan tepat 4 opsi pilihan (id: 'opt-a', 'opt-b', 'opt-c', 'opt-d'). Tentukan 1 'correctAnswer' (misalnya 'opt-b').
- CHECKBOXES: soal pilihan kotak centang (jawaban bisa lebih dari satu), sediakan tepat 4 opsi pilihan (id: 'opt-a', 'opt-b', 'opt-c', 'opt-d'). Tentukan daftar opsi yang benar pada 'correctAnswers' (misalnya ['opt-a', 'opt-c']).
- SHORT_ANSWER: soal jawaban singkat. Tidak perlu opsi pilihan. Tentukan jawaban singkat yang benar pada 'correctAnswer' (misalnya berupa satu kata atau frasa pendek).

Pastikan format output berupa array JSON yang valid sesuai skema yang diminta.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING, description: "ID unik untuk soal, misalnya 'q-1', 'q-2'" },
              type: { type: Type.STRING, description: "Tipe soal, harus persis MULTIPLE_CHOICE, CHECKBOXES, atau SHORT_ANSWER" },
              title: { type: Type.STRING, description: "Teks pertanyaan dalam bahasa Indonesia yang jelas" },
              required: { type: Type.BOOLEAN, description: "Selalu true" },
              points: { type: Type.INTEGER, description: "Skor bobot nilai untuk soal ini, misalnya 10, 20, atau 25" },
              options: {
                type: Type.ARRAY,
                description: "Hanya untuk MULTIPLE_CHOICE dan CHECKBOXES. Berisi tepat 4 opsi.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING, description: "ID opsi, misalnya 'opt-a', 'opt-b', dsb" },
                    text: { type: Type.STRING, description: "Teks opsi jawaban" }
                  },
                  required: ['id', 'text']
                }
              },
              correctAnswer: {
                type: Type.STRING,
                description: "Hanya untuk MULTIPLE_CHOICE (id opsi yang benar) atau SHORT_ANSWER (jawaban teks yang benar)"
              },
              correctAnswers: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Hanya untuk CHECKBOXES. Daftar id opsi yang benar."
              }
            },
            required: ['id', 'type', 'title', 'required', 'points']
          }
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error('Tidak ada respon teks dari model');
    }

    const quizData = JSON.parse(text);
    res.json({ questions: quizData });
  } catch (error: any) {
    console.error('Gagal membuat kuis:', error);
    res.status(500).json({ error: error?.message || 'Gagal memproses pembuatan soal kuis oleh AI' });
  }
});

// Setup dev server vs production server
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Vite development middleware mounted');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Support SPA fallback
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('Production static file serving enabled');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
