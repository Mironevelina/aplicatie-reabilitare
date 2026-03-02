import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import SakuraLayout from '../../layouts/SakuraLayout';

// 1. Definim interfața pentru structura datelor
interface Session {
  id: string;
  created_at: string;
  score: number;
  pacienti: {
    full_name: string;
  } | null; // Poate fi null dacă pacientul a fost șters sau nu există
}

export default function AdminSessions() {
  // 2. Înlocuim <any[]> cu <Session[]>
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    async function fetchSessions() {
      // Facem un join între sessions și pacienti pentru a vedea numele
      const { data } = await supabase
        .from('sessions')
        .select(`
          id,
          created_at,
          score,
          pacienti ( full_name )
        `)
        .order('created_at', { ascending: false });
      
      // 3. Forțăm tipul de date primit de la Supabase să corespundă interfeței noastre
      setSessions((data as unknown as Session[]) || []);
    }
    fetchSessions();
  }, []);

  return (
    <SakuraLayout>
      <div style={{ padding: '40px', maxWidth: '900px', margin: '0 auto' }}>
        <h1 style={{ color: '#4d444a' }}>Flux Activitate Recente 📊</h1>
        <div style={{ display: 'grid', gap: '10px' }}>
          {sessions.map(s => (
            <div key={s.id} style={{ backgroundColor: 'white', padding: '20px', borderRadius: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontWeight: 800 }}>{s.pacienti?.full_name || 'Pacient Necunoscut'}</span>
                <p style={{ margin: 0, fontSize: '12px', color: '#8a7d84' }}>{new Date(s.created_at).toLocaleString('ro-RO')}</p>
              </div>
              <div style={{ color: '#ff8fa3', fontWeight: 900, fontSize: '20px' }}>{s.score}%</div>
            </div>
          ))}
        </div>
      </div>
    </SakuraLayout>
  );
}