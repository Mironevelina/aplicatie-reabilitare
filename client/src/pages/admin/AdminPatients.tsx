import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import SakuraLayout from '../../layouts/SakuraLayout';
import { useNavigate } from 'react-router-dom';
import type { CSSProperties } from 'react';

// 1. Definim interfața pentru Pacient
interface Patient {
  id: string;
  full_name: string | null;
  email?: string;
  phone?: string;
  created_at?: string;
}

export default function AdminPatients() {
  const navigate = useNavigate(); 
  
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPatients() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('pacienti')
          .select('*')
          .order('full_name', { ascending: true });

        if (error) throw error;
        setPatients(data || []);
      } catch (err) {
        console.error('Eroare la încărcarea pacienților:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchPatients();
  }, []);

  return (
    <SakuraLayout>
      <div style={pageContainer}>
        
        {/* BUTON ÎNAPOI - Te duce la Dashboard-ul principal de Admin */}
        <button onClick={() => navigate('/admin')} style={backButtonStyle}>
          ← Înapoi la Panou Admin
        </button>

        <h1 style={{ color: '#4d444a', marginBottom: '25px', fontWeight: 900 }}>
          Gestionare Pacienți 👥
        </h1>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#8a7d84' }}>
            🌸 Se încarcă lista de pacienți...
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '15px' }}>
            {patients.length > 0 ? (
              patients.map((p) => (
                <div 
                  key={p.id} 
                  style={patientCard}
                >
                  <div>
                    <span style={{ fontWeight: 800, fontSize: '17px', color: '#4d444a' }}>
                      {p.full_name || 'Nume nespecificat'}
                    </span>
                    <p style={{ margin: '5px 0 0', fontSize: '13px', color: '#ff8fa3', fontWeight: 600 }}>
                      ID: {p.id.slice(0, 8)}...
                    </p>
                  </div>

                  <button 
                    style={viewBtnStyle}
                    onClick={() => navigate(`/admin/pacient/${p.id}`)} 
                  >
                    Vezi Fișa
                  </button>
                </div>
              ))
            ) : (
              <p style={{ textAlign: 'center', color: '#8a7d84', padding: '20px' }}>
                Nu există pacienți înregistrați.
              </p>
            )}
          </div>
        )}
      </div>
    </SakuraLayout>
  );
}

// --- STILURI ---
const pageContainer: CSSProperties = { 
  padding: '40px', 
  maxWidth: '1000px', 
  margin: '0 auto' 
};

const backButtonStyle: CSSProperties = { 
  marginBottom: '25px', 
  background: 'white', 
  border: '1px solid #ffeef2', 
  color: '#8a7d84', 
  padding: '10px 20px', 
  borderRadius: '15px', 
  fontWeight: 700, 
  cursor: 'pointer',
  transition: '0.3s'
};

const patientCard: CSSProperties = { 
  backgroundColor: 'white', 
  padding: '25px', 
  borderRadius: '20px', 
  display: 'flex', 
  justifyContent: 'space-between', 
  alignItems: 'center',
  boxShadow: '0 4px 15px rgba(255, 183, 197, 0.1)',
  border: '1px solid #fff0f3'
};

const viewBtnStyle: CSSProperties = { 
  padding: '10px 20px', 
  backgroundColor: '#fff5f6', 
  color: '#ff6b81', 
  border: '1px solid #ffb7c5', 
  borderRadius: '12px',
  cursor: 'pointer',
  fontWeight: 800,
  fontSize: '14px'
};