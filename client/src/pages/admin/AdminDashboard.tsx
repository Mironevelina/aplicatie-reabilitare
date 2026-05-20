import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { useNavigate } from 'react-router-dom';
import SakuraLayout from '../../layouts/SakuraLayout';
import type { CSSProperties } from 'react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ patients: 0, doctors: 0, sessions: 0 });
  const [loading, setLoading] = useState(true);
  const [isPopulating, setIsPopulating] = useState(false);

  useEffect(() => {
    async function fetchStats() {
      // Preluăm statisticile folosind tabelele corecte
      const { count: pCount } = await supabase.from('pacienti').select('*', { count: 'exact', head: true });
      const { count: dCount } = await supabase.from('doctori').select('*', { count: 'exact', head: true });
      // Folosim 'progres_pacienti' în loc de 'sessions' pentru a evita eroarea 400
      const { count: sCount } = await supabase.from('progres_pacienti').select('*', { count: 'exact', head: true });
      
      setStats({ patients: pCount || 0, doctors: dCount || 0, sessions: sCount || 0 });
      setLoading(false);
    }
    fetchStats();
  }, []);

  // FUNCTIA DE POPULARE - Cerință licență
  const handlePopulateData = async () => {
    if (!window.confirm("Sunteți sigur că doriți să populați baza de date cu 25 de sesiuni de test pentru analize clinice?")) return;
    
    setIsPopulating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utilizator neautentificat.");

      const dummySessions = [];
      const now = new Date();

      for (let i = 0; i < 25; i++) {
        const sessionDate = new Date();
        sessionDate.setDate(now.getDate() - i);

        dummySessions.push({
          id_pacient: user.id,
          tip_exercitiu: 'Evaluare Coordonare Biomecanică',
          scor: Math.floor(Math.random() * (100 - 65 + 1)) + 65, // Scoruri realiste
          durata_secunde: Math.floor(Math.random() * (150 - 40 + 1)) + 40,
          data_finalizare: sessionDate.toISOString()
        });
      }

      const { error } = await supabase.from('progres_pacienti').insert(dummySessions);
      if (error) throw error;

      alert("Succes: Sistemul a generat 25 de înregistrări pentru analizele de evoluție.");
      window.location.reload();
    } catch (err: any) {
      alert("Eroare la populare: " + err.message);
    } finally {
      setIsPopulating(false);
    }
  };

  if (loading) return (
    <SakuraLayout>
      <div style={centeredStyle}>Se încarcă baza de date administrativă...</div>
    </SakuraLayout>
  );

  return (
    <SakuraLayout>
      <div style={containerStyle}>
        <header style={headerStyle}>
          <h1 style={titleStyle}>Consola de Administrare</h1>
          <p style={subtitleStyle}>Monitorizarea fluxurilor de recuperare și gestionarea resurselor sistemului.</p>
        </header>

        <div style={gridStyle}>
          {[
            { label: 'Pacienți Înregistrați', val: stats.patients, path: '/admin/patients', color: '#4f46e5' },
            { label: 'Personal Medical', val: stats.doctors, path: '/admin/doctors', color: '#0891b2' },
            { label: 'Sesiuni Monitorizate', val: stats.sessions, path: '/admin/sessions', color: '#059669' }
          ].map((item, i) => (
            <div key={i} style={cardStyle} onClick={() => navigate(item.path)}>
              <h3 style={labelStyle}>{item.label}</h3>
              <div style={{ fontSize: '56px', fontWeight: 800, color: item.color, margin: '15px 0' }}>{item.val}</div>
              <button style={{ ...actionBtn, backgroundColor: item.color }}>Acces Rapoarte</button>
            </div>
          ))}
        </div>

        <section style={managementSection}>
          <h2 style={{ color: '#1e293b', marginBottom: '25px', fontSize: '22px' }}>Instrumente de Dezvoltare și Control</h2>
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
            <button style={userMgmtBtn} onClick={() => navigate('/admin/users')}>
              Alocare Pacienți către Specialiști
            </button>
            
            {/* Butonul de populare - Arată "muncă" de licență */}
            <button 
              style={{ ...userMgmtBtn, backgroundColor: '#059669' }} 
              onClick={handlePopulateData}
              disabled={isPopulating}
            >
              {isPopulating ? 'Se generează date...' : 'Populare Bază de Date (Test Evoluție)'}
            </button>
          </div>
        </section>
      </div>
    </SakuraLayout>
  );
}

// --- STILURI CURATE ȘI PROFESIONALE ---
const containerStyle: CSSProperties = { maxWidth: '1200px', margin: '0 auto', padding: '60px 20px' };
const headerStyle: CSSProperties = { marginBottom: '50px', textAlign: 'left' };
const titleStyle: CSSProperties = { fontSize: '32px', fontWeight: 800, color: '#0f172a', margin: 0 };
const subtitleStyle: CSSProperties = { color: '#64748b', fontSize: '18px', marginTop: '8px' };
const gridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '40px' };
const cardStyle: CSSProperties = { backgroundColor: 'white', padding: '35px', borderRadius: '20px', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.2s', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' };
const labelStyle: CSSProperties = { margin: 0, color: '#94a3b8', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 };
const actionBtn: CSSProperties = { padding: '10px 20px', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '13px' };
const managementSection: CSSProperties = { backgroundColor: '#f8fafc', padding: '40px', borderRadius: '20px', textAlign: 'center', border: '1px solid #e2e8f0' };
const userMgmtBtn: CSSProperties = { padding: '14px 28px', backgroundColor: '#1e293b', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', fontSize: '14px' };
const centeredStyle: CSSProperties = { textAlign: 'center', padding: '120px', color: '#64748b', fontSize: '18px', fontWeight: 600 };