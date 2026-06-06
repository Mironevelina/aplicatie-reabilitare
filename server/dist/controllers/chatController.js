import { supabase } from '../config/supabase.js';
export const proceseazaMesaj = async (req, res) => {
    const { patient_id, nume_pacient, mesaj, client_id, role } = req.body;
    try {
        // 1. Detecție problemă tehnică pentru alertă Admin
        const cuvinteTehnice = ['nu merge', 'eroare', 'bug', 'parola', 'cont', 'login', 'tehnic'];
        const esteProblemaTehnica = cuvinteTehnice.some(cuvant => mesaj.toLowerCase().includes(cuvant));
        // 2. Apel Gemini AI
        const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
        const promptAI = role === 'doctor'
            ? `Ești Sakura, asistent AI. Analizează tehnic cererea doctorului: ${mesaj}`
            : `Ești Sakura, asistent kineto empatic. Răspunde scurt în română (max 2 propoziții): ${mesaj}`;
        const geminiResponse = await fetch(GEMINI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: promptAI }] }] })
        });
        const data = await geminiResponse.json();
        const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sunt aici să te ajut!";
        // 3. SALVARE UNICĂ (Mesaj + Răspuns AI + Flag Admin + ClientID)
        const { data: savedData, error } = await supabase
            .from('contact_messages')
            .insert([{
                patient_id,
                nume_pacient: nume_pacient || 'Utilizator',
                mesaj: mesaj,
                raspuns_admin: `🌸 ${aiText.trim()}`,
                client_id: client_id, // Ștampila de la Frontend
                necesita_interventie_admin: esteProblemaTehnica,
                citit: false,
                created_at: new Date().toISOString()
            }])
            .select()
            .single();
        if (error)
            throw error;
        res.json({ success: true, message: savedData });
    }
    catch (error) {
        console.error("[CHAT ERROR]:", error.message);
        res.status(500).json({ success: false, error: "Eroare la procesarea mesajului" });
    }
};
