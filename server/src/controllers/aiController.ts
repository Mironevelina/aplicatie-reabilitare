import { Request, Response } from 'express';
import { supabase } from '../config/supabase.js';

// 1. Definim o interfață pentru a descrie structura rândului din baza de date
interface ProgresRow {
  scor: number;
  tip_exercitiu: string;
  data_finalizare: string;
}

export const genereazaRezumatMedical = async (req: Request, res: Response) => {
  const { id_pacient } = req.body;

  try {
    // 2. Extragem datele și folosim tipizarea pentru 'data'
    const { data, error } = await supabase
      .from('progres_pacienti')
      .select('scor, tip_exercitiu, data_finalizare')
      .eq('id_pacient', id_pacient)
      .order('data_finalizare', { ascending: false })
      .limit(10);

    if (error) throw error;

    if (!data || data.length === 0) {
      return res.json({ success: true, rezumat: "Nu există suficiente date pentru o analiză medicală." });
    }

    // 3. Specificăm tipul parametrului 's' ca fiind 'ProgresRow'
    // Aceasta elimină eroarea "implicitly has an any type"
    const dateEvolutie = data.map((s: ProgresRow) => 
      `Exercițiu: ${s.tip_exercitiu}, Scor: ${s.scor}%, Data: ${s.data_finalizare}`
    ).join('; ');

    const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
    
    const prompt = `Ești un asistent virtual specializat în kinetoterapie. Analizează următoarele date de progres ale pacientului: ${dateEvolutie}. 
    Generează un rezumat clinic scurt (maxim 3-4 propoziții) pentru medicul coordonator. 
    Specifică trendul (evoluție/involuție), media scorurilor și o recomandare tehnică. 
    Folosește un ton academic, profesional, în limba română. Fără emoji-uri.`;

    const geminiResponse = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const aiData = await geminiResponse.json();
    const rezumat = aiData.candidates?.[0]?.content?.parts?.[0]?.text || "Analiza AI nu a putut fi generată momentan.";

    res.json({ success: true, rezumat });

  } catch (error: any) {
    console.error("[AI ERROR]:", error.message);
    res.status(500).json({ success: false, error: "Eroare la generarea rezumatului medical." });
  }
};