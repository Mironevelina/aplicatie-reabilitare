import { type ReactNode, useState, useEffect, useRef, memo } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { supabase } from '../supabaseClient';

// --- CONFIG ---
const GEMINI_API_KEY = "AIzaSyBh1MWvKdRinMiXggeMMRvDJ2Vog1w4-qU"; 
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

const SakuraLayout = memo(({ children }: { children: ReactNode }) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. Initializare: Se executa o singura data la incarcarea paginii
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    
    // Ascultam evenimentul de deschidere a chat-ului din Header
    const handleOpen = () => setIsChatOpen(true);
    window.addEventListener('openChat', handleOpen);
    return () => window.removeEventListener('openChat', handleOpen);
  }, []);

  // 2. Incarcare Istoric: Doar cand se deschide chat-ul, fara loop
  useEffect(() => {
    if (isChatOpen && user?.id) {
      const fetchHistory = async () => {
        const { data } = await supabase
          .from('contact_messages')
          .select('id, mesaj, raspuns_admin')
          .eq('patient_id', user.id)
          .order('created_at', { ascending: true });
        if (data) setHistory(data);
      };
      fetchHistory();
    }
  }, [isChatOpen, user?.id]); // DEPENDINTE SIGURE: nu punem "history" aici!

  // 3. Auto-scroll la ultimul mesaj
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  // 4. FUNCTIA DE TRIMITERE: Singurul loc unde se apeleaza Google si Supabase
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Daca mesajul e gol sau trimitem deja, oprim functia
    if (!message.trim() || !user || isSending) return;

    const userText = message;
    setMessage(''); // Stergem input-ul IMEDIAT pentru fluiditate
    setIsSending(true); // Punem "lacatul" pe functie

    try {
      // Pas A: Salvam mesajul userului in Supabase
      await supabase.from('contact_messages').insert([{
        patient_id: user.id,
        nume_pacient: user.user_metadata?.full_name || 'Pacient',
        mesaj: userText,
        citit: true
      }]);

      // Pas B: Chemam Gemini AI
      const response = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Ești Sakura, un asistent de kinetoterapie. Răspunde scurt (max 2 propoziții) în română: ${userText}` }] }]
        })
      });

      const data = await response.json();
      const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "AI momentan indisponibil.";

      // Pas C: Salvam raspunsul AI in Supabase
      const { data: savedAiMsg } = await supabase.from('contact_messages').insert([{
        patient_id: user.id,
        nume_pacient: 'Sakura AI',
        mesaj: userText,
        raspuns_admin: `🤖 ${aiText}`,
        citit: false
      }]).select().single();

      // Pas D: Adaugam manual in istoric (nu prin useEffect)
      if (savedAiMsg) {
        setHistory(prev => [...prev, savedAiMsg]);
        window.dispatchEvent(new Event('messageRead'));
      }

    } catch (err) {
      console.error("Eroare la procesare:", err);
    } finally {
      setIsSending(false); // Deblocam functia pentru urmatorul mesaj
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#fffafb' }}>
      <Header />
      <main style={{ flex: 1, position: 'relative' }}>
        {children}

        {/* COMPONENTA DE CHAT */}
        <div style={chatContainer}>
          {isChatOpen && (
            <div style={chatBox}>
              <div style={chatHeader}>
                <span style={{ fontWeight: 800 }}>🌸 Sakura AI</span>
                <button onClick={() => setIsChatOpen(false)} style={closeBtn}>✕</button>
              </div>

              <div style={chatBody} ref={scrollRef}>
                {history.map((m) => (
                  <div key={m.id} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <div style={patientBubble}>{m.mesaj}</div>
                    {m.raspuns_admin && <div style={aiBubble}>{m.raspuns_admin}</div>}
                  </div>
                ))}
                {isSending && <div style={typing}>Sakura procesează...</div>}
              </div>

              <form onSubmit={handleSendMessage} style={chatForm}>
                <input 
                  disabled={isSending}
                  value={message} 
                  onChange={(e) => setMessage(e.target.value)} 
                  placeholder="Scrie mesaj..."
                  style={chatInput}
                />
                <button type="submit" disabled={isSending || !message.trim()} style={sendBtn}>
                  {isSending ? '...' : '➤'}
                </button>
              </form>
            </div>
          )}

          <button onClick={() => setIsChatOpen(!isChatOpen)} style={toggleBtn}>
            {isChatOpen ? '✕' : '💬'}
          </button>
        </div>
      </main>
      <Footer />
    </div>
  );
});

// --- STILURI (IZOLATE PENTRU PERFORMANTA) ---
const chatContainer: React.CSSProperties = { position: 'fixed', bottom: '20px', right: '20px', zIndex: 10000 };
const chatBox: React.CSSProperties = { width: '280px', height: '380px', backgroundColor: 'white', borderRadius: '15px', boxShadow: '0 5px 25px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', marginBottom: '10px', overflow: 'hidden', border: '1px solid #eee' };
const chatHeader: React.CSSProperties = { backgroundColor: '#ff8fa3', color: 'white', padding: '10px 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const closeBtn: React.CSSProperties = { background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '18px' };
const chatBody: React.CSSProperties = { flex: 1, padding: '10px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' };
const patientBubble: React.CSSProperties = { alignSelf: 'flex-end', backgroundColor: '#f3f3f3', padding: '8px 12px', borderRadius: '15px 15px 2px 15px', fontSize: '13px', marginLeft: 'auto', maxWidth: '85%' };
const aiBubble: React.CSSProperties = { alignSelf: 'flex-start', backgroundColor: '#fff0f3', padding: '8px 12px', borderRadius: '15px 15px 15px 2px', fontSize: '13px', border: '1px solid #ffdae0', maxWidth: '85%' };
const chatForm: React.CSSProperties = { display: 'flex', padding: '10px', borderTop: '1px solid #eee' };
const chatInput: React.CSSProperties = { flex: 1, border: '1px solid #eee', borderRadius: '8px', padding: '8px', fontSize: '13px', outline: 'none' };
const sendBtn: React.CSSProperties = { background: '#ff8fa3', color: 'white', border: 'none', borderRadius: '8px', marginLeft: '5px', padding: '0 12px', cursor: 'pointer' };
const toggleBtn: React.CSSProperties = { width: '55px', height: '55px', borderRadius: '50%', backgroundColor: '#ff8fa3', color: 'white', border: 'none', fontSize: '24px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(255,143,163,0.4)' };
const typing: React.CSSProperties = { fontSize: '11px', color: '#ff8fa3', fontStyle: 'italic' };

export default SakuraLayout;