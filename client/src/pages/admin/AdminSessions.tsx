import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import SakuraLayout from '../../layouts/SakuraLayout';
import type { CSSProperties } from 'react';

// 1. Definim interfața actualizată conform bazei de date reale
interface Session {
  id: string;
  data_finalizare: string; // În loc de created_at
  scor: number;            // În loc de score
  pacienti: {
    full_name: string;
  } | null;
}

export default function AdminSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSessions() {
      try {
        setLoading(true);
        // CORECȚIE: Folosim 'progres_pacienti' și coloanele corecte
        const { data, error } = await supabase
          .from('progres_pacienti')
          .select(`
            id,
            data_finalizare,
            scor,
            pacienti ( full_name )
          `)
          .order('data_finalizare', { ascending: false });

        if (error) throw error;
        
        setSessions((data as unknown as Session[]) || []);
      } catch (err) {
        console.error("Eroare la preluarea sesiunilor:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchSessions();
  }, []);

  return (
    <SakuraLayout>
      <div style={containerStyle}>
        <div style={headerStyle}>
          <h1 style={titleStyle}>Registru Sesiuni Clinice</h1>
          <p style={subtitleStyle}>Monitorizarea în timp real a activității de reabilitare.</p>
        </div>

        {loading ? (
          <div style={statusMessage}>Se accesează baza de date...</div>
        ) : (
          <div style={listContainer}>
            {sessions.length === 0 ? (
              <div style={statusMessage}>Nu există sesiuni înregistrate în sistem.</div>
            ) : (
              sessions.map(s => (
                <div key={s.id} style={sessionCard}>
                  <div style={infoGroup}>
                    <span style={patientName}>
                      {s.pacienti?.full_name || 'Pacient Anonim'}
                    </span>
                    <p style={dateText}>
                      Data finalizării: {new Date(s.data_finalizare).toLocaleString('ro-RO')}
                    </p>
                  </div>
                  <div style={scoreBadge(s.scor)}>
                    {s.scor}% <span style={scoreLabel}>Acuratețe</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </SakuraLayout>
  );
}

// --- STILURI PROFESIONALE ---
const containerStyle: CSSProperties = { padding: '50px 20px', maxWidth: '1000px', margin: '0 auto' };
const headerStyle: CSSProperties = { marginBottom: '40px', borderBottom: '2px solid #f1f5f9', paddingBottom: '20px' };
const titleStyle: CSSProperties = { color: '#1e293b', fontSize: '28px', fontWeight: 800, margin: 0 };
const subtitleStyle: CSSProperties = { color: '#64748b', fontSize: '16px', marginTop: '5px' };
const listContainer: CSSProperties = { display: 'grid', gap: '15px' };

const sessionCard: CSSProperties = { 
  backgroundColor: 'white', 
  padding: '20px 30px', 
  borderRadius: '16px', 
  display: 'flex', 
  justifyContent: 'space-between', 
  alignItems: 'center', 
  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  border: '1px solid #e2e8f0'
};

const infoGroup: CSSProperties = { display: 'flex', flexDirection: 'column', gap: '4px' };
const patientName: CSSProperties = { fontWeight: 700, color: '#334155', fontSize: '16px' };
const dateText: CSSProperties = { margin: 0, fontSize: '13px', color: '#94a3b8' };

const scoreBadge = (score: number): CSSProperties => ({ 
  color: score >= 70 ? '#059669' : '#dc2626', 
  fontWeight: 800, 
  fontSize: '22px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  background: score >= 70 ? '#f0fdf4' : '#fef2f2',
  padding: '10px 20px',
  borderRadius: '12px',
  minWidth: '100px'
});

const scoreLabel: CSSProperties = { fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, marginTop: '-4px' };
const statusMessage: CSSProperties = { textAlign: 'center', padding: '40px', color: '#64748b', fontWeight: 600 };
const centeredStyle: CSSProperties = { textAlign: 'center', padding: '100px', color: '#64748b', fontWeight: 900 };