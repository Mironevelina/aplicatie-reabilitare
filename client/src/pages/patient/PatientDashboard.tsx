import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import SakuraLayout from '../../layouts/SakuraLayout';
import type { CSSProperties } from 'react';

interface Session {
  id: string | number;
  data_finalizare: string;
  scor: number;
  tip_exercitiu: string;
}

export default function PatientDashboard() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [fullName, setFullName] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // 1. Preluăm profilul din tabelul 'pacienti' (NU din profiles)
          const { data: patientProfile } = await supabase
            .from('pacienti')
            .select('full_name')
            .eq('id', user.id)
            .single();
          
          if (patientProfile) {
            setFullName(patientProfile.full_name);
          } else {
            setFullName('Pacient');
          }

          // 2. Preluăm datele din 'progres_pacienti' folosind 'id_pacient'
          const { data: sessionData, error } = await supabase
            .from('progres_pacienti')
            .select('id, data_finalizare, scor, tip_exercitiu')
            .eq('id_pacient', user.id) // Coloana corectă din SQL
            .order('data_finalizare', { ascending: false });
          
          if (error) throw error;
          if (sessionData) setSessions(sessionData as Session[]);
        }
      } catch (error) {
        console.error("Eroare date Dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPatientData();
  }, []);

  // LOGICA DE CALCUL STATISTICI
  const avgScore = sessions.length > 0 
    ? Math.round(sessions.reduce((acc, s) => acc + s.scor, 0) / sessions.length) 
    : 0;
  
  const weeklyGoal = 5;
  const weeklyProgress = Math.min(sessions.filter(s => {
    const date = new Date(s.data_finalizare);
    const acum = new Date();
    return date > new Date(acum.getTime() - 7 * 24 * 60 * 60 * 1000);
  }).length, weeklyGoal);

  if (loading) return (
    <SakuraLayout>
      <div style={centeredStyle}>🌸 Se încarcă datele tale...</div>
    </SakuraLayout>
  );

  return (
    <SakuraLayout>
      <div style={pageScrollContainer}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '20px' }}>
          
          <div style={headerSectionStyle}>
            <div>
              <h1 style={titleStyle}>Bună dimineața, {fullName}! 🌸</h1>
              <p style={subtitleStyle}>Iată progresul tău actualizat în timp real.</p>
            </div>
            <button onClick={() => navigate('/exercitiu')} style={mainButtonStyle}>+ Sesiune Nouă</button>
          </div>

          <section style={challengeCardStyle}>
            <div style={{ fontSize: '40px' }}>🏆</div>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: '0 0 5px 0', color: '#4d444a' }}>Obiectiv Săptămânal</h3>
              <div style={progressTrackStyle}>
                <div style={{ ...progressFillStyle, width: `${(weeklyProgress / weeklyGoal) * 100}%` }} />
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontSize: '20px', fontWeight: 900, color: '#ff8fa3' }}>{weeklyProgress} / {weeklyGoal}</p>
            </div>
          </section>

          <div style={statsGridStyle}>
            <div style={statCardStyle}>
              <p style={statLabelStyle}>Acuratețe Medie</p>
              <span style={{ fontSize: '32px', fontWeight: 900, color: '#4d444a' }}>{avgScore}%</span>
            </div>
            <div style={statCardStyle}>
              <p style={statLabelStyle}>Sesiuni Totale</p>
              <span style={{ fontSize: '32px', fontWeight: 900, color: '#4d444a' }}>{sessions.length}</span>
            </div>
            <div style={{ ...statCardStyle, cursor: 'pointer', border: '1px solid #ff8fa3' }} onClick={() => navigate('/progres')}>
              <p style={{ ...statLabelStyle, color: '#ff8fa3' }}>Raport Evoluție</p>
              <span style={{ fontSize: '32px' }}>📈</span>
            </div>
          </div>

          <div style={activitySectionStyle}>
            <h3 style={{ color: '#4d444a', marginBottom: '15px' }}>Istoric Activitate</h3>
            <div style={tableScrollWrapper}>
              {sessions.length > 0 ? (
                sessions.map((s, i) => (
                  <div key={s.id} style={{ ...rowStyle, borderBottom: i === sessions.length - 1 ? 'none' : '1px solid #fff0f3' }}>
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                      <span style={dateTagStyle}>{new Date(s.data_finalizare).toLocaleDateString('ro-RO')}</span>
                      <span style={{ fontWeight: 600, color: '#4d444a' }}>{s.tip_exercitiu}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '25px', alignItems: 'center' }}>
                      <span style={{ ...scoreBadgeStyle, color: s.scor >= 80 ? '#2ed573' : '#ff8fa3' }}>{s.scor}%</span>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '40px', textAlign: 'center', color: '#8a7d84' }}>
                  Nu am găsit sesiuni salvate. Începe un exercițiu!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </SakuraLayout>
  );
}

// --- STILURI (CSS-in-JS) ---
const pageScrollContainer: CSSProperties = { height: 'calc(100vh - 80px)', overflowY: 'auto', paddingBottom: '50px' };
const tableScrollWrapper: CSSProperties = { backgroundColor: 'white', borderRadius: '30px', border: '1px solid #fff0f3', maxHeight: '400px', overflowY: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' };
const centeredStyle: CSSProperties = { textAlign: 'center', padding: '100px', color: '#ff8fa3', fontWeight: 900 };
const headerSectionStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' };
const titleStyle: CSSProperties = { fontSize: '28px', fontWeight: 900, color: '#4d444a', margin: 0 };
const subtitleStyle: CSSProperties = { color: '#8a7d84', margin: '5px 0 0 0' };
const mainButtonStyle: CSSProperties = { padding: '12px 28px', backgroundColor: '#ff8fa3', color: 'white', border: 'none', borderRadius: '18px', fontWeight: 800, cursor: 'pointer' };
const challengeCardStyle: CSSProperties = { backgroundColor: 'white', padding: '20px', borderRadius: '25px', border: '1px solid #fff0f3', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '20px' };
const progressTrackStyle: CSSProperties = { height: '10px', backgroundColor: '#fff0f3', borderRadius: '10px', marginTop: '8px', overflow: 'hidden' };
const progressFillStyle: CSSProperties = { height: '100%', backgroundColor: '#ffb7c5', borderRadius: '10px', transition: 'width 1s ease' };
const statsGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '30px' };
const statCardStyle: CSSProperties = { backgroundColor: 'white', padding: '25px', borderRadius: '25px', border: '1px solid #fff0f3', textAlign: 'center' };
const statLabelStyle: CSSProperties = { color: '#8a7d84', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '5px' };
const activitySectionStyle: CSSProperties = { marginTop: '20px' };
const rowStyle: CSSProperties = { padding: '18px 25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const dateTagStyle: CSSProperties = { backgroundColor: '#fff5f7', color: '#ff8fa3', padding: '5px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: 700 };
const scoreBadgeStyle: CSSProperties = { fontSize: '18px', fontWeight: 900 };