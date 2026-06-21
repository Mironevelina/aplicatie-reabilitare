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

   
    const ultimeleSesiuni = sesiuni.slice(-100);
    const dateEvolutie = ultimeleSesiuni.map(s => `${s.scor}%`).join(', ');

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `Ești un terapeut în kinetoterapie. Analizează scorurile pacientului din ultimele sesiuni: ${dateEvolutie}. 
    Evaluează progresul (creștere, stagnare sau scădere) și oferă o recomandare clinică  în limba română.
    CRITICAL: Nu folosi absolut deloc sintaxă Markdown în răspuns. Nu folosi steluțe pentru bold (**), nu folosi diezuri (#) și nu folosi liste cu caractere speciale. Returnează textul complet curat, formatat direct în paragrafe specifice unui cadru medical , separate prin rânduri noi, pregătit pentru a fi citit direct de un utilizator într-o interfață grafică standard.
`;
    
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    res.json({ success: true, analysis: text });
  } catch (err: any) {
    console.error("EROARE BACKEND AI:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};
export const genereazaRaportPacient = async (req: Request, res: Response) => {
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
    if (!sesiuni || sesiuni.length === 0) throw new Error("Nu există sesiuni înregistrate.");

    
    const ultimeleSesiuni = sesiuni.slice(-100);
    const dateEvolutie = ultimeleSesiuni.map(s => `${s.scor}%`).join(', ');

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    // --- PROMPTUL PERSONALIZAT PENTRU PACIENT ---
    const prompt = `Ești un asistent virtual empatic și cald, specializat în suport pentru recuperare medicală la domiciliu. 
    Analizează istoricul recent al scorurilor obținute de pacient la exerciții: ${dateEvolutie}.
    
    Generează un raport în limba română special pentru PACIENT, respectând următoarele reguli:
    1. Folosește un ton cald, prietenos, optimist și foarte încurajator (vorbește direct cu pacientul).
    2. Nu folosi jargon medical complicat sau termeni clinici rigizi. Explică totul simplu.
    3. Structurează răspunsul în 3 secțiuni clare, folosind titluri:
       - **Cum te-ai descurcat recent:** (O interpretare simplă a evoluției scorurilor, lăudând efortul dacă scorurile sunt mari sau oferind sprijin moral dacă au fost scăderi/fluctuații).
       - **Ce înseamnă acest lucru pentru tine:** (Explică-i de ce contează constanța, de exemplu: că mușchii sau articulațiile se obișnuiesc cu mișcarea corectă).
       - **Sfatul meu pentru acasă:** (O recomandare simplă, practică și sigură pentru următoarea perioadă, cum ar fi pauze scurte, hidratare sau continuarea exercițiilor în ritm propriu).
       CRITICAL: Nu folosi absolut deloc sintaxă Markdown în răspuns. Nu folosi steluțe pentru bold (**), nu folosi diezuri (#) și nu folosi liste cu caractere speciale. 
       Returnează textul complet curat, formatat direct în paragrafe simple, separate prin rânduri noi, pregătit pentru a fi citit direct de un utilizator într-o interfață grafică standard.
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    res.json({ success: true, analysis: text });
  } catch (err: any) {
    console.error("EROARE BACKEND RAPORT PACIENT:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};