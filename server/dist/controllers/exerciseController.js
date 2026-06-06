import { supabase } from '../config/supabase.js';
// =========================================================================
// FUNCȚIA 1: Procesare și Salvare Sesiune Nouă (Cea apelată după exercițiu)
// =========================================================================
export const proceseazaExercitiu = async (req, res) => {
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
            if (error)
                throw error;
            return res.json({ success: true, message: "Sesiune salvată cu succes!" });
        }
        return res.json({ success: true, message: "Date recepționate (live streaming)" });
    }
    catch (error) {
        console.error("❌ Eroare la salvarea exercițiului:", error.message);
        res.status(500).json({ error: "Eroare internă la salvarea datelor." });
    }
};
// =========================================================================
// FUNCȚIA 2: Preluare Istoric General (Cea pe care o căuta ruta și dădea eroare)
// =========================================================================
export const getIstoricPacient = async (req, res) => {
    const { id_pacient } = req.params;
    try {
        console.log("🌸 [BACKEND] Preluare istoric pentru pacientul:", id_pacient);
        const { data, error } = await supabase
            .from('progres_pacienti')
            .select('*')
            .eq('id_pacient', id_pacient)
            .order('data_finalizare', { ascending: true });
        if (error)
            throw error;
        res.json(data);
    }
    catch (error) {
        console.error("❌ Eroare la returnarea istoricului:", error.message);
        res.status(500).json({ error: error.message });
    }
};
// =========================================================================
// FUNCȚIA 3: Evaluare AI Indestructibilă (Separare Pacient / Medic)
// =========================================================================
export const genereazaRezumatMedical = async (req, res) => {
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
            if (user)
                idCautat = user.id;
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
        if (error)
            throw error;
        if (!sesiuni || sesiuni.length === 0) {
            return res.json({
                success: true,
                rezumat: "Nu s-au identificat exerciții finalizate în istoric pentru a genera o analiză.",
                analysis: "Nu s-au identificat exerciții finalizate în istoric pentru a genera o analiză."
            });
        }
        const normalizeExerciseName = (value) => value
            .normalize('NFD')
            .replace(/\p{Diacritic}/gu, '')
            .toLowerCase()
            .trim();
        const sesiuniOrdinate = [...sesiuni].sort((a, b) => new Date(a.data_finalizare).getTime() - new Date(b.data_finalizare).getTime());
        const gruparePeExercitii = sesiuniOrdinate.reduce((acc, sesiune) => {
            const cheie = normalizeExerciseName(sesiune.tip_exercitiu || 'Exercițiu');
            if (!acc[cheie]) {
                acc[cheie] = { nume: sesiune.tip_exercitiu || 'Exercițiu', intrari: [] };
            }
            acc[cheie].intrari.push(sesiune);
            return acc;
        }, {});
        const dateEvolutie = Object.values(gruparePeExercitii)
            .map((grup) => {
            const secventa = grup.intrari
                .map((item) => `[${new Date(item.data_finalizare).toLocaleString('ro-RO')}]: ${item.scor}%`)
                .join(' ➔ ');
            return `EXERCIȚIU: ${grup.nume}\nCronologie scoruri: ${secventa}`;
        })
            .join('\n\n');
        const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
        // 2. Prompt antiglonț cu reguli matematice stricte
        const prompt = `Ești un analist de date medicale. Sarcina ta este să identifici perioadele de progres și regres din istoricul pacientului. 
Pentru a evita erorile logice, trebuie să respecți EXACT aceste 3 reguli matematice universale:
- REGULA 1 (PROGRES): Scorul CREȘTE (de ex: de la 50% la 100%).
- REGULA 2 (REGRES): Scorul SCADE (de ex: de la 100% la 0% sau de la 80% la 50%).
- REGULA 3 (STABILIZARE/PLATOU): Scorul RĂMÂNE IDENTIC (de ex: de la 100% la 100%).

Nu suprapune niciodată datele. O perioadă nu poate fi și progres și regres în același timp. Dacă scorul se menține la 100% pe mai multe zile, se numește exclusiv "STABILIZARE PERFECTĂ".

Redactează răspunsul tău sub titlul "[PERIOADE DE PROGRES / REGRES PE EXERCIȚIU]".
Pentru fiecare exercițiu, scrie o singură frază clară și logică, după modelul:
"• [Nume Exercițiu]: Trend general de [Progres/Regres/Stabilizare], pornind de la X% și ajungând la Y%. Cea mai mare creștere a fost între [Data A] și [Data B], iar o scădere a apărut între [Data C] și [Data D]." (Omite scăderea dacă nu există).

Datele pacientului:
${dateEvolutie}`;
        // AICI ESTE SINGURA MODIFICARE: Un prompt strict care îi interzice să genereze alte texte în afară de rezultat.
        const geminiResponse = await fetch(GEMINI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const aiData = await geminiResponse.json();
        if (!geminiResponse.ok) {
            throw new Error(aiData.error?.message || 'Eroare AI la generarea raportului medical.');
        }
        const textFinal = aiData.candidates?.[0]?.content?.parts?.[0]?.text || 'Raportul AI nu a putut fi generat momentan.';
        return res.json({
            success: true,
            rezumat: textFinal,
            analysis: textFinal
        });
    }
    catch (error) {
        console.error("❌ [CRITICAL AI ERROR]:", error.message || error);
        return res.status(500).json({ success: false, error: "Eroare la procesarea modulului statistic AI." });
    }
};
