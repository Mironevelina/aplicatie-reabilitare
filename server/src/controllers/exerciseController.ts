import { Request, Response } from 'express';
import { supabase } from '../config/supabase.js';

// Funcția 1: Procesare și Salvare (Cea apelată de ExercisePage)
export const proceseazaExercitiu = async (req: Request, res: Response) => {
  const { id_pacient, tip_exercitiu, scor, durata_secunde } = req.body;

  try {
    if (scor !== undefined && scor !== null) {
      console.log("Salvare sesiune pentru pacientul:", id_pacient);

      const { data, error } = await supabase
        .from('progres_pacienti')
        .insert([{ 
            id_pacient: id_pacient, 
            tip_exercitiu: tip_exercitiu || "Coordonare Forme", 
            scor: scor,
            durata_secunde: durata_secunde || 0,
            data_finalizare: new Date().toISOString()
        }]);

      if (error) {
        console.error("Eroare Supabase la insert:", error.message);
        return res.status(400).json({ success: false, error: error.message });
      }

      return res.json({ success: true, message: "Sesiune salvată cu succes!" });
    }

    return res.json({ success: true, message: "Date primite (live)" });

  } catch (error: any) {
    console.error("Eroare Server Backend:", error.message);
    res.status(500).json({ error: "Eroare internă server" });
  }
};

// Funcția 2: Preluare Istoric (Cea care lipsea și cauza eroarea la pornire)
export const getIstoricPacient = async (req: Request, res: Response) => {
    const { id_pacient } = req.params;
    try {
        const { data, error } = await supabase
            .from('progres_pacienti')
            .select('*')
            .eq('id_pacient', id_pacient)
            .order('data_finalizare', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (error: any) {
        console.error("Eroare la preluare istoric:", error.message);
        res.status(500).json({ error: error.message });
    }
};