import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import SakuraLayout from '../../layouts/SakuraLayout';
import type { CSSProperties } from 'react';

interface PatientProfile {
  id: string;
  full_name: string | null;
}

interface Session {
  id: string | number;
  data_finalizare: string; 
  scor?: number;
  score?: number;
  durata_secunde?: number; // Coloana ta din Supabase
  durata?: number;
  duration?: number;
}

const PatientDetailsAdmin = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<PatientProfile | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        setLoading(true);
        
        // 1. Profil Pacient
        const { data: profile } = await supabase
          .from('pacienti')
          .select('*')
          .eq('id', id)
          .single();

        // 2. Progres Pacient (ordonat cronologic pentru grafic)
        const { data: sess, error: sessError } = await supabase
          .from('progres_pacienti')
          .select('*')
          .eq('id_pacient', id)
          .order('data_finalizare', { ascending: true });

        if (sessError) throw sessError;

        setPatient(profile);
        setSessions(sess || []);
      } catch (err) {
        console.error("Eroare fetching admin:", err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchPatientData();
  }, [id]);

  const extractValues = (session: Session) => {
    const score = session.scor ?? session.score ?? 0;
    
    // Corecția pentru durata_secunde
    const duration = session.durata_secunde ?? session.durata ?? session.duration ?? 0;
    
    const dateObj = new Date(session.data_finalizare);
    
    return {
      score,
      duration,
      dateFormatted: dateObj.toLocaleDateString('ro-RO'),
      fullDate: dateObj.toLocaleString('ro-RO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    };
  };

  const chartData = sessions.map((s, index) => ({
    name: `S${index + 1}`,
    scor: extractValues(s).score,
    dataLabel: extractValues(s).dateFormatted
  }));

  if (loading) return (
    <SakuraLayout>
      <div style={centeredContainer}>🌸 Se încarcă istoricul clinic...</div>
    </SakuraLayout>
  );

  return (
    <SakuraLayout>
      <div style={pageContainer}>
        
        <button onClick={() => navigate('/admin/patients')} style={backButtonStyle}>
          ← Înapoi la listă
        </button>
        
        <div style={headerCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={avatarCircle}>{patient?.full_name?.charAt(0) || 'P'}</div>
            <div>
              <h1 style={titleStyle}>{patient?.full_name || 'Pacient'}</h1>
              <p style={idSubtitle}>Panou Admin | Log: {id?.substring(0,8)}</p>
            </div>
          </div>
          <div style={summaryBadge}>
            <p style={badgeLabel}>SESIUNI</p>
            <p style={badgeValue}>{sessions.length}</p>
          </div>
        </div>

        <div style={chartCardStyle}>
          <h3 style={sectionTitle}>📈 Evoluție Performanță</h3>
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorScor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff8fa3" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ff8fa3" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#fff0f3" vertical={false} />
                <XAxis dataKey="name" stroke="#8a7d84" fontSize={12} />
                <YAxis stroke="#8a7d84" fontSize={12} domain={[0, 100]} />
                <Tooltip 
                   contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 5px 15px rgba(0,0,0,0.1)' }}
                />
                <Area type="monotone" dataKey="scor" stroke="#ff8fa3" strokeWidth={3} fill="url(#colorScor)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={listCardStyle}>
          <h3 style={sectionTitle}>📋 Jurnal Detaliat</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[...sessions].reverse().map((s, idx) => {
              const { score, duration, fullDate } = extractValues(s);
              return (
                <div key={s.id || idx} style={sessionRow}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={sessionIndex}>{sessions.length - idx}</div>
                    <div>
                      <div style={{ fontWeight: 800, color: '#4d444a' }}>{fullDate}</div>
                      <div style={{ fontSize: '11px', color: '#8a7d84' }}>Sesiune finalizată</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '30px' }}>
                    <div style={metricBox}>
                      <p style={metricLabel}>DURATĂ</p>
                      <p style={metricValue}>{duration}s</p>
                    </div>
                    <div style={metricBox}>
                      <p style={{ ...metricLabel, color: '#ff8fa3' }}>SCOR</p>
                      <p style={{ ...metricValue, color: '#ff8fa3' }}>{score}%</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </SakuraLayout>
  );
};

// --- STILURI (Păstrate) ---
const pageContainer: CSSProperties = { padding: '30px 40px', maxWidth: '1000px', margin: '0 auto' };
const centeredContainer: CSSProperties = { height: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff8fa3', fontWeight: 900 };
const backButtonStyle: CSSProperties = { marginBottom: '20px', cursor: 'pointer', background: 'white', border: '1px solid #ffeef2', color: '#8a7d84', padding: '8px 18px', borderRadius: '12px', fontWeight: 700 };
const headerCard: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: '25px', borderRadius: '25px', boxShadow: '0 10px 30px rgba(255, 183, 197, 0.1)', marginBottom: '30px', border: '1px solid #fff0f3' };
const avatarCircle: CSSProperties = { width: '55px', height: '55px', borderRadius: '50%', backgroundColor: '#ffb7c5', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 900 };
const titleStyle: CSSProperties = { fontSize: '24px', fontWeight: 900, margin: 0, color: '#4d444a' };
const idSubtitle: CSSProperties = { color: '#ff8fa3', fontSize: '13px', margin: '4px 0 0 0', fontWeight: 600 };
const summaryBadge: CSSProperties = { backgroundColor: '#fff9fa', padding: '12px 20px', borderRadius: '18px', textAlign: 'center', border: '1px solid #fff0f3' };
const badgeLabel: CSSProperties = { margin: 0, color: '#8a7d84', fontSize: '10px', fontWeight: 800 };
const badgeValue: CSSProperties = { fontSize: '24px', fontWeight: 900, margin: 0, color: '#ff8fa3' };
const chartCardStyle: CSSProperties = { backgroundColor: 'white', padding: '30px', borderRadius: '25px', boxShadow: '0 10px 30px rgba(255, 183, 197, 0.05)', marginBottom: '30px', border: '1px solid #fff0f3' };
const sectionTitle: CSSProperties = { marginTop: 0, marginBottom: '20px', fontSize: '16px', color: '#4d444a', fontWeight: 800 };
const listCardStyle: CSSProperties = { backgroundColor: 'white', borderRadius: '25px', border: '1px solid #fff0f3', padding: '25px' };
const sessionRow: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px', backgroundColor: '#fffcfd', borderRadius: '15px', border: '1px solid #fff0f3', marginBottom: '8px' };
const sessionIndex: CSSProperties = { backgroundColor: '#ffeef2', color: '#ff8fa3', width: '30px', height: '30px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800 };
const metricBox: CSSProperties = { textAlign: 'center', minWidth: '50px' };
const metricLabel: CSSProperties = { margin: 0, fontSize: '9px', color: '#8a7d84', fontWeight: 800 };
const metricValue: CSSProperties = { margin: 0, fontWeight: 900, fontSize: '16px', color: '#4d444a' };

export default PatientDetailsAdmin;