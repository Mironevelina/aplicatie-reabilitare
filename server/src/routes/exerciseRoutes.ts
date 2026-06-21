import { Router } from 'express';
import { proceseazaExercitiu, getIstoricPacient, genereazaRezumatMedical, genereazaRaportPacient } from '../controllers/exerciseController.js';

const router = Router();

router.post('/proceseaza', proceseazaExercitiu);
router.get('/istoric/:id_pacient', getIstoricPacient);
router.post('/analiza-ai', genereazaRezumatMedical);
router.post('/analiza-pacient', genereazaRaportPacient);

export default router;