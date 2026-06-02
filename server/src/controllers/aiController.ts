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
    // 2. Extragem datele din tabelul tău din Supabase
    const { data, error } = await supabase
      .from('progres_pacienti')
      .select('scor, tip_exercitiu, data_finalizare')
      .eq('id_pacient', id_pacient)
      .order('data_finalizare', { ascending: false })
      .limit(10);

    if (error) throw error;

    if (!data || data.length === 0) {
      return res.json({ success: true, rezumat: "Nu există suficiente date înregistrate pentru a genera o analiză medicală." });
    }

    // 3. Formatăm istoricul sesiunilor sub formă de text
    const dateEvolutie = data.map((s: ProgresRow) => 
      `Exercițiu: ${s.tip_exercitiu}, Scor: ${s.scor}%, Data: ${s.data_finalizare}`
    ).join('; ');

    // REPARAT CRITIC: Am pus identificatorul exact universal primit de v1beta în API direct
    const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`;
    
    const prompt = `Ești un asistent virtual specializat în kinetoterapie și reabilitare motorie neuro-musculară. 
Analizează următoarele date de progres ale pacientului pentru proiectul meu de licență: ${dateEvolutie}. 
Generează un rezumat clinic scurt (maxim 3 propoziții) în limba română pentru medicul coordonator. 
Specifică în mod explicit dacă se observă o EVOLUȚIE clinică sau o INVOLUȚIE/STAGNARE a stării motorii și adaugă o scurtă recomandare terapeutică bazată pe performanță. 
Păstrează un ton academic, strict profesional, fără emoji-uri și fără introduceri introductive.`;

    const geminiResponse = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const aiData = await geminiResponse.json();

    // Verificăm dacă răspunsul Google a întors o eroare structurală
    if (!geminiResponse.ok) {
      console.error("=== EROARE DE PARSARE SERVER GOOGLE ===");
      console.error(aiData);
      return res.status(geminiResponse.status).json({
        success: false,
        error: aiData.error?.message || "Eroare la procesarea răspunsului de la Google."
      });
    }

    const rezumat = aiData.candidates?.[0]?.content?.parts?.[0]?.text || "Analiza AI nu a putut fi generată momentan.";

    return res.json({ success: true, rezumat });

  } catch (error: any) {
    console.error("[AI ERROR IN CONTROLLER]:", error.message || error);
    return res.status(500).json({ success: false, error: "Eroare la generarea rezumatului medical pe server." });
  }
};