import { Router, Request, Response } from 'express';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { proceseazaExercitiu, getIstoricPacient } from '../controllers/exerciseController.js';

const router = Router();

// Inițializare Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

/**
 * @swagger
 * /api/exercises/proceseaza:
 *   post:
 *     summary: Trimite rezultatele exercițiului și salvează scorul sesiunii
 *     tags:
 *       - Exerciții
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id_pacient:
 *                 type: string
 *               tip_exercitiu:
 *                 type: string
 *               scor:
 *                 type: number
 *               durata_secunde:
 *                 type: number
 *     responses:
 *       200:
 *         description: Sesiune salvată cu succes
 */
router.post('/proceseaza', proceseazaExercitiu);

/**
 * @swagger
 * /api/exercises/istoric/{id_pacient}:
 *   get:
 *     summary: Obține istoricul de antrenament al unui pacient
 *     tags:
 *       - Exerciții
 *     parameters:
 *       - in: path
 *         name: id_pacient
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Succes
 */
router.get('/istoric/:id_pacient', getIstoricPacient);

/**
 * @swagger
 * /api/exercises/analiza-ai:
 *   post:
 *     summary: Generează un raport clinic inteligent folosind Google Gemini
 *     tags:
 *       - Exerciții
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               pacientNume:
 *                 type: string
 *               istoric:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Analiză generată cu succes
 */
router.post('/analiza-ai', async (req: Request, res: Response) => {
  try {
    const { pacientNume, istoric } = req.body;

    if (!istoric || istoric.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Date insuficiente pentru analiza AI."
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        message: "Cheia API Gemini nu este configurată."
      });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash"
    });

    const prompt = `
Ești un expert în kinetoterapie.

Analizează următoarele date pentru pacientul ${pacientNume}:

${JSON.stringify(istoric, null, 2)}

Generează:
- un raport scurt
- progresul pacientului
- eventuale recomandări

Răspunsul trebuie să fie:
- în limba română
- maxim 4 rânduri
- ton profesional
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    res.json({
      success: true,
      analysis: text
    });

  } catch (error: any) {
    console.error("Eroare Backend Gemini:", error);

    res.status(500).json({
      success: false,
      message: "Eroare la procesarea inteligenței artificiale.",
      details: error.message
    });
  }
});

export default router;