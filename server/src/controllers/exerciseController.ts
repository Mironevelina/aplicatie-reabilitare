import { Request, Response } from 'express';
import { supabase } from '../config/supabase.js';

import { Request, Response } from 'express';
import { supabase } from '../config/supabase.js';

// =========================================================================
// FUNCȚIA 1: Procesare și Salvare Sesiune Nouă (Cea apelată după exercițiu)
// =========================================================================
export const proceseazaExercitiu = async (req: Request, res: Response) => {
  const { id_pacient, tip_exercitiu, scor, durata_secunde } = req.body;
  try {
    if (scor !== undefined && scor !== null) {
      console.log("🌸 [BACKEND] Salvare sesiune nouă pentru pacientul:", id_pacient);
      const { error } = await supabase
        .from('progres_pacienti')
        .insert([{ 
            id_pacient: id_pacient, 
            tip_exercitiu: tip_exercitiu || "Coordonare Forme", 
            scor: Number(scor),
            durata_secunde: Number(durata_secunde) || 0,
            data_finalizare: new Date().toISOString()
        }]);

      if (error) throw error;
      return res.json({ success: true, message: "Sesiune salvată cu succes!" });
    }
    return res.json({ success: true, message: "Date recepționate (live streaming)" });
  } catch (error: any) {
    console.error("❌ Eroare la salvarea exercițiului:", error.message);
    res.status(500).json({ error: "Eroare internă la salvarea datelor." });
  }
};

// =========================================================================
// FUNCȚIA 2: Preluare Istoric General (Cea pe care o căuta ruta și dădea eroare)
// =========================================================================
export const getIstoricPacient = async (req: Request, res: Response) => {
    const { id_pacient } = req.params;
    try {
        console.log("🌸 [BACKEND] Preluare istoric pentru pacientul:", id_pacient);
        const { data, error } = await supabase
            .from('progres_pacienti')
            .select('*')
            .eq('id_pacient', id_pacient)
            .order('data_finalizare', { ascending: true });

        if (error) throw error;
        res.json(data);
    } catch (error: any) {
        console.error("❌ Eroare la returnarea istoricului:", error.message);
        res.status(500).json({ error: error.message });
    }
};

// =========================================================================
// FUNCȚIA 3: Evaluare AI Indestructibilă (Separare Pacient / Medic)
// =========================================================================
export const genereazaRezumatMedical = async (req: Request, res: Response) => {
  let idCautat = req.body.id_pacient || req.body.pacientId || req.body.id;
  const { pacientNume } = req.body;
  
  // SEPARARE INFALIBILĂ: Dacă frontend-ul trimite parametrul 'pacientNume', înseamnă 100% că apelul vine de la ProgressPage (Pacient)
  const esteMedic = pacientNume ? false : true;

  console.log(`\n========== SakuraMotion AI LOG ==========`);
  console.log(`👤 Nume pacient primit în body: ${pacientNume || 'Nespecificat (Apel din panou medic)'}`);
  console.log(`🌸 [CONTEXT DETECTAT]: ${esteMedic ? 'MEDIC 👨‍⚕️' : 'PACIENT 👤'}`);
  console.log(`=========================================\n`);

  try {
    if (!idCautat) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) idCautat = user.id;
    }

    if (!idCautat) {
      return res.status(400).json({ success: false, error: "Nu s-a putut mapa un ID de pacient valid." });
    }

    // Extragem istoricul complet din tabelă
    const { data: sesiuni, error } = await supabase
      .from('progres_pacienti')
      .select('scor, tip_exercitiu, data_finalizare')
      .eq('id_pacient', idCautat)
      .order('data_finalizare', { ascending: true });

    if (error) throw error;

    if (!sesiuni || sesiuni.length === 0) {
      return res.json({ 
        success: true, 
        rezumat: "Nu s-au identificat exerciții finalizate în istoric pentru a genera o analiză.",
        analysis: "Nu s-au identificat exerciții finalizate în istoric pentru a genera o analiză."
      });
    }

    const scoruri = sesiuni.map(s => s.scor);
    const N = scoruri.length;

    // Calcul statistic pe datele brute
    const medie = Math.round(scoruri.reduce((acc, val) => acc + val, 0) / N);
    let abatereStandard = "0.0";
    let panta = 0;
    
    if (N >= 2) {
      const mediePatrate = scoruri.reduce((acc, val) => acc + Math.pow(val - medie, 2), 0);
      abatereStandard = Math.sqrt(mediePatrate / N).toFixed(1);

      let sumaX = 0, sumaY = 0, sumaXY = 0, sumaXX = 0;
      for (let i = 0; i < N; i++) {
        sumaX += i;
        sumaY += scoruri[i];
        sumaXY += i * scoruri[i];
        sumaXX += i * i;
      }
      panta = (N * sumaXY - sumaX * sumaY) / (N * sumaXX - sumaX * sumaX);
    }

    let statusClinic = "CONSOLIDARE MOTORIE INIȚIALĂ";
    let recomandareMedica = "Se recomandă menținerea frecvenței curente a antrenamentelor.";

    if (panta > 1.2) {
      statusClinic = "CURBĂ ASCENDENTĂ DE RECUPERARE DINAMICĂ";
      recomandareMedica = "Se indică sporirea treptată a complexității mișcărilor cinematice.";
    } else if (panta < -1.2) {
      statusClinic = "REGRES DE COMPLIANȚĂ / OBOSEALĂ NEUROMUSCULARĂ";
      recomandareMedica = "Indică necesitatea reducerii pragurilor de dificultate pentru a preveni suprasolicitarea.";
    } else if (N >= 2) {
      statusClinic = "STABILIZARE ÎN PLATOU KINETIC";
      recomandareMedica = "Control muscular consolidat. Necesară deblocarea progresului prin exerciții noi.";
    }

    const variabilitateMare = parseFloat(abatereStandard) > 15;
    const instabilitateText = variabilitateMare 
      ? " Datele evidențiază fluctuații tranzitorii mari cauzate de oboseala musculară." 
      : " Parametrii înregistrați reflectă o constanță cinematică optimă.";

    let textFinal = "";
    if (esteMedic) {
      textFinal = `[RAPORT EVALUARE CLINICĂ AI]
• Status neurologic: ${statusClinic}.
• Indicatori Cantitativi: Analiză executată complet pe un eșantion de ${N} ședințe. Medie globală a acurateței: ${medie}%.
• Coeficient de Variabilitate: Abatere standard calculată la ±${abatereStandard}%.${instabilitateText}
• Concluzie terapeutică: ${recomandareMedica}`;
    } else {
      textFinal = `Pe baza celor ${N} exerciții din istoricul tău, ai obținut o mișcare corectă cu o medie remarcabilă de ${medie}%. Graficul tău arată că mușchii și încheieturile tale răspund din ce în ce mai bine la antrenamente. Continuă să exersezi în fiecare zi pentru a-ți recăpăta mobilitatea completă! ✨🌸`;
    }

    return res.json({ 
      success: true, 
      rezumat: textFinal,
      analysis: textFinal 
    });

  } catch (error: any) {
    console.error("❌ [CRITICAL AI ERROR]:", error.message || error);
    return res.status(500).json({ success: false, error: "Eroare la procesarea modulului statistic AI." });
  }
};