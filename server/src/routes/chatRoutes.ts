import { Router } from 'express';
import { proceseazaMesaj } from '../controllers/chatController.js';
import { genereazaRezumatMedical } from '../controllers/aiController.js';
const router = Router();

/**
 * @swagger
 * /api/chat/send:
 *   post:
 *     summary: Trimite un mesaj către asistentul Sakura AI
 *     tags: [Chat AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               patient_id:
 *                 type: string
 *                 example: "123e4567-e89b-12d3-a456-426614174000"
 *               nume_pacient:
 *                 type: string
 *                 example: "Test User"
 *               mesaj:
 *                 type: string
 *                 example: "Mă doare umărul drept când ridic mâna."
 *     responses:
 *       200:
 *         description: Mesaj salvat și răspuns AI primit
 *       500:
 *         description: Eroare la procesare
 */
router.post('/send', proceseazaMesaj);
router.post('/rezumat-medical', genereazaRezumatMedical);
export default router;