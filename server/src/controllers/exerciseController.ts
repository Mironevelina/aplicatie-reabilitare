import { Request, Response } from 'express';
import { supabase } from '../config/supabase.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export const proceseazaExercitiu = async (req: Request, res: Response) => {
  const { id_pacient, tip_exercitiu, scor, durata_secunde } = req.body;
  try {
    await supabase.from('progres_pacienti').insert([{ 
        id_pacient, tip_exercitiu, scor, durata_secunde, data_finalizare: new Date().toISOString() 
    }]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getIstoricPacient = async (req: Request, res: Response) => {
  const { id_pacient } = req.params;
  const { data } = await supabase.from('progres_pacienti').select('*').eq('id_pacient', id_pacient).order('data_finalizare');
  res.json(data);
};

export const genereazaRezumatMedical = async (req: Request, res: Response) => {
  const { id_pacient } = req.body;
  
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ success: false, error: "Cheia API Gemini lipsește pe server." });
  }

  try {
    const { data: sesiuni, error } = await supabase
      .from('progres_pacienti')
      .select('scor, data_finalizare')
      .eq('id_pacient', id_pacient)
      .order('data_finalizare', { ascending: true });

    if (error) throw error;
    if (!sesiuni || sesiuni.length === 0) throw new Error("Nu există sesiuni.");

    // Selectăm doar ultimele 20 sesiuni pentru a nu depăși limita AI
    const ultimeleSesiuni = sesiuni.slice(-20);
    const dateEvolutie = ultimeleSesiuni.map(s => `${s.scor}%`).join(', ');

   const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `Ești un expert în kinetoterapie. Analizează scorurile pacientului din ultimele sesiuni: ${dateEvolutie}. 
    Evaluează progresul (creștere, stagnare sau scădere) și oferă o recomandare clinică scurtă în limba română.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    res.json({ success: true, analysis: text });
  } catch (err: any) {
    console.error("EROARE BACKEND AI:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};