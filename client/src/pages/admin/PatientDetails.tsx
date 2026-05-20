import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
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
  durata_secunde?: number;
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
        
        const { data: profile } = await supabase
          .from('pacienti')
          .select('*')
          .eq('id', id)
          .single();

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
    const duration = session.durata_secunde ?? 0;
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

  // Optimizare date grafic (Sampling pentru claritate dacă sunt multe sesiuni)
  const chartData = sessions.length > 30 
    ? sessions.filter((_, i) => i % Math.floor(sessions.length / 20) === 0).map((s, index) => ({
        name: `S${index + 1}`,
        scor: extractValues(s).score,
        dataLabel: extractValues(s).dateFormatted
      }))
    : sessions.map((s, index) => ({
        name: `S${index + 1}`,
        scor: extractValues(s).score,
        dataLabel: extractValues(s).dateFormatted
      }));

  if (loading) return (
    <SakuraLayout>
      <div style={centeredContainer}>Se accesează istoricul clinic al pacientului...</div>
    </SakuraLayout>
  );

  return (
    <SakuraLayout>
      <div style={pageContainer}>
        
        <button onClick={() => navigate('/admin/patients')} style={backButtonStyle}>
          ← Revenire la Lista Pacienților
        </button>
        
        <div style={headerCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={avatarCircle}>{patient?.full_name?.charAt(0) || 'P'}</div>
            <div>
              <h1 style={titleStyle}>{patient?.full_name || 'Profil Pacient'}</h1>
              <p style={idSubtitle}>Identificator Sistem: {id?.substring(0,13).toUpperCase()}</p>
            </div>
          </div>
          <div style={summaryBadge}>
            <p style={badgeLabel}>TOTAL SESIUNI</p>
            <p style={badgeValue}>{sessions.length}</p>
          </div>
        </div>

        <div style={chartCardStyle}>
          <h3 style={sectionTitle}>Monitorizare Progres Clinic (Scor Acuratețe)</h3>
          <div style={{ height: '350px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#94a3b8" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false} 
                  dy={10}
                />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={11} 
                  domain={[0, 100]} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <Tooltip 
                   contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="scor" 
                  stroke="#4f46e5" 
                  strokeWidth={3} 
                  dot={chartData.length < 20} 
                  activeDot={{ r: 6 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={listCardStyle}>
          <h3 style={sectionTitle}>Registru Activități Detaliat</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[...sessions].reverse().slice(0, 50).map((s, idx) => {
              const { score, duration, fullDate } = extractValues(s);
              return (
                <div key={s.id || idx} style={sessionRow}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={sessionIndex}>#{sessions.length - idx}</div>
                    <div>
                      <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '14px' }}>{fullDate}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>Sesiune Monitorizată</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '40px' }}>
                    <div style={metricBox}>
                      <p style={metricLabel}>DURATĂ</p>
                      <p style={metricValue}>{duration}s</p>
                    </div>
                    <div style={metricBox}>
                      <p style={{ ...metricLabel, color: score >= 70 ? '#059669' : '#e11d48' }}>SCOR</p>
                      <p style={{ ...metricValue, color: score >= 70 ? '#059669' : '#e11d48' }}>{score}%</p>
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

// --- STILURI ACTUALIZATE ---
const pageContainer: CSSProperties = { padding: '40px', maxWidth: '1100px', margin: '0 auto', background: '#f8fafc', minHeight: '100vh' };
const centeredContainer: CSSProperties = { height: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontWeight: 600 };
const backButtonStyle: CSSProperties = { marginBottom: '25px', cursor: 'pointer', background: 'white', border: '1px solid #e2e8f0', color: '#64748b', padding: '10px 20px', borderRadius: '10px', fontWeight: 600, fontSize: '13px' };
const headerCard: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '30px', border: '1px solid #e2e8f0' };
const avatarCircle: CSSProperties = { width: '60px', height: '60px', borderRadius: '12px', backgroundColor: '#4f46e5', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: 800 };
const titleStyle: CSSProperties = { fontSize: '24px', fontWeight: 800, margin: 0, color: '#0f172a' };
const idSubtitle: CSSProperties = { color: '#94a3b8', fontSize: '13px', margin: '4px 0 0 0', fontWeight: 500, letterSpacing: '0.5px' };
const summaryBadge: CSSProperties = { backgroundColor: '#f1f5f9', padding: '15px 25px', borderRadius: '12px', textAlign: 'center', border: '1px solid #e2e8f0' };
const badgeLabel: CSSProperties = { margin: 0, color: '#64748b', fontSize: '10px', fontWeight: 700, letterSpacing: '1px' };
const badgeValue: CSSProperties = { fontSize: '28px', fontWeight: 800, margin: 0, color: '#1e293b' };
const chartCardStyle: CSSProperties = { backgroundColor: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '30px', border: '1px solid #e2e8f0' };
const sectionTitle: CSSProperties = { marginTop: 0, marginBottom: '25px', fontSize: '14px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' };
const listCardStyle: CSSProperties = { backgroundColor: 'white', borderRadius: '20px', border: '1px solid #e2e8f0', padding: '30px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' };
const sessionRow: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 25px', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #f1f5f9', marginBottom: '10px' };
const sessionIndex: CSSProperties = { backgroundColor: '#f1f5f9', color: '#64748b', width: '35px', height: '35px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700 };
const metricBox: CSSProperties = { textAlign: 'center', minWidth: '70px' };
const metricLabel: CSSProperties = { margin: 0, fontSize: '10px', color: '#94a3b8', fontWeight: 700, letterSpacing: '0.5px' };
const metricValue: CSSProperties = { margin: 0, fontWeight: 800, fontSize: '18px', color: '#1e293b' };

export default PatientDetailsAdmin;