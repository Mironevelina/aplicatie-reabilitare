import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { useNavigate } from 'react-router-dom';
import SakuraLayout from '../../layouts/SakuraLayout';
import type { CSSProperties } from 'react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ patients: 0, doctors: 0, sessions: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const { count: pCount } = await supabase.from('pacienti').select('*', { count: 'exact', head: true });
      const { count: dCount } = await supabase.from('doctori').select('*', { count: 'exact', head: true });
      const { count: sCount } = await supabase.from('sessions').select('*', { count: 'exact', head: true });
      
      setStats({ patients: pCount || 0, doctors: dCount || 0, sessions: sCount || 0 });
      setLoading(false);
    }
    fetchStats();
  }, []);

  if (loading) return <SakuraLayout><div style={centeredStyle}>🌸 Se încarcă datele administrative...</div></SakuraLayout>;

  return (
    <SakuraLayout>
      <div style={containerStyle}>
        <header style={headerStyle}>
          <h1 style={titleStyle}>Panou Administrare Sakura 🏛️</h1>
          <p style={subtitleStyle}>Gestionarea resurselor și monitorizarea sistemului.</p>
        </header>

        <div style={gridStyle}>
          {[
            { label: 'Pacienți Activi', val: stats.patients, icon: '👤', path: '/admin/patients', color: '#ff8fa3' },
            { label: 'Medici Înrolați', val: stats.doctors, icon: '🩺', path: '/admin/doctors', color: '#a7c9b0' },
            { label: 'Sesiuni Totale', val: stats.sessions, icon: '📊', path: '/admin/sessions', color: '#ffb7c5' }
          ].map((item, i) => (
            <div key={i} style={cardStyle} onClick={() => navigate(item.path)}>
              <div style={{ fontSize: '40px', marginBottom: '10px' }}>{item.icon}</div>
              <h3 style={{ margin: 0, color: '#8a7d84', fontSize: '14px', textTransform: 'uppercase' }}>{item.label}</h3>
              <div style={{ fontSize: '48px', fontWeight: 900, color: item.color }}>{item.val}</div>
              <button style={{ ...actionBtn, backgroundColor: item.color }}>Gestionează</button>
            </div>
          ))}
        </div>

        <section style={managementSection}>
          <h2 style={{ color: '#4d444a', marginBottom: '20px' }}>Asignare și Control</h2>
          <button style={userMgmtBtn} onClick={() => navigate('/admin/users')}>
            ⚙️ Alocă Pacienți către Medici
          </button>
        </section>
      </div>
    </SakuraLayout>
  );
}

const containerStyle: CSSProperties = { maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' };
const headerStyle: CSSProperties = { marginBottom: '40px', textAlign: 'center' };
const titleStyle: CSSProperties = { fontSize: '36px', fontWeight: 900, color: '#4d444a', margin: 0 };
const subtitleStyle: CSSProperties = { color: '#8a7d84', fontSize: '18px' };
const gridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px', marginBottom: '50px' };
const cardStyle: CSSProperties = { backgroundColor: 'white', padding: '40px', borderRadius: '40px', textAlign: 'center', cursor: 'pointer', transition: '0.3s', boxShadow: '0 15px 35px rgba(255, 183, 197, 0.1)', border: '1px solid #fff0f3' };
const actionBtn: CSSProperties = { marginTop: '20px', padding: '10px 25px', color: 'white', border: 'none', borderRadius: '15px', fontWeight: 800, cursor: 'pointer' };
const managementSection: CSSProperties = { backgroundColor: 'rgba(255,255,255,0.7)', padding: '40px', borderRadius: '40px', textAlign: 'center', border: '1px solid white' };
const userMgmtBtn: CSSProperties = { padding: '15px 40px', backgroundColor: '#4d444a', color: 'white', border: 'none', borderRadius: '20px', fontWeight: 700, cursor: 'pointer' };
const centeredStyle: CSSProperties = { textAlign: 'center', padding: '100px', color: '#ff8fa3', fontWeight: 900 };