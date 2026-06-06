import { Router } from 'express';
import { proceseazaExercitiu, getIstoricPacient, genereazaRezumatMedical } from '../controllers/exerciseController.js';
const router = Router();
// 1. Rutele tale standard pentru salvare și istoric grafic
router.post('/proceseaza', proceseazaExercitiu);
router.get('/istoric/:id_pacient', getIstoricPacient);
// 2. RUTA CRITICĂ UNIFICATĂ PENTRU ANALIZA AI
// Mapăm direct /analiza-ai către funcția din controller pe care am scris-o completă
router.post('/analiza-ai', genereazaRezumatMedical);
export default router;
